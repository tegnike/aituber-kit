import { useTranslation } from 'react-i18next';

import { Voice } from '@/features/chat/aiChatFactory';
import {
  PRESET_A,
  PRESET_B,
  PRESET_C,
  PRESET_D,
} from '@/features/constants/koeiroParam';
import { testVoice } from '@/features/messages/speakCharacter';
import store from '@/features/stores/app';
import { Link } from '../link';
import { TextButton } from '../textButton';
import speakers from '../speakers.json';

const Voice = () => {
  const koeiromapKey = store((s) => s.koeiromapKey);
  const elevenlabsApiKey = store((s) => s.elevenlabsApiKey);

  const selectVoice = store((s) => s.selectVoice);
  const koeiroParam = store((s) => s.koeiroParam);
  const googleTtsType = store((s) => s.googleTtsType);
  const voicevoxSpeaker = store((s) => s.voicevoxSpeaker);
  const stylebertvits2ServerUrl = store((s) => s.stylebertvits2ServerUrl);
  const stylebertvits2ModelId = store((s) => s.stylebertvits2ModelId);
  const stylebertvits2Style = store((s) => s.stylebertvits2Style);
  const gsviTtsServerUrl = store((s) => s.gsviTtsServerUrl);
  const gsviTtsModelId = store((s) => s.gsviTtsModelId);
  const gsviTtsBatchSize = store((s) => s.gsviTtsBatchSize);
  const gsviTtsSpeechRate = store((s) => s.gsviTtsSpeechRate);
  const elevenlabsVoiceId = store((s) => s.elevenlabsVoiceId);

  const { t } = useTranslation();

  return (
    <div className="my-40">
      <div className="my-16 typography-20 font-bold">
        {t('SyntheticVoiceEngineChoice')}
      </div>
      <div>{t('VoiceEngineInstruction')}</div>
      <div className="my-8">
        <select
          value={selectVoice}
          onChange={(e) =>
            store.setState({ selectVoice: e.target.value as Voice })
          }
          className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8"
        >
          <option value="voicevox">{t('UsingVoiceVox')}</option>
          <option value="koeiromap">{t('UsingKoeiromap')}</option>
          <option value="google">{t('UsingGoogleTTS')}</option>
          <option value="stylebertvits2">{t('UsingStyleBertVITS2')}</option>
          <option value="gsvitts">{t('UsingGSVITTS')}</option>
          <option value="elevenlabs">{t('UsingElevenLabs')}</option>
        </select>
      </div>
      <div className="my-40">
        <div className="my-16 typography-20 font-bold">
          {t('VoiceAdjustment')}
        </div>
        {(() => {
          if (selectVoice === 'koeiromap') {
            return (
              <>
                <div>
                  {t('KoeiromapInfo')}
                  <br />
                  <Link
                    url="https://koemotion.rinna.co.jp"
                    label="https://koemotion.rinna.co.jp"
                  />
                </div>
                <div className="mt-16 font-bold">API キー</div>
                <div className="mt-8">
                  <input
                    className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                    type="text"
                    placeholder="..."
                    value={koeiromapKey}
                    onChange={(e) =>
                      store.setState({ koeiromapKey: e.target.value })
                    }
                  />
                </div>
                <div className="mt-16 font-bold">プリセット</div>
                <div className="my-8 grid grid-cols-2 gap-[8px]">
                  <TextButton
                    onClick={() =>
                      store.setState({
                        koeiroParam: {
                          speakerX: PRESET_A.speakerX,
                          speakerY: PRESET_A.speakerY,
                        },
                      })
                    }
                  >
                    かわいい
                  </TextButton>
                  <TextButton
                    onClick={() =>
                      store.setState({
                        koeiroParam: {
                          speakerX: PRESET_B.speakerX,
                          speakerY: PRESET_B.speakerY,
                        },
                      })
                    }
                  >
                    元気
                  </TextButton>
                  <TextButton
                    onClick={() =>
                      store.setState({
                        koeiroParam: {
                          speakerX: PRESET_C.speakerX,
                          speakerY: PRESET_C.speakerY,
                        },
                      })
                    }
                  >
                    かっこいい
                  </TextButton>
                  <TextButton
                    onClick={() =>
                      store.setState({
                        koeiroParam: {
                          speakerX: PRESET_D.speakerX,
                          speakerY: PRESET_D.speakerY,
                        },
                      })
                    }
                  >
                    渋い
                  </TextButton>
                </div>
                <div className="my-24">
                  <div className="select-none">x : {koeiroParam.speakerX}</div>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    step={0.001}
                    value={koeiroParam.speakerX}
                    className="mt-8 mb-16 input-range"
                    onChange={(e) => {
                      store.setState({
                        koeiroParam: {
                          speakerX: Number(e.target.value),
                          speakerY: koeiroParam.speakerY,
                        },
                      });
                    }}
                  ></input>
                  <div className="select-none">y : {koeiroParam.speakerY}</div>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    step={0.001}
                    value={koeiroParam.speakerY}
                    className="mt-8 mb-16 input-range"
                    onChange={(e) => {
                      store.setState({
                        koeiroParam: {
                          speakerX: koeiroParam.speakerX,
                          speakerY: Number(e.target.value),
                        },
                      });
                    }}
                  ></input>
                </div>
              </>
            );
          } else if (selectVoice === 'voicevox') {
            return (
              <>
                <div>
                  {t('VoiceVoxInfo')}
                  <br />
                  <Link
                    url="https://voicevox.hiroshiba.jp/"
                    label="https://voicevox.hiroshiba.jp/"
                  />
                </div>
                <div className="mt-16 font-bold">{t('SpeakerSelection')}</div>
                <div className="flex items-center">
                  <select
                    value={voicevoxSpeaker}
                    onChange={(e) =>
                      store.setState({ voicevoxSpeaker: e.target.value })
                    }
                    className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8"
                  >
                    <option value="">選択してください</option>
                    {speakers.map((speaker) => (
                      <option key={speaker.id} value={speaker.id}>
                        {speaker.speaker}
                      </option>
                    ))}
                  </select>
                  <TextButton
                    onClick={() => testVoice(voicevoxSpeaker)}
                    className="ml-16"
                  >
                    ボイスを試聴する
                  </TextButton>
                </div>
              </>
            );
          } else if (selectVoice === 'google') {
            return (
              <>
                <div>
                  {t('GoogleTTSInfo')}
                  {t('AuthFileInstruction')}
                  <br />
                  <Link
                    url="https://developers.google.com/workspace/guides/create-credentials?#create_credentials_for_a_service_account"
                    label="https://developers.google.com/workspace/guides/create-credentials?#create_credentials_for_a_service_account"
                  />
                  <br />
                  <br />
                  {t('LanguageModelURL')}
                  <br />
                  <Link
                    url="https://cloud.google.com/text-to-speech/docs/voices"
                    label="https://cloud.google.com/text-to-speech/docs/voices"
                  />
                </div>
                <div className="mt-16 font-bold">{t('LanguageChoice')}</div>
                <div className="mt-8">
                  <input
                    className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
                    type="text"
                    placeholder="..."
                    value={googleTtsType}
                    onChange={(e) =>
                      store.setState({ googleTtsType: e.target.value })
                    }
                  />
                </div>
              </>
            );
          } else if (selectVoice === 'stylebertvits2') {
            return (
              <>
                <div>
                  {t('StyleBertVITS2Info')}
                  <br />
                  <Link
                    url="https://github.com/litagin02/Style-Bert-VITS2"
                    label="https://github.com/litagin02/Style-Bert-VITS2"
                  />
                  <br />
                  <br />
                </div>
                <div className="mt-16 font-bold">
                  {t('StyleBeatVITS2LocalServerURL')}
                </div>
                <div className="mt-8">
                  <input
                    className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
                    type="text"
                    placeholder="..."
                    value={stylebertvits2ServerUrl}
                    onChange={(e) =>
                      store.setState({
                        stylebertvits2ServerUrl: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-16 font-bold">
                  {t('StyleBeatVITS2ModelID')}
                </div>
                <div className="mt-8">
                  <input
                    className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
                    type="number"
                    placeholder="..."
                    value={stylebertvits2ModelId}
                    onChange={(e) =>
                      store.setState({
                        stylebertvits2ModelId: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-16 font-bold">
                  {t('StyleBeatVITS2Style')}
                </div>
                <div className="mt-8">
                  <input
                    className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
                    type="text"
                    placeholder="..."
                    value={stylebertvits2Style}
                    onChange={(e) =>
                      store.setState({
                        stylebertvits2Style: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            );
          } else if (selectVoice === 'gsvitts') {
            return (
              <>
                <div>{t('GSVITTSInfo')}</div>
                <div className="mt-16 font-bold">{t('GSVITTSServerUrl')}</div>
                <div className="mt-8">
                  <input
                    className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
                    type="text"
                    placeholder="..."
                    value={gsviTtsServerUrl}
                    onChange={(e) =>
                      store.setState({ gsviTtsServerUrl: e.target.value })
                    }
                  />
                </div>
                <div className="mt-16 font-bold">{t('GSVITTSModelID')}</div>
                <div className="mt-8">
                  <input
                    className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
                    type="text"
                    placeholder="..."
                    value={gsviTtsModelId}
                    onChange={(e) =>
                      store.setState({ gsviTtsModelId: e.target.value })
                    }
                  />
                </div>
                <div className="mt-16 font-bold">{t('GSVITTSBatchSize')}</div>
                <div className="mt-8">
                  <input
                    className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
                    type="number"
                    step="1"
                    placeholder="..."
                    value={gsviTtsBatchSize}
                    onChange={(e) =>
                      store.setState({
                        gsviTtsBatchSize: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="mt-16 font-bold">{t('GSVITTSSpeechRate')}</div>
                <div className="mt-8">
                  <input
                    className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
                    type="number"
                    step="0.1"
                    placeholder="..."
                    value={gsviTtsSpeechRate}
                    onChange={(e) =>
                      store.setState({
                        gsviTtsSpeechRate: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </>
            );
          } else if (selectVoice === 'elevenlabs') {
            return (
              <>
                <div>
                  {t('ElevenLabsInfo')}
                  <br />
                  <Link
                    url="https://elevenlabs.io/api"
                    label="https://elevenlabs.io/api"
                  />
                  <br />
                </div>
                <div className="mt-16 font-bold">{t('ElevenLabsApiKey')}</div>
                <div className="mt-8">
                  <input
                    className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
                    type="text"
                    placeholder="..."
                    value={elevenlabsApiKey}
                    onChange={(e) =>
                      store.setState({ elevenlabsApiKey: e.target.value })
                    }
                  />
                </div>
                <div className="mt-16 font-bold">{t('ElevenLabsVoiceId')}</div>
                <div className="mt-8">
                  {t('ElevenLabsVoiceIdInfo')}
                  <br />
                  <Link
                    url="https://api.elevenlabs.io/v1/voices"
                    label="https://api.elevenlabs.io/v1/voices"
                  />
                  <br />
                </div>
                <div className="mt-8">
                  <input
                    className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
                    type="text"
                    placeholder="..."
                    value={elevenlabsVoiceId}
                    onChange={(e) =>
                      store.setState({
                        elevenlabsVoiceId: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            );
          }
        })()}
      </div>
    </div>
  );
};
export default Voice;
