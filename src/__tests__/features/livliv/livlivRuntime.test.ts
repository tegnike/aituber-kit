import type { Driver, Frame, Host, Player } from '@livliv-dev/player'
import {
  bindLivLivMouth,
  expressionIdForEmotion,
  livlivRenderer,
} from '@/features/livliv/livlivRuntime'
import homeStore from '@/features/stores/home'

describe('expressionIdForEmotion', () => {
  const ids = ['smile', 'shy', 'angry', 'sad', 'surprised']

  it('maps AITuberKit emotions onto standard LivLiv expression ids', () => {
    expect(expressionIdForEmotion('neutral', ids)).toBeNull()
    expect(expressionIdForEmotion('happy', ids)).toBe('smile')
    expect(expressionIdForEmotion('angry', ids)).toBe('angry')
    expect(expressionIdForEmotion('sad', ids)).toBe('sad')
    expect(expressionIdForEmotion('surprised', ids)).toBe('surprised')
    expect(expressionIdForEmotion('relaxed', ids)).toBeNull()
  })

  it('returns null when the model has no matching expression', () => {
    expect(expressionIdForEmotion('surprised', ['smile'])).toBeNull()
  })
})

describe('bindLivLivMouth', () => {
  const mouthFor = (volume: number, mouthOpen: number) => {
    let driver: Driver | undefined
    const host = {
      use: (next: Driver) => {
        driver = next
        return () => {}
      },
    }
    bindLivLivMouth(host, () => volume)
    const frame = { params: { mouthOpen } }
    driver?.update(frame as unknown as Frame, host as unknown as Host)
    return frame.params.mouthOpen
  }

  it('opens the mouth with the speech volume', () => {
    expect(mouthFor(0.62, 0)).toBe(0.62)
  })

  it('keeps a louder mouthOpen set on the player, such as live audio', () => {
    expect(mouthFor(0.2, 0.8)).toBe(0.8)
  })

  it('keeps the mouth in range for unusable volumes', () => {
    expect(mouthFor(1.4, 0)).toBe(1)
    expect(mouthFor(Number.NaN, 0)).toBe(0)
    expect(mouthFor(-0.3, 0)).toBe(0)
  })
})

describe('livlivRenderer', () => {
  afterEach(() => homeStore.setState({ livlivPlayer: null }))

  it('returns the registered player to a neutral face on idle', () => {
    const setExpression = jest.fn(() => true)
    homeStore.setState({
      livlivPlayer: {
        expressions: [{ id: 'smile' }],
        setExpression,
      } as unknown as Player,
    })

    livlivRenderer.resetToIdle()

    expect(setExpression).toHaveBeenCalledWith(null)
  })
})
