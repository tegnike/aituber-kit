import settingsStore, {
  CURRENT_SETTINGS_VERSION,
} from '@/features/stores/settings'
import {
  SETTINGS_FILE_FORMAT,
  SETTINGS_FILE_FORMAT_VERSION,
  SettingsFileError,
  applySettingsImport,
  createSettingsFileData,
  createSettingsFilename,
  downloadSettingsFile,
  parseSettingsFile,
} from '@/features/settings/settingsFile'

describe('settings file export and import', () => {
  const originalEnvironmentOverride =
    process.env.NEXT_PUBLIC_ALWAYS_OVERRIDE_WITH_ENV_VARIABLES
  const originalState = settingsStore.getState()

  beforeEach(() => {
    process.env.NEXT_PUBLIC_ALWAYS_OVERRIDE_WITH_ENV_VARIABLES = 'false'
    settingsStore.setState({
      openaiKey: 'openai-secret',
      cartesiaApiKey: 'cartesia-secret',
      customApiHeaders: '{"Authorization":"Bearer secret"}',
      kioskPasscode: '1234',
      characterName: 'ニケ',
      dynamicRetrievalThreshold: 0.7,
      showControlPanel: false,
    })
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_ALWAYS_OVERRIDE_WITH_ENV_VARIABLES =
      originalEnvironmentOverride
    settingsStore.setState(originalState)
    localStorage.clear()
  })

  it('exports regular settings without sensitive values', () => {
    const exportedAt = new Date('2026-08-03T12:34:56.000Z')
    const data = createSettingsFileData(false, exportedAt)

    expect(data).toMatchObject({
      format: SETTINGS_FILE_FORMAT,
      formatVersion: SETTINGS_FILE_FORMAT_VERSION,
      settingsVersion: CURRENT_SETTINGS_VERSION,
      exportedAt: exportedAt.toISOString(),
      secretsIncluded: false,
    })
    expect(data.settings.characterName).toBe('ニケ')
    expect(data.settings.dynamicRetrievalThreshold).toBe(0.7)
    expect(data.settings.showControlPanel).toBe(false)
    expect(data.settings).not.toHaveProperty('openaiKey')
    expect(data.settings).not.toHaveProperty('cartesiaApiKey')
    expect(data.settings).not.toHaveProperty('customApiHeaders')
    expect(data.settings).not.toHaveProperty('kioskPasscode')
  })

  it('exports sensitive values when a complete backup is requested', () => {
    const data = createSettingsFileData(true)

    expect(data.secretsIncluded).toBe(true)
    expect(data.settings.openaiKey).toBe('openai-secret')
    expect(data.settings.cartesiaApiKey).toBe('cartesia-secret')
    expect(data.settings.customApiHeaders).toContain('Bearer secret')
    expect(data.settings.kioskPasscode).toBe('1234')
  })

  it('creates a timestamped JSON filename', () => {
    expect(createSettingsFilename(new Date('2026-08-03T12:34:56.000Z'))).toBe(
      'aituber-kit-settings-20260803-123456.json'
    )
  })

  it('downloads the settings as a JSON file and releases the object URL', () => {
    jest.useFakeTimers()
    const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(
      URL,
      'createObjectURL'
    )
    const originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(
      URL,
      'revokeObjectURL'
    )
    const createObjectUrl = jest.fn(() => 'blob:settings')
    const revokeObjectUrl = jest.fn()
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation()

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    })

    try {
      downloadSettingsFile(false)

      expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob))
      expect(click).toHaveBeenCalledTimes(1)
      expect(document.querySelector('a[download]')).toBeNull()

      jest.runOnlyPendingTimers()
      expect(revokeObjectUrl).toHaveBeenCalledWith('blob:settings')
    } finally {
      click.mockRestore()
      if (originalCreateObjectUrl) {
        Object.defineProperty(URL, 'createObjectURL', originalCreateObjectUrl)
      } else {
        Reflect.deleteProperty(URL, 'createObjectURL')
      }
      if (originalRevokeObjectUrl) {
        Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectUrl)
      } else {
        Reflect.deleteProperty(URL, 'revokeObjectURL')
      }
      jest.useRealTimers()
    }
  })

  it('parses a current settings file', () => {
    const exported = createSettingsFileData(false)
    const parsed = parseSettingsFile(JSON.stringify(exported))

    expect(parsed.secretsIncluded).toBe(false)
    expect(parsed.settings.characterName).toBe('ニケ')
    expect(parsed.settings).not.toHaveProperty('openaiKey')
  })

  it('migrates settings from an older settings schema', () => {
    const parsed = parseSettingsFile(
      JSON.stringify({
        format: SETTINGS_FILE_FORMAT,
        formatVersion: SETTINGS_FILE_FORMAT_VERSION,
        settingsVersion: 2,
        exportedAt: '2026-08-03T12:34:56.000Z',
        secretsIncluded: false,
        settings: { multiModalMode: 'never' },
      })
    )

    expect(parsed.settings.enableMultiModal).toBe(false)
    expect(parsed.settings).not.toHaveProperty('multiModalMode')
  })

  it('rejects a settings file created by a newer settings schema', () => {
    expect(() =>
      parseSettingsFile(
        JSON.stringify({
          format: SETTINGS_FILE_FORMAT,
          formatVersion: SETTINGS_FILE_FORMAT_VERSION,
          settingsVersion: CURRENT_SETTINGS_VERSION + 1,
          exportedAt: '2026-08-03T12:34:56.000Z',
          secretsIncluded: false,
          settings: {},
        })
      )
    ).toThrow(
      expect.objectContaining<Partial<SettingsFileError>>({
        code: 'newer-settings-version',
      })
    )
  })

  it('rejects sensitive values that are not declared by the file', () => {
    expect(() =>
      parseSettingsFile(
        JSON.stringify({
          format: SETTINGS_FILE_FORMAT,
          formatVersion: SETTINGS_FILE_FORMAT_VERSION,
          settingsVersion: CURRENT_SETTINGS_VERSION,
          exportedAt: '2026-08-03T12:34:56.000Z',
          secretsIncluded: false,
          settings: { openaiKey: 'undeclared-secret' },
        })
      )
    ).toThrow(
      expect.objectContaining<Partial<SettingsFileError>>({
        code: 'sensitive-data-mismatch',
      })
    )
  })

  it('rejects values with an incompatible top-level type', () => {
    expect(() =>
      parseSettingsFile(
        JSON.stringify({
          format: SETTINGS_FILE_FORMAT,
          formatVersion: SETTINGS_FILE_FORMAT_VERSION,
          settingsVersion: CURRENT_SETTINGS_VERSION,
          exportedAt: '2026-08-03T12:34:56.000Z',
          secretsIncluded: false,
          settings: { showControlPanel: 'false' },
        })
      )
    ).toThrow(
      expect.objectContaining<Partial<SettingsFileError>>({
        code: 'invalid-setting-value',
      })
    )
  })

  it('preserves current secrets when importing a regular settings file', () => {
    applySettingsImport({
      settingsVersion: CURRENT_SETTINGS_VERSION,
      exportedAt: '2026-08-03T12:34:56.000Z',
      secretsIncluded: false,
      settings: {
        characterName: 'インポート後',
        showControlPanel: true,
      },
    })

    const state = settingsStore.getState()
    expect(state.characterName).toBe('インポート後')
    expect(state.showControlPanel).toBe(true)
    expect(state.openaiKey).toBe('openai-secret')
    expect(state.cartesiaApiKey).toBe('cartesia-secret')
  })

  it('refuses imports when environment settings always override the browser', () => {
    process.env.NEXT_PUBLIC_ALWAYS_OVERRIDE_WITH_ENV_VARIABLES = 'true'

    expect(() =>
      applySettingsImport({
        settingsVersion: CURRENT_SETTINGS_VERSION,
        exportedAt: '2026-08-03T12:34:56.000Z',
        secretsIncluded: false,
        settings: { characterName: '変更されない' },
      })
    ).toThrow(
      expect.objectContaining<Partial<SettingsFileError>>({
        code: 'environment-override-enabled',
      })
    )
    expect(settingsStore.getState().characterName).toBe('ニケ')
  })
})
