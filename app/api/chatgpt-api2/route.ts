import { NextRequest, NextResponse } from "next/server";
import { ChatGPTAPI, ChatGPTUnofficialProxyAPI } from "chatgpt";

async function example() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";

  const api = new ChatGPTAPI({
    apiKey: OPENAI_API_KEY,
    completionParams: {
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      top_p: 0.8,
    },
  });

  return api.sendMessage("Hello World!");
}

async function makeRequest(req: NextRequest) {
  try {
    const api = await example();
    console.log(api);
    const res = new NextResponse(api.text);
    res.headers.set("Content-Type", "application/json");
    res.headers.set("Cache-Control", "no-cache");
    return res;
  } catch (e) {
    console.error("[OpenAI] ", req.body, e);
    return NextResponse.json(
      {
        error: true,
        msg: JSON.stringify(e),
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(req: NextRequest) {
  return makeRequest(req);
}

export const runtime = "experimental-edge";
