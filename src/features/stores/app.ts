import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface APIKeys {
  openAiKey: string;
  anthropicKey: string;
  googleKey: string;
  groqKey: string;
  difyKey: string;
  koeiromapKey: string;
  youtubeApiKey: string;
  elevenlabsApiKey: string;
}

export type AppState = APIKeys & {};

const store = create<AppState>()(
  persist(
    (set, get) => ({
      // API Keys
      openAiKey: '',
      anthropicKey: '',
      googleKey: '',
      groqKey: '',
      difyKey: '',
      koeiromapKey: '',
      youtubeApiKey: '',
      elevenlabsApiKey: '',
    }),
    {
      name: 'app',
    },
  ),
);
export default store;
