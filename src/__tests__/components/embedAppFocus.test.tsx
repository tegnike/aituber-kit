import React from 'react'
import { render, waitFor } from '@testing-library/react'

import { EmbedApp } from '@/components/embed/EmbedApp'

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/form', () => ({
  Form: ({ focusOnMount }: { focusOnMount?: boolean }) => (
    <div data-testid="embed-form" data-focus-on-mount={focusOnMount} />
  ),
}))

jest.mock('@/components/assistantText', () => ({ AssistantText: () => null }))
jest.mock('@/components/ImageOverlay', () => () => null)
jest.mock('@/components/live2DViewer', () => () => null)
jest.mock('@/components/memoryServiceInitializer', () => ({
  MemoryServiceInitializer: () => null,
}))
jest.mock('@/components/modalImage', () => () => null)
jest.mock('@/components/pngTuberViewer', () => () => null)
jest.mock('@/components/toasts', () => ({ Toasts: () => null }))
jest.mock('@/components/vrmViewer', () => () => null)

jest.mock('@/features/embed/embedConfig', () => ({
  getEmbedConfig: () => ({ id: 'default' }),
  getEmbedOverridesFromSearchParams: () => ({}),
  isEmbedOriginAllowed: () => true,
  mergeEmbedConfig: (config: object) => config,
  toPresetQuestions: (questions: unknown) => questions,
}))

jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) =>
      selector({
        webcamStatus: false,
        captureStatus: false,
        backgroundImageUrl: 'green',
        chatLog: [],
      })
    ),
    {
      getInitialState: jest.fn(() => ({ backgroundImageUrl: 'green' })),
      setState: jest.fn(),
    }
  ),
}))

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) =>
      selector({
        useVideoAsBackground: false,
        modelType: 'vrm',
        showAssistantText: false,
      })
    ),
    {
      getInitialState: jest.fn(() => ({
        characterName: 'Character',
        userDisplayName: 'User',
        systemPrompt: '',
        modelType: 'vrm',
        selectedVrmPath: '',
        selectedLive2DPath: '',
        selectedPNGTuberPath: '',
        showAssistantText: false,
        showCharacterName: true,
        showPresetQuestions: false,
        presetQuestions: [],
        colorTheme: 'default',
      })),
      setState: jest.fn(),
    }
  ),
}))

jest.mock('@/hooks/useLive2DEnabled', () => ({
  useLive2DEnabled: () => ({ isLive2DEnabled: false }),
}))
jest.mock('@/features/presets/usePresetLoader', () => ({
  usePresetLoader: () => undefined,
}))
jest.mock('@/utils/assistantMessageUtils', () => ({
  getLatestAssistantMessage: () => null,
}))
jest.mock('@/utils/buildUrl', () => ({ buildUrl: (value: string) => value }))
jest.mock('@/lib/i18n', () => ({}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('EmbedApp focus contract', () => {
  it('disables initial input focus for the embedded form', async () => {
    const { getByTestId } = render(<EmbedApp embedId="default" />)

    await waitFor(() => expect(getByTestId('embed-form')).toBeInTheDocument())
    expect(getByTestId('embed-form')).toHaveAttribute(
      'data-focus-on-mount',
      'false'
    )
  })
})
