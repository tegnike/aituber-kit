import { fireEvent, render, screen } from '@testing-library/react'
import SpeechInput from '@/components/settings/speechInput'
import settingsStore from '@/features/stores/settings'

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), {
    setState: jest.fn(),
  }),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ''} />
  ),
}))

jest.mock('@/components/link', () => ({
  Link: ({ url, label }: { url: string; label: string }) => (
    <a href={url}>{label}</a>
  ),
}))

jest.mock('@/components/toggleSwitch', () => ({
  ToggleSwitch: ({ testId }: { testId?: string }) => (
    <button data-testid={testId} />
  ),
}))

jest.mock('@/features/constants/aiModels', () => ({
  getOpenAIWhisperModels: () => ['whisper-1'],
}))

const mockSettingsStore = settingsStore as jest.MockedFunction<
  typeof settingsStore
>

const defaultState = {
  noSpeechTimeout: 2,
  showSilenceProgressBar: true,
  speechRecognitionMode: 'browser' as const,
  whisperTranscriptionModel: 'whisper-1' as const,
  openaiKey: '',
  continuousMicListeningMode: false,
  initialSpeechTimeout: 5,
  realtimeAPIMode: false,
  audioMode: false,
}

describe('SpeechInput live transcription mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSettingsStore.mockImplementation((selector) =>
      selector(defaultState as never)
    )
  })

  it('音声入力設定に3種類の音声認識方式を表示する', () => {
    const { container } = render(<SpeechInput />)

    expect(screen.getByText('BrowserSpeechRecognition')).toBeTruthy()
    expect(screen.getByText('WhisperSpeechRecognition')).toBeTruthy()
    expect(screen.getByText('LiveTranscriptionSpeechRecognition')).toBeTruthy()
    expect(container.querySelector('optgroup')).toBeNull()
  })

  it('音声入力設定からライブ文字起こしを選択できる', () => {
    render(<SpeechInput />)

    fireEvent.change(screen.getByTestId('speech-recognition-mode-select'), {
      target: { value: 'live-transcription' },
    })

    expect(settingsStore.setState).toHaveBeenCalledWith({
      speechRecognitionMode: 'live-transcription',
    })
  })

  it('ライブ文字起こし選択時に入力専用の説明とAPIキー欄を表示する', () => {
    mockSettingsStore.mockImplementation((selector) =>
      selector({
        ...defaultState,
        speechRecognitionMode: 'live-transcription',
      } as never)
    )

    render(<SpeechInput />)

    expect(screen.getByText('LiveTranscriptionInfo')).toBeTruthy()
    expect(screen.getByText('OpenAIAPIKeyLabel')).toBeTruthy()
    expect(screen.getByText('InitialSpeechTimeout')).toBeTruthy()
    expect(screen.getByText('NoSpeechTimeout')).toBeTruthy()
    expect(screen.getByTestId('show-silence-progress-bar-toggle')).toBeTruthy()
    expect(screen.queryByTestId('continuous-mic-listening-toggle')).toBeNull()
  })
})
