import DeleteIcon from "../icons/delete.svg";
import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";
import Locale from "../locales";
import { Link, useNavigate } from "react-router-dom";
import { Path } from "../constant";
import Image, { StaticImageData } from "next/image";
import avatarUrl1 from "../..//public/jay.png";
import avatarUrl2 from "../..//public/snape.jpg";
import styles from "./persona.module.scss";
import {
  Message,
  SubmitKey,
  useChatStore,
  BOT_HELLO,
  ROLES,
  createMessage,
  useAccessStore,
  Theme,
  ModelType,
  useAppConfig,
  createPresetMessage,
} from "../store";

interface Persona {
  id: number;
  avatarUrl: StaticImageData | string;
  presetContent: string;
}

export function Persona(props: { narrow?: boolean }) {
  const [sessions, selectedIndex, selectSession, removeSession, moveSession] =
    useChatStore((state) => [
      state.sessions,
      state.currentSessionIndex,
      state.selectSession,
      state.removeSession,
      state.moveSession,
    ]);
  const chatStore = useChatStore();
  const navigate = useNavigate();
  const content1 =
    "您被委任为音乐推荐专家。您需要创建一个包含 10 首与给定歌曲相似的歌曲的播放列表。您需要为播放列表提供一个独特的名称和描述，以激发听众的兴趣。请确保不要选择同名或同名歌手的曲目，以使播放列表更加多样化。在回复中，请提供播放列表的名称、描述和所有 10 首歌曲名称。您的第一个参考曲目是周杰伦的《稻香》。";

  const content2 =
    "我要你扮演诗人。你将创作出能唤起情感并具有触动人心的力量的诗歌。写任何主题或主题，但要确保您的文字以优美而有意义的方式传达您试图表达的感觉。您还可以想出一些短小的诗句，这些诗句仍然足够强大，可以在读者的脑海中留下印记。我的第一个请求是“我需要一首关于爱情的诗”。";
  const personas: Persona[] = [
    {
      id: 1,
      presetContent: content1,
      avatarUrl: avatarUrl1,
    },
    {
      id: 2,
      presetContent: content2,
      avatarUrl: avatarUrl2,
    },
  ];

  const newPresetSession = (persona: Persona) => {
    const presetMessage = createPresetMessage({
      role: "user",
      content: persona.presetContent,
    });
    chatStore.newPresetSession(persona.avatarUrl, presetMessage);
  };

  return (
    <div className={styles["persona-list"]}>
      {personas.map((persona) => {
        return (
          <span
            key={persona.id}
            className={styles["persona-item"]}
            onClick={() => {
              newPresetSession(persona);
            }}
          >
            <Image
              src={persona.avatarUrl}
              alt="Picture of the author"
              width={48}
              height={48}
            />
          </span>
        );
      })}
    </div>
  );
}
