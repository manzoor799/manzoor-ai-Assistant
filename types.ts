export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  LIVE = 'LIVE',
  IMAGE_EDIT = 'IMAGE_EDIT',
  TRANSCRIBE = 'TRANSCRIBE',
  TTS = 'TTS',
  // New Modes
  FORMS = 'FORMS',
  DOCS = 'DOCS',
  CROPS = 'CROPS',
  FARMING = 'FARMING',
  HEALTH = 'HEALTH',
  EDUCATION = 'EDUCATION',
  UTILITIES = 'UTILITIES'
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