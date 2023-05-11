import { ModelConfig } from "../../app/store/config";

export type niceApiOption = {
  completionParams: ModelConfig;
  parentMessageId?: string;
};
