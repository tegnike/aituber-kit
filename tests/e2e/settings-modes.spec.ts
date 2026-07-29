import { expect, Locator, Page, test } from '@playwright/test'
import {
  closeSettings,
  expectPersistedSetting,
  gotoHome,
  openSettings,
  openSettingsTab,
  prepareApp,
  readPersistedSetting,
} from './helpers/app'

const OPENAI_AUDIO_MODE_MODEL = 'gpt-audio-mini'

async function blockExternalRequests(page: Page) {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:'
    const isLocal =
      url.hostname === '127.0.0.1' ||
      url.hostname === 'localhost' ||
      url.hostname === '::1'

    if (isHttp && !isLocal) {
      return route.abort()
    }

    return route.continue()
  })
}

function panel(page: Page) {
  return page.getByTestId('settings-panel')
}

function switchAfter(page: Page, label: string): Locator {
  return panel(page).locator(
    `xpath=.//*[normalize-space(.)="${label}"]/following::button[@role="switch"][1]`
  )
}

function controlAfter(
  page: Page,
  label: string,
  selector: 'input' | 'select' | 'textarea'
): Locator {
  return panel(page).locator(
    `xpath=.//*[normalize-space(.)="${label}"]/following::${selector}[1]`
  )
}

async function clickElement(locator: Locator) {
  await locator.evaluate((element) => {
    ;(element as HTMLElement).click()
  })
}

async function setNativeInputValue(locator: Locator, value: string) {
  await locator.evaluate((element, nextValue) => {
    const input = element as HTMLInputElement | HTMLTextAreaElement
    const prototype =
      input instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype
    const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set

    valueSetter?.call(input, nextValue)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    input.dispatchEvent(new Event('blur', { bubbles: true }))
  }, value)
}

test.beforeEach(async ({ page }) => {
  await blockExternalRequests(page)
  await prepareApp(page, {
    settings: {
      showSilenceProgressBar: false,
      continuousMicListeningMode: false,
    },
  })
})

test('can edit settings tabs and keep idle and presence form state when the panel reopens', async ({
  page,
}) => {
  await gotoHome(page)
  await openSettings(page)

  await openSettingsTab(page, 'idle')
  await expect(page.getByTestId('idle-mode-toggle')).toBeVisible()

  await switchAfter(page, 'Idle Mode').click()
  await expectPersistedSetting(page, 'idleModeEnabled', true)

  await page.getByLabel('Speech Interval').fill('42')
  await expectPersistedSetting(page, 'idleInterval', 42)

  await page.getByLabel('Playback Mode').selectOption('random')
  await expectPersistedSetting(page, 'idlePlaybackMode', 'random')

  await page.getByLabel('Speech Source').selectOption('aiGeneration')
  await expectPersistedSetting(page, 'idleAiGenerationEnabled', true)
  await expectPersistedSetting(page, 'idleTimePeriodEnabled', false)

  await controlAfter(page, 'Generation Prompt', 'textarea').fill(
    'Say one short idle line without contacting an external service.'
  )
  await expectPersistedSetting(
    page,
    'idleAiPromptTemplate',
    'Say one short idle line without contacting an external service.'
  )

  await openSettingsTab(page, 'presence')
  await expect(
    panel(page).getByTestId('presence-timing-settings-button')
  ).toBeVisible()

  await panel(page).getByTestId('presence-timing-settings-button').click()
  await page.getByLabel('Departure Detection Time').fill('9')
  await expectPersistedSetting(page, 'presenceDepartureTimeout', 9)
  await page.getByLabel('Cooldown Time').fill('2')
  await expectPersistedSetting(page, 'presenceCooldownTime', 2)

  await panel(page)
    .getByRole('button', { name: /Detection Settings/ })
    .click()
  await page.getByLabel('Detection Sensitivity').selectOption('high')
  await expectPersistedSetting(page, 'presenceDetectionSensitivity', 'high')
  await page.getByLabel('Detection Confirmation Time').fill('1.5')
  await expectPersistedSetting(page, 'presenceDetectionThreshold', 1.5)

  await closeSettings(page)
  await openSettings(page)

  await openSettingsTab(page, 'idle')
  await expect(switchAfter(page, 'Idle Mode')).toHaveAttribute(
    'aria-checked',
    'true'
  )
  await expect(page.getByLabel('Speech Interval')).toHaveValue('42')
  await expect(page.getByLabel('Speech Source')).toHaveValue('aiGeneration')
  await expect(controlAfter(page, 'Generation Prompt', 'textarea')).toHaveValue(
    'Say one short idle line without contacting an external service.'
  )

  await openSettingsTab(page, 'presence')
  await panel(page).getByTestId('presence-timing-settings-button').click()
  await expect(page.getByLabel('Departure Detection Time')).toHaveValue('9')
  await expect(page.getByLabel('Cooldown Time')).toHaveValue('2')
  await panel(page)
    .getByRole('button', { name: /Detection Settings/ })
    .click()
  await expect(page.getByLabel('Detection Sensitivity')).toHaveValue('high')
  await expect(page.getByLabel('Detection Confirmation Time')).toHaveValue(
    '1.5'
  )
})

test('enforces mode exclusions for real-time API and audio modes from settings UI', async ({
  page,
}) => {
  await gotoHome(page)
  await openSettings(page)

  await openSettingsTab(page, 'idle')
  await switchAfter(page, 'Idle Mode').click()
  await expectPersistedSetting(page, 'idleModeEnabled', true)

  await openSettingsTab(page, 'speechInput')
  await setNativeInputValue(
    page.getByTestId('initial-speech-timeout-input'),
    '8'
  )
  await expectPersistedSetting(page, 'initialSpeechTimeout', 8)
  await setNativeInputValue(page.getByTestId('no-speech-timeout-input'), '6')
  await expectPersistedSetting(page, 'noSpeechTimeout', 6)
  if (
    (await page
      .getByTestId('show-silence-progress-bar-toggle')
      .getAttribute('aria-checked')) !== 'true'
  ) {
    await clickElement(page.getByTestId('show-silence-progress-bar-toggle'))
  }
  await expectPersistedSetting(page, 'showSilenceProgressBar', true)
  await clickElement(page.getByTestId('continuous-mic-listening-toggle'))
  await expectPersistedSetting(page, 'continuousMicListeningMode', true)

  await openSettingsTab(page, 'ai')
  await clickElement(page.getByTestId('realtime-api-mode-toggle'))
  await expectPersistedSetting(page, 'realtimeAPIMode', true)
  await expectPersistedSetting(page, 'audioMode', false)
  await expectPersistedSetting(page, 'idleModeEnabled', false)
  await expectPersistedSetting(page, 'speechRecognitionMode', 'browser')
  await expectPersistedSetting(page, 'initialSpeechTimeout', 0)
  await expectPersistedSetting(page, 'noSpeechTimeout', 0)
  await expectPersistedSetting(page, 'showSilenceProgressBar', false)
  await expectPersistedSetting(page, 'continuousMicListeningMode', false)
  await expectPersistedSetting(page, 'selectAIModel', 'gpt-realtime-2.1')

  await expect(page.getByTestId('realtime-api-mode-toggle')).toHaveAttribute(
    'aria-checked',
    'true'
  )
  await expect(page.getByTestId('audio-mode-toggle')).toHaveAttribute(
    'aria-checked',
    'false'
  )

  await clickElement(page.getByTestId('audio-mode-toggle'))
  await expectPersistedSetting(page, 'audioMode', true)
  await expectPersistedSetting(page, 'realtimeAPIMode', false)
  await expectPersistedSetting(page, 'selectAIModel', OPENAI_AUDIO_MODE_MODEL)

  await clickElement(page.getByTestId('audio-mode-toggle'))
  await expectPersistedSetting(page, 'audioMode', false)
  await expect
    .poll(() => readPersistedSetting<string>(page, 'selectAIModel'))
    .not.toBe(OPENAI_AUDIO_MODE_MODEL)

  await openSettingsTab(page, 'idle')
  await switchAfter(page, 'Idle Mode').click()
  await expectPersistedSetting(page, 'idleModeEnabled', true)

  expect(await readPersistedSetting(page, 'youtubeMode')).toBe(false)
})
