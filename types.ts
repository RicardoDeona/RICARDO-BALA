
export enum Mode {
  ASSISTANT = 'ASSISTANT',
  IMAGE_GEN = 'IMAGE_GEN',
  IMAGE_EDIT = 'IMAGE_EDIT',
  VIDEO_GEN = 'VIDEO_GEN',
  IMAGE_ANIMATE = 'IMAGE_ANIMATE',
  VOICE_CONVO = 'VOICE_CONVO',
  IMAGE_INTERPRET = 'IMAGE_INTERPRET',
}

export type OutputContent = {
  type: 'text' | 'image' | 'video' | 'voice';
  data: string | string[]; // string for text/image/video, string[] for voice transcripts
};

export type ApiState = {
  isLoading: boolean;
  error: string | null;
  data: OutputContent | null;
};
