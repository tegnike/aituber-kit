/**
 * Voice Component Tests
 *
 * TDD: Tests for voice settings UI component demo mode behavior
 * Requirements: 4.1, 4.2, 4.3, 4.4, 7.1, 7.2
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Voice from '@/components/settings/voice'
import * as demoMode from '@/hooks/useDemoMode'

// Local server TTS options that should be disabled in demo mode
const LOCAL_TTS_OPTIONS = [
  'voicevox',
  'aivis_speech',
  'stylebertvits2',
  'gsvitts',
]

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        VoiceSettings: '合成音声設定',
        SyntheticVoiceEngineChoice: '合成音声エンジンの選択',
        VoiceEngineInstruction: '使用する合成音声エンジンを選択してください。',
        VoiceAdjustment: '声の調整',
        UsingVoiceVox: 'VOICEVOXを使用する',
        UsingKoeiromap: 'Koeiromapを使用する',
        UsingGoogleTTS: 'Google TTSを使用する',
        UsingStyleBertVITS2: 'StyleBertVITS2を使用する',
        UsingAivisSpeech: 'AivisSpeechを使用する',
        UsingAivisCloudAPI: 'Aivis Cloud APIを使用する',
        UsingGSVITTS: 'GSVITTSを使用する',
        UsingElevenLabs: 'ElevenLabsを使用する',
        UsingCartesia: 'Cartesiaを使用する',
        UsingOpenAITTS: 'OpenAI TTSを使用する',
        UsingAzureTTS: 'Azure TTSを使用する',
        UsingNijiVoice: 'にじボイスを使用する',
        DemoModeNotice: 'デモ版ではこの機能は利用できません',
        DemoModeLocalTTSNotice:
          'デモ版ではローカルサーバーを使用するTTSは利用できません',
        CannotUseVoice:
          'Realtime APIモードまたはAudio Mode中は音声設定を変更できません',
        TestVoiceSettings: '音声テスト',
        CustomVoiceTextPlaceholder: 'テストテキストを入力',
        TestSelectedVoice: '選択中のボイスをテスト',
        GoogleTTSInfo: 'Google TTSの情報',
        AuthFileInstruction: '認証ファイルの説明',
        LanguageModelURL: '言語モデルURL',
        LanguageChoice: '言語選択',
        Select: '選択してください',
      }
      return translations[key] || key
    },
  }),
}))

// Mock useDemoMode hook
jest.mock('@/hooks/useDemoMode', () => ({
  useDemoMode: jest.fn(),
}))

// Mock settingsStore
jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) => {
      const state = {
        koeiromapKey: '',
        elevenlabsApiKey: '',
        cartesiaApiKey: '',
        realtimeAPIMode: false,
        audioMode: false,
        selectVoice: 'google',
        koeiroParam: { speakerX: 0, speakerY: 0 },
        googleTtsType: 'ja-JP-Neural2-B',
        voicevoxSpeaker: '',
        voicevoxSpeed: 1.0,
        voicevoxPitch: 0,
        voicevoxIntonation: 1.0,
        voicevoxServerUrl: 'http://localhost:50021',
        aivisSpeechSpeaker: '',
        aivisSpeechSpeed: 1.0,
        aivisSpeechPitch: 0,
        aivisSpeechIntonationScale: 1.0,
        aivisSpeechServerUrl: 'http://localhost:10101',
        aivisSpeechTempoDynamics: 1.0,
        aivisSpeechPrePhonemeLength: 0.1,
        aivisSpeechPostPhonemeLength: 0.1,
        aivisCloudApiKey: '',
        aivisCloudModelUuid: '',
        aivisCloudStyleId: 0,
        aivisCloudStyleName: '',
        aivisCloudUseStyleName: false,
        aivisCloudSpeed: 1.0,
        aivisCloudPitch: 0,
        aivisCloudIntonationScale: 1.0,
        aivisCloudTempoDynamics: 1.0,
        aivisCloudPrePhonemeLength: 0.1,
        aivisCloudPostPhonemeLength: 0.1,
        stylebertvits2ServerUrl: '',
        stylebertvits2ApiKey: '',
        stylebertvits2ModelId: '',
        stylebertvits2Style: '',
        stylebertvits2SdpRatio: 0.2,
        stylebertvits2Length: 1.0,
        gsviTtsServerUrl: '',
        gsviTtsModelId: '',
        gsviTtsBatchSize: 1,
        gsviTtsSpeechRate: 1.0,
        elevenlabsVoiceId: '',
        cartesiaVoiceId: '',
        openaiKey: '',
        openaiTTSVoice: 'alloy',
        openaiTTSModel: 'tts-1',
        openaiTTSSpeed: 1.0,
        azureTTSKey: '',
        azureTTSEndpoint: '',
        nijivoiceApiKey: '',
        nijivoiceActorId: '',
        nijivoiceSpeed: 1.0,
        nijivoiceEmotionalLevel: 0,
        nijivoiceSoundDuration: 0,
      }
      return selector ? selector(state) : state
    }),
    {
      setState: jest.fn(),
    }
  ),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))

// Mock speakCharacter
jest.mock('@/features/messages/speakCharacter', () => ({
  testVoice: jest.fn(),
}))

// Mock aiModels
jest.mock('@/features/constants/aiModels', () => ({
  getOpenAITTSModels: jest.fn().mockReturnValue(['tts-1', 'tts-1-hd']),
}))

const mockUseDemoMode = demoMode.useDemoMode as jest.MockedFunction<
  typeof demoMode.useDemoMode
>

describe('Voice Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDemoMode.mockReturnValue({ isDemoMode: false })
  })

  describe('normal mode rendering', () => {
    it('should render voice settings with all options enabled', () => {
      render(<Voice />)
      expect(screen.getByText('合成音声設定')).toBeInTheDocument()
    })

    it('should have all TTS options enabled in normal mode', () => {
      render(<Voice />)
      const select = screen.getByRole('combobox')
      expect(select).not.toBeDisabled()

      // Check that local TTS options exist and are not disabled
      const options = select.querySelectorAll('option')
      LOCAL_TTS_OPTIONS.forEach((optionValue) => {
        const option = Array.from(options).find(
          (opt) => opt.value === optionValue
        )
        expect(option).toBeDefined()
        expect(option).not.toBeDisabled()
      })
    })

    it('should not show demo mode notice for local TTS in normal mode', () => {
      render(<Voice />)
      expect(
        screen.queryByText(
          'デモ版ではローカルサーバーを使用するTTSは利用できません'
        )
      ).not.toBeInTheDocument()
    })
  })

  describe('demo mode rendering', () => {
    beforeEach(() => {
      mockUseDemoMode.mockReturnValue({ isDemoMode: true })
    })

    it('should disable local server TTS options in demo mode', () => {
      render(<Voice />)
      const select = screen.getByRole('combobox')
      const options = select.querySelectorAll('option')

      LOCAL_TTS_OPTIONS.forEach((optionValue) => {
        const option = Array.from(options).find(
          (opt) => opt.value === optionValue
        )
        expect(option).toBeDisabled()
      })
    })

    it('should keep cloud TTS options enabled in demo mode', () => {
      render(<Voice />)
      const select = screen.getByRole('combobox')
      const options = select.querySelectorAll('option')

      const cloudOptions = [
        'google',
        'elevenlabs',
        'openai',
        'azure',
        'nijivoice',
        'koeiromap',
        'cartesia',
        'aivis_cloud_api',
      ]
      cloudOptions.forEach((optionValue) => {
        const option = Array.from(options).find(
          (opt) => opt.value === optionValue
        )
        if (option) {
          expect(option).not.toBeDisabled()
        }
      })
    })

    it('should show demo mode notice for local TTS options in demo mode', () => {
      render(<Voice />)
      expect(
        screen.getByText(
          'デモ版ではローカルサーバーを使用するTTSは利用できません'
        )
      ).toBeInTheDocument()
    })
  })
})
