import { ModelConfig } from "../../app/store/config";

export type NiceApiOption = {
  completionParams: ModelConfig;
  parentMessageId?: string;
  conversationId?: string;
};

export interface ChunkMessage {
  id: string;
  text: string;
  role: string;
  name?: string;
  delta?: string;
  detail?: any;
  parentMessageId?: string;
  conversationId?: string;
}
