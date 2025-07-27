import { useTranslation } from 'react-i18next'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

import {
  PRESET_A,
  PRESET_B,
  PRESET_C,
  PRESET_D,
} from '@/features/constants/koeiroParam'
import {
  AIVoice,
  OpenAITTSVoice,
  OpenAITTSModel,
} from '@/features/constants/settings'
import { getOpenAITTSModels } from '@/features/constants/aiModels'
import { testVoice } from '@/features/messages/speakCharacter'
import settingsStore from '@/features/stores/settings'
import { Link } from '../link'
import { TextButton } from '../textButton'
import speakers from '../speakers.json'
// import speakers_aivis from '../speakers_aivis.json'

const Voice = () => {
  const koeiromapKey = settingsStore((s) => s.koeiromapKey)
  const elevenlabsApiKey = settingsStore((s) => s.elevenlabsApiKey)
  const cartesiaApiKey = settingsStore((s) => s.cartesiaApiKey)

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
  const nijivoiceApiKey = settingsStore((s) => s.nijivoiceApiKey)
  const nijivoiceActorId = settingsStore((s) => s.nijivoiceActorId)
  const nijivoiceSpeed = settingsStore((s) => s.nijivoiceSpeed)
  const nijivoiceEmotionalLevel = settingsStore(
    (s) => s.nijivoiceEmotionalLevel
  )
  const nijivoiceSoundDuration = settingsStore((s) => s.nijivoiceSoundDuration)

  const { t } = useTranslation()
  const [nijivoiceSpeakers, setNijivoiceSpeakers] = useState<Array<any>>([])
  const [prevNijivoiceActorId, setPrevNijivoiceActorId] = useState<string>('')
  const [speakers_aivis, setSpeakers_aivis] = useState<Array<any>>([])
  const [customVoiceText, setCustomVoiceText] = useState<string>('')
  const [isUpdatingSpeakers, setIsUpdatingSpeakers] = useState<boolean>(false)
  const [speakersUpdateError, setSpeakersUpdateError] = useState<string>('')

  // にじボイスの話者一覧を取得する関数
  const fetchNijivoiceSpeakers = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/get-nijivoice-actors?apiKey=${nijivoiceApiKey}`
      )
      const data = await response.json()
      if (data.voiceActors) {
        const sortedActors = data.voiceActors.sort(
          (a: any, b: any) => a.id - b.id
        )
        setNijivoiceSpeakers(sortedActors)
      }
    } catch (error) {
      console.error('Failed to fetch nijivoice speakers:', error)
    }
  }, [nijivoiceApiKey])

  // AIVISの話者一覧を取得する関数
  const fetchAivisSpeakers = async () => {
    try {
      const response = await fetch('/speakers_aivis.json')
      const data = await response.json()
      setSpeakers_aivis(data)
    } catch (error) {
      console.error('Failed to fetch AIVIS speakers:', error)
    }
  }

  // コンポーネントマウント時またはにじボイス選択時に話者一覧を取得
  useEffect(() => {
    if (selectVoice === 'nijivoice') {
      fetchNijivoiceSpeakers()
    }
  }, [selectVoice, nijivoiceApiKey, fetchNijivoiceSpeakers])

  // コンポーネントマウント時またはAIVIS選択時に話者一覧を取得
  useEffect(() => {
    if (selectVoice === 'aivis_speech') {
      fetchAivisSpeakers()
    }
  }, [selectVoice])

  // nijivoiceActorIdが変更された時にrecommendedVoiceSpeedを設定する処理を追加
  useEffect(() => {
    if (
      selectVoice === 'nijivoice' &&
      nijivoiceActorId &&
      nijivoiceActorId !== prevNijivoiceActorId
    ) {
      // 現在選択されていキャラクターを探す
      const selectedActor = nijivoiceSpeakers.find(
        (actor) => actor.id === nijivoiceActorId
      )

      // キャラクターが見つかり、recommendedVoiceSpeedが設定されている場合
      if (selectedActor?.recommendedVoiceSpeed) {
        settingsStore.setState({
          nijivoiceSpeed: selectedActor.recommendedVoiceSpeed,
        })
      }

      // 前回の選択を更新
      setPrevNijivoiceActorId(nijivoiceActorId)
    }
  }, [nijivoiceActorId, nijivoiceSpeakers, prevNijivoiceActorId, selectVoice])

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
      <div className="mb-4 text-xl font-bold">
        {t('SyntheticVoiceEngineChoice')}
      </div>
      <div>{t('VoiceEngineInstruction')}</div>
      <div className="my-2">
        <select
          value={selectVoice}
          onChange={(e) =>
            settingsStore.setState({ selectVoice: e.target.value as AIVoice })
          }
          className="px-4 py-2 bg-white hover:bg-white-hover rounded-lg"
        >
          <option value="voicevox">{t('UsingVoiceVox')}</option>
          <option value="koeiromap">{t('UsingKoeiromap')}</option>
          <option value="google">{t('UsingGoogleTTS')}</option>
          <option value="stylebertvits2">{t('UsingStyleBertVITS2')}</option>
          <option value="aivis_speech">{t('UsingAivisSpeech')}</option>
          <option value="aivis_cloud_api">{t('UsingAivisCloudAPI')}</option>
          <option value="gsvitts">{t('UsingGSVITTS')}</option>
          <option value="elevenlabs">{t('UsingElevenLabs')}</option>
          <option value="cartesia">{t('UsingCartesia')}</option>
          <option value="openai">{t('UsingOpenAITTS')}</option>
          <option value="azure">{t('UsingAzureTTS')}</option>
          <option value="nijivoice">{t('UsingNijiVoice')}</option>
        </select>
      </div>

      <div className="mt-10">
        <div className="mb-4 text-xl font-bold">{t('VoiceAdjustment')}</div>
        {(() => {
          if (selectVoice === 'koeiromap') {
            return (
              <>
                <div>
                  {t('KoeiromapInfo')}
                  <br />
                  <Link
                    url="https://koemotion.rinna.co.jp"
                    label="https://koemotion.rinna.co.jp"
                  />
                </div>
                <div className="mt-4 font-bold">{t('APIKey')}</div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="..."
                    value={koeiromapKey}
                    onChange={(e) =>
                      settingsStore.setState({ koeiromapKey: e.target.value })
                    }
                  />
                </div>

                <div className="mt-4 font-bold">{t('Preset')}</div>
                <div className="my-2 grid grid-cols-2 gap-[8px]">
                  <TextButton
                    onClick={() =>
                      settingsStore.setState({
                        koeiroParam: {
                          speakerX: PRESET_A.speakerX,
                          speakerY: PRESET_A.speakerY,
                        },
                      })
                    }
                  >
                    {t('Cute')}
                  </TextButton>
                  <TextButton
                    onClick={() =>
                      settingsStore.setState({
                        koeiroParam: {
                          speakerX: PRESET_B.speakerX,
                          speakerY: PRESET_B.speakerY,
                        },
                      })
                    }
                  >
                    {t('Energetic')}
                  </TextButton>
                  <TextButton
                    onClick={() =>
                      settingsStore.setState({
                        koeiroParam: {
                          speakerX: PRESET_C.speakerX,
                          speakerY: PRESET_C.speakerY,
                        },
                      })
                    }
                  >
                    {t('Cool')}
                  </TextButton>
                  <TextButton
                    onClick={() =>
                      settingsStore.setState({
                        koeiroParam: {
                          speakerX: PRESET_D.speakerX,
                          speakerY: PRESET_D.speakerY,
                        },
                      })
                    }
                  >
                    {t('Mature')}
                  </TextButton>
                </div>
                <div className="mt-6">
                  <div className="select-none">x : {koeiroParam.speakerX}</div>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    step={0.001}
                    value={koeiroParam.speakerX}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        koeiroParam: {
                          speakerX: Number(e.target.value),
                          speakerY: koeiroParam.speakerY,
                        },
                      })
                    }}
                  ></input>
                  <div className="select-none">y : {koeiroParam.speakerY}</div>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    step={0.001}
                    value={koeiroParam.speakerY}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        koeiroParam: {
                          speakerX: koeiroParam.speakerX,
                          speakerY: Number(e.target.value),
                        },
                      })
                    }}
                  ></input>
                </div>
              </>
            )
          } else if (selectVoice === 'voicevox') {
            return (
              <>
                <div>
                  {t('VoiceVoxInfo')}
                  <br />
                  <Link
                    url="https://voicevox.hiroshiba.jp/"
                    label="https://voicevox.hiroshiba.jp/"
                  />
                </div>
                <div className="mt-4 font-bold">{t('VoicevoxServerUrl')}</div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="http://localhost:50021"
                    value={voicevoxServerUrl}
                    onChange={(e) =>
                      settingsStore.setState({
                        voicevoxServerUrl: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-4 font-bold">{t('SpeakerSelection')}</div>
                <div className="flex items-center">
                  <select
                    value={voicevoxSpeaker}
                    onChange={(e) =>
                      settingsStore.setState({
                        voicevoxSpeaker: e.target.value,
                      })
                    }
                    className="px-4 py-2 bg-white hover:bg-white-hover rounded-lg"
                  >
                    <option value="">{t('Select')}</option>
                    {speakers.map((speaker) => (
                      <option key={speaker.id} value={speaker.id}>
                        {speaker.speaker}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-6 font-bold">
                  <div className="select-none">
                    {t('VoicevoxSpeed')}: {voicevoxSpeed}
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.01}
                    value={voicevoxSpeed}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        voicevoxSpeed: Number(e.target.value),
                      })
                    }}
                  ></input>
                  <div className="select-none">
                    {t('VoicevoxPitch')}: {voicevoxPitch}
                  </div>
                  <input
                    type="range"
                    min={-0.15}
                    max={0.15}
                    step={0.01}
                    value={voicevoxPitch}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        voicevoxPitch: Number(e.target.value),
                      })
                    }}
                  ></input>
                  <div className="select-none">
                    {t('VoicevoxIntonation')}: {voicevoxIntonation}
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={2.0}
                    step={0.01}
                    value={voicevoxIntonation}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        voicevoxIntonation: Number(e.target.value),
                      })
                    }}
                  ></input>
                </div>
              </>
            )
          } else if (selectVoice === 'google') {
            return (
              <>
                <div>
                  {t('GoogleTTSInfo')}
                  {t('AuthFileInstruction')}
                  <br />
                  <Link
                    url="https://developers.google.com/workspace/guides/create-credentials?#create_credentials_for_a_service_account"
                    label="https://developers.google.com/workspace/guides/create-credentials?#create_credentials_for_a_service_account"
                  />
                  <br />
                  <br />
                  {t('LanguageModelURL')}
                  <br />
                  <Link
                    url="https://cloud.google.com/text-to-speech/docs/voices"
                    label="https://cloud.google.com/text-to-speech/docs/voices"
                  />
                </div>
                <div className="mt-4 font-bold">{t('LanguageChoice')}</div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="..."
                    value={googleTtsType}
                    onChange={(e) =>
                      settingsStore.setState({ googleTtsType: e.target.value })
                    }
                  />
                </div>
              </>
            )
          } else if (selectVoice === 'stylebertvits2') {
            return (
              <>
                <div>
                  {t('StyleBertVITS2Info')}
                  <br />
                  <Link
                    url="https://github.com/litagin02/Style-Bert-VITS2"
                    label="https://github.com/litagin02/Style-Bert-VITS2"
                  />
                  <br />
                  <br />
                </div>
                <div className="mt-4 font-bold">
                  {t('StyleBeatVITS2ServerURL')}
                </div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="..."
                    value={stylebertvits2ServerUrl}
                    onChange={(e) =>
                      settingsStore.setState({
                        stylebertvits2ServerUrl: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-4 font-bold">
                  {t('StyleBeatVITS2ApiKey')}
                </div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="..."
                    value={stylebertvits2ApiKey}
                    onChange={(e) =>
                      settingsStore.setState({
                        stylebertvits2ApiKey: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-4 font-bold">
                  {t('StyleBeatVITS2ModelID')}
                </div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="number"
                    placeholder="..."
                    value={stylebertvits2ModelId}
                    onChange={(e) =>
                      settingsStore.setState({
                        stylebertvits2ModelId: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-4 font-bold">{t('StyleBeatVITS2Style')}</div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="..."
                    value={stylebertvits2Style}
                    onChange={(e) =>
                      settingsStore.setState({
                        stylebertvits2Style: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-4 font-bold">
                  {t('StyleBeatVITS2SdpRatio')}: {stylebertvits2SdpRatio}
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={1.0}
                  step={0.01}
                  value={stylebertvits2SdpRatio}
                  className="mt-2 mb-4 input-range"
                  onChange={(e) => {
                    settingsStore.setState({
                      stylebertvits2SdpRatio: Number(e.target.value),
                    })
                  }}
                ></input>
                <div className="mt-4 font-bold">
                  {t('StyleBeatVITS2Length')}: {stylebertvits2Length}
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={2.0}
                  step={0.01}
                  value={stylebertvits2Length}
                  className="mt-2 mb-4 input-range"
                  onChange={(e) => {
                    settingsStore.setState({
                      stylebertvits2Length: Number(e.target.value),
                    })
                  }}
                ></input>
              </>
            )
          } else if (selectVoice === 'aivis_speech') {
            return (
              <>
                <div>
                  {t('AivisSpeechInfo')}
                  <br />
                  <Link
                    url="https://aivis-project.com/"
                    label="https://aivis-project.com/"
                  />
                </div>
                <div className="mt-4 font-bold">
                  {t('AivisSpeechServerUrl')}
                </div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="http://localhost:10101"
                    value={aivisSpeechServerUrl}
                    onChange={(e) =>
                      settingsStore.setState({
                        aivisSpeechServerUrl: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-4 font-bold">{t('AivisSpeechSpeaker')}</div>
                <div className="space-y-3">
                  <select
                    value={aivisSpeechSpeaker}
                    onChange={(e) =>
                      settingsStore.setState({
                        aivisSpeechSpeaker: e.target.value,
                      })
                    }
                    className="px-4 py-2 bg-white hover:bg-white-hover rounded-lg"
                  >
                    <option value="">{t('Select')}</option>
                    {speakers_aivis.map((speaker) => (
                      <option key={speaker.id} value={speaker.id}>
                        {speaker.speaker}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={async () => {
                      setIsUpdatingSpeakers(true)
                      setSpeakersUpdateError('')
                      try {
                        const response = await fetch(
                          '/api/update-aivis-speakers?serverUrl=' +
                            aivisSpeechServerUrl
                        )
                        if (response.ok) {
                          const updatedSpeakersResponse = await fetch(
                            '/speakers_aivis.json'
                          )
                          const updatedSpeakers =
                            await updatedSpeakersResponse.json()
                          setSpeakers_aivis(updatedSpeakers)
                        } else {
                          setSpeakersUpdateError(
                            '話者リストの更新に失敗しました'
                          )
                        }
                      } catch (error) {
                        setSpeakersUpdateError(
                          'ネットワークエラーが発生しました'
                        )
                      } finally {
                        setIsUpdatingSpeakers(false)
                      }
                    }}
                    disabled={isUpdatingSpeakers}
                    className="w-full px-4 py-2 text-sm font-medium text-theme bg-primary hover:bg-primary-hover active:bg-primary-press rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {isUpdatingSpeakers ? '更新中...' : t('UpdateSpeakerList')}
                  </button>
                  {speakersUpdateError && (
                    <div className="mt-2 text-red-600 text-sm">
                      {speakersUpdateError}
                    </div>
                  )}
                </div>
                <div className="mt-6 font-bold">
                  <div className="select-none">
                    {t('SpeechSpeed')}: {aivisSpeechSpeed}
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.01}
                    value={aivisSpeechSpeed}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        aivisSpeechSpeed: Number(e.target.value),
                      })
                    }}
                  />
                  <div className="select-none">
                    {t('Pitch')}: {aivisSpeechPitch}
                  </div>
                  <input
                    type="range"
                    min={-0.15}
                    max={0.15}
                    step={0.01}
                    value={aivisSpeechPitch}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        aivisSpeechPitch: Number(e.target.value),
                      })
                    }}
                  />
                  <div className="select-none">
                    {t('TempoDynamics')}: {aivisSpeechTempoDynamics}
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.01}
                    value={aivisSpeechTempoDynamics}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        aivisSpeechTempoDynamics: Number(e.target.value),
                      })
                    }}
                  />
                  <div className="select-none">
                    {t('AivisSpeechIntonationScale')}:{' '}
                    {aivisSpeechIntonationScale}
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={2.0}
                    step={0.01}
                    value={aivisSpeechIntonationScale}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        aivisSpeechIntonationScale: Number(e.target.value),
                      })
                    }}
                  />
                  <div className="select-none">
                    {t('PreSilenceDuration')}:{' '}
                    {aivisSpeechPrePhonemeLength}{' '}
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.01}
                    value={aivisSpeechPrePhonemeLength}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        aivisSpeechPrePhonemeLength: Number(e.target.value),
                      })
                    }}
                  />
                  <div className="select-none">
                    {t('PostSilenceDuration')}:{' '}
                    {aivisSpeechPostPhonemeLength}{' '}
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.01}
                    value={aivisSpeechPostPhonemeLength}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        aivisSpeechPostPhonemeLength: Number(e.target.value),
                      })
                    }}
                  />
                </div>
              </>
            )
          } else if (selectVoice === 'aivis_cloud_api') {
            return (
              <>
                <div>
                  {t('AivisCloudAPIInfo')}
                  <br />
                  <Link
                    url="https://hub.aivis-project.com/cloud-api/"
                    label={t('AivisCloudAPIDashboard')}
                  />
                </div>
                <div className="mt-4 font-bold">{t('APIKey')}</div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="password"
                    placeholder="Aivis Cloud API Key"
                    value={aivisCloudApiKey}
                    onChange={(e) =>
                      settingsStore.setState({
                        aivisCloudApiKey: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-4 font-bold">{t('ModelUUID')}</div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="a59cb814-..."
                    value={aivisCloudModelUuid}
                    onChange={(e) =>
                      settingsStore.setState({
                        aivisCloudModelUuid: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <label className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      checked={aivisCloudUseStyleName}
                      onChange={(e) =>
                        settingsStore.setState({
                          aivisCloudUseStyleName: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="font-medium">{t('UseStyleName')}</span>
                  </label>
                  <div className="text-sm text-gray-600 mb-4">
                    {t('StyleSelectionDescription')}
                  </div>

                  {aivisCloudUseStyleName ? (
                    <>
                      <div className="font-bold">{t('StyleName')}</div>
                      <div className="mt-2">
                        <input
                          className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                          type="text"
                          maxLength={20}
                          placeholder={t('StyleNamePlaceholder')}
                          value={aivisCloudStyleName}
                          onChange={(e) =>
                            settingsStore.setState({
                              aivisCloudStyleName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-bold">{t('StyleID')}</div>
                      <div className="mt-2">
                        <input
                          className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                          type="number"
                          min="0"
                          max="31"
                          value={aivisCloudStyleId}
                          onChange={(e) =>
                            settingsStore.setState({
                              aivisCloudStyleId: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-6 font-bold">
                  <div className="select-none">
                    {t('SpeechSpeed')}: {aivisCloudSpeed}
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.01}
                    value={aivisCloudSpeed}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        aivisCloudSpeed: Number(e.target.value),
                      })
                    }}
                  />
                  <div className="select-none">
                    {t('Pitch')}: {aivisCloudPitch}
                  </div>
                  <input
                    type="range"
                    min={-1.0}
                    max={1.0}
                    step={0.01}
                    value={aivisCloudPitch}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        aivisCloudPitch: Number(e.target.value),
                      })
                    }}
                  />
                  <div className="select-none">
                    {t('TempoDynamics')}: {aivisCloudTempoDynamics}
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.01}
                    value={aivisCloudTempoDynamics}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        aivisCloudTempoDynamics: Number(e.target.value),
                      })
                    }}
                  />
                  <div className="select-none">
                    {t('EmotionalIntensity')}: {aivisCloudIntonationScale}
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={2.0}
                    step={0.01}
                    value={aivisCloudIntonationScale}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        aivisCloudIntonationScale: Number(e.target.value),
                      })
                    }}
                  />
                  <div className="select-none">
                    {t('PreSilenceDuration')}: {aivisCloudPrePhonemeLength}{' '}
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.01}
                    value={aivisCloudPrePhonemeLength}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        aivisCloudPrePhonemeLength: Number(e.target.value),
                      })
                    }}
                  />
                  <div className="select-none">
                    {t('PostSilenceDuration')}:{' '}
                    {aivisCloudPostPhonemeLength}{' '}
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.01}
                    value={aivisCloudPostPhonemeLength}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) => {
                      settingsStore.setState({
                        aivisCloudPostPhonemeLength: Number(e.target.value),
                      })
                    }}
                  />
                </div>
              </>
            )
          } else if (selectVoice === 'gsvitts') {
            return (
              <>
                <div>{t('GSVITTSInfo')}</div>
                <div className="mt-4 font-bold">{t('GSVITTSServerUrl')}</div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="..."
                    value={gsviTtsServerUrl}
                    onChange={(e) =>
                      settingsStore.setState({
                        gsviTtsServerUrl: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-4 font-bold">{t('GSVITTSModelID')}</div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="..."
                    value={gsviTtsModelId}
                    onChange={(e) =>
                      settingsStore.setState({ gsviTtsModelId: e.target.value })
                    }
                  />
                </div>
                <div className="mt-4 font-bold">{t('GSVITTSBatchSize')}</div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="number"
                    step="1"
                    placeholder="..."
                    value={gsviTtsBatchSize}
                    onChange={(e) =>
                      settingsStore.setState({
                        gsviTtsBatchSize: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="mt-4 font-bold">{t('GSVITTSSpeechRate')}</div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="number"
                    step="0.1"
                    placeholder="..."
                    value={gsviTtsSpeechRate}
                    onChange={(e) =>
                      settingsStore.setState({
                        gsviTtsSpeechRate: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </>
            )
          } else if (selectVoice === 'elevenlabs') {
            return (
              <>
                <div>
                  {t('ElevenLabsInfo')}
                  <br />
                  <Link
                    url="https://elevenlabs.io/api"
                    label="https://elevenlabs.io/api"
                  />
                  <br />
                </div>
                <div className="mt-4 font-bold">{t('ElevenLabsApiKey')}</div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="..."
                    value={elevenlabsApiKey}
                    onChange={(e) =>
                      settingsStore.setState({
                        elevenlabsApiKey: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-4 font-bold">{t('ElevenLabsVoiceId')}</div>
                <div className="mt-2">
                  {t('ElevenLabsVoiceIdInfo')}
                  <br />
                  <Link
                    url="https://api.elevenlabs.io/v1/voices"
                    label="https://api.elevenlabs.io/v1/voices"
                  />
                  <br />
                </div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="..."
                    value={elevenlabsVoiceId}
                    onChange={(e) =>
                      settingsStore.setState({
                        elevenlabsVoiceId: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )
          } else if (selectVoice === 'cartesia') {
            return (
              <>
                <div>
                  {t('CartesiaInfo')}
                  <br />
                  <Link
                    url="https://docs.cartesia.ai/api-reference/tts/bytes"
                    label="https://docs.cartesia.ai/api-reference/tts/bytes"
                  />
                  <br />
                </div>
                <div className="mt-4 font-bold">{t('CartesiaApiKey')}</div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="..."
                    value={cartesiaApiKey}
                    onChange={(e) =>
                      settingsStore.setState({
                        cartesiaApiKey: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-4 font-bold">{t('CartesiaVoiceId')}</div>
                <div className="mt-2">
                  {t('CartesiaVoiceIdInfo')}
                  <br />
                  <Link
                    url="https://docs.cartesia.ai/api-reference/voices/list"
                    label="https://docs.cartesia.ai/api-reference/voices/list"
                  />
                  <br />
                </div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="..."
                    value={cartesiaVoiceId}
                    onChange={(e) =>
                      settingsStore.setState({
                        cartesiaVoiceId: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )
          } else if (selectVoice === 'openai') {
            return (
              <>
                <div>{t('OpenAITTSInfo')}</div>
                <div className="mt-4 font-bold">{t('OpenAIAPIKeyLabel')}</div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="..."
                    value={openaiAPIKey}
                    onChange={(e) =>
                      settingsStore.setState({
                        openaiKey: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-4 font-bold">{t('OpenAITTSVoice')}</div>
                <div className="mt-2">
                  <select
                    value={openaiTTSVoice}
                    onChange={(e) =>
                      settingsStore.setState({
                        openaiTTSVoice: e.target.value as OpenAITTSVoice,
                      })
                    }
                    className="px-4 py-2 bg-white hover:bg-white-hover rounded-lg"
                  >
                    <option value="alloy">alloy</option>
                    <option value="ash">ash</option>
                    <option value="ballad">ballad</option>
                    <option value="coral">coral</option>
                    <option value="echo">echo</option>
                    <option value="fable">fable</option>
                    <option value="onyx">onyx</option>
                    <option value="nova">nova</option>
                    <option value="sage">sage</option>
                    <option value="shimmer">shimmer</option>
                  </select>
                </div>
                <div className="mt-4 font-bold">{t('OpenAITTSModel')}</div>
                <div className="mt-2">
                  <select
                    value={openaiTTSModel}
                    onChange={(e) =>
                      settingsStore.setState({
                        openaiTTSModel: e.target.value as OpenAITTSModel,
                      })
                    }
                    className="px-4 py-2 bg-white hover:bg-white-hover rounded-lg"
                  >
                    {getOpenAITTSModels().map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 font-bold">
                  {t('OpenAITTSSpeed')}: {openaiTTSSpeed}
                </div>
                <input
                  type="range"
                  min={0.25}
                  max={4.0}
                  step={0.01}
                  value={openaiTTSSpeed}
                  className="mt-2 mb-4 input-range"
                  onChange={(e) => {
                    settingsStore.setState({
                      openaiTTSSpeed: Number(e.target.value),
                    })
                  }}
                />
              </>
            )
          } else if (selectVoice === 'azure') {
            return (
              <>
                <div>{t('AzureTTSInfo')}</div>
                <div className="mt-4 font-bold">{t('AzureAPIKeyLabel')}</div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="..."
                    value={azureTTSKey}
                    onChange={(e) =>
                      settingsStore.setState({
                        azureTTSKey: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-4 font-bold">{t('AzureEndpoint')}</div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="..."
                    value={azureTTSEndpoint}
                    onChange={(e) =>
                      settingsStore.setState({
                        azureTTSEndpoint: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-4 font-bold">{t('OpenAITTSVoice')}</div>
                <div className="mt-2">
                  <select
                    value={openaiTTSVoice}
                    onChange={(e) =>
                      settingsStore.setState({
                        openaiTTSVoice: e.target.value as OpenAITTSVoice,
                      })
                    }
                    className="px-4 py-2 bg-white hover:bg-white-hover rounded-lg"
                  >
                    <option value="alloy">alloy</option>
                    <option value="echo">echo</option>
                    <option value="fable">fable</option>
                    <option value="onyx">onyx</option>
                    <option value="nova">nova</option>
                    <option value="shimmer">shimmer</option>
                  </select>
                </div>
                <div className="mt-4 font-bold">{t('OpenAITTSModel')}</div>
                <div className="mt-4 font-bold">
                  {t('OpenAITTSSpeed')}: {openaiTTSSpeed}
                </div>
                <input
                  type="range"
                  min={0.25}
                  max={4.0}
                  step={0.01}
                  value={openaiTTSSpeed}
                  className="mt-2 mb-4 input-range"
                  onChange={(e) => {
                    settingsStore.setState({
                      openaiTTSSpeed: Number(e.target.value),
                    })
                  }}
                />
              </>
            )
          } else if (selectVoice === 'nijivoice') {
            return (
              <>
                <div>{t('NijiVoiceInfo')}</div>
                <Link
                  url="https://app.nijivoice.com/"
                  label="https://app.nijivoice.com/"
                />
                <div className="mt-4 font-bold">{t('NijiVoiceApiKey')}</div>
                <div className="mt-2">
                  <input
                    className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
                    type="text"
                    placeholder="..."
                    value={nijivoiceApiKey}
                    onChange={(e) =>
                      settingsStore.setState({
                        nijivoiceApiKey: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mt-4 font-bold">{t('NijiVoiceActorId')}</div>
                <div className="mt-2">
                  <select
                    value={nijivoiceActorId}
                    onChange={(e) => {
                      settingsStore.setState({
                        nijivoiceActorId: e.target.value,
                      })
                    }}
                    className="px-4 py-2 bg-white hover:bg-white-hover rounded-lg"
                  >
                    <option value="">{t('Select')}</option>
                    {nijivoiceSpeakers.map((actor) => (
                      <option key={actor.id} value={actor.id}>
                        {actor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 font-bold">
                  {t('NijiVoiceSpeed')}: {nijivoiceSpeed}
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={3.0}
                  step={0.1}
                  value={nijivoiceSpeed}
                  className="mt-2 mb-4 input-range"
                  onChange={(e) => {
                    settingsStore.setState({
                      nijivoiceSpeed: Number(e.target.value),
                    })
                  }}
                />
                <div className="mt-4 font-bold">
                  {t('NijiVoiceEmotionalLevel')}: {nijivoiceEmotionalLevel}
                </div>
                <input
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.1}
                  value={nijivoiceEmotionalLevel}
                  className="mt-2 mb-4 input-range"
                  onChange={(e) => {
                    settingsStore.setState({
                      nijivoiceEmotionalLevel: Number(e.target.value),
                    })
                  }}
                />
                <div className="mt-4 font-bold">
                  {t('NijiVoiceSoundDuration')}: {nijivoiceSoundDuration}
                </div>
                <input
                  type="range"
                  min={0}
                  max={1.7}
                  step={0.1}
                  value={nijivoiceSoundDuration}
                  className="mt-2 mb-4 input-range"
                  onChange={(e) => {
                    settingsStore.setState({
                      nijivoiceSoundDuration: Number(e.target.value),
                    })
                  }}
                />
              </>
            )
          }
        })()}
      </div>

      {/* カスタムテキスト入力と統合テストボタン */}
      <div className="mt-10 p-4 bg-gray-50 rounded-lg">
        <div className="mb-4 text-xl font-bold">{t('TestVoiceSettings')}</div>
        <div className="flex items-center">
          <input
            className="flex-1 px-4 py-2 bg-white hover:bg-white-hover rounded-lg"
            type="text"
            placeholder={t('CustomVoiceTextPlaceholder')}
            value={customVoiceText}
            onChange={(e) => setCustomVoiceText(e.target.value)}
          />
        </div>
        <div className="flex items-center mt-4">
          <TextButton
            onClick={() => testVoice(selectVoice, customVoiceText)}
            disabled={!customVoiceText}
          >
            {t('TestSelectedVoice')}
          </TextButton>
        </div>
      </div>
    </div>
  )
}
export default Voice
