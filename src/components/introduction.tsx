import { useState, useCallback } from "react";
import { Link } from "./link";
import { IconButton } from "./iconButton";

type Props = {
  dontShowIntroduction: boolean;
  onChangeDontShowIntroduction: (dontShowIntroduction: boolean) => void;
};
export const Introduction = ({
  dontShowIntroduction,
  onChangeDontShowIntroduction
}: Props) => {
  const [opened, setOpened] = useState(true);

  const handleDontShowIntroductionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeDontShowIntroduction(event.target.checked);
    },
    [onChangeDontShowIntroduction]
  );

  return opened ? (
    <div className="absolute z-40 w-full h-full px-24 py-40 bg-black/30 font-M_PLUS_2">
      <div className="relative mx-auto my-auto max-w-3xl max-h-full p-24 overflow-auto bg-white rounded-16">
      <IconButton
          iconName="24/Close"
          isProcessing={false}
          onClick={() => setOpened(false)}
          className="absolute top-8 right-8 bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled text-white"
        ></IconButton>
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary ">
            このアプリケーションについて
          </div>
          <div>
            Webブラウザだけで3Dキャラクターとの会話を、マイクやテキスト入力、音声合成を用いて楽しめます。キャラクター（VRM）の変更や性格設定、音声調整もできます。<br />
            設定は左上のメニューボタンから変更できます。
          </div>
        </div>
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary ">
            About This Application
          </div>
          <div>
            Enjoy conversations with a 3D character right in your web browser, using microphone or text input and voice synthesis. You can also change the character (VRM), adjust its personality, and modify its voice.<br />
            Settings can be changed from the menu button in the top left.
          </div>
        </div>
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            技術紹介
          </div>
          <div>
            このアプリはpixiv社の<b>ChatVRM</b>を改造して作成されています。元のソースコードは
            <Link
              url={
                "https://github.com/pixiv/ChatVRM"
              }
              label={"こちら"}
            />
            をご覧ください。
          </div>
          <div className="my-16">
            3Dモデルの表示や操作には
            <Link
              url={"https://github.com/pixiv/three-vrm"}
              label={"@pixiv/three-vrm"}
            />
            、 会話文生成には
            <Link
              url={
                "https://openai.com/blog/introducing-chatgpt-and-whisper-apis"
              }
              label={"OpenAI API"}
            />
            などの各種LLM、 音声合成には
            <Link url={"https://developers.rinna.co.jp/product/#product=koeiromap-free"} label={"Koemotion"} />
            などの各種TTSを使用しています。 詳細はこちらの
            <Link
              url={"https://note.com/nike_cha_n/n/ne98acb25e00f"}
              label={"解説記事"}
            />
            をご覧ください。
          </div>
          <div className="my-16">
            このアプリのソースコードはGitHubで公開しています。自由に変更や改変可能です。
            <br />
            リポジトリURL:<span> </span>
            <Link
              url={"https://github.com/tegnike/nike-ChatVRM"}
              label={"https://github.com/tegnike/nike-ChatVRM"}
            />
          </div>
        </div>

        {/* dontShowIntroductionのチェックボックスを表示 */}
        <div className="my-24">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={dontShowIntroduction}
              onChange={handleDontShowIntroductionChange}
              className="mr-8"
            />
            <span>次回からこのダイアログを表示しない（Do not show this dialog next time）</span>
          </label>
        </div>

        <div className="my-24">
          <button
            onClick={() => {
              setOpened(false);
            }}
            className="font-bold bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled text-white px-24 py-8 rounded-oval"
          >
           閉じる（CLOSE）
          </button>
        </div>
      </div>
    </div>
  ) : null;
};
