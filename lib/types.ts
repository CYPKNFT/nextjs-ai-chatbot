export type DataPart = { type: 'append-message'; message: string };

export interface UploadApiResponse {
  url: string;
  pathname: string;
  contentType: string;
  extractedText?: string;
}

export interface Attachment {
  url: string;
  name: string;
  contentType: string;
}
