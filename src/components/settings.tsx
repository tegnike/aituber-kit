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
  setselectVoice: (show: string) => void;
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
  setselectVoice,
}: Props) => {
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
          <div className="my-24 typography-32 font-bold">設定</div>
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">
              外部連携モード（WebSocket）
            </div>
            <div className="my-8">
              {webSocketMode ? (
                <TextButton
                  onClick={() => changeWebSocketMode(false)}>
                  状態：ON
                </TextButton>
              ) : (
                <TextButton
                  onClick={() => changeWebSocketMode(true)}>
                  状態：OFF
                </TextButton>
              )}
            </div>
          </div>
          <div className="my-24">
            <div className="my-16 typography-20 font-bold">OpenAI API キー</div>
            <input
              className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
              type="text"
              placeholder="sk-..."
              value={openAiKey}
              onChange={onChangeAiKey}
            />
            <div>
              APIキーは
              <Link
                url="https://platform.openai.com/account/api-keys"
                label="OpenAIのサイト"
              />
              で取得できます。取得したAPIキーをフォームに入力してください。
            </div>
            <div className="my-16">
              ChatGPT
              APIはブラウザから直接アクセスしています。また、APIキーや会話内容はピクシブのサーバには保存されません。
              <br />
              ※利用しているモデルはChatGPT API (GPT-3.5)です。
            </div>
          </div>
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">
              キャラクターモデル
            </div>
            <div className="my-8">
              <TextButton onClick={onClickOpenVrmFile}>VRMを開く</TextButton>
            </div>
          </div>
          <div className="my-40">
            <div className="my-8">
              <div className="my-16 typography-20 font-bold">
                キャラクター設定（システムプロンプト）
              </div>
              <TextButton onClick={onClickResetSystemPrompt}>
                キャラクター設定リセット
              </TextButton>
            </div>

            <textarea
              value={systemPrompt}
              onChange={onChangeSystemPrompt}
              className="px-16 py-8  bg-surface1 hover:bg-surface1-hover h-168 rounded-8 w-full"
            ></textarea>
          </div>
          <div className="my-40">
          <div className="my-16 typography-20 font-bold">合成音声エンジンの選択</div>
            <div>使用する合成音声エンジンをKoeiromapとGoogle Cloud Text-to-Speechから選択してください。</div>
            <div className="my-8">
              {(() => {
                if (selectVoice === "koeiromap") {
                  return (
                    <TextButton onClick={() => setselectVoice("google")}>
                      現在：koeiro APIを使用する
                    </TextButton>
                  );
                } else {
                  return (
                    <TextButton onClick={() => setselectVoice("koeiromap")}>
                      現在：Google TTSを使用する（English）
                    </TextButton>
                  );
                }
            })()}
            </div>
            <div>&nbsp;</div>
            <div className="my-16 typography-20 font-bold">声の調整</div>
            {(() => {
                if (selectVoice === "koeiromap") {
                  return (
                    <>
                      <div>
                        KoemotionのKoeiromap APIを使用しています。詳しくは
                        <Link
                          url="https://koemotion.rinna.co.jp"
                          label="https://koemotion.rinna.co.jp" />
                        をご覧ください。
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
                        Google Cloud Text-to-Speechを使用しています。多言語に対応可能です。
                        認証用のJSONファイルを下記から取得し、リポジトリのルートフォルダに credentials.json という名称で配置してください。<br />
                        <Link
                          url="https://developers.google.com/workspace/guides/create-credentials?#create_credentials_for_a_service_account"
                          label="https://developers.google.com/workspace/guides/create-credentials?#create_credentials_for_a_service_account" />
                        <br /><br />
                        言語モデルは下記のURLから選択してください。<br />
                        <Link
                          url="https://cloud.google.com/text-to-speech/docs/voices"
                          label="https://cloud.google.com/text-to-speech/docs/voices" />
                      </div>
                      <div className="mt-16 font-bold">Language Select</div><div className="mt-8">
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
                <div className="my-16 typography-20 font-bold">会話履歴</div>
                <TextButton onClick={() => { 
                  onClickResetChatLog();
                  onClickResetCodeLog(); 
                }}>
                  会話履歴リセット
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
