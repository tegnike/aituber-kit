import { ChangeEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  SETTINGS_FILE_MAX_BYTES,
  SettingsFileError,
  type SettingsFileErrorCode,
  applySettingsImport,
  downloadSettingsFile,
  isEnvironmentSettingsOverrideEnabled,
  parseSettingsFile,
} from '@/features/settings/settingsFile'
import toastStore from '@/features/stores/toast'
import { TextButton } from '../textButton'
import { ToggleSwitch } from '../toggleSwitch'

const importErrorTranslationKeys: Record<SettingsFileErrorCode, string> = {
  'invalid-json': 'SettingsImportInvalidJson',
  'invalid-format': 'SettingsImportInvalidFormat',
  'unsupported-format-version': 'SettingsImportUnsupportedFormat',
  'newer-settings-version': 'SettingsImportNewerVersion',
  'unknown-setting': 'SettingsImportInvalidFormat',
  'invalid-setting-value': 'SettingsImportInvalidFormat',
  'sensitive-data-mismatch': 'SettingsImportInvalidFormat',
  'environment-override-enabled': 'SettingsImportEnvironmentOverride',
}

const SettingsBackup = () => {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [includeSecrets, setIncludeSecrets] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const environmentOverrideEnabled = isEnvironmentSettingsOverrideEnabled()

  const showToast = (message: string, type: 'success' | 'error') => {
    toastStore.getState().addToast({ message, type, duration: 4000 })
  }

  const handleExport = () => {
    if (includeSecrets && !window.confirm(t('SettingsExportSecretsConfirm'))) {
      return
    }

    try {
      downloadSettingsFile(includeSecrets)
      showToast(t('SettingsExportSuccess'), 'success')
    } catch {
      showToast(t('SettingsExportFailed'), 'error')
    }
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      if (file.size > SETTINGS_FILE_MAX_BYTES) {
        showToast(t('SettingsImportFileTooLarge'), 'error')
        return
      }

      const importData = parseSettingsFile(await file.text())
      const confirmKey = importData.secretsIncluded
        ? 'SettingsImportConfirmWithSecrets'
        : 'SettingsImportConfirmWithoutSecrets'
      if (!window.confirm(t(confirmKey, { filename: file.name }))) {
        return
      }

      applySettingsImport(importData)
      showToast(t('SettingsImportSuccess'), 'success')
      window.setTimeout(() => window.location.reload(), 300)
    } catch (error) {
      const errorKey =
        error instanceof SettingsFileError
          ? importErrorTranslationKeys[error.code]
          : undefined
      showToast(t(errorKey || 'SettingsImportFailed'), 'error')
    } finally {
      input.value = ''
      setIsImporting(false)
    }
  }

  return (
    <div className="mb-6 grid-cols-2">
      <div className="mb-4 text-xl font-bold">{t('SettingsBackupTitle')}</div>
      <div className="my-2 text-sm whitespace-pre-wrap">
        {t('SettingsBackupInfo')}
      </div>
      <div className="my-3 text-sm">
        <div className="flex items-center gap-3">
          <ToggleSwitch
            enabled={includeSecrets}
            onChange={setIncludeSecrets}
            testId="settings-include-secrets"
            ariaLabel={t('SettingsIncludeSecrets')}
          />
          <span className="font-bold">{t('SettingsIncludeSecrets')}</span>
        </div>
        <div className="mt-2">{t('SettingsIncludeSecretsInfo')}</div>
      </div>
      <div className="flex flex-col items-start gap-3 sm:flex-row">
        <TextButton onClick={handleExport}>
          {t('SettingsExportButton')}
        </TextButton>
        <TextButton
          onClick={() => fileInputRef.current?.click()}
          disabled={environmentOverrideEnabled || isImporting}
        >
          {isImporting ? t('SettingsImporting') : t('SettingsImportButton')}
        </TextButton>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          className="hidden"
          aria-label={t('SettingsImportFileLabel')}
        />
      </div>
      <div className="mt-3 text-sm whitespace-pre-wrap">
        {environmentOverrideEnabled
          ? t('SettingsImportEnvironmentOverride')
          : t('SettingsImportInfo')}
      </div>
    </div>
  )
}

export default SettingsBackup
