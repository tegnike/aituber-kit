import { getAIChatResponseStream } from '@/features/chat/aiChatFactory'
import { AIService } from '@/features/constants/settings'
import { textsToScreenplay, Message } from '@/features/messages/messages'
import { speakCharacter } from '@/features/messages/speakCharacter'
import { judgeSlide } from '@/features/slide/slideAIHelpers'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import slideStore from '@/features/stores/slide'
import { goToSlide } from '@/components/slides'

/**
 * 受け取ったメッセージを解析し、文単位で処理する共通関数
 */
const processReceivedMessage = (
  receivedMessage: string,
  options: {
    tag: string
    isCodeBlock: boolean
    codeBlockText: string
    sentences: string[]
    aiTextLog: Message[]
    currentSlideMessages: string[]
  },
  ss: any,
  hs: any
) => {
  let {
    tag,
    isCodeBlock,
    codeBlockText,
    sentences,
    aiTextLog,
    currentSlideMessages,
  } = options

  // タグと返答を分離
  const tagMatch = receivedMessage.match(/^\[(.*?)\]/)
  if (tagMatch && tagMatch[0]) {
    tag = tagMatch[0]
    receivedMessage = receivedMessage.slice(tag.length)
  }

  // メッセージを文単位で処理
  while (receivedMessage.length > 0) {
    const sentenceMatch = receivedMessage.match(
      /^(.+?[。．.!?！？\n]|.{20,}[、,])/
    )
    if (sentenceMatch?.[0]) {
      let sentence = sentenceMatch[0]
      sentences.push(sentence)
      receivedMessage = receivedMessage.slice(sentence.length).trimStart()

      if (
        !sentence.includes('```') &&
        !sentence.replace(
          /^[\s\u3000\t\n\r\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]'"''""・、。,.!?！？:：;；\-_=+~～*＊@＠#＃$＄%％^＾&＆|｜\\＼/／`｀]+$/gu,
          ''
        )
      ) {
        continue
      }

      let aiText = `${tag} ${sentence}`
      console.log('aiText', aiText)

      if (isCodeBlock && !sentence.includes('```')) {
        codeBlockText += sentence
        continue
      }

      if (sentence.includes('```')) {
        if (isCodeBlock) {
          const [codeEnd, ...restOfSentence] = sentence.split('```')
          aiTextLog.push({
            role: 'code',
            content: codeBlockText + codeEnd,
          })
          aiText += `${tag} ${restOfSentence.join('```') || ''}`

          homeStore.setState({ assistantMessage: sentences.join(' ') })

          codeBlockText = ''
          isCodeBlock = false
        } else {
          isCodeBlock = true
          ;[aiText, codeBlockText] = aiText.split('```')
        }

        sentence = sentence.replace(/```/g, '')
      }

      const aiTalks = textsToScreenplay([aiText], ss.koeiroParam)
      aiTextLog.push({ role: 'assistant', content: sentence })

      const currentAssistantMessage = sentences.join(' ')

      speakCharacter(
        aiTalks[0],
        () => {
          homeStore.setState({
            assistantMessage: currentAssistantMessage,
          })
          hs.incrementChatProcessingCount()
          currentSlideMessages.push(sentence)
          homeStore.setState({
            slideMessages: currentSlideMessages,
          })
        },
        () => {
          hs.decrementChatProcessingCount()
          currentSlideMessages.shift()
          homeStore.setState({
            slideMessages: currentSlideMessages,
          })
        }
      )
    } else {
      break
    }
  }

  return {
    remainingMessage: receivedMessage,
    tag,
    isCodeBlock,
    codeBlockText,
  }
}

/**
 * 受け取ったメッセージを処理し、AIの応答を生成して発話させる
 * @param receivedMessage 処理する文字列
 */
export const speakMessage = async (receivedMessage: string) => {
  const ss = settingsStore.getState()
  const hs = homeStore.getState()
  const currentSlideMessages: string[] = []

  let aiTextLog: Message[] = []
  let tag: string = ''
  let isCodeBlock: boolean = false
  let codeBlockText: string = ''
  const sentences: string[] = []

  console.log('speakMessage', receivedMessage)

  const result = processReceivedMessage(
    receivedMessage,
    {
      tag,
      isCodeBlock,
      codeBlockText,
      sentences,
      aiTextLog,
      currentSlideMessages,
    },
    ss,
    hs
  )

  // 変数の更新
  tag = result.tag
  isCodeBlock = result.isCodeBlock
  codeBlockText = result.codeBlockText
}

/**
 * AIからの応答を処理する関数
 * @param currentChatLog ログに残るメッセージの配列
 * @param messages 解答生成に使用するメッセージの配列
 */
export const processAIResponse = async (
  currentChatLog: Message[],
  messages: Message[]
) => {
  homeStore.setState({ chatProcessing: true })
  let stream

  const ss = settingsStore.getState()
  const hs = homeStore.getState()
  const currentSlideMessages: string[] = []

  try {
    stream = await getAIChatResponseStream(
      ss.selectAIService as AIService,
      messages
    )
  } catch (e) {
    console.error(e)
    stream = null
  }

  if (stream == null) {
    homeStore.setState({ chatProcessing: false })
    return
  }

  const reader = stream.getReader()
  let receivedMessage = ''
  let aiTextLog: Message[] = []
  let tag = ''
  let isCodeBlock = false
  let codeBlockText = ''
  const sentences: string[] = []

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done && receivedMessage.length === 0) break

      if (value) receivedMessage += value

      const result = processReceivedMessage(
        receivedMessage,
        {
          tag,
          isCodeBlock,
          codeBlockText,
          sentences,
          aiTextLog,
          currentSlideMessages,
        },
        ss,
        hs
      )

      // 変数の更新
      receivedMessage = result.remainingMessage
      tag = result.tag
      isCodeBlock = result.isCodeBlock
      codeBlockText = result.codeBlockText

      if (done && receivedMessage.length > 0) {
        const finalResult = processReceivedMessage(
          receivedMessage,
          {
            tag,
            isCodeBlock,
            codeBlockText,
            sentences,
            aiTextLog,
            currentSlideMessages,
          },
          ss,
          hs
        )

        receivedMessage = finalResult.remainingMessage
        tag = finalResult.tag
        isCodeBlock = finalResult.isCodeBlock
        codeBlockText = finalResult.codeBlockText
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    reader.releaseLock()
  }

  // 会話ログの更新
  let lastImageUrl = ''
  aiTextLog = aiTextLog
    .reduce((acc: Message[], item: Message) => {
      if (
        typeof item.content != 'string' &&
        item.content[0] &&
        item.content[1]
      ) {
        lastImageUrl = item.content[1].image
      }

      const lastItem = acc[acc.length - 1]
      if (lastItem && lastItem.role === item.role) {
        if (typeof item.content != 'string') {
          lastItem.content += ' ' + item.content[0].text
        } else {
          lastItem.content += ' ' + item.content
        }
      } else {
        const text =
          typeof item.content != 'string' ? item.content[0].text : item.content
        if (lastImageUrl != '') {
          acc.push({
            ...item,
            content: [
              { type: 'text', text: text.trim() },
              { type: 'image', image: lastImageUrl },
            ],
          })
          lastImageUrl = ''
        } else {
          acc.push({ ...item, content: text.trim() })
        }
      }
      return acc
    }, [])
    .filter((item) => item.content !== '')

  homeStore.setState({
    chatLog: [...currentChatLog, ...aiTextLog],
    chatProcessing: false,
  })
}

/**
 * アシスタントとの会話を行う
 * 画面のチャット欄から入力されたときに実行される処理
 * Youtubeでチャット取得した場合もこの関数を使用する
 */
export const handleSendChatFn =
  (errors: {
    NotConnectedToExternalAssistant: string
    APIKeyNotEntered: string
  }) =>
  async (text: string) => {
    const newMessage = text

    if (newMessage === null) return

    const ss = settingsStore.getState()
    const hs = homeStore.getState()
    const sls = slideStore.getState()

    if (ss.webSocketMode) {
      console.log('websocket mode: true')
      homeStore.setState({ chatProcessing: true })

      // WebSocketで送信する処理
      if (hs.ws?.readyState === WebSocket.OPEN) {
        // ユーザーの発言を追加して表示
        const updateLog: Message[] = [
          ...hs.chatLog,
          { role: 'user', content: newMessage },
        ]
        homeStore.setState({
          chatLog: updateLog,
        })

        // WebSocket送信
        // hs.ws.send(JSON.stringify({ content: newMessage, type: 'chat' }))
      } else {
        homeStore.setState({
          assistantMessage: errors['NotConnectedToExternalAssistant'],
          chatProcessing: false,
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
        },
      ]
      if (hs.modalImage) {
        homeStore.setState({ modalImage: '' })
      }
      homeStore.setState({ chatLog: messageLog })

      // 画像は直近のものしか送らない
      const processedMessageLog = messageLog.map((message, index) => ({
        role: ['assistant', 'user', 'system'].includes(message.role)
          ? message.role
          : 'assistant',
        content:
          index === messageLog.length - 1
            ? message.content
            : Array.isArray(message.content)
              ? message.content[0].text
              : message.content,
      }))

      const messages: Message[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...processedMessageLog.slice(-10),
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
  async (text: string, role?: string, state?: string, buffer?: ArrayBuffer) => {
    speakCharacter(
      {
        talk: {
          style: '',
          message: buffer,
          speakerX: 0,
          speakerY: 0,
        },
      },
      () => {},
      () => {}
    )

    if (text === null || role === undefined) return

    const ss = settingsStore.getState()
    const hs = homeStore.getState()

    if (!ss.webSocketMode) {
      console.log('websocket mode: false')
      return
    }

    console.log('websocket mode: true')
    homeStore.setState({ chatProcessing: true })

    if (role !== 'user') {
      const updateLog: Message[] = [...hs.chatLog]

      if (state === 'start') {
        // startの場合は何もしない（textは空文字のため）
        console.log('Starting new response')
        homeStore.setState({ wsStreaming: false })
      } else if (
        updateLog.length > 0 &&
        updateLog[updateLog.length - 1].role === role &&
        hs.wsStreaming
      ) {
        // 既存のメッセージに追加
        updateLog[updateLog.length - 1].content += text
      } else {
        // 新しいメッセージを追加
        updateLog.push({ role: role, content: text })
        homeStore.setState({ wsStreaming: true })
      }

      if (role === 'assistant' && text !== '') {
        let aiText = `${'[neutral]'} ${text}`
        try {
          const aiTalks = textsToScreenplay([aiText], ss.koeiroParam)

          // 文ごとに音声を生成 & 再生、返答を表示
          speakCharacter(
            aiTalks[0],
            () => {
              homeStore.setState({
                chatLog: updateLog,
                assistantMessage: (() => {
                  const content = updateLog[updateLog.length - 1].content
                  return typeof content === 'string' ? content : ''
                })(),
              })
            },
            () => {}
          )
        } catch (e) {
          console.error('Error in speakCharacter:', e)
        }
      } else {
        homeStore.setState({
          chatLog: updateLog,
        })
      }

      if (state === 'end') {
        // レスポンスの終了処理
        console.log('Response ended')
        homeStore.setState({ wsStreaming: false })
        homeStore.setState({ chatProcessing: false })
      }
    }

    homeStore.setState({ chatProcessing: state !== 'end' })
  }
