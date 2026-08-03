import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import SettingsBackup from '@/components/settings/settingsBackup'

const mockDownloadSettingsFile = jest.fn()
const mockParseSettingsFile = jest.fn()
const mockApplySettingsImport = jest.fn()
const mockAddToast = jest.fn()
let mockEnvironmentOverride = false

jest.mock('@/features/settings/settingsFile', () => ({
  SETTINGS_FILE_MAX_BYTES: 5 * 1024 * 1024,
  SettingsFileError: class SettingsFileError extends Error {
    constructor(
      public readonly code: string,
      message: string
    ) {
      super(message)
    }
  },
  downloadSettingsFile: (...args: unknown[]) =>
    mockDownloadSettingsFile(...args),
  parseSettingsFile: (...args: unknown[]) => mockParseSettingsFile(...args),
  applySettingsImport: (...args: unknown[]) => mockApplySettingsImport(...args),
  isEnvironmentSettingsOverrideEnabled: () => mockEnvironmentOverride,
}))

jest.mock('@/features/stores/toast', () => ({
  __esModule: true,
  default: {
    getState: () => ({ addToast: mockAddToast }),
  },
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('SettingsBackup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEnvironmentOverride = false
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('exports a regular settings file by default', () => {
    render(<SettingsBackup />)

    expect(screen.getByText('SettingsBackupTitle')).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'SettingsExportButton' })
    )

    expect(mockDownloadSettingsFile).toHaveBeenCalledWith(false)
  })

  it('confirms before exporting sensitive settings', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    render(<SettingsBackup />)

    fireEvent.click(screen.getByTestId('settings-include-secrets'))
    fireEvent.click(
      screen.getByRole('button', { name: 'SettingsExportButton' })
    )

    expect(confirmSpy).toHaveBeenCalledWith('SettingsExportSecretsConfirm')
    expect(mockDownloadSettingsFile).toHaveBeenCalledWith(true)
  })

  it('parses, confirms, and applies an imported settings file', async () => {
    jest.useFakeTimers()
    const importData = {
      settingsVersion: 6,
      exportedAt: '2026-08-03T12:34:56.000Z',
      secretsIncluded: false,
      settings: { characterName: 'ニケ' },
    }
    mockParseSettingsFile.mockReturnValue(importData)
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    const file = new File(['{}'], 'settings.json', {
      type: 'application/json',
    })
    Object.defineProperty(file, 'text', {
      value: jest.fn().mockResolvedValue('{}'),
    })
    render(<SettingsBackup />)

    await act(async () => {
      fireEvent.change(screen.getByLabelText('SettingsImportFileLabel'), {
        target: { files: [file] },
      })
      await Promise.resolve()
    })

    expect(mockParseSettingsFile).toHaveBeenCalledWith('{}')
    expect(confirmSpy).toHaveBeenCalledWith(
      'SettingsImportConfirmWithoutSecrets'
    )
    expect(mockApplySettingsImport).toHaveBeenCalledWith(importData)
    expect(jest.getTimerCount()).toBe(1)
  })

  it('disables import when environment settings always override the browser', () => {
    mockEnvironmentOverride = true
    render(<SettingsBackup />)

    expect(
      screen.getByRole('button', { name: 'SettingsImportButton' })
    ).toBeDisabled()
    expect(
      screen.getByText('SettingsImportEnvironmentOverride')
    ).toBeInTheDocument()
  })
})
