import { useTranslation } from 'react-i18next'
import Image from 'next/image'

import settingsStore from '@/features/stores/settings'
import {
  VoiceEngineSelector,
  KoeiromapSettings,
  VoicevoxSettings,
  GoogleTTSSettings,
  StyleBertVITS2Settings,
  AivisSpeechSettings,
  AivisCloudApiSettings,
  GsviTtsSettings,
  ElevenLabsSettings,
  CartesiaSettings,
  OpenAITTSSettings,
  AzureTTSSettings,
  TestVoiceSection,
} from './voice/index'

const Voice = () => {
  const koeiromapKey = settingsStore((s) => s.koeiromapKey)
  const elevenlabsApiKey = settingsStore((s) => s.elevenlabsApiKey)
  const cartesiaApiKey = settingsStore((s) => s.cartesiaApiKey)

  const liveMode = settingsStore((s) => s.liveMode)
  const realtimeAPIMode = settingsStore((s) => s.realtimeAPIMode)
  const audioMode = settingsStore((s) => s.audioMode)

  const selectVoice = settingsStore((s) => s.selectVoice)
  const koeiroParam = settingsStore((s) => s.koeiroParam)
  const googleTtsType = settingsStore((s) => s.googleTtsType)
  const voicevoxSpeaker = settingsStore((s) => s.voicevoxSpeaker)
  const voicevoxSpeed = settingsStore((s) => s.voicevoxSpeed)
  const voicevoxPitch = settingsStore((s) => s.voicevoxPitch)
  const voicevoxIntonation = settingsStore((s) => s.voicevoxIntonation)
  const voicevoxServerUrl = settingsStore((s) => s.voicevoxServerUrl)
  const aivisSpeechSpeaker = settingsStore((s) => s.aivisSpeechSpeaker)
  const aivisSpeechSpeed = settingsStore((s) => s.aivisSpeechSpeed)
  const aivisSpeechPitch = settingsStore((s) => s.aivisSpeechPitch)
  const aivisSpeechIntonationScale = settingsStore(
    (s) => s.aivisSpeechIntonationScale
  )
  const aivisSpeechServerUrl = settingsStore((s) => s.aivisSpeechServerUrl)
  const aivisSpeechTempoDynamics = settingsStore(
    (s) => s.aivisSpeechTempoDynamics
  )
  const aivisSpeechPrePhonemeLength = settingsStore(
    (s) => s.aivisSpeechPrePhonemeLength
  )
  const aivisSpeechPostPhonemeLength = settingsStore(
    (s) => s.aivisSpeechPostPhonemeLength
  )
  const aivisCloudApiKey = settingsStore((s) => s.aivisCloudApiKey)
  const aivisCloudModelUuid = settingsStore((s) => s.aivisCloudModelUuid)
  const aivisCloudStyleId = settingsStore((s) => s.aivisCloudStyleId)
  const aivisCloudStyleName = settingsStore((s) => s.aivisCloudStyleName)
  const aivisCloudUseStyleName = settingsStore((s) => s.aivisCloudUseStyleName)
  const aivisCloudSpeed = settingsStore((s) => s.aivisCloudSpeed)
  const aivisCloudPitch = settingsStore((s) => s.aivisCloudPitch)
  const aivisCloudIntonationScale = settingsStore(
    (s) => s.aivisCloudIntonationScale
  )
  const aivisCloudTempoDynamics = settingsStore(
    (s) => s.aivisCloudTempoDynamics
  )
  const aivisCloudPrePhonemeLength = settingsStore(
    (s) => s.aivisCloudPrePhonemeLength
  )
  const aivisCloudPostPhonemeLength = settingsStore(
    (s) => s.aivisCloudPostPhonemeLength
  )
  const stylebertvits2ServerUrl = settingsStore(
    (s) => s.stylebertvits2ServerUrl
  )
  const stylebertvits2ApiKey = settingsStore((s) => s.stylebertvits2ApiKey)
  const stylebertvits2ModelId = settingsStore((s) => s.stylebertvits2ModelId)
  const stylebertvits2Style = settingsStore((s) => s.stylebertvits2Style)
  const stylebertvits2SdpRatio = settingsStore((s) => s.stylebertvits2SdpRatio)
  const stylebertvits2Length = settingsStore((s) => s.stylebertvits2Length)
  const gsviTtsServerUrl = settingsStore((s) => s.gsviTtsServerUrl)
  const gsviTtsModelId = settingsStore((s) => s.gsviTtsModelId)
  const gsviTtsBatchSize = settingsStore((s) => s.gsviTtsBatchSize)
  const gsviTtsSpeechRate = settingsStore((s) => s.gsviTtsSpeechRate)
  const elevenlabsVoiceId = settingsStore((s) => s.elevenlabsVoiceId)
  const cartesiaVoiceId = settingsStore((s) => s.cartesiaVoiceId)
  const openaiAPIKey = settingsStore((s) => s.openaiKey)
  const openaiTTSVoice = settingsStore((s) => s.openaiTTSVoice)
  const openaiTTSModel = settingsStore((s) => s.openaiTTSModel)
  const openaiTTSSpeed = settingsStore((s) => s.openaiTTSSpeed)
  const azureTTSKey = settingsStore((s) => s.azureTTSKey)
  const azureTTSEndpoint = settingsStore((s) => s.azureTTSEndpoint)
  const { t } = useTranslation()

  if (liveMode) return <p>{t('Live.SettingsHint')}</p>

  // 追加: realtimeAPIMode または audioMode が true の場合にメッセージを表示
  if (realtimeAPIMode || audioMode) {
    return (
      <div className="text-center text-xl whitespace-pre-line">
        {t('CannotUseVoice')}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Image
          src="/images/setting-icons/voice-settings.svg"
          alt="Voice Settings"
          width={24}
          height={24}
          className="mr-2"
        />
        <h2 className="text-2xl font-bold">{t('VoiceSettings')}</h2>
      </div>
      <VoiceEngineSelector selectVoice={selectVoice} />

      <div className="border-t border-gray-300 pt-6 my-6">
        <div className="mb-4 text-xl font-bold">{t('VoiceAdjustment')}</div>
        {(() => {
          if (selectVoice === 'koeiromap') {
            return (
              <KoeiromapSettings
                koeiromapKey={koeiromapKey}
                koeiroParam={koeiroParam}
              />
            )
          } else if (selectVoice === 'voicevox') {
            return (
              <VoicevoxSettings
                selectVoice={selectVoice}
                voicevoxServerUrl={voicevoxServerUrl}
                voicevoxSpeaker={voicevoxSpeaker}
                voicevoxSpeed={voicevoxSpeed}
                voicevoxPitch={voicevoxPitch}
                voicevoxIntonation={voicevoxIntonation}
              />
            )
          } else if (selectVoice === 'google') {
            return <GoogleTTSSettings googleTtsType={googleTtsType} />
          } else if (selectVoice === 'stylebertvits2') {
            return (
              <StyleBertVITS2Settings
                stylebertvits2ServerUrl={stylebertvits2ServerUrl}
                stylebertvits2ApiKey={stylebertvits2ApiKey}
                stylebertvits2ModelId={stylebertvits2ModelId}
                stylebertvits2Style={stylebertvits2Style}
                stylebertvits2SdpRatio={stylebertvits2SdpRatio}
                stylebertvits2Length={stylebertvits2Length}
              />
            )
          } else if (selectVoice === 'aivis_speech') {
            return (
              <AivisSpeechSettings
                selectVoice={selectVoice}
                aivisSpeechServerUrl={aivisSpeechServerUrl}
                aivisSpeechSpeaker={aivisSpeechSpeaker}
                aivisSpeechSpeed={aivisSpeechSpeed}
                aivisSpeechPitch={aivisSpeechPitch}
                aivisSpeechTempoDynamics={aivisSpeechTempoDynamics}
                aivisSpeechIntonationScale={aivisSpeechIntonationScale}
                aivisSpeechPrePhonemeLength={aivisSpeechPrePhonemeLength}
                aivisSpeechPostPhonemeLength={aivisSpeechPostPhonemeLength}
              />
            )
          } else if (selectVoice === 'aivis_cloud_api') {
            return (
              <AivisCloudApiSettings
                aivisCloudApiKey={aivisCloudApiKey}
                aivisCloudModelUuid={aivisCloudModelUuid}
                aivisCloudUseStyleName={aivisCloudUseStyleName}
                aivisCloudStyleName={aivisCloudStyleName}
                aivisCloudStyleId={aivisCloudStyleId}
                aivisCloudSpeed={aivisCloudSpeed}
                aivisCloudPitch={aivisCloudPitch}
                aivisCloudTempoDynamics={aivisCloudTempoDynamics}
                aivisCloudIntonationScale={aivisCloudIntonationScale}
                aivisCloudPrePhonemeLength={aivisCloudPrePhonemeLength}
                aivisCloudPostPhonemeLength={aivisCloudPostPhonemeLength}
              />
            )
          } else if (selectVoice === 'gsvitts') {
            return (
              <GsviTtsSettings
                gsviTtsServerUrl={gsviTtsServerUrl}
                gsviTtsModelId={gsviTtsModelId}
                gsviTtsBatchSize={gsviTtsBatchSize}
                gsviTtsSpeechRate={gsviTtsSpeechRate}
              />
            )
          } else if (selectVoice === 'elevenlabs') {
            return (
              <ElevenLabsSettings
                elevenlabsApiKey={elevenlabsApiKey}
                elevenlabsVoiceId={elevenlabsVoiceId}
              />
            )
          } else if (selectVoice === 'cartesia') {
            return (
              <CartesiaSettings
                cartesiaApiKey={cartesiaApiKey}
                cartesiaVoiceId={cartesiaVoiceId}
              />
            )
          } else if (selectVoice === 'openai') {
            return (
              <OpenAITTSSettings
                openaiAPIKey={openaiAPIKey}
                openaiTTSVoice={openaiTTSVoice}
                openaiTTSModel={openaiTTSModel}
                openaiTTSSpeed={openaiTTSSpeed}
              />
            )
          } else if (selectVoice === 'azure') {
            return (
              <AzureTTSSettings
                azureTTSKey={azureTTSKey}
                azureTTSEndpoint={azureTTSEndpoint}
                openaiTTSVoice={openaiTTSVoice}
                openaiTTSSpeed={openaiTTSSpeed}
              />
            )
          }
        })()}
      </div>

      {/* カスタムテキスト入力と統合テストボタン */}
      <TestVoiceSection selectVoice={selectVoice} />
    </div>
  )
}
export default Voice
