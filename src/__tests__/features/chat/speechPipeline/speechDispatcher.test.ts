import {
  createSpeechDispatcher,
  __resetLatestResponseSessionId,
} from '@/features/chat/speechPipeline/speechDispatcher'
import { speakCharacter } from '@/features/messages/speakCharacter'
import { SpeakQueue } from '@/features/messages/speakQueue'
import homeStore from '@/features/stores/home'

jest.mock('@/features/messages/speakCharacter', () => ({
  speakCharacter: jest.fn(),
}))

jest.mock('@/features/messages/characterRenderer', () => ({
  getCharacterRenderer: jest.fn(() => ({
    speak: jest.fn(),
    stopSpeaking: jest.fn(),
    resetToIdle: jest.fn(),
  })),
}))

jest.mock('@/features/stores/home', () => ({
  getState: jest.fn(),
  setState: jest.fn(),
}))

const mockHomeState = {
  isSpeaking: false,
  slideMessages: [] as string[],
  incrementChatProcessingCount: jest.fn(),
  decrementChatProcessingCount: jest.fn(),
}

const speech = (text: string, emotionTag = '', motionTag?: string) =>
  ({ kind: 'speech', text, emotionTag, motionTag }) as const

describe('speechDispatcher', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __resetLatestResponseSessionId()
    ;(homeStore.getState as jest.Mock).mockReturnValue(mockHomeState)
  })

  it('通常のテキストをspeakCharacterへ依頼する', () => {
    const d = createSpeechDispatcher('session-1')
    expect(d.dispatch(speech('こんにちは。', '[happy]', 'wave'))).toBe(true)
    expect(speakCharacter).toHaveBeenCalledWith(
      'session-1',
      { message: 'こんにちは。', emotion: 'happy', motion: 'wave' },
      expect.any(Function),
      expect.any(Function),
      undefined,
      expect.any(Function)
    )
    expect(d.anyDispatched).toBe(true)
  })

  it('タグなしはneutralとして依頼する', () => {
    const d = createSpeechDispatcher('session-1')
    d.dispatch(speech('やあ。'))
    expect(speakCharacter).toHaveBeenCalledWith(
      'session-1',
      { message: 'やあ。', emotion: 'neutral', motion: undefined },
      expect.any(Function),
      expect.any(Function),
      undefined,
      expect.any(Function)
    )
  })

  it('記号・空白のみは依頼しない（ただし無効化はされない）', () => {
    const d = createSpeechDispatcher('session-1')
    expect(d.dispatch(speech('、、、'))).toBe(false)
    expect(speakCharacter).not.toHaveBeenCalled()
    expect(d.disabled).toBe(false)
    expect(d.dispatch(speech('本文。'))).toBe(true)
  })

  it('初回dispatch後のstopAllで無効化される（D1/契約6-1）', () => {
    const d = createSpeechDispatcher('session-1')
    expect(d.dispatch(speech('一文目。'))).toBe(true)
    SpeakQueue.stopAll()
    expect(d.dispatch(speech('二文目。'))).toBe(false)
    expect(d.disabled).toBe(true)
    expect(speakCharacter).toHaveBeenCalledTimes(1)
    // 無効化後は永続的に依頼しない
    expect(d.dispatch(speech('三文目。'))).toBe(false)
  })

  it('初回dispatch前のstopAllは影響しない＝遅延捕捉（契約6-5）', () => {
    const d = createSpeechDispatcher('session-1')
    SpeakQueue.stopAll()
    expect(d.dispatch(speech('応答遅延後の一文目。'))).toBe(true)
    expect(d.disabled).toBe(false)
  })

  it('自セッションへのstopSessionで無効化される（契約6-3）', () => {
    const d = createSpeechDispatcher('session-1')
    d.dispatch(speech('一文目。'))
    // session-1 を現在発話中セッションにしてから停止
    SpeakQueue.getInstance().checkSessionId('session-1')
    SpeakQueue.stopSession('session-1')
    expect(d.dispatch(speech('二文目。'))).toBe(false)
    expect(d.disabled).toBe(true)
  })

  it('他セッションへのstopSessionでは巻き添えにならず継続する（契約6-4）', () => {
    const other = createSpeechDispatcher('session-other')
    other.dispatch(speech('他セッション。'))
    const d = createSpeechDispatcher('session-1')
    d.dispatch(speech('一文目。'))
    // 他セッションを現在発話中にして停止（トークンが増える）
    SpeakQueue.getInstance().checkSessionId('session-other')
    SpeakQueue.stopSession('session-other')
    expect(SpeakQueue.currentStopScope).toBe('session-other')
    // このセッションはトークンを追従して発話を継続する
    expect(d.dispatch(speech('二文目。'))).toBe(true)
    expect(d.disabled).toBe(false)
  })

  it('新しい応答セッションの開始で旧dispatcherが無効化される（契約6-2/6-6）', () => {
    const oldDispatcher = createSpeechDispatcher('session-old')
    oldDispatcher.dispatch(speech('旧応答。'))
    createSpeechDispatcher('session-new')
    expect(oldDispatcher.dispatch(speech('旧応答の続き。'))).toBe(false)
    expect(oldDispatcher.disabled).toBe(true)
    expect(speakCharacter).toHaveBeenCalledTimes(1)
  })

  it('実再生開始と完了でスライド字幕を切り替える', () => {
    const d = createSpeechDispatcher('session-1')
    d.dispatch(speech('一文目。'))
    const [, , onStart, onComplete, , onPlaybackStart] = (
      speakCharacter as jest.Mock
    ).mock.calls[0]

    onStart()
    expect(mockHomeState.incrementChatProcessingCount).toHaveBeenCalled()
    expect(homeStore.setState).not.toHaveBeenCalledWith({
      slideMessages: ['一文目。'],
    })

    onPlaybackStart()
    expect(homeStore.setState).toHaveBeenCalledWith({
      slideMessages: ['一文目。'],
    })

    onComplete()
    expect(mockHomeState.decrementChatProcessingCount).toHaveBeenCalled()
    expect(homeStore.setState).toHaveBeenLastCalledWith({ slideMessages: [] })
  })

  it('発話文と異なる表示文を字幕へ維持する', () => {
    const d = createSpeechDispatcher('session-1', {
      displayMessages: ['Bunkerkidsを', '紹介します。'],
    })
    d.dispatch(speech('バンカーキッズを'))
    d.dispatch(speech('紹介します。'))
    const [
      ,
      ,
      firstOnStart,
      firstOnComplete,
      firstDisplayText,
      firstOnPlaybackStart,
    ] = (speakCharacter as jest.Mock).mock.calls[0]
    const [
      ,
      ,
      secondOnStart,
      secondOnComplete,
      secondDisplayText,
      secondOnPlaybackStart,
    ] = (speakCharacter as jest.Mock).mock.calls[1]

    expect(firstDisplayText).toBe('Bunkerkidsを')
    expect(secondDisplayText).toBe('紹介します。')

    firstOnStart()
    secondOnStart()
    expect(homeStore.setState).not.toHaveBeenCalledWith({
      slideMessages: ['Bunkerkidsを', '紹介します。'],
    })
    firstOnPlaybackStart()
    secondOnPlaybackStart()
    expect(homeStore.setState).toHaveBeenLastCalledWith({
      slideMessages: ['Bunkerkidsを', '紹介します。'],
    })
    ;(homeStore.setState as jest.Mock).mockClear()
    firstOnComplete()
    expect(homeStore.setState).toHaveBeenLastCalledWith({
      slideMessages: ['紹介します。'],
    })

    secondOnComplete()
    expect(homeStore.setState).toHaveBeenLastCalledWith({ slideMessages: [] })
  })

  it('空の表示文を発話文へフォールバックしない', () => {
    const d = createSpeechDispatcher('session-1', { displayMessages: [''] })
    d.dispatch(speech('バンカーキッズを紹介します。'))
    const [, , onStart, onComplete, displayText, onPlaybackStart] = (
      speakCharacter as jest.Mock
    ).mock.calls[0]

    expect(displayText).toBe('')

    onStart()
    expect(homeStore.setState).not.toHaveBeenCalledWith({ slideMessages: [''] })

    onPlaybackStart()
    expect(homeStore.setState).toHaveBeenCalledWith({ slideMessages: [''] })

    onComplete()
    expect(homeStore.setState).toHaveBeenLastCalledWith({ slideMessages: [] })
  })

  it('再生前に破棄された発話は字幕キューを進めない', () => {
    const d = createSpeechDispatcher('session-1')
    d.dispatch(speech('再生されない文。'))
    const [, , onStart, onComplete] = (speakCharacter as jest.Mock).mock
      .calls[0]

    onStart()
    onComplete()

    expect(mockHomeState.decrementChatProcessingCount).toHaveBeenCalled()
    expect(homeStore.setState).not.toHaveBeenCalled()
  })
})
