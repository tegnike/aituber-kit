import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextButton } from '@/components/textButton'
import { settingsControlClass } from '@/components/settings/formStyles'
import {
  listFeaturedLivLivModels,
  listHostedLivLivModels,
  listLocalLivLivModels,
  reportLivLivModelError,
  selectLocalLivLivFile,
  useLocalLivLivRevision,
  type LivLivModelEntry,
} from '@/features/livliv/models'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import { logger } from '@/lib/logger'

export function LivLivModelSettings() {
  const { t } = useTranslation()
  const selectedPath = settingsStore((s) => s.selectedLivlivPath)
  const revision = useLocalLivLivRevision()
  const [hosted, setHosted] = useState<LivLivModelEntry[]>([])
  const [local, setLocal] = useState<LivLivModelEntry[]>([])
  const [featured, setFeatured] = useState<LivLivModelEntry[]>([])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    void listHostedLivLivModels(signal)
      .then((models) => {
        if (!signal.aborted) setHosted(models)
      })
      .catch((error) => {
        if (!signal.aborted) reportLivLivModelError('ListError', error)
      })
    // 精選キャラクターは任意。オフラインなどで読めなくても一覧から外すだけにする。
    void listFeaturedLivLivModels(signal)
      .then((models) => {
        if (!signal.aborted) setFeatured(models)
      })
      .catch((error) => {
        if (!signal.aborted) logger.warn('LivLiv featured list:', error)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    let cancelled = false
    void listLocalLivLivModels()
      .then((models) => {
        if (!cancelled) setLocal(models)
      })
      .catch((error) => {
        if (!cancelled) reportLivLivModelError('ListError', error)
      })
    return () => {
      cancelled = true
    }
  }, [revision])

  const models = [...hosted, ...local].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  return (
    <>
      <select
        aria-label="LivLiv"
        className={`${settingsControlClass.medium} mb-2`}
        value={selectedPath}
        onChange={(event) => {
          settingsStore.setState({ selectedLivlivPath: event.target.value })
        }}
      >
        <option value="">{t('LivLiv.ChooseModel')}</option>
        {models.map(({ path, name }) => (
          <option key={path} value={path}>
            {name}
          </option>
        ))}
        {featured.length > 0 && (
          <optgroup label={t('LivLiv.Characters')}>
            {featured.map(({ path, name }) => (
              <option key={path} value={path}>
                {name}
              </option>
            ))}
          </optgroup>
        )}
        {selectedPath &&
          ![...models, ...featured].some(
            ({ path }) => path === selectedPath
          ) && <option value={selectedPath}>{selectedPath}</option>}
      </select>
      <div className="my-2 flex flex-wrap items-center gap-3">
        <TextButton
          onClick={() => {
            const { fileInput } = menuStore.getState()
            if (!fileInput) return
            fileInput.accept = '.livliv'
            fileInput.onchange = () => {
              const file = fileInput.files?.[0]
              if (file) void selectLocalLivLivFile(file)
              fileInput.value = ''
            }
            fileInput.click()
          }}
        >
          {t('LivLiv.OpenModel')}
        </TextButton>
        <a
          href="https://github.com/livliv-dev/player#featured-characters"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          {t('LivLiv.Characters')}
        </a>
      </div>
      <p className="my-2 whitespace-pre-wrap text-sm">{t('LivLiv.FileInfo')}</p>

      {/* 位置・サイズリセットボタン */}
      <div className="my-6">
        <div className="font-bold mb-2">{t('LivLiv.PositionSize')}</div>
        <div className="text-sm text-gray-600 mb-4">
          {t('LivLiv.PositionInfo')}
        </div>
        <TextButton
          onClick={() => {
            settingsStore.setState({
              livlivScale: 1.0,
              livlivOffsetX: 0,
              livlivOffsetY: 0,
            })
          }}
        >
          {t('LivLiv.ResetPosition')}
        </TextButton>
      </div>
    </>
  )
}
