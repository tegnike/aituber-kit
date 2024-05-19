import { useCallback, useContext, useEffect, useState, useRef } from "react";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import {
  Message,
  textsToScreenplay,
  Screenplay,
} from "@/features/messages/messages";
import { speakCharacter } from "@/features/messages/speakCharacter";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { SYSTEM_PROMPT } from "@/features/constants/systemPromptConstants";
import { KoeiroParam, DEFAULT_PARAM } from "@/features/constants/koeiroParam";
import { getOpenAIChatResponseStream } from "@/features/chat/openAiChat";
import { getAnthropicChatResponseStream } from "@/features/chat/anthropicChat";
import { getOllamaChatResponseStream } from "@/features/chat/ollamaChat";
import { getGroqChatResponseStream } from "@/features/chat/groqChat";
import { getDifyChatResponseStream } from "@/features/chat/difyChat";
import { Introduction } from "@/components/introduction";
import { Menu } from "@/components/menu";
import { GitHubLink } from "@/components/githubLink";
import { Meta } from "@/components/meta";
import "@/lib/i18n";
import { useTranslation } from 'react-i18next';
import { fetchAndProcessComments } from "@/features/youtube/youtubeComments";
import { buildUrl } from "@/utils/buildUrl";

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [selectAIService, setSelectAIService] = useState("openai");
  const [selectAIModel, setSelectAIModel] = useState("gpt-3.5-turbo");
  const [openAiKey, setOpenAiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [difyKey, setDifyKey] = useState("");
  const [difyUrl, setDifyUrl] = useState("");
  const [selectVoice, setSelectVoice] = useState("voicevox");
  const [selectLanguage, setSelectLanguage] = useState("JP");
  const [selectVoiceLanguage, setSelectVoiceLanguage] = useState("ja-JP");
  const [koeiromapKey, setKoeiromapKey] = useState("");
  const [voicevoxSpeaker, setVoicevoxSpeaker] = useState("2");
  const [googleTtsType, setGoogleTtsType] = useState("en-US-Neural2-F");
  const [stylebertvits2ServerUrl, setStylebertvits2ServerURL] = useState("http://127.0.0.1:5000");
  const [stylebertvits2ModelId, setStylebertvits2ModelId] = useState("0");
  const [stylebertvits2Style, setStylebertvits2Style] = useState("Neutral");
  const [youtubeMode, setYoutubeMode] = useState(false);
  const [youtubeApiKey, setYoutubeApiKey] = useState("");
  const [youtubeLiveId, setYoutubeLiveId] = useState("");
  const [koeiroParam, setKoeiroParam] = useState<KoeiroParam>(DEFAULT_PARAM);
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [codeLog, setCodeLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [webSocketMode, changeWebSocketMode] = useState(false);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const { t } = useTranslation();
  const INTERVAL_MILL_SECONDS_RETRIEVING_COMMENTS = 20000; // 20秒
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("/bg-c.png");

  useEffect(() => {
    const storedData = window.localStorage.getItem("chatVRMParams");
    if (storedData) {
      const params = JSON.parse(storedData);
      setSystemPrompt(params.systemPrompt || SYSTEM_PROMPT);
      setKoeiroParam(params.koeiroParam || DEFAULT_PARAM);
      setChatLog(Array.isArray(params.chatLog) ? params.chatLog : []);
      setCodeLog(Array.isArray(params.codeLog) ? params.codeLog : []);
      setSelectAIService(params.selectAIService || "openai");
      setSelectAIModel(params.selectAIModel || "gpt-3.5-turbo");
      setOpenAiKey(params.openAiKey || "");
      setAnthropicKey(params.anthropicKey || "");
      setGroqKey(params.groqKey || "");
      setDifyKey(params.difyKey || "");
      setDifyUrl(params.difyUrl || "");
      setSelectVoice(params.selectVoice || "voicevox");
      setSelectLanguage(params.selectLanguage || "JP");
      setSelectVoiceLanguage(params.selectVoiceLanguage || "ja-JP");
      setKoeiromapKey(params.koeiromapKey || "");
      setVoicevoxSpeaker(params.voicevoxSpeaker || "2");
      setGoogleTtsType(params.googleTtsType || "en-US-Neural2-F");
      setYoutubeMode(params.youtubeMode || false);
      setYoutubeApiKey(params.youtubeApiKey || "");
      setYoutubeLiveId(params.youtubeLiveId || "");
      changeWebSocketMode(params.webSocketMode || false);
      setStylebertvits2ServerURL(params.stylebertvits2ServerUrl || "http://127.0.0.1:5000");
      setStylebertvits2ModelId(params.stylebertvits2ModelId || "0");
      setStylebertvits2Style(params.stylebertvits2Style || "Neutral");
    }
  }, []);

  useEffect(() => {
    const params = {
      systemPrompt,
      koeiroParam,
      chatLog,
      codeLog,
      selectAIService,
      selectAIModel,
      openAiKey,
      anthropicKey,
      groqKey,
      difyKey,
      difyUrl,
      selectVoice,
      selectLanguage,
      selectVoiceLanguage,
      koeiromapKey,
      voicevoxSpeaker,
      googleTtsType,
      youtubeMode,
      youtubeApiKey,
      youtubeLiveId,
      webSocketMode,
      stylebertvits2ServerUrl,
      stylebertvits2ModelId,
      stylebertvits2Style
    };
    process.nextTick(() =>
      window.localStorage.setItem(
        "chatVRMParams", JSON.stringify(params)
      )
    );
  }, [
    systemPrompt,
    koeiroParam,
    chatLog,
    codeLog,
    selectAIService,
    selectAIModel,
    openAiKey,
    anthropicKey,
    groqKey,
    difyKey,
    difyUrl,
    selectVoice,
    selectLanguage,
    selectVoiceLanguage,
    koeiromapKey,
    voicevoxSpeaker,
    googleTtsType,
    youtubeMode,
    youtubeApiKey,
    youtubeLiveId,
    webSocketMode,
    stylebertvits2ServerUrl,
    stylebertvits2ModelId,
    stylebertvits2Style
  ]);

  const handleChangeChatLog = useCallback(
    (targetIndex: number, text: string) => {
      const newChatLog = chatLog.map((v: Message, i) => {
        return i === targetIndex ? { role: v.role, content: text } : v;
      });

      setChatLog(newChatLog);
    },
    [chatLog]
  );

  const handleChangeCodeLog = useCallback(
    async (targetIndex: number, text: string) => {
      const newCodeLog = codeLog.map((v: Message, i) => {
        return i === targetIndex ? { role: v.role, content: text} : v;
      });

      setCodeLog(newCodeLog);
    },
    [codeLog]
  );

  /**
   * 文ごとに音声を直列でリクエストしながら再生する
   */
  const handleSpeakAi = useCallback(
    async (
      screenplay: Screenplay,
      onStart?: () => void,
      onEnd?: () => void
    ) => {
      speakCharacter(
        screenplay,
        viewer,
        selectVoice,
        selectLanguage,
        koeiromapKey,
        voicevoxSpeaker,
        googleTtsType,
        stylebertvits2ServerUrl,
        stylebertvits2ModelId,
        stylebertvits2Style,
        onStart,
        onEnd
      );
    },
    [
      viewer,
      selectVoice,
      selectLanguage,
      koeiromapKey,
      voicevoxSpeaker,
      googleTtsType,
      stylebertvits2ServerUrl,
      stylebertvits2ModelId,
      stylebertvits2Style
    ]
  );

  const wsRef = useRef<WebSocket | null>(null);

  /**
   * アシスタントとの会話を行う
   */
  const handleSendChat = useCallback(
    async (text: string, role?: string) => {
      const newMessage = text;

      if (newMessage == null) {
        return;
      }

      if (webSocketMode) {
        console.log("websocket mode: true")
        setChatProcessing(true);

        if (role !== undefined && role !== "user") {
          // WebSocketからの返答を処理

          if (role == "assistant") {
            let aiText = `${"[neutral]"} ${newMessage}`;
            try {
              const aiTalks = textsToScreenplay([aiText], koeiroParam);

              // 文ごとに音声を生成 & 再生、返答を表示
              handleSpeakAi(aiTalks[0], async () => {
                // アシスタントの返答をログに追加
                const updateLog: Message[] = [
                  ...codeLog,
                  { role: "assistant", content: newMessage },
                ];
                setChatLog(updateLog);
                setCodeLog(updateLog);

                setAssistantMessage(newMessage);
                setIsVoicePlaying(false);
                setChatProcessing(false);
              });
            } catch (e) {
              setIsVoicePlaying(false);
              setChatProcessing(false);
            }
          } else if (role == "code" || role == "output" || role == "executing"){ // コードコメントの処理
            // ループ完了後にAI応答をコードログに追加
            const updateLog: Message[] = [
              ...codeLog,
              { role: role, content: newMessage },
            ];
            setCodeLog(updateLog);
            setChatProcessing(false);
          } else { // その他のコメントの処理（現想定では使用されないはず）
            console.log("error role:", role)
          }
        } else {
          // WebSocketで送信する処理

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // ユーザーの発言を追加して表示
            const updateLog: Message[] = [
              ...codeLog,
              { role: "user", content: newMessage },
            ];
            setChatLog(updateLog);
            setCodeLog(updateLog);

            // WebSocket送信
            wsRef.current.send(JSON.stringify({content: newMessage, type: "chat"}));
          } else {
            setAssistantMessage(t('NotConnectedToExternalAssistant'));
            setChatProcessing(false);
          }
        }
      } else {
        // ChatVERM original mode
        if (selectAIService === "openai" && !openAiKey) {
          setAssistantMessage(t('APIKeyNotEntered'));
          return;
        } else if (selectAIService === "anthropic" && !anthropicKey) {
          setAssistantMessage(t('APIKeyNotEntered'));
          return;
        } else if (selectAIService === "groq" && !groqKey) {
          setAssistantMessage(t('APIKeyNotEntered'));
          return;
        } else if (selectAIService === "dify" && !difyKey) {
          setAssistantMessage(t('APIKeyNotEntered'));
          return;
        }

        setChatProcessing(true);
        // ユーザーの発言を追加して表示
        const messageLog: Message[] = [
          ...chatLog,
          { role: "user", content: newMessage },
        ];
        setChatLog(messageLog);

        const messages: Message[] = [
          {
            role: "system",
            content: systemPrompt,
          },
          ...messageLog.slice(-10),
        ];

        let stream;
        try {
          if (selectAIService === "openai") {
            stream = await getOpenAIChatResponseStream(messages, openAiKey, selectAIModel);
          } else if (selectAIService === "anthropic") {
            stream = await getAnthropicChatResponseStream(messages, anthropicKey, selectAIModel);
          } else if (selectAIService === "ollama") {
            stream = await getOllamaChatResponseStream(messages, selectAIModel);
          } else if (selectAIService === "groq") {
            stream = await getGroqChatResponseStream(messages, groqKey, selectAIModel);
          } else if (selectAIService === "dify") {
            stream = await getDifyChatResponseStream(messages, difyKey, difyUrl);
          }
        } catch (e) {
          console.error(e);
          stream = null;
        }
        if (stream == null) {
          setChatProcessing(false);
          return;
        }

        const reader = stream.getReader();
        let receivedMessage = "";
        let aiTextLog = "";
        let tag = "";
        const sentences = new Array<string>();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            receivedMessage += value;

            // 返答内容のタグ部分の検出
            const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
            if (tagMatch && tagMatch[0]) {
              tag = tagMatch[0];
              receivedMessage = receivedMessage.slice(tag.length);
            }

            // 返答を一文単位で切り出して処理する
            const sentenceMatch = receivedMessage.match(
              /^(.+[。．！？\n]|.{10,}[、,])/
            );
            if (sentenceMatch && sentenceMatch[0]) {
              const sentence = sentenceMatch[0];
              sentences.push(sentence);
              receivedMessage = receivedMessage
                .slice(sentence.length)
                .trimStart();

              // 発話不要/不可能な文字列だった場合はスキップ
              if (
                !sentence.replace(
                  /^[\s\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]]+$/g,
                  ""
                )
              ) {
                continue;
              }

              const aiText = `${tag} ${sentence}`;
              const aiTalks = textsToScreenplay([aiText], koeiroParam);
              aiTextLog += aiText;

              // 文ごとに音声を生成 & 再生、返答を表示
              const currentAssistantMessage = sentences.join(" ");
              handleSpeakAi(aiTalks[0], () => {
                setAssistantMessage(currentAssistantMessage);
              });
            }
          }
        } catch (e) {
          setChatProcessing(false);
          console.error(e);
        } finally {
          reader.releaseLock();
        }

        // アシスタントの返答をログに追加
        const messageLogAssistant: Message[] = [
          ...messageLog,
          { role: "assistant", content: aiTextLog },
        ];

        setChatLog(messageLogAssistant);
        setChatProcessing(false);
      }
    },
    [webSocketMode, koeiroParam, handleSpeakAi, codeLog, t, selectAIService, openAiKey, anthropicKey, chatLog, systemPrompt, selectAIModel, groqKey, difyKey, difyUrl]
  );

  ///取得したコメントをストックするリストの作成（tmpMessages）
  interface tmpMessage {
    text: string;
    role: string;
    emotion: string;
  }
  const [tmpMessages, setTmpMessages] = useState<tmpMessage[]>([]);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      console.log("WebSocket connection opened:", event);
    };
    const handleMessage = (event: MessageEvent) => {
      console.log("Received message:", event.data);
      const jsonData = JSON.parse(event.data);
      setTmpMessages((prevMessages) => [...prevMessages, jsonData]);
    };
    const handleError = (event: Event) => {
      console.error("WebSocket error:", event);
    };
    const handleClose = (event: Event) => {
      console.log("WebSocket connection closed:", event);
    };

    function setupWebsocket() {
      const ws = new WebSocket("ws://localhost:8000/ws");
      ws.addEventListener("open", handleOpen);
      ws.addEventListener("message", handleMessage);
      ws.addEventListener("error", handleError);
      ws.addEventListener("close", handleClose);
      return ws;
    }
    let ws = setupWebsocket();
    wsRef.current = ws;

    const reconnectInterval = setInterval(() => {
      if (webSocketMode && ws.readyState !== WebSocket.OPEN && ws.readyState !== WebSocket.CONNECTING) {
        setChatProcessing(false);
        console.log("try reconnecting...");
        ws.close();
        ws = setupWebsocket();
        wsRef.current = ws;
      }
    }, 1000);

    return () => {
      clearInterval(reconnectInterval);
      ws.close();
    };
  }, [webSocketMode]);

  useEffect(() => {
    if (tmpMessages.length > 0 && !isVoicePlaying) {
      const message = tmpMessages[0];
      if (message.role == "assistant") { setIsVoicePlaying(true) };
      setTmpMessages((tmpMessages) => tmpMessages.slice(1));
      handleSendChat(message.text, message.role);
    }
  }, [tmpMessages, isVoicePlaying, handleSendChat]);

  // YouTubeコメントを取得する処理
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchAndProcessComments(youtubeLiveId, youtubeApiKey, handleSendChat);
    }, INTERVAL_MILL_SECONDS_RETRIEVING_COMMENTS);
  
    // クリーンアップ関数
    return () => clearInterval(intervalId);
  }, [youtubeLiveId, youtubeApiKey, handleSendChat]);

  return (
    <>
      <div className={"font-M_PLUS_2"} style={{ backgroundImage: `url(${buildUrl(backgroundImageUrl)})`, backgroundSize: 'cover', minHeight: '100vh' }}>
        <Meta />
        <Introduction
          openAiKey={openAiKey}
          koeiroMapKey={koeiromapKey}
          onChangeAiKey={setOpenAiKey}
          onChangeKoeiromapKey={setKoeiromapKey}
        />
        <VrmViewer />
        <MessageInputContainer
          isChatProcessing={chatProcessing}
          onChatProcessStart={handleSendChat}
          selectVoiceLanguage={selectVoiceLanguage}
        />
        <Menu
          selectAIService={selectAIService}
          setSelectAIService={setSelectAIService}
          selectAIModel={selectAIModel}
          setSelectAIModel={setSelectAIModel}
          openAiKey={openAiKey}
          onChangeOpenAiKey={setOpenAiKey}
          anthropicKey={anthropicKey}
          onChangeAnthropicKey={setAnthropicKey}
          groqKey={groqKey}
          onChangeGroqKey={setGroqKey}
          difyKey={difyKey}
          onChangeDifyKey={setDifyKey}
          difyUrl={difyUrl}
          onChangeDifyUrl={setDifyUrl}
          systemPrompt={systemPrompt}
          chatLog={chatLog}
          codeLog={codeLog}
          koeiroParam={koeiroParam}
          assistantMessage={assistantMessage}
          koeiromapKey={koeiromapKey}
          voicevoxSpeaker={voicevoxSpeaker}
          googleTtsType={googleTtsType}
          stylebertvits2ServerUrl={stylebertvits2ServerUrl}
          stylebertvits2ModelId={stylebertvits2ModelId}
          stylebertvits2Style={stylebertvits2Style}
          youtubeMode={youtubeMode}
          youtubeApiKey={youtubeApiKey}
          youtubeLiveId={youtubeLiveId}
          onChangeSystemPrompt={setSystemPrompt}
          onChangeChatLog={handleChangeChatLog}
          onChangeCodeLog={handleChangeCodeLog}
          onChangeKoeiromapParam={setKoeiroParam}
          onChangeYoutubeMode={setYoutubeMode}
          onChangeYoutubeApiKey={setYoutubeApiKey}
          onChangeYoutubeLiveId={setYoutubeLiveId}
          handleClickResetChatLog={() => setChatLog([])}
          handleClickResetCodeLog={() => setCodeLog([])}
          handleClickResetSystemPrompt={() => setSystemPrompt(SYSTEM_PROMPT)}
          onChangeKoeiromapKey={setKoeiromapKey}
          onChangeVoicevoxSpeaker={setVoicevoxSpeaker}
          onChangeGoogleTtsType={setGoogleTtsType}
          onChangeStyleBertVits2ServerUrl={setStylebertvits2ServerURL}
          onChangeStyleBertVits2ModelId={setStylebertvits2ModelId}
          onChangeStyleBertVits2Style={setStylebertvits2Style}
          webSocketMode={webSocketMode}
          changeWebSocketMode={changeWebSocketMode}
          selectVoice={selectVoice}
          setSelectVoice={setSelectVoice}
          selectLanguage={selectLanguage}
          setSelectLanguage={setSelectLanguage}
          setSelectVoiceLanguage={setSelectVoiceLanguage}
          setBackgroundImageUrl={setBackgroundImageUrl}
        />
        <GitHubLink />
      </div>
    </>
  );
}
