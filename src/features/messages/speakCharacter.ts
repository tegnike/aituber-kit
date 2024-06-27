import { wait } from "@/utils/wait";
import { synthesizeVoiceApi } from "./synthesizeVoice";
import { synthesizeVoiceGoogleApi } from "./synthesizeVoiceGoogle";
import { synthesizeStyleBertVITS2Api } from "./synthesizeStyleBertVITS2";
import { Viewer } from "../vrmViewer/viewer";
import { Screenplay, Talk } from "./messages";
import englishToJapanese from '@/utils/englishToJapanese.json';

interface EnglishToJapanese {
  [key: string]: string;
}

const VOICE_VOX_API_URL = process.env.NEXT_PUBLIC_VOICE_VOX_API_URL || 'http://localhost:50021';
const typedEnglishToJapanese = englishToJapanese as EnglishToJapanese;

const createSpeakCharacter = () => {
  let lastTime = 0;
  let prevFetchPromise: Promise<unknown> = Promise.resolve();
  let prevSpeakPromise: Promise<unknown> = Promise.resolve();

  return (
    screenplay: Screenplay,
    viewer: Viewer,
    selectVoice: string,
    selectLanguage: string,
    koeiroApiKey: string,
    voicevoxSpeaker: string,
    googleTtsType: string,
    stylebertvits2ServerUrl: string,
    stylebertvits2ModelId: string,
    stylebertvits2Style: string,
    gsviTtsServerUrl: string,
    gsviTtsModelId: string,
    gsviTtsBatchSize: number,
    gsviTtsSpeechRate: number,
    changeEnglishToJapanese: boolean,
    onStart?: () => void,
    onComplete?: () => void
  ) => {
    onStart?.();

    if (changeEnglishToJapanese && selectLanguage === "JP") {
      // 英単語を日本語で読み上げる
      screenplay.talk.message = convertEnglishToJapaneseReading(screenplay.talk.message);
    }

    const fetchPromise = prevFetchPromise.then(async () => {
      const now = Date.now();
      if (now - lastTime < 1000) {
        await wait(1000 - (now - lastTime));
      }
      let buffer;
      if (selectVoice == "koeiromap") {
        buffer = await fetchAudio(screenplay.talk, koeiroApiKey).catch(() => null);
      } else if (selectVoice == "voicevox") {
        buffer = await fetchAudioVoiceVox(screenplay.talk, voicevoxSpeaker).catch(() => null);
      } else if (selectVoice == "google") {
        const googleTtsTypeByLang = getGoogleTtsType(googleTtsType, selectLanguage);
        buffer = await fetchAudioGoogle(screenplay.talk, googleTtsTypeByLang).catch(() => null);
      } else if (selectVoice == "stylebertvits2") {
        buffer = await fetchAudioStyleBertVITS2(screenplay.talk, stylebertvits2ServerUrl, stylebertvits2ModelId, stylebertvits2Style, selectLanguage).catch(() => null);
      } else if (selectVoice == "gsvitts") {
        buffer = await fetchAudioVoiceGSVIApi(screenplay.talk, gsviTtsServerUrl, gsviTtsModelId, gsviTtsBatchSize, gsviTtsSpeechRate).catch(() => null);
      }
      lastTime = Date.now();
      return buffer;
    });

    prevFetchPromise = fetchPromise;
    prevSpeakPromise = Promise.all([fetchPromise, prevSpeakPromise]).then(
      ([audioBuffer]) => {
        if (!audioBuffer) {
          return;
        }
        return viewer.model?.speak(audioBuffer, screenplay);
      }
    );
    prevSpeakPromise.then(() => {
      onComplete?.();
    });
  };
};

function convertEnglishToJapaneseReading(text: string): string {
  const sortedKeys = Object.keys(typedEnglishToJapanese).sort((a, b) => b.length - a.length);
  
  return sortedKeys.reduce((result, englishWord) => {
    const japaneseReading = typedEnglishToJapanese[englishWord];
    const regex = new RegExp(`\\b${englishWord}\\b`, 'gi');
    return result.replace(regex, japaneseReading);
  }, text);
}

function getGoogleTtsType(googleTtsType: string, selectLanguage: string): string {
  if (googleTtsType && googleTtsType !== "") {
    return googleTtsType;
  }

  const storedData = window.localStorage.getItem('chatVRMParams');
  if (storedData) {
    const params = JSON.parse(storedData);
    const langCode = params.selectLanguage;
    if (langCode) {
      return getGppgleTtsType(langCode) || '';
    }
  }
  return '';
}

function getGppgleTtsType(selectLanguage: string): string {
  switch (selectLanguage) {
    case 'JP': return 'ja-JP-Standard-B';
    case 'EN': return 'en-US-Neural2-F';
    case 'ZH': return 'cmn-TW-Standard-A';
    default: return 'en-US-Neural2-F';
  }
}

export const speakCharacter = createSpeakCharacter();

export const fetchAudio = async (
  talk: Talk,
  apiKey: string
): Promise<ArrayBuffer> => {
  const ttsVoice = await synthesizeVoiceApi(
    talk.message,
    talk.speakerX,
    talk.speakerY,
    talk.style,
    apiKey
  );
  const url = ttsVoice.audio;

  if (url == null) {
    throw new Error("Something went wrong");
  }

  const resAudio = await fetch(url);
  const buffer = await resAudio.arrayBuffer();
  return buffer;
};

export const fetchAudioVoiceVox = async (
  talk: Talk,
  speaker: string
): Promise<ArrayBuffer> => {
  console.log("speakerId:", speaker)
  const ttsQueryResponse = await fetch(VOICE_VOX_API_URL + '/audio_query?speaker=' + speaker + '&text=' + encodeURIComponent(talk.message), {
    method: 'POST',
  });
  if (!ttsQueryResponse.ok) {
    throw new Error('Failed to fetch TTS query.');
  }
  const ttsQueryJson = await ttsQueryResponse.json();

  ttsQueryJson['speedScale'] = 1.1;
  const synthesisResponse = await fetch(VOICE_VOX_API_URL + '/synthesis?speaker=' + speaker, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' },
    body: JSON.stringify(ttsQueryJson)
  });
  if (!synthesisResponse.ok) {
    throw new Error('Failed to fetch TTS synthesis result.');
  }
  const blob = await synthesisResponse.blob();
  const buffer = await blob.arrayBuffer();
  return buffer;
}

export const fetchAudioGoogle = async (
  talk: Talk,
  ttsType: string
): Promise<ArrayBuffer> => {
  const ttsVoice = await synthesizeVoiceGoogleApi(
    talk.message,
    ttsType
  );
  const uint8Array = new Uint8Array(ttsVoice.audio.data);
  const arrayBuffer: ArrayBuffer = uint8Array.buffer;
  
  return arrayBuffer;
};

export const fetchAudioStyleBertVITS2 = async (
  talk: Talk,
  stylebertvits2ServerUrl: string,
  stylebertvits2ModelId: string,
  stylebertvits2Style: string,
  selectLanguage: string
): Promise<ArrayBuffer> => {
  const ttsVoice = await synthesizeStyleBertVITS2Api(
    talk.message,
    stylebertvits2ServerUrl,
    stylebertvits2ModelId,
    stylebertvits2Style,
    selectLanguage
  );
  return ttsVoice
};

export const testVoice = async (
  viewer: Viewer,
  voicevoxSpeaker: string
) => {
  const talk: Talk = {
    message: "ボイスボックスを使用します",
    speakerX: 0,
    speakerY: 0,
    style: "talk",
  };
  const buffer = await fetchAudioVoiceVox(talk, voicevoxSpeaker).catch(
    () => null  
  );
  if (buffer) {
    const screenplay: Screenplay = {
      expression: "neutral",
      talk: talk
    };
    await viewer.model?.speak(buffer, screenplay);
  }
};

export const fetchAudioVoiceGSVIApi = async (
  talk: Talk,
  url: string,
  character: string,
  batchsize: number,
  speed: number,
): Promise<ArrayBuffer> => {
  const style = (talk.style !== 'talk')? talk.style : 'default';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      character: character,
      emotion: style,
      text: talk.message,
      batch_size: batchsize,
      speed: speed.toString(),
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error('Failed to fetch TTS audio.');
  }

  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  return buffer;
}
