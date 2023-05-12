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
    const parentMessageId = req.body.option.parentMessageId ?? "";
    const completionParams = req.body.option.completionParams;
    // console.log("completionParams", completionParams);
    // console.log("prompt", prompt);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache");
    const apiResult = await api.sendMessage(prompt, {
      parentMessageId,
      completionParams,
    });
    // console.log("successapi", apiResult);

    res.status(200).json(apiResult);
  } catch (e) {
    console.error("[OpenAI] ", req.body, e);

    res.status(500).json({
      error: true,
      msg: JSON.stringify(e),
    });
  }
}
