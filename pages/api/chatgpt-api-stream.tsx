import { NextApiRequest, NextApiResponse } from "next";

import { ChatGPTAPI, ChatGPTUnofficialProxyAPI } from "chatgpt";

let api: ChatGPTAPI;

function initChatgptApi() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";

  api = new ChatGPTAPI({
    apiKey: OPENAI_API_KEY,
    completionParams: {
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      top_p: 0.8,
    },
  });
}

initChatgptApi();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const prompt = req.body.prompt;
    const parentMessageId = req.body.option?.parentMessageId ?? "";
    const completionParams = req.body.option?.completionParams;
    console.log("completionParams", completionParams);
    console.log("prompt", prompt);
    res.setHeader("Content-type", "application/octet-stream");
    res.setHeader("Transfer-Encoding", "chunked");
    let firstChunk = true;

    const apiResult = await api.sendMessage(prompt, {
      parentMessageId,
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
