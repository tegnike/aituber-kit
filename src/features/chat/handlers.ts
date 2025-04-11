import { getAIChatResponseStream } from '@/features/chat/aiChatFactory'
import { Message, EmotionType } from '@/features/messages/messages'
import { speakCharacter } from '@/features/messages/speakCharacter'
import { judgeSlide } from '@/features/slide/slideAIHelpers'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import slideStore from '@/features/stores/slide'
import { goToSlide } from '@/components/slides'
import { messageSelectors } from '../messages/messageSelectors'
import webSocketStore from '@/features/stores/websocketStore'
import i18next from 'i18next'
import toastStore from '@/features/stores/toast'

// セッションIDを生成する関数
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// --- Refactoring Helpers ---

/**
 * テキストから感情タグ `[...]` を抽出する
 * @param text 入力テキスト
 * @returns 感情タグと残りのテキスト
 */
const extractEmotion = (
  text: string
): { emotionTag: string; remainingText: string } => {
  const emotionMatch = text.match(/^\[(.*?)\]/)
  if (emotionMatch?.[0]) {
    return {
      emotionTag: emotionMatch[0],
      remainingText: text.slice(emotionMatch[0].length),
    }
  }
  return { emotionTag: '', remainingText: text }
}

/**
 * テキストから文法的に区切りの良い文を抽出する
 * @param text 入力テキスト
 * @returns 抽出された文と残りのテキスト
 */
const extractSentence = (
  text: string
): { sentence: string; remainingText: string } => {
  const sentenceMatch = text.match(
    /^(.{1,19}?(?:[。．.!?！？\n]|(?=\[))|.{20,}?(?:[、,。．.!?！？\n]|(?=\[)))/
  )
  if (sentenceMatch?.[0]) {
    return {
      sentence: sentenceMatch[0],
      remainingText: text.slice(sentenceMatch[0].length).trimStart(),
    }
  }
  return { sentence: '', remainingText: text }
}

/**
 * 発話と関連する状態更新を行う
 * @param sessionId セッションID
 * @param sentence 発話する文
 * @param emotionTag 感情タグ (例: "[neutral]")
 * @param currentAssistantMessageListRef アシスタントメッセージリストの参照
 * @param currentSlideMessagesRef スライドメッセージリストの参照
 */
const handleSpeakAndStateUpdate = (
  sessionId: string,
  sentence: string,
  emotionTag: string,
  currentAssistantMessageListRef: { current: string[] },
  currentSlideMessagesRef: { current: string[] }
) => {
  const hs = homeStore.getState()
  const emotion = emotionTag.includes('[')
    ? (emotionTag.slice(1, -1).toLowerCase() as EmotionType)
    : 'neutral'

  // 発話不要/不可能な文字列だった場合はスキップ
  if (
    sentence === '' ||
    sentence.replace(
      /^[\s\u3000\t\n\r\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]'"''""・、。,.!?！？:：;；\-_=+~～*＊@＠#＃$＄%％^＾&＆|｜\\＼/／`｀]+$/gu,
      ''
    ) === ''
  ) {
    return
  }

  speakCharacter(
    sessionId,
    { message: sentence, emotion: emotion },
    () => {
      // onStart callback
      homeStore.setState({
        assistantMessage: currentAssistantMessageListRef.current.join(' '),
      })
      hs.incrementChatProcessingCount()
      currentSlideMessagesRef.current.push(sentence)
      homeStore.setState({
        slideMessages: [...currentSlideMessagesRef.current],
      }) // Ensure array update triggers re-render if needed
    },
    () => {
      // onEnd callback
      hs.decrementChatProcessingCount()
      currentSlideMessagesRef.current.shift()
      homeStore.setState({
        slideMessages: [...currentSlideMessagesRef.current],
      }) // Ensure array update triggers re-render if needed
    }
  )
}

// --- Original Functions (Refactored) ---

/**
 * 受け取ったメッセージを処理し、AIの応答を生成して発話させる (Refactored)
 * @param receivedMessage 処理する文字列
 */
export const speakMessageHandler = async (receivedMessage: string) => {
  const sessionId = generateSessionId()
  const hs = homeStore.getState()
  const currentSlideMessagesRef = { current: [] as string[] } // Use ref object
  const assistantMessageListRef = { current: [] as string[] } // Use ref object

  let isCodeBlock: boolean = false
  let codeBlockContent: string = '' // Renamed for clarity
  let logText: string = ''
  let remainingMessage = receivedMessage
  const addedChatLog: Message[] = []
  const delimiter = '```'

  while (remainingMessage.length > 0 || isCodeBlock) {
    let processableText = '' // Initialize processableText for non-code parts
    let currentCodeBlock = '' // Code block extracted in this iteration

    if (isCodeBlock) {
      if (remainingMessage.includes(delimiter)) {
        // End of code block found in remainingMessage
        const [codeEnd, ...rest] = remainingMessage.split(delimiter)
        currentCodeBlock = codeBlockContent + codeEnd
        codeBlockContent = ''
        // Update remainingMessage for the next iteration
        remainingMessage = rest.join(delimiter).trimStart()
        isCodeBlock = false

        // Add previous assistant text and the completed code block to log
        if (logText.trim()) {
          addedChatLog.push({ role: 'assistant', content: logText.trim() })
        }
        addedChatLog.push({ role: 'code', content: currentCodeBlock })
        logText = ''
        // Skip processing non-code text in this iteration, handle remainingMessage in the next
        continue // ★ Go to next iteration
      } else {
        // End of code block not found, consume entire remainingMessage
        codeBlockContent += remainingMessage
        remainingMessage = ''
        continue // Skip further processing in this iteration
      }
    } else if (remainingMessage.includes(delimiter)) {
      // Start of code block found
      const [beforeCode, ...rest] = remainingMessage.split(delimiter)
      processableText = beforeCode // Set text before delimiter to be processed now
      codeBlockContent = rest.join(delimiter) // Store potential code content for next iteration
      isCodeBlock = true
      remainingMessage = '' // Clear remainingMessage as code part is stored
    } else {
      // No code block involved, process the entire remainingMessage
      processableText = remainingMessage
      remainingMessage = '' // Consume the text
    }

    // Process the non-code text part (only if not in code block state initially)
    // Note: This block is now skipped if we just finished a code block (due to `continue` above)
    if (processableText.length > 0) {
      // Check if there is actually text to process
      let localRemaining = processableText.trimStart()
      while (localRemaining.length > 0) {
        const prevLocalRemaining = localRemaining
        const { emotionTag, remainingText: textAfterEmotion } =
          extractEmotion(localRemaining)
        const { sentence, remainingText: textAfterSentence } =
          extractSentence(textAfterEmotion)

        if (sentence) {
          assistantMessageListRef.current.push(sentence)
          const aiText = emotionTag ? `${emotionTag} ${sentence}` : sentence
          logText += aiText // Accumulate text for logging
          handleSpeakAndStateUpdate(
            sessionId,
            sentence,
            emotionTag,
            assistantMessageListRef,
            currentSlideMessagesRef
          )
          localRemaining = textAfterSentence
        } else {
          // No standard sentence found, treat the rest as one chunk if unchanged
          if (localRemaining === prevLocalRemaining && localRemaining) {
            const finalSentence = localRemaining
            assistantMessageListRef.current.push(finalSentence)
            const aiText = emotionTag
              ? `${emotionTag} ${finalSentence}`
              : finalSentence
            logText += aiText
            handleSpeakAndStateUpdate(
              sessionId,
              finalSentence,
              emotionTag,
              assistantMessageListRef,
              currentSlideMessagesRef
            )
            localRemaining = ''
          } else {
            // No sentence match and text changed (e.g., only emotion extracted), or empty
            localRemaining = textAfterSentence // Continue with potentially remaining text
          }
        }
        // Safety break: If text remains but no sentence is extracted, avoid infinite loop
        if (
          localRemaining.length > 0 &&
          localRemaining === prevLocalRemaining &&
          !sentence
        ) {
          console.warn(
            'Potential infinite loop detected in speakMessageHandler, breaking. Remaining:',
            localRemaining
          )
          // Optionally handle the remaining text here, e.g., log it or speak it as one chunk
          const finalSentence = localRemaining
          assistantMessageListRef.current.push(finalSentence)
          logText += finalSentence // Assuming no emotion tag if extractEmotion didn't find one earlier
          handleSpeakAndStateUpdate(
            sessionId,
            finalSentence,
            '', // No emotion tag assumed here
            assistantMessageListRef,
            currentSlideMessagesRef
          )
          break
        }
      }
    } // End of non-code text processing

    // Handle the start of a code block detected earlier in the loop
    if (isCodeBlock && codeBlockContent) {
      // If code block started, potentially add preceding text to log
      if (logText.trim()) {
        addedChatLog.push({ role: 'assistant', content: logText.trim() })
        logText = ''
      }
      // Set remainingMessage for the next loop iteration to handle the code block content
      remainingMessage = codeBlockContent
      codeBlockContent = '' // Clear temp holder
    }
  } // while loop end

  // Add any remaining assistant text to the log (if loop ends outside code block)
  if (logText.trim()) {
    addedChatLog.push({ role: 'assistant', content: logText.trim() })
  }
  // Add remaining code block content if loop ended abruptly while in code block state
  // (Should ideally not happen with current logic, but as safety)
  if (isCodeBlock && codeBlockContent.trim()) {
    console.warn('Loop ended unexpectedly while in code block state.')
    addedChatLog.push({ role: 'code', content: codeBlockContent.trim() })
  }

  // Final state update
  homeStore.setState({
    // slideMessages is updated within handleSpeakAndStateUpdate callbacks
    chatLog: [...hs.chatLog, ...addedChatLog],
    // assistantMessage is updated within handleSpeakAndStateUpdate callbacks
  })
}

/**
 * AIからの応答を処理する関数 (Refactored with improved code block handling)
 * @param currentChatLog ログに残るメッセージの配列
 * @param messages 解答生成に使用するメッセージの配列
 */
export const processAIResponse = async (
  currentChatLog: Message[],
  messages: Message[]
) => {
  const sessionId = generateSessionId()
  homeStore.setState({ chatProcessing: true })
  let stream

  const hs = homeStore.getState()
  const currentSlideMessagesRef = { current: [] as string[] } // Use ref object
  const assistantMessageListRef = { current: [] as string[] } // Use ref object

  try {
    stream = await getAIChatResponseStream(messages)
  } catch (e) {
    console.error(e)
    stream = null
  }

  if (stream == null) {
    homeStore.setState({ chatProcessing: false })
    return
  }

  const reader = stream.getReader()
  let receivedChunks = '' // Store unprocessed parts of chunks
  let aiTextLog: Message[] = [] // 会話ログ欄で使用
  let currentEmotionTag = '' // Track emotion across chunks
  let isCodeBlock = false
  let codeBlockContent = '' // Store content while inside a code block
  const CODE_DELIMITER = '```'

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (value) receivedChunks += value // Append new chunk

      let processableText = receivedChunks // Text to process in this iteration
      receivedChunks = '' // Assume we process everything unless part remains

      mainLoop: while (processableText.length > 0) {
        const originalProcessableText = processableText // For loop break detection

        if (isCodeBlock) {
          // Append current chunk first, then search backwards for the delimiter
          codeBlockContent += processableText
          processableText = '' // Assume consumed for now

          const delimiterIndex = codeBlockContent.lastIndexOf(CODE_DELIMITER)

          // Check if the found delimiter could reasonably be the *end* delimiter.
          // It should start at or after the beginning of the newly added text chunk,
          // minus a small overlap allowance (CODE_DELIMITER.length - 1).
          if (
            delimiterIndex !== -1 &&
            delimiterIndex >=
              codeBlockContent.length -
                (originalProcessableText.length + CODE_DELIMITER.length - 1)
          ) {
            const actualCode = codeBlockContent.substring(0, delimiterIndex)
            const remainingAfterDelimiter = codeBlockContent.substring(
              delimiterIndex + CODE_DELIMITER.length
            )

            if (actualCode.trim()) {
              // Log the code part
              aiTextLog.push({ role: 'code', content: actualCode })
            }

            // Reset state and process remaining text
            codeBlockContent = ''
            isCodeBlock = false
            currentEmotionTag = '' // Reset emotion context
            processableText = remainingAfterDelimiter.trimStart() // Set the remaining text to be processed
            // Continue the inner loop to process the remaining text
            continue mainLoop
          } else {
            // Delimiter not found spanning the boundary or within the new chunk
            // The entire originalProcessableText is part of the code block for now.
            // Break inner loop and wait for the next chunk.
            break mainLoop
          }
        } else {
          // Not inside a code block
          const delimiterIndex = processableText.indexOf(CODE_DELIMITER)
          if (delimiterIndex !== -1) {
            // Found start delimiter
            const beforeCode = processableText.substring(0, delimiterIndex)
            const afterDelimiterRaw = processableText.substring(
              delimiterIndex + CODE_DELIMITER.length
            )

            // Process text before the code block starts
            let textToProcessBeforeCode = beforeCode.trimStart()
            processLoopBeforeCode: while (textToProcessBeforeCode.length > 0) {
              const prevText = textToProcessBeforeCode
              const {
                emotionTag: extractedEmotion,
                remainingText: textAfterEmotion,
              } = extractEmotion(textToProcessBeforeCode)
              if (extractedEmotion) currentEmotionTag = extractedEmotion
              const { sentence, remainingText: textAfterSentence } =
                extractSentence(textAfterEmotion)

              if (sentence) {
                assistantMessageListRef.current.push(sentence)
                aiTextLog.push({
                  role: 'assistant',
                  content: `${currentEmotionTag} ${sentence}`.trim(),
                })
                handleSpeakAndStateUpdate(
                  sessionId,
                  sentence,
                  currentEmotionTag,
                  assistantMessageListRef,
                  currentSlideMessagesRef
                )
                textToProcessBeforeCode = textAfterSentence
                if (!textAfterSentence) currentEmotionTag = '' // Reset emotion if sentence ends chunk
              } else {
                // If no sentence extracted, store remaining and break this specific loop
                receivedChunks = textToProcessBeforeCode + receivedChunks // Prepend unprocessed part
                textToProcessBeforeCode = '' // Stop this loop
                break processLoopBeforeCode
              }
              // Safety break for this inner-inner loop
              if (
                textToProcessBeforeCode.length > 0 &&
                textToProcessBeforeCode === prevText
              ) {
                receivedChunks = textToProcessBeforeCode + receivedChunks // Prepend unprocessed part
                break processLoopBeforeCode
              }
            }

            // Check for language name after delimiter (e.g., ```python\n)
            const langMatch = afterDelimiterRaw.match(/^ *(\w+)? *\n/)
            let remainingAfterDelimiter = afterDelimiterRaw
            if (langMatch) {
              // If language found, start code block content *after* the language and newline
              remainingAfterDelimiter = afterDelimiterRaw.substring(
                langMatch[0].length
              )
            }

            isCodeBlock = true
            codeBlockContent = '' // Start fresh code block content
            processableText = remainingAfterDelimiter // Continue processing text *after* delimiter
            continue mainLoop // Restart inner loop with remaining text after delimiter
          } else {
            // No delimiter found, process as regular text
            const {
              emotionTag: extractedEmotion,
              remainingText: textAfterEmotion,
            } = extractEmotion(processableText)
            if (extractedEmotion) currentEmotionTag = extractedEmotion // Update context emotion

            const { sentence, remainingText: textAfterSentence } =
              extractSentence(textAfterEmotion)

            if (sentence) {
              assistantMessageListRef.current.push(sentence)
              aiTextLog.push({
                role: 'assistant',
                content: `${currentEmotionTag} ${sentence}`.trim(),
              })
              handleSpeakAndStateUpdate(
                sessionId,
                sentence,
                currentEmotionTag,
                assistantMessageListRef,
                currentSlideMessagesRef
              )
              processableText = textAfterSentence // Continue with the rest
              if (!textAfterSentence) currentEmotionTag = '' // Reset emotion if sentence ends chunk
            } else {
              // No sentence found in this chunk. Store remaining part for next iteration.
              receivedChunks = processableText + receivedChunks // Prepend unprocessed part
              processableText = '' // Mark as processed for this inner loop
              break mainLoop // Break inner loop, wait for more data
            }
          }
        } // end if(isCodeBlock) else

        // Safety check: If no progress is made in the inner loop, store remaining and break
        if (
          processableText.length > 0 &&
          processableText === originalProcessableText
        ) {
          receivedChunks = processableText + receivedChunks // Store unprocessed part
          processableText = ''
          break mainLoop // Avoid potential infinite loop
        }
      } // End inner while(processableText.length > 0)

      // --- Stream End Handling ---
      if (done) {
        // If stream finished, process any remaining stored text
        if (receivedChunks.length > 0) {
          if (!isCodeBlock) {
            // Don't process if expecting code end
            const finalSentence = receivedChunks // Treat remaining as one sentence
            assistantMessageListRef.current.push(finalSentence)
            aiTextLog.push({
              role: 'assistant',
              content: `${currentEmotionTag} ${finalSentence}`.trim(),
            })
            handleSpeakAndStateUpdate(
              sessionId,
              finalSentence,
              currentEmotionTag,
              assistantMessageListRef,
              currentSlideMessagesRef
            )
            receivedChunks = '' // Clear remaining
          } else {
            // Still in code block when stream ends? Append remaining to code block
            codeBlockContent += receivedChunks
            receivedChunks = ''
          }
        }
        // If still in code block state when done, log the accumulated content
        if (isCodeBlock && codeBlockContent.trim()) {
          aiTextLog.push({ role: 'code', content: codeBlockContent })
          codeBlockContent = '' // Clear just in case
          isCodeBlock = false // Ensure state is reset
        }
        break // Exit outer while loop
      }
    } // End outer while(true) loop
  } catch (e) {
    console.error(e)
  } finally {
    reader.releaseLock()
  }

  // Final state update after stream processing
  homeStore.setState({
    chatLog: messageSelectors.normalizeMessages([
      ...currentChatLog,
      ...aiTextLog,
    ]),
    chatProcessing: false,
    // assistantMessage and slideMessages are updated via callbacks
  })
}

/**
 * アシスタントとの会話を行う
 * 画面のチャット欄から入力されたときに実行される処理
 * Youtubeでチャット取得した場合もこの関数を使用する
 */
export const handleSendChatFn = () => async (text: string) => {
  const sessionId = generateSessionId()
  const newMessage = text
  const timestamp = new Date().toISOString()

  if (newMessage === null) return

  const ss = settingsStore.getState()
  const hs = homeStore.getState()
  const sls = slideStore.getState()
  const wsManager = webSocketStore.getState().wsManager

  if (ss.externalLinkageMode) {
    homeStore.setState({ chatProcessing: true })

    if (wsManager?.websocket?.readyState === WebSocket.OPEN) {
      // ユーザーの発言を追加して表示
      const updateLog: Message[] = [
        ...hs.chatLog,
        { role: 'user', content: newMessage, timestamp: timestamp },
      ]
      homeStore.setState({
        chatLog: updateLog,
      })

      // WebSocket送信
      wsManager.websocket.send(
        JSON.stringify({ content: newMessage, type: 'chat' })
      )
    } else {
      toastStore.getState().addToast({
        message: i18next.t('NotConnectedToExternalAssistant'),
        type: 'error',
        tag: 'not-connected-to-external-assistant',
      })
      homeStore.setState({
        chatProcessing: false,
      })
    }
  } else if (ss.realtimeAPIMode) {
    if (wsManager?.websocket?.readyState === WebSocket.OPEN) {
      // ユーザーの発言を追加して表示
      const updateLog: Message[] = [
        ...hs.chatLog,
        { role: 'user', content: newMessage, timestamp: timestamp },
      ]
      homeStore.setState({
        chatLog: updateLog,
      })
    }
  } else {
    let systemPrompt = ss.systemPrompt
    if (ss.slideMode) {
      if (sls.isPlaying) {
        return
      }

      try {
        let scripts = JSON.stringify(
          require(
            `../../../public/slides/${sls.selectedSlideDocs}/scripts.json`
          )
        )
        systemPrompt = systemPrompt.replace('{{SCRIPTS}}', scripts)

        let supplement = ''
        try {
          const response = await fetch(
            `/api/getSupplement?slideDocs=${sls.selectedSlideDocs}`
          )
          if (!response.ok) {
            throw new Error('Failed to fetch supplement')
          }
          const data = await response.json()
          supplement = data.supplement
          systemPrompt = systemPrompt.replace('{{SUPPLEMENT}}', supplement)
        } catch (e) {
          console.error('supplement.txtの読み込みに失敗しました:', e)
        }

        const answerString = await judgeSlide(newMessage, scripts, supplement)
        const answer = JSON.parse(answerString)
        if (answer.judge === 'true' && answer.page !== '') {
          goToSlide(Number(answer.page))
          systemPrompt += `\n\nEspecial Page Number is ${answer.page}.`
        }
      } catch (e) {
        console.error(e)
      }
    }

    homeStore.setState({ chatProcessing: true })
    // ユーザーの発言を追加して表示
    const messageLog: Message[] = [
      ...hs.chatLog,
      {
        role: 'user',
        content: hs.modalImage
          ? [
              { type: 'text', text: newMessage },
              { type: 'image', image: hs.modalImage },
            ]
          : newMessage,
        timestamp: timestamp,
      },
    ]
    if (hs.modalImage) {
      homeStore.setState({ modalImage: '' })
    }
    homeStore.setState({ chatLog: messageLog })

    const messages: Message[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messageSelectors.getProcessedMessages(
        messageLog,
        ss.includeTimestampInUserMessage
      ),
    ]

    try {
      await processAIResponse(messageLog, messages)
    } catch (e) {
      console.error(e)
    }

    homeStore.setState({ chatProcessing: false })
  }
}

/**
 * WebSocketからのテキストを受信したときの処理
 */
export const handleReceiveTextFromWsFn =
  () =>
  async (
    text: string,
    role?: string,
    emotion: EmotionType = 'neutral',
    type?: string
  ) => {
    const sessionId = generateSessionId()
    if (text === null || role === undefined) return

    const ss = settingsStore.getState()
    const hs = homeStore.getState()
    const wsManager = webSocketStore.getState().wsManager

    if (ss.externalLinkageMode) {
      console.log('ExternalLinkage Mode: true')
    } else {
      console.log('ExternalLinkage Mode: false')
      return
    }

    homeStore.setState({ chatProcessing: true })

    if (role !== 'user') {
      const updateLog: Message[] = [...hs.chatLog]

      if (type === 'start') {
        // startの場合は何もしない（textは空文字のため）
        console.log('Starting new response')
        wsManager?.setTextBlockStarted(false)
      } else if (
        updateLog.length > 0 &&
        updateLog[updateLog.length - 1].role === role &&
        wsManager?.textBlockStarted
      ) {
        // 既存のメッセージに追加
        updateLog[updateLog.length - 1].content += text
      } else {
        // 新しいメッセージを追加
        updateLog.push({ role: role, content: text })
        wsManager?.setTextBlockStarted(true)
      }

      if (role === 'assistant' && text !== '') {
        let aiText = `[${emotion}] ${text}`
        try {
          // 文ごとに音声を生成 & 再生、返答を表示
          speakCharacter(
            sessionId,
            {
              message: text,
              emotion: emotion,
            },
            () => {
              homeStore.setState({
                chatLog: updateLog,
                assistantMessage: (() => {
                  const content = updateLog[updateLog.length - 1].content
                  return typeof content === 'string' ? content : ''
                })(),
              })
            },
            () => {
              // hs.decrementChatProcessingCount()
            }
          )
        } catch (e) {
          console.error('Error in speakCharacter:', e)
        }
      } else {
        homeStore.setState({
          chatLog: updateLog,
        })
      }

      if (type === 'end') {
        // レスポンスの終了処理
        console.log('Response ended')
        wsManager?.setTextBlockStarted(false)
        homeStore.setState({ chatProcessing: false })
      }
    }

    homeStore.setState({ chatProcessing: type !== 'end' })
  }

/**
 * RealtimeAPIからのテキストまたは音声データを受信したときの処理
 */
export const handleReceiveTextFromRtFn =
  () =>
  async (text?: string, role?: string, type?: string, buffer?: ArrayBuffer) => {
    const sessionId = generateSessionId()
    if ((!text && !buffer) || role === undefined) return

    const ss = settingsStore.getState()
    const hs = homeStore.getState()

    if (ss.realtimeAPIMode) {
      console.log('realtime api mode: true')
    } else if (ss.audioMode) {
      console.log('audio mode: true')
    } else {
      console.log('realtime api mode: false')
      return
    }

    homeStore.setState({ chatProcessing: true })

    if (role == 'assistant') {
      const updateLog: Message[] = [...hs.chatLog]

      if (type?.includes('response.audio') && buffer !== undefined) {
        console.log('response.audio:')
        try {
          speakCharacter(
            sessionId,
            {
              emotion: 'neutral',
              message: '',
              buffer: buffer,
            },
            () => {},
            () => {}
          )
        } catch (e) {
          console.error('Error in speakCharacter:', e)
        }
      } else if (type === 'response.content_part.done' && text !== undefined) {
        updateLog.push({ role: role, content: text })
        homeStore.setState({
          chatLog: updateLog,
        })
      }
    }
    homeStore.setState({ chatProcessing: false })
  }
