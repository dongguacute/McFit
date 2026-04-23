type requestBody = {
  mcptoken: string;
  aitoken: string;
  prompt: string;
};

type responseBody = {
  message: string;
};

export type { requestBody, responseBody };