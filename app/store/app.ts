import { create } from "zustand";
import { persist } from "zustand/middleware";

import { type ChatCompletionResponseMessage } from "openai";
import {
  ControllerPool,
  requestChatStream,
  requestNiceApiStream,
  requestWithPrompt,
} from "../requests";
import { isMobileScreen, trimTopic } from "../utils";

import Locale from "../locales";
import { showToast } from "../components/ui-lib";
import { ModelType, useAppConfig } from "./config";

export type Message = ChatCompletionResponseMessage & {
  date: string;
  streaming?: boolean;
  isError?: boolean;
  id?: number;
  model?: ModelType;
  isUserPreset?: boolean;
};

export function createMessage(override: Partial<Message>): Message {
  return {
    id: Date.now(),
    date: new Date().toLocaleString(),
    role: "user",
    content: "",
    ...override,
  };
}

export function createPresetMessage(override: Partial<Message>): Message {
  const message = createMessage(override);
  message.isUserPreset = true;
  return message;
}

export const ROLES: Message["role"][] = ["system", "user", "assistant"];

export interface ChatStat {
  tokenCount: number;
  wordCount: number;
  charCount: number;
}

export interface ChatSession {
  id: number;
  topic: string;
  sendMemory: boolean;
  memoryPrompt: string;
  context: Message[];
  messages: Message[];
  stat: ChatStat;
  lastUpdate: string;
  lastSummarizeIndex: number;
  avatarUrl?: string;
  conversationId?: string;
  parentMessageId?: string;
}

const DEFAULT_TOPIC = Locale.Store.DefaultTopic;
export const BOT_HELLO: Message = createMessage({
  role: "assistant",
  content: Locale.Store.BotHello,
});

function createEmptySession(): ChatSession {
  const createDate = new Date().toLocaleString();

  return {
    id: Date.now(),
    topic: DEFAULT_TOPIC,
    sendMemory: true,
    memoryPrompt: "",
    context: [],
    messages: [],
    stat: {
      tokenCount: 0,
      wordCount: 0,
      charCount: 0,
    },
    lastUpdate: createDate,
    lastSummarizeIndex: 0,
  };
}

function createPresetSession(
  avatarUrl: string,
  presetMessages: Message[],
  topic: string,
): ChatSession {
  const presetSession = createEmptySession();
  presetSession.avatarUrl = avatarUrl;
  presetSession.context.push(...presetMessages);
  presetSession.topic = topic;
  return presetSession;
}

interface ChatStore {
  sessions: ChatSession[];
  currentSessionIndex: number;
  clearSessions: () => void;
  removeSession: (index: number) => void;
  moveSession: (from: number, to: number) => void;
  selectSession: (index: number) => void;
  newSession: () => void;
  newPresetSession: (
    avatarUrl: string,
    messages: Message[],
    topic: string,
  ) => void;
  deleteSession: (index?: number) => void;
  currentSession: () => ChatSession;
  onNewMessage: (message: Message) => void;
  onUserInput: (content: string, isPreset?: boolean) => Promise<void>;
  summarizeSession: () => void;
  updateStat: (message: Message) => void;
  updateCurrentSession: (updater: (session: ChatSession) => void) => void;
  updateMessage: (
    sessionIndex: number,
    messageIndex: number,
    updater: (message?: Message) => void,
  ) => void;
  resetSession: () => void;
  getMessagesWithMemory: () => Message[];
  getMemoryPrompt: () => Message;
  isStreaming: () => boolean;

  clearAllData: () => void;
}

function countMessages(msgs: Message[]) {
  return msgs.reduce((pre, cur) => pre + cur.content.length, 0);
}

const LOCAL_KEY = "chat-next-web-store";

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [createEmptySession()],
      currentSessionIndex: 0,

      clearSessions() {
        set(() => ({
          sessions: [createEmptySession()],
          currentSessionIndex: 0,
        }));
      },

      selectSession(index: number) {
        set({
          currentSessionIndex: index,
        });
      },

      removeSession(index: number) {
        set((state) => {
          let nextIndex = state.currentSessionIndex;
          const sessions = state.sessions;

          if (sessions.length === 1) {
            return {
              currentSessionIndex: 0,
              sessions: [createEmptySession()],
            };
          }

          sessions.splice(index, 1);

          if (nextIndex === index) {
            nextIndex -= 1;
          }

          return {
            currentSessionIndex: nextIndex,
            sessions,
          };
        });
      },

      moveSession(from: number, to: number) {
        set((state) => {
          const { sessions, currentSessionIndex: oldIndex } = state;

          // move the session
          const newSessions = [...sessions];
          const session = newSessions[from];
          newSessions.splice(from, 1);
          newSessions.splice(to, 0, session);

          // modify current session id
          let newIndex = oldIndex === from ? to : oldIndex;
          if (oldIndex > from && oldIndex <= to) {
            newIndex -= 1;
          } else if (oldIndex < from && oldIndex >= to) {
            newIndex += 1;
          }

          return {
            currentSessionIndex: newIndex,
            sessions: newSessions,
          };
        });
      },

      newSession() {
        set((state) => ({
          currentSessionIndex: 0,
          sessions: [createEmptySession()].concat(state.sessions),
        }));
      },

      newPresetSession(avatarUrl: string, messages: Message[], topic: string) {
        set((state) => ({
          currentSessionIndex: 0,
          sessions: [createPresetSession(avatarUrl, messages, topic)].concat(
            state.sessions,
          ),
        }));
      },

      deleteSession(i?: number) {
        const deletedSession = get().currentSession();
        const index = i ?? get().currentSessionIndex;
        const isLastSession = get().sessions.length === 1;
        if (!isMobileScreen() || confirm(Locale.Home.DeleteChat)) {
          get().removeSession(index);

          showToast(
            Locale.Home.DeleteToast,
            {
              text: Locale.Home.Revert,
              onClick() {
                set((state) => ({
                  sessions: state.sessions
                    .slice(0, index)
                    .concat([deletedSession])
                    .concat(
                      state.sessions.slice(index + Number(isLastSession)),
                    ),
                }));
              },
            },
            5000,
          );
        }
      },

      currentSession() {
        let index = get().currentSessionIndex;
        const sessions = get().sessions;

        if (index < 0 || index >= sessions.length) {
          index = Math.min(sessions.length - 1, Math.max(0, index));
          set(() => ({ currentSessionIndex: index }));
        }

        const session = sessions[index];

        return session;
      },

      onNewMessage(message) {
        get().updateCurrentSession((session) => {
          session.lastUpdate = new Date().toLocaleString();
        });
        get().updateStat(message);
        get().summarizeSession();
      },

      async onUserInput(content, isPreset = false) {
        let userMessage: Message;

        userMessage = isPreset
          ? createPresetMessage({
              role: "user",
              content,
            })
          : createMessage({
              role: "user",
              content,
            });

        const botMessage: Message = createMessage({
          role: "assistant",
          streaming: true,
          id: userMessage.id! + 1,
          model: useAppConfig.getState().modelConfig.model,
        });

        const sessionIndex = get().currentSessionIndex;
        const messageIndex = get().currentSession().messages.length + 1;

        // save user's and bot's message
        get().updateCurrentSession((session) => {
          session.messages.push(userMessage);
          session.messages.push(botMessage);
        });

        const currentSession = this.currentSession();
        const option = {
          parentMessageId: currentSession.parentMessageId,
          completionParams: useAppConfig.getState().modelConfig,
          conversationId: currentSession.conversationId,
        };
        requestNiceApiStream(content, option, {
          onMessage(chunk, done) {
            if (done) {
              botMessage.streaming = false;
              botMessage.content = chunk.text;
              get().onNewMessage(botMessage);
              const newParentsMessageId = chunk.id ?? "";
              const newConversationId = chunk.conversationId ?? "";
              get().updateCurrentSession((session) => {
                // https://github.com/transitive-bullshit/chatgpt-api
                // need parentMessageId to track the conversation
                // and ChatGPTUnofficialProxyAPI needs parentMessageId and conversationId in addiction
                session.parentMessageId = newParentsMessageId;
                session.conversationId = newConversationId;
              });
            } else {
              botMessage.content = chunk.text;
              set(() => ({}));
            }
          },
          onError(error, statusCode) {
            if (statusCode === 401) {
              botMessage.content = Locale.Error.Unauthorized;
            } else if (!error.message.includes("aborted")) {
              console.log("error", error.message);
              botMessage.content += "\n\n" + error.message;
            }
            botMessage.streaming = false;
            userMessage.isError = true;
            botMessage.isError = true;
            set(() => ({}));
            ControllerPool.remove(sessionIndex, botMessage.id ?? messageIndex);
          },
          onController(controller) {
            // collect controller for stop/retry
            ControllerPool.addController(
              sessionIndex,
              botMessage.id ?? messageIndex,
              controller,
            );
          },
        });
      },

      getMemoryPrompt() {
        const session = get().currentSession();

        return {
          role: "system",
          content: Locale.Store.Prompt.History(session.memoryPrompt),
          date: "",
        } as Message;
      },

      isStreaming() {
        const session = get().currentSession();
        if (session.messages.length === 0) return false;
        const lastMessage = session.messages[session.messages.length - 1];
        return !!lastMessage.streaming;
      },

      getMessagesWithMemory() {
        const session = get().currentSession();
        const config = useAppConfig.getState();
        const messages = session.messages.filter((msg) => !msg.isError);
        const n = messages.length;

        const context = session.context.slice();

        // long term memory
        if (
          session.sendMemory &&
          session.memoryPrompt &&
          session.memoryPrompt.length > 0
        ) {
          const memoryPrompt = get().getMemoryPrompt();
          context.push(memoryPrompt);
        }

        // get short term and unmemoried long term memory
        const shortTermMemoryMessageIndex = Math.max(
          0,
          n - config.historyMessageCount,
        );
        const longTermMemoryMessageIndex = session.lastSummarizeIndex;
        const oldestIndex = Math.max(
          shortTermMemoryMessageIndex,
          longTermMemoryMessageIndex,
        );
        const threshold = config.compressMessageLengthThreshold;

        // get recent messages as many as possible
        const reversedRecentMessages = [];
        for (
          let i = n - 1, count = 0;
          i >= oldestIndex && count < threshold;
          i -= 1
        ) {
          const msg = messages[i];
          if (!msg || msg.isError) continue;
          count += msg.content.length;
          reversedRecentMessages.push(msg);
        }

        // concat
        const recentMessages = context.concat(reversedRecentMessages.reverse());

        return recentMessages;
      },

      updateMessage(
        sessionIndex: number,
        messageIndex: number,
        updater: (message?: Message) => void,
      ) {
        const sessions = get().sessions;
        const session = sessions.at(sessionIndex);
        const messages = session?.messages;
        updater(messages?.at(messageIndex));
        set(() => ({ sessions }));
      },

      resetSession() {
        get().updateCurrentSession((session) => {
          session.messages = [];
          session.memoryPrompt = "";
        });
      },

      summarizeSession() {
        const session = get().currentSession();

        // should summarize topic after chating more than 50 words
        const SUMMARIZE_MIN_LEN = 50;
        if (
          session.topic === DEFAULT_TOPIC &&
          countMessages(session.messages) >= SUMMARIZE_MIN_LEN
        ) {
          requestWithPrompt(session.messages, Locale.Store.Prompt.Topic, {
            model: "gpt-3.5-turbo",
          }).then((res) => {
            get().updateCurrentSession(
              (session) =>
                (session.topic = res ? trimTopic(res) : DEFAULT_TOPIC),
            );
          });
        }

        const config = useAppConfig.getState();
        let toBeSummarizedMsgs = session.messages.slice(
          session.lastSummarizeIndex,
        );

        const historyMsgLength = countMessages(toBeSummarizedMsgs);

        if (historyMsgLength > config?.modelConfig?.max_tokens ?? 4000) {
          const n = toBeSummarizedMsgs.length;
          toBeSummarizedMsgs = toBeSummarizedMsgs.slice(
            Math.max(0, n - config.historyMessageCount),
          );
        }

        // add memory prompt
        toBeSummarizedMsgs.unshift(get().getMemoryPrompt());

        const lastSummarizeIndex = session.messages.length;

        console.log(
          "[Chat History] ",
          toBeSummarizedMsgs,
          historyMsgLength,
          config.compressMessageLengthThreshold,
        );

        if (
          historyMsgLength > config.compressMessageLengthThreshold &&
          session.sendMemory
        ) {
          requestChatStream(
            toBeSummarizedMsgs.concat({
              role: "system",
              content: Locale.Store.Prompt.Summarize,
              date: "",
            }),
            {
              filterBot: false,
              model: "gpt-3.5-turbo",
              onMessage(message, done) {
                session.memoryPrompt = message;
                if (done) {
                  console.log("[Memory] ", session.memoryPrompt);
                  session.lastSummarizeIndex = lastSummarizeIndex;
                }
              },
              onError(error) {
                console.error("[Summarize] ", error);
              },
            },
          );
        }
      },

      updateStat(message) {
        get().updateCurrentSession((session) => {
          session.stat.charCount += message.content.length;
          // TODO: should update chat count and word count
        });
      },

      updateCurrentSession(updater) {
        const sessions = get().sessions;
        const index = get().currentSessionIndex;
        updater(sessions[index]);
        set(() => ({ sessions }));
      },

      clearAllData() {
        if (confirm(Locale.Store.ConfirmClearAll)) {
          localStorage.clear();
          location.reload();
        }
      },
    }),
    {
      name: LOCAL_KEY,
      version: 1.2,
      migrate(persistedState, version) {
        const state = persistedState as ChatStore;

        if (version === 1) {
          state.sessions.forEach((s) => (s.context = []));
        }

        if (version < 1.2) {
          state.sessions.forEach((s) => (s.sendMemory = true));
        }

        return state;
      },
    },
  ),
);
