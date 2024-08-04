import { Disclosure } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/24/solid';
import i18n from 'i18next';
import Image from 'next/image';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Voice } from '@/features/chat/aiChatFactory';
import {
  PRESET_A,
  PRESET_B,
  PRESET_C,
  PRESET_D,
} from '@/features/constants/koeiroParam';
import { SYSTEM_PROMPT } from '@/features/constants/systemPromptConstants';
import store from '@/features/stores/app';
import homeStore from '@/features/stores/home';
import menuStore from '@/features/stores/menu';
import { GitHubLink } from './githubLink';
import { IconButton } from './iconButton';
import { Link } from './link';
import speakers from './speakers.json';
import { TextButton } from './textButton';

type Props = {
  onClickClose: () => void;
  onClickTestVoice: (speaker: string) => void;
  showSettingsButton: boolean;
  onChangeShowSettingsButton: (show: boolean) => void;
};
export const Settings = ({
  onClickClose,
  onClickTestVoice,
  showSettingsButton,
  onChangeShowSettingsButton,
}: Props) => {
  // API Keys
  const openAiKey = store((s) => s.openAiKey);
  const anthropicKey = store((s) => s.anthropicKey);
  const googleKey = store((s) => s.googleKey);
  const groqKey = store((s) => s.groqKey);
  const difyKey = store((s) => s.difyKey);
  const koeiromapKey = store((s) => s.koeiromapKey);
  const youtubeApiKey = store((s) => s.youtubeApiKey);
  const elevenlabsApiKey = store((s) => s.elevenlabsApiKey);

  // Model Provider
  const selectAIService = store((s) => s.selectAIService);
  const selectAIModel = store((s) => s.selectAIModel);
  const localLlmUrl = store((s) => s.localLlmUrl);
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

  // Integrations
  const difyUrl = store((s) => s.difyUrl);
  const difyConversationId = store((s) => s.difyConversationId);
  const youtubeMode = store((s) => s.youtubeMode);
  const youtubeLiveId = store((s) => s.youtubeLiveId);

  // Characters
  const characterName = store((s) => s.characterName);
  const showCharacterName = store((s) => s.showCharacterName);
  const systemPrompt = store((s) => s.systemPrompt);
  const conversationContinuityMode = store((s) => s.conversationContinuityMode);

  // General
  const selectLanguage = store((s) => s.selectLanguage);
  const changeEnglishToJapanese = store((s) => s.changeEnglishToJapanese);
  const webSocketMode = store((s) => s.webSocketMode);

  // Chat
  const chatLog = store((s) => s.chatLog);

  const { t } = useTranslation();

  // オブジェクトを定義して、各AIサービスのデフォルトモデルを保存する
  // ローカルLLMが選択された場合、AIモデルを空文字に設定
  const defaultModels = {
    openai: 'gpt-3.5-turbo',
    anthropic: 'claude-3-haiku-20240307',
    google: 'gemini-1.5-pro',
    groq: 'gemma-7b-it',
    localLlm: '',
    dify: '',
  };

  return (
    <div className="absolute z-40 w-full h-full bg-white/80 backdrop-blur ">
      <GitHubLink />
      <div className="absolute m-24">
        <IconButton
          iconName="24/Close"
          isProcessing={false}
          onClick={onClickClose}
        ></IconButton>
      </div>
      <div className="absolute py-4 bg-[#413D43] text-center text-white font-Montserrat bottom-0 w-full">
        powered by Pixiv, VRoid, Koemotion, VOICEVOX, OpenAI, Anthropic, Google,
        Groq, Dify
      </div>
      <div className="max-h-full overflow-auto">
        <div className="text-text1 max-w-3xl mx-auto px-24 py-64 ">
          <div className="my-24 typography-32 font-bold">{t('Settings')}</div>
          {/* 言語設定 */}
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">{t('Language')}</div>
            <div className="my-8">
              <select
                className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8"
                value={selectLanguage}
                onChange={(e) => {
                  const newLanguage = e.target.value;
                  const jpVoiceSelected =
                    selectVoice === 'voicevox' || selectVoice === 'koeiromap';

                  switch (newLanguage) {
                    case 'JP':
                      store.setState({
                        selectLanguage: 'JP',
                        selectVoiceLanguage: 'ja-JP',
                      });

                      i18n.changeLanguage('ja');
                      break;
                    case 'EN':
                      store.setState({ selectLanguage: 'EN' });

                      if (jpVoiceSelected) {
                        store.setState({ selectVoice: 'google' });
                      }
                      store.setState({ selectVoiceLanguage: 'en-US' });

                      i18n.changeLanguage('en');
                      break;
                    case 'ZH':
                      store.setState({ selectLanguage: 'ZH' });

                      if (jpVoiceSelected) {
                        store.setState({ selectVoice: 'google' });
                      }
                      store.setState({ selectVoiceLanguage: 'zh-TW' });

                      i18n.changeLanguage('zh-TW');
                      break;
                    case 'KO':
                      store.setState({ selectLanguage: 'KO' });

                      if (jpVoiceSelected) {
                        store.setState({ selectVoice: 'google' });
                      }
                      store.setState({ selectVoiceLanguage: 'ko-KR' });

                      i18n.changeLanguage('ko');
                      break;
                    default:
                      break;
                  }
                }}
              >
                <option value="JP">日本語 - Japanese</option>
                <option value="EN">英語 - English</option>
                <option value="ZH">繁體中文 - Traditional Chinese</option>
                <option value="KO">韓語 - Korean</option>
              </select>
            </div>
          </div>
          {/* キャラクター名表示 */}
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">
              {t('CharacterName')}
            </div>
            <input
              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
              type="text"
              placeholder={t('CharacterName')}
              value={characterName}
              onChange={(e) =>
                store.setState({ characterName: e.target.value })
              }
            />
            <div className="my-16 typography-20 font-bold">
              {t('ShowCharacterName')}
            </div>
            <div className="my-8">
              <TextButton
                onClick={() =>
                  store.setState((s) => ({
                    showCharacterName: !s.showCharacterName,
                  }))
                }
              >
                {showCharacterName ? t('StatusOn') : t('StatusOff')}
              </TextButton>
            </div>
          </div>
          {/* VRMと背景画像の設定 */}
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">
              {t('CharacterModelLabel')}
            </div>
            <div className="my-8">
              <TextButton
                onClick={() => {
                  const { fileInput } = menuStore.getState();
                  fileInput?.click();
                }}
              >
                {t('OpenVRM')}
              </TextButton>
            </div>
            <div className="my-16 typography-20 font-bold">
              {t('BackgroundImage')}
            </div>
            <div className="my-8">
              <TextButton
                onClick={() => {
                  const { bgFileInput } = menuStore.getState();
                  bgFileInput?.click();
                }}
              >
                {t('ChangeBackgroundImage')}
              </TextButton>
            </div>
          </div>
          {/* 外部接続モード */}
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">
              {t('ExternalConnectionMode')}
            </div>
            <div className="my-8">
              {webSocketMode ? (
                <TextButton
                  onClick={() => {
                    store.setState({ webSocketMode: false });
                    webSocketMode && store.setState({ youtubeMode: false });
                  }}
                >
                  {t('StatusOn')}
                </TextButton>
              ) : (
                <TextButton
                  onClick={() => {
                    store.setState({ webSocketMode: true });
                    webSocketMode && store.setState({ youtubeMode: false });
                  }}
                >
                  {t('StatusOff')}
                </TextButton>
              )}
            </div>
          </div>
          {/* 外部連携モードでない時の設定 */}
          {(() => {
            if (!webSocketMode) {
              return (
                <>
                  <div className="my-40">
                    <div className="my-16 typography-20 font-bold">
                      {t('SelectAIService')}
                    </div>
                    <div className="my-8">
                      <select
                        className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8"
                        value={selectAIService}
                        onChange={(e) => {
                          const newService = e.target
                            .value as keyof typeof defaultModels;

                          store.setState({
                            selectAIService: newService,
                          });

                          if (newService !== 'openai') {
                            store.setState({
                              conversationContinuityMode: false,
                            });
                            homeStore.setState({ modalImage: '' });
                            menuStore.setState({ showWebcam: false });
                          }

                          // 選択したAIサービスに基づいてデフォルトモデルを設定する
                          store.setState({
                            selectAIModel: defaultModels[newService],
                          });
                        }}
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="google">Google Gemini</option>
                        <option value="groq">Groq</option>
                        <option value="localLlm">{t('LocalLLM')}</option>
                        <option value="dify">Dify</option>
                      </select>
                    </div>
                    {(() => {
                      if (selectAIService === 'openai') {
                        return (
                          <div className="my-24">
                            <div className="my-16 typography-20 font-bold">
                              {t('OpenAIAPIKeyLabel')}
                            </div>
                            <input
                              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                              type="text"
                              placeholder="sk-..."
                              value={openAiKey}
                              onChange={(e) =>
                                store.setState({ openAiKey: e.target.value })
                              }
                            />
                            <div className="my-16">
                              {t('APIKeyInstruction')}
                              <br />
                              <Link
                                url="https://platform.openai.com/account/api-keys"
                                label="OpenAI"
                              />
                            </div>
                            <div className="my-16">{t('ChatGPTInfo')}</div>
                            <div className="my-24">
                              <div className="my-16 typography-20 font-bold">
                                {t('SelectModel')}
                              </div>
                              <select
                                className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                                value={selectAIModel}
                                onChange={(e) =>
                                  store.setState({
                                    selectAIModel: e.target.value,
                                  })
                                }
                              >
                                <option value="gpt-4o-mini">gpt-4o-mini</option>
                                <option value="gpt-4o">gpt-4o</option>
                                <option value="gpt-4-turbo">gpt-4-turbo</option>
                                <option value="gpt-3.5-turbo">
                                  gpt-3.5-turbo
                                </option>
                              </select>
                            </div>
                          </div>
                        );
                      } else if (selectAIService === 'anthropic') {
                        return (
                          <div className="my-24">
                            <div className="my-16 typography-20 font-bold">
                              {t('AnthropicAPIKeyLabel')}
                            </div>
                            <input
                              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                              type="text"
                              placeholder="..."
                              value={anthropicKey}
                              onChange={(e) =>
                                store.setState({ anthropicKey: e.target.value })
                              }
                            />
                            <div className="my-16">
                              {t('APIKeyInstruction')}
                              <br />
                              <Link
                                url="https://console.anthropic.com"
                                label="Anthropic"
                              />
                            </div>
                            <div className="my-24">
                              <div className="my-16 typography-20 font-bold">
                                {t('SelectModel')}
                              </div>
                              <select
                                className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                                value={selectAIModel}
                                onChange={(e) =>
                                  store.setState({
                                    selectAIModel: e.target.value,
                                  })
                                }
                              >
                                <option value="claude-3-opus-20240229">
                                  claude-3-opus-20240229
                                </option>
                                <option value="claude-3-5-sonnet-20240620">
                                  claude-3.5-sonnet-20240620
                                </option>
                                <option value="claude-3-sonnet-20240229">
                                  claude-3-sonnet-20240229
                                </option>
                                <option value="claude-3-haiku-20240307">
                                  claude-3-haiku-20240307
                                </option>
                              </select>
                            </div>
                          </div>
                        );
                      } else if (selectAIService === 'google') {
                        return (
                          <div className="my-24">
                            <div className="my-16 typography-20 font-bold">
                              {t('GoogleAPIKeyLabel')}
                            </div>
                            <input
                              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                              type="text"
                              placeholder="..."
                              value={googleKey}
                              onChange={(e) =>
                                store.setState({ googleKey: e.target.value })
                              }
                            />
                            <div className="my-16">
                              {t('APIKeyInstruction')}
                              <br />
                              <Link
                                url="https://aistudio.google.com/app/apikey?hl=ja"
                                label="Google AI Studio"
                              />
                            </div>
                            <div className="my-24">
                              <div className="my-16 typography-20 font-bold">
                                {t('SelectModel')}
                              </div>
                              <select
                                className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                                value={selectAIModel}
                                onChange={(e) =>
                                  store.setState({
                                    selectAIModel: e.target.value,
                                  })
                                }
                              >
                                <option value="gemini-1.5-pro-latest">
                                  gemini-1.5-pro-latest
                                </option>
                                <option value="gemini-1.5-flash-latest">
                                  gemini-1.5-flash-latest
                                </option>
                              </select>
                            </div>
                          </div>
                        );
                      } else if (selectAIService === 'groq') {
                        return (
                          <div className="my-24">
                            <div className="my-16 typography-20 font-bold">
                              {t('GroqAPIKeyLabel')}
                            </div>
                            <input
                              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                              type="text"
                              placeholder="..."
                              value={groqKey}
                              onChange={(e) =>
                                store.setState({ groqKey: e.target.value })
                              }
                            />
                            <div className="my-16">
                              {t('APIKeyInstruction')}
                              <br />
                              <Link
                                url="https://console.groq.com/keys"
                                label="Groq Dashboard"
                              />
                            </div>
                            <div className="my-24">
                              <div className="my-16 typography-20 font-bold">
                                {t('SelectModel')}
                              </div>
                              <select
                                className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                                value={selectAIModel}
                                onChange={(e) =>
                                  store.setState({
                                    selectAIModel: e.target.value,
                                  })
                                }
                              >
                                <option value="gemma-7b-it">gemma-7b-it</option>
                                <option value="llama3-70b-8192">
                                  llama3-70b-8192
                                </option>
                                <option value="llama3-8b-8192">
                                  llama3-8b-8192
                                </option>
                                <option value="mixtral-8x7b-32768">
                                  mixtral-8x7b-32768
                                </option>
                              </select>
                            </div>
                          </div>
                        );
                      } else if (selectAIService === 'localLlm') {
                        return (
                          <div className="my-24">
                            <div className="my-16">
                              {t('LocalLLMInfo')}
                              <br />
                              ex. Ollama:{' '}
                              <Link
                                url="https://note.com/schroneko/n/n8b1a5bbc740b"
                                label="https://note.com/schroneko/n/n8b1a5bbc740b"
                              />
                            </div>
                            <div className="my-16">
                              {t('LocalLLMInfo2')}
                              <br />
                              ex. Ollama:
                              http://localhost:11434/v1/chat/completions
                            </div>
                            <div className="my-16 typography-20 font-bold">
                              {t('EnterURL')}
                            </div>
                            <input
                              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                              type="text"
                              placeholder="..."
                              value={localLlmUrl}
                              onChange={(e) =>
                                store.setState({ localLlmUrl: e.target.value })
                              }
                            />
                            <div className="my-16 typography-20 font-bold">
                              {t('SelectModel')}
                            </div>
                            <input
                              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                              type="text"
                              placeholder="..."
                              value={selectAIModel}
                              onChange={(e) =>
                                store.setState({
                                  selectAIModel: e.target.value,
                                })
                              }
                            />
                          </div>
                        );
                      } else if (selectAIService === 'dify') {
                        return (
                          <div className="my-24">
                            <div className="my-16">{t('DifyInfo')}</div>
                            <div className="my-16 typography-20 font-bold">
                              {t('DifyAPIKeyLabel')}
                            </div>
                            <input
                              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                              type="text"
                              placeholder="..."
                              value={difyKey}
                              onChange={(e) =>
                                store.setState({ difyKey: e.target.value })
                              }
                            />
                            <div className="my-24">
                              <div className="my-16 typography-20 font-bold">
                                {t('EnterURL')}
                              </div>
                              <div className="my-16">{t('DifyInfo3')}</div>
                              <input
                                className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                                type="text"
                                placeholder="..."
                                value={difyUrl}
                                onChange={(e) =>
                                  store.setState({ difyUrl: e.target.value })
                                }
                              />
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                  <div className="my-40">
                    <div className="my-16 typography-20 font-bold">
                      {t('YoutubeMode')}
                    </div>
                    <div className="my-8">
                      {youtubeMode ? (
                        <TextButton
                          onClick={() => store.setState({ youtubeMode: false })}
                        >
                          {t('StatusOn')}
                        </TextButton>
                      ) : (
                        <TextButton
                          onClick={() => store.setState({ youtubeMode: true })}
                        >
                          {t('StatusOff')}
                        </TextButton>
                      )}
                    </div>
                    <div className="my-16">
                      {(() => {
                        if (youtubeMode) {
                          return (
                            <>
                              <div className="">{t('YoutubeInfo')}</div>
                              <div className="my-16 typography-20 font-bold">
                                {t('YoutubeAPIKey')}
                              </div>
                              <input
                                className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                                type="text"
                                placeholder="..."
                                value={youtubeApiKey}
                                onChange={(e) =>
                                  store.setState({
                                    youtubeApiKey: e.target.value,
                                  })
                                }
                              />
                              <div className="my-16 typography-20 font-bold">
                                {t('YoutubeLiveID')}
                              </div>
                              <input
                                className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                                type="text"
                                placeholder="..."
                                value={youtubeLiveId}
                                onChange={(e) =>
                                  store.setState({
                                    youtubeLiveId: e.target.value,
                                  })
                                }
                              />
                              <div className="my-16 typography-20 font-bold">
                                {t('ConversationContinuityMode')}
                              </div>
                              <div className="my-8">
                                {t('ConversationContinuityModeInfo')}
                              </div>
                              <div className="my-8">
                                {t('ConversationContinuityModeInfo2')}
                              </div>
                              <div className="my-8">
                                {t('ConversationContinuityModeInfo3')}
                              </div>
                              {conversationContinuityMode ? (
                                <TextButton
                                  onClick={() =>
                                    store.setState({
                                      conversationContinuityMode: false,
                                    })
                                  }
                                  disabled={
                                    selectAIService !== 'openai' &&
                                    selectAIService !== 'anthropic'
                                  }
                                >
                                  {t('StatusOn')}
                                </TextButton>
                              ) : (
                                <TextButton
                                  onClick={() =>
                                    store.setState({
                                      conversationContinuityMode: true,
                                    })
                                  }
                                  disabled={
                                    selectAIService !== 'openai' &&
                                    selectAIService !== 'anthropic'
                                  }
                                >
                                  {t('StatusOff')}
                                </TextButton>
                              )}
                            </>
                          );
                        }
                      })()}
                    </div>
                  </div>
                  <div className="my-40">
                    <div className="my-8">
                      <div className="my-16 typography-20 font-bold">
                        {t('CharacterSettingsPrompt')}
                      </div>
                      {selectAIService === 'dify' && (
                        <div className="my-16">{t('DifyInstruction')}</div>
                      )}
                      <TextButton
                        onClick={() =>
                          store.setState({ systemPrompt: SYSTEM_PROMPT })
                        }
                      >
                        {t('CharacterSettingsReset')}
                      </TextButton>
                    </div>
                    <textarea
                      value={systemPrompt}
                      onChange={(e) =>
                        store.setState({ systemPrompt: e.target.value })
                      }
                      className="px-16 py-8 bg-surface1 hover:bg-surface1-hover h-168 rounded-8 w-full"
                    ></textarea>
                  </div>
                </>
              );
            }
          })()}
          {/* 音声エンジンの選択 */}
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
                <option value="stylebertvits2">
                  {t('UsingStyleBertVITS2')}
                </option>
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
                        <div className="select-none">
                          x : {koeiroParam.speakerX}
                        </div>
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
                        <div className="select-none">
                          y : {koeiroParam.speakerY}
                        </div>
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
                      <div className="mt-16 font-bold">
                        {t('SpeakerSelection')}
                      </div>
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
                          onClick={() => onClickTestVoice(voicevoxSpeaker)}
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
                      <div className="mt-16 font-bold">
                        {t('LanguageChoice')}
                      </div>
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
                      <div className="mt-16 font-bold">
                        {t('GSVITTSServerUrl')}
                      </div>
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
                      <div className="mt-16 font-bold">
                        {t('GSVITTSModelID')}
                      </div>
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
                      <div className="mt-16 font-bold">
                        {t('GSVITTSBatchSize')}
                      </div>
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
                      <div className="mt-16 font-bold">
                        {t('GSVITTSSpeechRate')}
                      </div>
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
                      <div className="mt-16 font-bold">
                        {t('ElevenLabsApiKey')}
                      </div>
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
                      <div className="mt-16 font-bold">
                        {t('ElevenLabsVoiceId')}
                      </div>
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
          <div className="my-40">
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex items-center w-full px-4 py-2 text-sm font-medium text-left text-purple-900 bg-purple-100 rounded-lg hover:bg-purple-200 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75">
                    <div className="flex items-center flex-grow">
                      <span className="typography-20 font-bold mr-8">
                        {t('AdvancedSettings')}
                      </span>
                      <ChevronUpIcon
                        className={`${
                          open ? 'transform rotate-180' : ''
                        } w-[20px] h-[20px] text-purple-500 flex-shrink-0`}
                      />
                    </div>
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500">
                    <div className="pl-16">
                      {selectLanguage === 'JP' && (
                        <div className="my-24">
                          <div className="my-16 typography-16 font-bold">
                            {t('EnglishToJapanese')}
                          </div>
                          <div className="my-8">
                            {changeEnglishToJapanese ? (
                              <TextButton
                                onClick={() =>
                                  store.setState({
                                    changeEnglishToJapanese: false,
                                  })
                                }
                              >
                                {t('StatusOn')}
                              </TextButton>
                            ) : (
                              <TextButton
                                onClick={() =>
                                  store.setState({
                                    changeEnglishToJapanese: true,
                                  })
                                }
                              >
                                {t('StatusOff')}
                              </TextButton>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="my-16 typography-16 font-bold">
                        {t('ShowSettingsButton')}
                      </div>
                      <div className="my-16 typography-16">
                        {t('ShowSettingsButtonInfo')}
                      </div>
                      <div className="my-8">
                        {showSettingsButton ? (
                          <TextButton
                            onClick={() => onChangeShowSettingsButton(false)}
                          >
                            {t('StatusOn')}
                          </TextButton>
                        ) : (
                          <TextButton
                            onClick={() => onChangeShowSettingsButton(true)}
                          >
                            {t('StatusOff')}
                          </TextButton>
                        )}
                      </div>
                    </div>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          </div>
          {/* チャットログの設定 */}
          <div className="my-40">
            <div className="my-8 grid-cols-2">
              <div className="my-16 typography-20 font-bold">
                {t('ConversationHistory')}
              </div>
              <div className="my-8">
                {selectAIService !== 'dify'
                  ? t('ConversationHistoryInfo')
                  : t('DifyInfo2')}
              </div>
              <TextButton
                onClick={() => {
                  store.setState({
                    difyConversationId: '',
                    chatLog: [],
                    codeLog: [],
                  });
                }}
              >
                {t('ConversationHistoryReset')}
              </TextButton>
            </div>

            {chatLog.length > 0 && (
              <div className="my-8">
                {chatLog.map((value, index) => {
                  return (
                    <div
                      key={index}
                      className="my-8 grid grid-flow-col  grid-cols-[min-content_1fr] gap-x-fixed"
                    >
                      <div className="w-[64px] py-8">
                        {value.role === 'assistant' ? 'Character' : 'You'}
                      </div>
                      {typeof value.content == 'string' ? (
                        <input
                          key={index}
                          className="bg-surface1 hover:bg-surface1-hover rounded-8 w-full px-16 py-8"
                          type="text"
                          value={value.content}
                          onChange={(e) => {
                            handleChangeChatLog(index, e.target.value);
                            handleChangeCodeLog(index, e.target.value);
                          }}
                        ></input>
                      ) : (
                        <Image
                          src={value.content[1].image_url.url}
                          alt="画像"
                          width={500}
                          height={500}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const handleChangeChatLog = (targetIndex: number, text: string) => {
  const s = store.getState();

  const newChatLog = s.chatLog.map((m, i) => {
    return i === targetIndex ? { role: m.role, content: text } : m;
  });

  store.setState({ chatLog: newChatLog });
};

const handleChangeCodeLog = (targetIndex: number, text: string) => {
  const s = store.getState();

  const newCodeLog = s.codeLog.map((m, i) => {
    return i === targetIndex ? { role: m.role, content: text } : m;
  });

  store.setState({ chatLog: newCodeLog });
};
