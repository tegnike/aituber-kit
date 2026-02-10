/**
 * Voice Settings Component Tests
 *
 * 音声設定コンポーネントのテスト
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Voice from '@/components/settings/voice'
import settingsStore from '@/features/stores/settings'

// Mock stores
jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), {
    setState: jest.fn(),
    getState: jest.fn(() => ({})),
  }),
}))

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))

// Mock Link
jest.mock('@/components/link', () => ({
  Link: ({ url, label }: any) => <a href={url}>{label}</a>,
}))

// Mock TextButton
jest.mock('@/components/textButton', () => ({
  TextButton: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))

// Mock speakCharacter
jest.mock('@/features/messages/speakCharacter', () => ({
  testVoice: jest.fn(),
}))

// Mock aiModels
jest.mock('@/features/constants/aiModels', () => ({
  getOpenAITTSModels: jest.fn(() => ['tts-1', 'tts-1-hd']),
}))

const mockSettingsStore = settingsStore as jest.MockedFunction<
  typeof settingsStore
>

const defaultVoiceState = {
  koeiromapKey: '',
  elevenlabsApiKey: '',
  cartesiaApiKey: '',
  realtimeAPIMode: false,
  audioMode: false,
  selectVoice: 'voicevox' as const,
  koeiroParam: { speakerX: 0, speakerY: 0 },
  googleTtsType: '',
  voicevoxSpeaker: '46',
  voicevoxSpeed: 1.0,
  voicevoxPitch: 0.0,
  voicevoxIntonation: 1.0,
  voicevoxServerUrl: '',
  aivisSpeechSpeaker: '',
  aivisSpeechSpeed: 1.0,
  aivisSpeechPitch: 0.0,
  aivisSpeechIntonationScale: 1.0,
  aivisSpeechServerUrl: '',
  aivisSpeechTempoDynamics: 1.0,
  aivisSpeechPrePhonemeLength: 0.1,
  aivisSpeechPostPhonemeLength: 0.1,
  aivisCloudApiKey: '',
  aivisCloudModelUuid: '',
  aivisCloudStyleId: 0,
  aivisCloudStyleName: '',
  aivisCloudUseStyleName: false,
  aivisCloudSpeed: 1.0,
  aivisCloudPitch: 0.0,
  aivisCloudIntonationScale: 1.0,
  aivisCloudTempoDynamics: 1.0,
  aivisCloudPrePhonemeLength: 0.1,
  aivisCloudPostPhonemeLength: 0.1,
  stylebertvits2ServerUrl: '',
  stylebertvits2ApiKey: '',
  stylebertvits2ModelId: '0',
  stylebertvits2Style: 'Neutral',
  stylebertvits2SdpRatio: 0.2,
  stylebertvits2Length: 1.0,
  gsviTtsServerUrl: '',
  gsviTtsModelId: '0',
  gsviTtsBatchSize: 2,
  gsviTtsSpeechRate: 1.0,
  elevenlabsVoiceId: '',
  cartesiaVoiceId: '',
  openaiKey: '',
  openaiTTSVoice: 'shimmer' as const,
  openaiTTSModel: 'tts-1' as const,
  openaiTTSSpeed: 1.0,
  azureTTSKey: '',
  azureTTSEndpoint: '',
}

describe('Voice Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockSettingsStore.mockImplementation((selector) => {
      return selector(defaultVoiceState as any)
    })
  })

  describe('engine selection', () => {
    it('should render voice engine selection dropdown', () => {
      render(<Voice />)

      expect(screen.getByText('SyntheticVoiceEngineChoice')).toBeTruthy()
      const select = screen.getByDisplayValue('UsingVoiceVox')
      expect(select).toBeTruthy()
    })

    it('should show all voice engine options', () => {
      render(<Voice />)

      expect(screen.getByText('UsingVoiceVox')).toBeTruthy()
      expect(screen.getByText('UsingKoeiromap')).toBeTruthy()
      expect(screen.getByText('UsingGoogleTTS')).toBeTruthy()
      expect(screen.getByText('UsingStyleBertVITS2')).toBeTruthy()
      expect(screen.getByText('UsingAivisSpeech')).toBeTruthy()
      expect(screen.getByText('UsingElevenLabs')).toBeTruthy()
      expect(screen.getByText('UsingOpenAITTS')).toBeTruthy()
    })
  })

  describe('realtime API mode', () => {
    it('should show message when realtimeAPIMode is enabled', () => {
      mockSettingsStore.mockImplementation((selector) => {
        return selector({ ...defaultVoiceState, realtimeAPIMode: true } as any)
      })

      render(<Voice />)
      expect(screen.getByText('CannotUseVoice')).toBeTruthy()
    })

    it('should show message when audioMode is enabled', () => {
      mockSettingsStore.mockImplementation((selector) => {
        return selector({ ...defaultVoiceState, audioMode: true } as any)
      })

      render(<Voice />)
      expect(screen.getByText('CannotUseVoice')).toBeTruthy()
    })
  })

  describe('voicevox settings', () => {
    it('should render VOICEVOX settings when voicevox is selected', () => {
      render(<Voice />)

      expect(screen.getByText('VoicevoxServerUrl')).toBeTruthy()
      expect(screen.getByText('SpeakerSelection')).toBeTruthy()
    })
  })

  describe('test voice section', () => {
    it('should render test voice section', () => {
      render(<Voice />)

      expect(screen.getByText('TestVoiceSettings')).toBeTruthy()
    })

    it('should disable test button when no custom text', () => {
      render(<Voice />)

      const testButton = screen.getByText('TestSelectedVoice')
      expect(testButton).toBeDisabled()
    })
  })
})
