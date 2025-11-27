
export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  LIVE = 'LIVE',
  IMAGE_EDIT = 'IMAGE_EDIT',
  TRANSCRIBE = 'TRANSCRIBE',
  TTS = 'TTS',
  // Existing Modes
  FORMS = 'FORMS',
  DOCS = 'DOCS',
  CROPS = 'CROPS',
  FARMING = 'FARMING',
  HEALTH = 'HEALTH',
  MEDICINE = 'MEDICINE',
  EDUCATION = 'EDUCATION',
  VISUAL = 'VISUAL',
  FINANCE = 'FINANCE',
  LEGAL = 'LEGAL',
  UTILITIES = 'UTILITIES',
  LIVESTOCK = 'LIVESTOCK',
  JOBS = 'JOBS',
  NEWS = 'NEWS',
  // New Missing Modes
  SHOPPING = 'SHOPPING',
  REMINDERS = 'REMINDERS',
  CULTURE = 'CULTURE',
  WOMEN = 'WOMEN',
  PROFILE = 'PROFILE'
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
