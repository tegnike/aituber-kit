import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Introduction } from '@/components/introduction';
import { Menu } from '@/components/menu';
import { MessageInputContainer } from '@/components/messageInputContainer';
import { Meta } from '@/components/meta';
import useWebSocket from '@/components/home/useWebSocket';
import useYoutube from '@/components/home/useYoutube';
import ModalImage from '@/components/modal-image';
import VrmViewer from '@/components/vrmViewer';
import {
  getAIChatResponseStream,
  AIService,
  AIServiceConfig,
} from '@/features/chat/aiChatFactory';
import {
  textsToScreenplay,
  Message,
  Screenplay,
} from '@/features/messages/messages';
import { speakCharacter } from '@/features/messages/speakCharacter';
import store from '@/features/stores/app';
import homeStore from '@/features/stores/home';
import '@/lib/i18n';
import { buildUrl } from '@/utils/buildUrl';
import c from '@/styles/home.module.scss';

const Home = () => {
  const dontShowIntroduction = store((s) => s.dontShowIntroduction);
  const backgroundImage = homeStore(
    (s) => `url(${buildUrl(s.backgroundImageUrl)})`,
  );
  const modalImage = homeStore((s) => s.modalImage);
  const webcamStatus = homeStore((s) => s.webcamStatus);

  const [showIntroduction, setShowIntroduction] = useState(false);
  const { t } = useTranslation();
  const [delayedText, setDelayedText] = useState('');

  useEffect(() => {
    // wait for local storage to be fully initialized
    // to prevent a flash of <Introduction />
    setShowIntroduction(!store.getState().dontShowIntroduction);
  }, [dontShowIntroduction]);

  /**
   * 文ごとに音声を直列でリクエストしながら再生する
   */
  const handleSpeakAi = useCallback(
    async (
      screenplay: Screenplay,
      onStart?: () => void,
      onEnd?: () => void,
    ) => {
      speakCharacter(screenplay, onStart, onEnd);
    },
    [],
  );

  /**
   * AIからの応答を処理する関数
   * @param currentChatLog ログに残るメッセージの配列
   * @param messages 解答生成に使用するメッセージの配列
   */
  const processAIResponse = useCallback(
    async (currentChatLog: Message[], messages: Message[]) => {
      homeStore.setState({ chatProcessing: true });
      let stream;

      const s = store.getState();
      const hs = homeStore.getState();

      const aiServiceConfig: AIServiceConfig = {
        openai: {
          key: s.openAiKey || process.env.NEXT_PUBLIC_OPEN_AI_KEY || '',
          model: s.selectAIModel,
        },
        anthropic: {
          key: s.anthropicKey || process.env.NEXT_PUBLIC_ANTHROPIC_KEY || '',
          model: s.selectAIModel,
        },
        google: {
          key: s.googleKey || process.env.NEXT_PUBLIC_GOOGLE_KEY || '',
          model: s.selectAIModel,
        },
        localLlm: {
          url: s.localLlmUrl || process.env.NEXT_PUBLIC_LOCAL_LLM_URL || '',
          model:
            s.selectAIModel || process.env.NEXT_PUBLIC_LOCAL_LLM_MODEL || '',
        },
        groq: {
          key: s.groqKey || process.env.NEXT_PUBLIC_GROQ_KEY || '',
          model: s.selectAIModel,
        },
        dify: {
          key: s.difyKey || process.env.NEXT_PUBLIC_DIFY_KEY || '',
          url: s.difyUrl || process.env.NEXT_PUBLIC_DIFY_URL || '',
          conversationId: s.difyConversationId,
        },
      };

      try {
        stream = await getAIChatResponseStream(
          s.selectAIService as AIService,
          messages,
          aiServiceConfig,
        );
      } catch (e) {
        console.error(e);
        stream = null;
      }

      if (stream == null) {
        homeStore.setState({ chatProcessing: false });
        return;
      }

      const reader = stream.getReader();
      let receivedMessage = '';
      let aiTextLog: Message[] = []; // 会話ログ欄で使用
      let tag = '';
      let isCodeBlock = false;
      let codeBlockText = '';
      const sentences = new Array<string>(); // AssistantMessage欄で使用
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done && receivedMessage.length === 0) break;

          if (value) receivedMessage += value;

          // 返答内容のタグ部分と返答部分を分離
          const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
          if (tagMatch && tagMatch[0]) {
            tag = tagMatch[0];
            receivedMessage = receivedMessage.slice(tag.length);
          }

          // 返答を一文単位で切り出して処理する
          while (receivedMessage.length > 0) {
            const sentenceMatch = receivedMessage.match(
              /^(.+?[。．.!?！？\n]|.{20,}[、,])/,
            );
            if (sentenceMatch?.[0]) {
              let sentence = sentenceMatch[0];
              // 区切った文字をsentencesに追加
              sentences.push(sentence);
              // 区切った文字の残りでreceivedMessageを更新
              receivedMessage = receivedMessage
                .slice(sentence.length)
                .trimStart();

              // 発話不要/不可能な文字列だった場合はスキップ
              if (
                !sentence.includes('```') &&
                !sentence.replace(
                  /^[\s\u3000\t\n\r\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]'"''""・、。,.!?！？:：;；\-_=+~～*＊@＠#＃$＄%％^＾&＆|｜\\＼/／`｀]+$/gu,
                  '',
                )
              ) {
                continue;
              }

              // タグと返答を結合（音声再生で使用される）
              let aiText = `${tag} ${sentence}`;
              console.log('aiText', aiText);

              if (isCodeBlock && !sentence.includes('```')) {
                codeBlockText += sentence;
                continue;
              }

              if (sentence.includes('```')) {
                if (isCodeBlock) {
                  // コードブロックの終了処理
                  const [codeEnd, ...restOfSentence] = sentence.split('```');
                  aiTextLog.push({
                    role: 'code',
                    content: codeBlockText + codeEnd,
                  });
                  aiText += `${tag} ${restOfSentence.join('```') || ''}`;

                  // AssistantMessage欄の更新
                  homeStore.setState({ assistantMessage: sentences.join(' ') });

                  codeBlockText = '';
                  isCodeBlock = false;
                } else {
                  // コードブロックの開始処理
                  isCodeBlock = true;
                  [aiText, codeBlockText] = aiText.split('```');
                }

                sentence = sentence.replace(/```/g, '');
              }

              const aiTalks = textsToScreenplay([aiText], s.koeiroParam);
              aiTextLog.push({ role: 'assistant', content: sentence });

              // 文ごとに音声を生成 & 再生、返答を表示
              const currentAssistantMessage = sentences.join(' ');

              handleSpeakAi(
                aiTalks[0],
                () => {
                  homeStore.setState({
                    assistantMessage: currentAssistantMessage,
                  });
                  hs.incrementChatProcessingCount();
                },
                () => {
                  hs.decrementChatProcessingCount();
                },
              );
            } else {
              // マッチする文がない場合、ループを抜ける
              break;
            }
          }

          // ストリームが終了し、receivedMessageが空でない場合の処理
          if (done && receivedMessage.length > 0) {
            // 残りのメッセージを処理
            let aiText = `${tag} ${receivedMessage}`;
            const aiTalks = textsToScreenplay([aiText], s.koeiroParam);
            aiTextLog.push({ role: 'assistant', content: receivedMessage });
            sentences.push(receivedMessage);

            const currentAssistantMessage = sentences.join(' ');

            handleSpeakAi(
              aiTalks[0],
              () => {
                homeStore.setState({
                  assistantMessage: currentAssistantMessage,
                });
                hs.incrementChatProcessingCount();
              },
              () => {
                hs.decrementChatProcessingCount();
              },
            );

            receivedMessage = '';
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        reader.releaseLock();
      }

      // 直前のroleと同じならば、contentを結合し、空のcontentを除外する
      let lastImageUrl = '';
      aiTextLog = aiTextLog
        .reduce((acc: Message[], item: Message) => {
          if (
            typeof item.content != 'string' &&
            item.content[0] &&
            item.content[1].image_url
          ) {
            lastImageUrl = item.content[1].image_url.url;
          }

          const lastItem = acc[acc.length - 1];
          if (lastItem && lastItem.role === item.role) {
            if (typeof item.content != 'string') {
              lastItem.content += ' ' + item.content[0].text;
            } else {
              lastItem.content += ' ' + item.content;
            }
          } else {
            const text =
              typeof item.content != 'string'
                ? item.content[0].text
                : item.content;
            if (lastImageUrl != '') {
              acc.push({
                ...item,
                content: [
                  { type: 'text', text: text.trim() },
                  { type: 'image_url', image_url: { url: lastImageUrl } },
                ],
              });
              lastImageUrl = '';
            } else {
              acc.push({ ...item, content: text.trim() });
            }
          }
          return acc;
        }, [])
        .filter((item) => item.content !== '');

      store.setState({ chatLog: [...currentChatLog, ...aiTextLog] });
      homeStore.setState({ chatProcessing: false });
    },
    [handleSpeakAi],
  );

  /**
   * アシスタントとの会話を行う
   */
  const handleSendChat = useCallback(
    async (text: string, role?: string) => {
      const newMessage = text;

      if (newMessage === null) return;

      const s = store.getState();
      const hs = homeStore.getState();

      if (s.webSocketMode) {
        // 未メンテなので不具合がある可能性あり
        console.log('websocket mode: true');
        homeStore.setState({ chatProcessing: true });

        if (role !== undefined && role !== 'user') {
          // WebSocketからの返答を処理

          if (role == 'assistant') {
            let aiText = `${'[neutral]'} ${newMessage}`;
            try {
              const aiTalks = textsToScreenplay([aiText], s.koeiroParam);

              // 文ごとに音声を生成 & 再生、返答を表示
              handleSpeakAi(aiTalks[0], async () => {
                // アシスタントの返答をログに追加
                const updateLog: Message[] = [
                  ...s.codeLog,
                  { role: 'assistant', content: newMessage },
                ];
                store.setState({
                  chatLog: updateLog,
                  codeLog: updateLog,
                });

                homeStore.setState({
                  assistantMessage: newMessage,
                  chatProcessing: false,
                  voicePlaying: false,
                });
              });
            } catch (e) {
              homeStore.setState({
                chatProcessing: false,
                voicePlaying: false,
              });
            }
          } else if (
            role == 'code' ||
            role == 'output' ||
            role == 'executing'
          ) {
            // コードコメントの処理
            // ループ完了後にAI応答をコードログに追加
            const updateLog: Message[] = [
              ...s.codeLog,
              { role: role, content: newMessage },
            ];
            store.setState({ codeLog: updateLog });
            homeStore.setState({ chatProcessing: false });
          } else {
            // その他のコメントの処理（現想定では使用されないはず）
            console.log('error role:', role);
          }
        } else {
          // WebSocketで送信する処理

          if (hs.ws?.readyState === WebSocket.OPEN) {
            // ユーザーの発言を追加して表示
            const updateLog: Message[] = [
              ...s.codeLog,
              { role: 'user', content: newMessage },
            ];
            store.setState({
              chatLog: updateLog,
              codeLog: updateLog,
            });

            // WebSocket送信
            hs.ws.send(JSON.stringify({ content: newMessage, type: 'chat' }));
          } else {
            homeStore.setState({
              assistantMessage: t('NotConnectedToExternalAssistant'),
              chatProcessing: false,
            });
          }
        }
      } else {
        // ChatVRM original mode
        const emptyKeys = [
          s.selectAIService === 'openai' &&
            !s.openAiKey &&
            !process.env.NEXT_PUBLIC_OPEN_AI_KEY,

          s.selectAIService === 'anthropic' &&
            !s.anthropicKey &&
            !process.env.NEXT_PUBLIC_ANTHROPIC_KEY,

          s.selectAIService === 'google' &&
            !s.googleKey &&
            !process.env.NEXT_PUBLIC_GOOGLE_KEY,

          s.selectAIService === 'groq' &&
            !s.groqKey &&
            !process.env.NEXT_PUBLIC_GROQ_KEY,

          s.selectAIService === 'dify' &&
            !s.difyKey &&
            !process.env.NEXT_PUBLIC_DIFY_KEY,
        ];
        if (emptyKeys.includes(true)) {
          homeStore.setState({ assistantMessage: t('APIKeyNotEntered') });
          return;
        }

        homeStore.setState({ chatProcessing: true });
        // ユーザーの発言を追加して表示
        const messageLog: Message[] = [
          ...s.chatLog,
          {
            role: 'user',
            content:
              hs.modalImage &&
              s.selectAIService === 'openai' &&
              (s.selectAIModel === 'gpt-4o-mini' ||
                s.selectAIModel === 'gpt-4o' ||
                s.selectAIModel === 'gpt-4-turbo')
                ? [
                    { type: 'text', text: newMessage },
                    { type: 'image_url', image_url: { url: hs.modalImage } },
                  ]
                : newMessage,
          },
        ];
        if (hs.modalImage) {
          homeStore.setState({ modalImage: '' });
        }
        store.setState({ chatLog: messageLog });

        // TODO: AIに送信するメッセージの加工、処理がひどいので要修正
        const processedMessageLog = messageLog.map((message) => ({
          role: ['assistant', 'user', 'system'].includes(message.role)
            ? message.role
            : 'assistant',
          content:
            typeof message.content === 'string' ||
            (s.selectAIService === 'openai' &&
              (s.selectAIModel === 'gpt-4o-mini' ||
                s.selectAIModel === 'gpt-4o' ||
                s.selectAIModel === 'gpt-4-turbo'))
              ? message.content
              : message.content[0].text,
        }));

        const messages: Message[] = [
          {
            role: 'system',
            content: s.systemPrompt,
          },
          ...processedMessageLog.slice(-10),
        ];

        try {
          await processAIResponse(messageLog, messages);
        } catch (e) {
          console.error(e);
        }

        homeStore.setState({ chatProcessing: false });
      }
    },
    [handleSpeakAi, t, processAIResponse, delayedText],
  );

  useYoutube({ processAIResponse, handleSendChat });
  useWebSocket({ handleSendChat });

  useEffect(() => {
    // テキストと画像がそろったら、チャットを送信
    if (delayedText && modalImage) {
      handleSendChat(delayedText);
      setDelayedText('');
    }
  }, [modalImage, delayedText]);

  const hookSendChat = useCallback(
    (text: string) => {
      homeStore.setState({ triggerShutter: true });

      // MENUの中でshowCameraがtrueの場合、画像が取得されるまで待機
      if (webcamStatus) {
        // Webcamが開いている場合
        setDelayedText(text); // 画像が取得されるまで遅延させる
      } else {
        handleSendChat(text);
      }
    },
    [handleSendChat, webcamStatus, delayedText, setDelayedText],
  );

  return (
    <div className={c.home} style={{ backgroundImage }}>
      <Meta />
      {showIntroduction && <Introduction />}
      <VrmViewer />
      <MessageInputContainer onChatProcessStart={hookSendChat} />
      <Menu />
      <ModalImage />
    </div>
  );
};
export default Home;
