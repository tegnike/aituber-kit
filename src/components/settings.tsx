import React from "react";
import { IconButton } from "./iconButton";
import { TextButton } from "./textButton";
import { Message } from "@/features/messages/messages";
import {
  KoeiroParam,
  PRESET_A,
  PRESET_B,
  PRESET_C,
  PRESET_D,
} from "@/features/constants/koeiroParam";
import { Link } from "./link";
import i18n from "i18next";
import { useTranslation } from 'react-i18next';

type Props = {
  openAiKey: string;
  systemPrompt: string;
  chatLog: Message[];
  codeLog: Message[];
  koeiroParam: KoeiroParam;
  koeiromapKey: string;
  googleTtsType: string;
  onClickClose: () => void;
  onChangeAiKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeSystemPrompt: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeChatLog: (index: number, text: string) => void;
  onChangeCodeLog: (index: number, text: string) => void;
  onChangeKoeiroParam: (x: number, y: number) => void;
  onClickOpenVrmFile: () => void;
  onClickResetChatLog: () => void;
  onClickResetCodeLog: () => void;
  onClickResetSystemPrompt: () => void;
  onChangeKoeiromapKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeGoogleTtsType: (event: React.ChangeEvent<HTMLInputElement>) => void;
  webSocketMode: boolean;
  changeWebSocketMode: (show: boolean) => void;
  selectVoice: string;
  setSelectVoice: (show: string) => void;
  selectLanguage: string;
  setSelectLanguage: (show: string) => void;
};
export const Settings = ({
  openAiKey,
  chatLog,
  systemPrompt,
  koeiroParam,
  koeiromapKey,
  googleTtsType,
  onClickClose,
  onChangeSystemPrompt,
  onChangeAiKey,
  onChangeChatLog,
  onChangeCodeLog,
  onChangeKoeiroParam,
  onClickOpenVrmFile,
  onClickResetChatLog,
  onClickResetCodeLog,
  onClickResetSystemPrompt,
  onChangeKoeiromapKey,
  onChangeGoogleTtsType,
  webSocketMode,
  changeWebSocketMode,
  selectVoice,
  setSelectVoice,
  selectLanguage,
  setSelectLanguage,
}: Props) => {
  const { t } = useTranslation();

  return (
    <div className="absolute z-40 w-full h-full bg-white/80 backdrop-blur ">
      <div className="absolute m-24">
        <IconButton
          iconName="24/Close"
          isProcessing={false}
          onClick={onClickClose}
        ></IconButton>
      </div>
      <div className="max-h-full overflow-auto">
        <div className="text-text1 max-w-3xl mx-auto px-24 py-64 ">
          <div className="my-24 typography-32 font-bold">{t('Settings')}</div>
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">
              言語設定 - Language
            </div>
            <div className="my-8">
              {(() => {
                if (selectLanguage === "Japanese") {
                  return (
                    <TextButton onClick={() => { 
                        setSelectLanguage("English")
                        setSelectVoice("google")
                        i18n.changeLanguage('en');
                    }}>
                      日本語 - Japanese
                    </TextButton>
                  );
                } else {
                  return (
                    <TextButton onClick={() => { 
                        setSelectLanguage("Japanese")
                        i18n.changeLanguage('ja');
                    }}>
                      英語 - English
                    </TextButton>
                  );
                }
              })()}
            </div>
          </div>
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">
              {t('ExternalConnectionMode')}
            </div>
            <div className="my-8">
              {webSocketMode ? (
                <TextButton onClick={() => changeWebSocketMode(false)}>
                  {t('StatusOn')}
                </TextButton>
              ) : (
                <TextButton onClick={() => changeWebSocketMode(true)}>
                  {t('StatusOff')}
                </TextButton>
              )}
            </div>
          </div>
          <div className="my-24">
            <div className="my-16 typography-20 font-bold">{t('OpenAI_API_Key_Label')}</div>
            <input
              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
              type="text"
              placeholder="sk-..."
              value={openAiKey}
              onChange={onChangeAiKey}
            />
            <div>
              {t('APIKeyInstruction')}<br />
              <Link url="https://platform.openai.com/account/api-keys" label="OpenAI's Site" />
            </div>
            <div className="my-16">
              {t('ChatGPTInfo')}
            </div>
          </div>
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">
              {t('CharacterModelLabel')}
            </div>
            <div className="my-8">
              <TextButton onClick={onClickOpenVrmFile}>{t('OpenVRM')}</TextButton>
            </div>
          </div>
          <div className="my-40">
            <div className="my-8">
              <div className="my-16 typography-20 font-bold">
                {t('CharacterSettingsPrompt')}
              </div>
              <TextButton onClick={onClickResetSystemPrompt}>
                {t('CharacterSettingsReset')}
              </TextButton>
            </div>
            <textarea
              value={systemPrompt}
              onChange={onChangeSystemPrompt}
              className="px-16 py-8 bg-surface1 hover:bg-surface1-hover h-168 rounded-8 w-full"
            ></textarea>
          </div>
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">{t('SyntheticVoiceEngineChoice')}</div>
            <div>{t('VoiceEngineInstruction')}</div>
            <div className="my-8">
              {(() => {
                if (selectVoice === "koeiromap") {
                  return (
                    <TextButton onClick={() => setSelectVoice("google")}>
                      {t('UsingKoeiromap')}
                    </TextButton>
                  );
                } else {
                  return (
                    <TextButton onClick={() => setSelectVoice("koeiromap")}>
                      {t('UsingGoogleTTS')}
                    </TextButton>
                  );
                }
              })()}
            </div>
            <div>&nbsp;</div>
            <div className="my-16 typography-20 font-bold">{t('VoiceAdjustment')}</div>
            {(() => {
                if (selectVoice === "koeiromap") {
                  return (
                    <>
                      <div>
                        KoemotionのKoeiromap APIを使用しています。詳しくは下記をご覧ください。<br />
                        <Link
                          url="https://koemotion.rinna.co.jp"
                          label="https://koemotion.rinna.co.jp" />
                        
                      </div>
                      <div className="mt-16 font-bold">API キー</div><div className="mt-8">
                        <input
                          className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                          type="text"
                          placeholder="..."
                          value={koeiromapKey}
                          onChange={onChangeKoeiromapKey} />
                      </div>
                      <div className="mt-16 font-bold">プリセット</div><div className="my-8 grid grid-cols-2 gap-[8px]">
                        <TextButton
                          onClick={() => onChangeKoeiroParam(PRESET_A.speakerX, PRESET_A.speakerY)}
                        >
                          かわいい
                        </TextButton>
                        <TextButton
                          onClick={() => onChangeKoeiroParam(PRESET_B.speakerX, PRESET_B.speakerY)}
                        >
                          元気
                        </TextButton>
                        <TextButton
                          onClick={() => onChangeKoeiroParam(PRESET_C.speakerX, PRESET_C.speakerY)}
                        >
                          かっこいい
                        </TextButton>
                        <TextButton
                          onClick={() => onChangeKoeiroParam(PRESET_D.speakerX, PRESET_D.speakerY)}
                        >
                          渋い
                        </TextButton>
                      </div><div className="my-24">
                        <div className="select-none">x : {koeiroParam.speakerX}</div>
                        <input
                          type="range"
                          min={-10}
                          max={10}
                          step={0.001}
                          value={koeiroParam.speakerX}
                          className="mt-8 mb-16 input-range"
                          onChange={(e) => {
                            onChangeKoeiroParam(
                              Number(e.target.value),
                              koeiroParam.speakerY
                            );
                          } }
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
                            onChangeKoeiroParam(
                              koeiroParam.speakerX,
                              Number(e.target.value)
                            );
                          } }
                        ></input>
                      </div>
                    </>
                  );
                } else {
                  return (
                    <>
                      <div>
                        {t('UsingGoogleTTSInfo')}
                        {t('AuthFileInstruction')}<br />
                        <Link
                          url="https://developers.google.com/workspace/guides/create-credentials?#create_credentials_for_a_service_account"
                          label="https://developers.google.com/workspace/guides/create-credentials?#create_credentials_for_a_service_account" />
                        <br /><br />
                        {t('LanguageModelInstruction')}<br />
                        <Link
                          url="https://cloud.google.com/text-to-speech/docs/voices"
                          label="https://cloud.google.com/text-to-speech/docs/voices" />
                      </div>
                      <div className="mt-16 font-bold">{t('LanguageSelectLabel')}</div>
                      <div className="mt-8">
                        <input
                          className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
                          type="text"
                          placeholder="..."
                          value={googleTtsType}
                          onChange={onChangeGoogleTtsType} />
                      </div>
                    </>
                  );
                }
            })()}

          </div>
          {chatLog.length > 0 && (
            <div className="my-40">
              <div className="my-8 grid-cols-2">
                <div className="my-16 typography-20 font-bold">{t('ConversationHistory')}</div>
                <TextButton onClick={() => { 
                  onClickResetChatLog();
                  onClickResetCodeLog(); 
                }}>
                  {t('ConversationHistoryReset')}
                </TextButton>
              </div>
              <div className="my-8">
                {chatLog.map((value, index) => {
                  return (
                    <div
                      key={index}
                      className="my-8 grid grid-flow-col  grid-cols-[min-content_1fr] gap-x-fixed"
                    >
                      <div className="w-[64px] py-8">
                        {value.role === "assistant" ? "Character" : "You"}
                      </div>
                      <input
                        key={index}
                        className="bg-surface1 hover:bg-surface1-hover rounded-8 w-full px-16 py-8"
                        type="text"
                        value={value.content}
                        onChange={(event) => {
                          onChangeChatLog(index, event.target.value);
                          onChangeCodeLog(index, event.target.value);
                        }}
                      ></input>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
