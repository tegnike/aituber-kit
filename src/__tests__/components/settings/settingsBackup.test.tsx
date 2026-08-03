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

  it('shows an error toast when exporting fails', () => {
    mockDownloadSettingsFile.mockImplementation(() => {
      throw new Error('Download failed')
    })
    render(<SettingsBackup />)

    fireEvent.click(
      screen.getByRole('button', { name: 'SettingsExportButton' })
    )

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'SettingsExportFailed',
        type: 'error',
      })
    )
  })

  it('confirms before exporting sensitive settings', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    render(<SettingsBackup />)

    fireEvent.click(
      screen.getByRole('switch', { name: 'SettingsIncludeSecrets' })
    )
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

  it('maps a settings file error to the matching toast message', async () => {
    const { SettingsFileError } = jest.requireMock(
      '@/features/settings/settingsFile'
    ) as {
      SettingsFileError: new (code: string, message: string) => Error
    }
    mockParseSettingsFile.mockImplementation(() => {
      throw new SettingsFileError('invalid-json', 'Invalid JSON')
    })
    const file = new File(['{'], 'settings.json', {
      type: 'application/json',
    })
    Object.defineProperty(file, 'text', {
      value: jest.fn().mockResolvedValue('{'),
    })
    render(<SettingsBackup />)

    await act(async () => {
      fireEvent.change(screen.getByLabelText('SettingsImportFileLabel'), {
        target: { files: [file] },
      })
      await Promise.resolve()
    })

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'SettingsImportInvalidJson',
        type: 'error',
      })
    )
    expect(mockApplySettingsImport).not.toHaveBeenCalled()
  })

  it('rejects a settings file larger than the supported limit', async () => {
    const file = new File(['{}'], 'settings.json', {
      type: 'application/json',
    })
    Object.defineProperty(file, 'size', {
      value: 5 * 1024 * 1024 + 1,
    })
    render(<SettingsBackup />)

    await act(async () => {
      fireEvent.change(screen.getByLabelText('SettingsImportFileLabel'), {
        target: { files: [file] },
      })
    })

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'SettingsImportFileTooLarge',
        type: 'error',
      })
    )
    expect(mockParseSettingsFile).not.toHaveBeenCalled()
  })

  it('does not apply sensitive settings when the user cancels', async () => {
    mockParseSettingsFile.mockReturnValue({
      settingsVersion: 6,
      exportedAt: '2026-08-03T12:34:56.000Z',
      secretsIncluded: true,
      settings: {},
    })
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)
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

    expect(confirmSpy).toHaveBeenCalledWith('SettingsImportConfirmWithSecrets')
    expect(mockApplySettingsImport).not.toHaveBeenCalled()
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
