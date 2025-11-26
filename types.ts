export enum AppMode {
  CHAT = 'CHAT',
  LIVE = 'LIVE',
  IMAGE_EDIT = 'IMAGE_EDIT',
  TRANSCRIBE = 'TRANSCRIBE',
  TTS = 'TTS'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string; // base64
  imageMimeType?: string;
}

export interface ProcessingState {
  isLoading: boolean;
  error: string | null;
}