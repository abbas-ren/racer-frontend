// src/components/WebCLIModal/prompts/types.ts - UPDATED

export enum PromptType {
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  INPUT = 'input',
  CONFIRM = 'confirm',
}

export interface BasePromptRequest {
  id: string;
  type: PromptType;
  message: string;
}

export interface PromptChoice {
  label: string;
  value: any;
  description?: string;
  selected?: boolean;
}

export interface SelectPromptRequest extends BasePromptRequest {
  type: PromptType.SELECT;
  choices: PromptChoice[];
  default?: number;
}

export interface MultiSelectPromptRequest extends BasePromptRequest {
  type: PromptType.MULTI_SELECT;
  choices: PromptChoice[];
  min?: number;
  max?: number;
}

export interface InputPromptRequest extends BasePromptRequest {
  type: PromptType.INPUT;
  placeholder?: string;
  default?: string;
}

export interface ConfirmPromptRequest extends BasePromptRequest {
  type: PromptType.CONFIRM;
  default?: boolean;
}

export type PromptRequest =
  | SelectPromptRequest
  | MultiSelectPromptRequest
  | InputPromptRequest
  | ConfirmPromptRequest;

export interface PromptResponse {
  id: string;
  value: any;
  cancelled?: boolean;
}
