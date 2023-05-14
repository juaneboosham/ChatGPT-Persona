import { NextApiRequest, NextApiResponse } from "next";

import { ChatGPTAPI, ChatGPTUnofficialProxyAPI } from "chatgpt";

let api: ChatGPTAPI | ChatGPTUnofficialProxyAPI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const OPENAI_ACCESS_TOKEN = process.env.OPENAI_ACCESS_TOKEN ?? "";
const API_REVERSE_PROXY = process.env.API_REVERSE_PROXY ?? "";

function getApiType() {
  let apiType: "ChatGPTAPI" | "ChatGPTUnofficialProxyAPI";

  if (OPENAI_API_KEY) {
    apiType = "ChatGPTAPI";
  } else if (OPENAI_ACCESS_TOKEN && API_REVERSE_PROXY) {
    apiType = "ChatGPTUnofficialProxyAPI";
  } else {
    console.error("Please check your env");
    throw new Error("Please check your env");
  }

  return apiType;
}

async function initChatgptApi() {
  const apiType = getApiType();
  if (apiType === "ChatGPTAPI") {
    api = new ChatGPTAPI({
      apiKey: OPENAI_API_KEY,
      completionParams: {
        model: "gpt-3.5-turbo",
        temperature: 0.5,
        top_p: 0.8,
      },
    });
  } else if (apiType === "ChatGPTUnofficialProxyAPI") {
    api = new ChatGPTUnofficialProxyAPI({
      accessToken: OPENAI_ACCESS_TOKEN,
      apiReverseProxyUrl: API_REVERSE_PROXY,
    });
  }
}

initChatgptApi();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const prompt = req.body.prompt;
    const parentMessageId = req.body.option?.parentMessageId ?? "";
    const conversationId = req.body.option?.conversationId ?? "";
    const completionParams = req.body.option?.completionParams;
    console.log("completionParams", completionParams);
    console.log("prompt", prompt);
    res.setHeader("Content-type", "application/octet-stream");
    res.setHeader("Transfer-Encoding", "chunked");
    let firstChunk = true;

    const apiResult = await api.sendMessage(prompt, {
      parentMessageId,
      conversationId,
      completionParams,
      onProgress: (partialResponse) => {
        const chunk = firstChunk
          ? JSON.stringify(partialResponse)
          : "\n*" + JSON.stringify(partialResponse);
        res.write(chunk);
        firstChunk = false;
      },
    });
    console.log("successapi", apiResult);
  } catch (error) {
    console.error("[Chat Stream]", error);
    res.write(
      ["```json\n", JSON.stringify(error, null, "  "), "\n```"].join(""),
    );
  } finally {
    res.end();
  }
}
