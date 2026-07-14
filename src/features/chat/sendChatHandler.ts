import { logger } from '@/lib/logger'
import { Message } from '@/features/messages/messages'
import { judgeSlide } from '@/features/slide/slideAIHelpers'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import slideStore, { goToSlide } from '@/features/stores/slide'
import { messageSelectors } from '../messages/messageSelectors'
import webSocketStore from '@/features/stores/websocketStore'
import externalLinkageWebSocketStore from '@/features/stores/externalLinkageWebSocketStore'
import i18next from 'i18next'
import toastStore from '@/features/stores/toast'
import { isMultiModalAvailable } from '@/features/constants/aiModels'
import {
  saveMessageToMemory,
  searchMemoryContext,
} from '@/features/memory/memoryStoreSync'
import {
  createLegacyExternalLinkageChatPayload,
  createV2ExternalLinkageChatEvent,
} from '@/features/externalLinkage/externalLinkageProtocol'
import { processAIResponse } from './speechPipeline/processAIResponse'
import presentationStore from '@/features/stores/presentation'
import { buildPresentationPromptContext } from '@/features/presentation/presentationPromptContext'

/**
 * アシスタントとの会話を行う
 * 画面のチャット欄から入力されたときに実行される処理
 * Youtubeでチャット取得した場合もこの関数を使用する
 */
export const handleSendChatFn =
  () => async (text: string, userName?: string) => {
    const newMessage = text
    const timestamp = new Date().toISOString()

    if (newMessage === null) return

    const ss = settingsStore.getState()
    const sls = slideStore.getState()
    const presentation = presentationStore.getState()
    const externalWsManager = externalLinkageWebSocketStore.getState().wsManager
    const modalImage = homeStore.getState().modalImage

    if (ss.externalLinkageMode) {
      homeStore.setState({ chatProcessing: true })

      if (externalWsManager?.websocket?.readyState === WebSocket.OPEN) {
        const userMessageContent: Message['content'] = modalImage
          ? [
              { type: 'text' as const, text: newMessage },
              { type: 'image' as const, image: modalImage },
            ]
          : newMessage

        homeStore.getState().upsertMessage({
          role: 'user',
          content: userMessageContent,
          timestamp: timestamp,
          userName: userName,
        })

        saveMessageToMemory({
          role: 'user',
          content: newMessage,
          timestamp: timestamp,
        }).catch(() => {})

        const externalWsState = externalLinkageWebSocketStore.getState()
        const wsPayload =
          externalWsState.protocolVersion === '2'
            ? createV2ExternalLinkageChatEvent(
                newMessage,
                modalImage || undefined
              )
            : createLegacyExternalLinkageChatPayload(
                newMessage,
                modalImage || undefined
              )
        if ('id' in wsPayload) {
          externalWsState.startRequest(wsPayload.id)
        }
        try {
          externalWsManager.websocket.send(JSON.stringify(wsPayload))
        } catch (error) {
          logger.error('Failed to send external linkage message:', error)
          if ('id' in wsPayload) {
            externalWsState.failRequest(wsPayload.id, 'WebSocket send failed')
          }
          homeStore.setState({ chatProcessing: false })
          toastStore.getState().addToast({
            message: i18next.t('Toasts.WebSocketConnectionError'),
            type: 'error',
            tag: 'external-linkage-websocket-send-error',
          })
          return
        }

        if (modalImage) {
          homeStore.setState({ modalImage: '' })
        }
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
      const wsManager = webSocketStore.getState().wsManager
      if (wsManager?.websocket?.readyState === WebSocket.OPEN) {
        homeStore.getState().upsertMessage({
          role: 'user',
          content: newMessage,
          timestamp: timestamp,
          userName: userName,
        })

        saveMessageToMemory({
          role: 'user',
          content: newMessage,
          timestamp: timestamp,
        }).catch(() => {})
      }
    } else {
      let systemPrompt = ss.systemPrompt
      if (ss.slideMode) {
        if (sls.isPlaying || presentation.state === 'playing') {
          return
        }

        if (
          presentation.document &&
          presentation.sectionId &&
          presentation.slideId
        ) {
          const context = buildPresentationPromptContext(
            presentation.document,
            presentation.sectionId,
            presentation.slideId
          )
          if (context) systemPrompt += `\n\n${context}`
        } else {
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
                `/api/getSupplement?slideName=${sls.selectedSlideDocs}`
              )
              if (!response.ok) {
                throw new Error('Failed to fetch supplement')
              }
              const data = await response.json()
              supplement = data.supplement
              systemPrompt = systemPrompt.replace('{{SUPPLEMENT}}', supplement)
            } catch (e) {
              logger.error('supplement.txtの読み込みに失敗しました:', e)
            }

            const answerString = await judgeSlide(
              newMessage,
              scripts,
              supplement
            )
            const answer = JSON.parse(answerString)
            if (answer.judge === 'true' && answer.page !== '') {
              goToSlide(Number(answer.page))
              systemPrompt += `\n\nEspecial Page Number is ${answer.page}.`
            }
          } catch (e) {
            logger.error(e)
          }
        }
      }

      homeStore.setState({ chatProcessing: true })

      // マルチモーダル対応チェック
      if (
        modalImage &&
        !isMultiModalAvailable(
          ss.selectAIService,
          ss.selectAIModel,
          ss.enableMultiModal,
          ss.customModel
        )
      ) {
        toastStore.getState().addToast({
          message: i18next.t('MultiModalNotSupported'),
          type: 'error',
          tag: 'multimodal-not-supported',
        })
        homeStore.setState({
          chatProcessing: false,
          modalImage: '',
        })
        return
      }

      // 画像が添付されている場合はマルチモーダルメッセージを構築
      let userMessageContent: Message['content'] = newMessage
      if (modalImage) {
        userMessageContent = [
          { type: 'text' as const, text: newMessage },
          { type: 'image' as const, image: modalImage },
        ]
      }

      homeStore.getState().upsertMessage({
        role: 'user',
        content: userMessageContent,
        timestamp: timestamp,
        userName: userName,
      })

      // IndexedDBにユーザーメッセージを保存
      saveMessageToMemory({
        role: 'user',
        content:
          typeof userMessageContent === 'string'
            ? userMessageContent
            : newMessage,
        timestamp: timestamp,
      }).catch(() => {})

      if (modalImage) {
        homeStore.setState({ modalImage: '' })
      }

      // ポーズ設定からモーションタグ情報をシステムプロンプトに追加
      const poseConfigs = ss.poseConfigs
      if (poseConfigs.length > 0) {
        const motionIds = poseConfigs.map((p) => p.id).join(', ')
        systemPrompt +=
          '\n\nモーションタグを使うことで、キャラクターのポーズを制御できます。' +
          `利用可能なモーション: ${motionIds}\n` +
          '書式: [motion:モーション名]  例: [motion:think]\n' +
          '感情タグと併用可能です。例: [happy][motion:cheer]やったー！'
      }

      // IndexedDBから関連する過去の記憶を検索してsystemPromptに追加
      const memoryContext = await searchMemoryContext(newMessage)
      if (memoryContext) {
        systemPrompt = systemPrompt + '\n\n' + memoryContext
      }

      const currentChatLog = homeStore.getState().chatLog

      const messages: Message[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messageSelectors.getProcessedMessages(
          currentChatLog,
          ss.includeTimestampInUserMessage
        ),
      ]

      try {
        await processAIResponse(messages)
      } catch (e) {
        logger.error(e)
        // 思考中ポーズのリセット
        if (ss.thinkingPoseEnabled && ss.modelType === 'vrm') {
          const model = homeStore.getState().viewer.model
          if (model?.poseManager.isActive) {
            model.poseManager.resetToIdle(model)
          }
        }
        homeStore.setState({ chatProcessing: false })
      }
    }
  }
