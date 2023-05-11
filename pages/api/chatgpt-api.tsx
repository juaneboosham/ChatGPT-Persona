// 导入 Next.js 的服务端请求和响应对象
import { NextApiRequest, NextApiResponse } from "next";

// 导入 chatgpt 库
import { ChatGPTAPI, ChatGPTUnofficialProxyAPI } from "chatgpt";

let api: ChatGPTAPI;

// 定义一个例子函数，用于在 chatgpt 中发送消息
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

// 导出一个处理函数
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const prompt = req.body.prompt;
    const parentMessageId = req.body.option.parentMessageId;
    const completionParams = req.body.option.completionParams;
    console.log("completionParams", completionParams);
    console.log("prompt", prompt);
    const apiResult = await api.sendMessage(prompt, {
      parentMessageId,
      completionParams,
    });
    console.log("successapi", apiResult);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache");
    res.status(200).json({ message: apiResult });
  } catch (e) {
    console.error("[OpenAI] ", req.body, e);

    res.status(500).json({
      error: true,
      msg: JSON.stringify(e),
    });
  }
}
