import toastStore from '@/features/stores/toast'

describe('toastStore', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    toastStore.setState({ toasts: [] })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('addToast', () => {
    it('should add a toast and return an id', () => {
      const id = toastStore.getState().addToast({
        message: 'Test message',
        type: 'info',
      })

      expect(id).toBeTruthy()
      expect(toastStore.getState().toasts).toHaveLength(1)
      expect(toastStore.getState().toasts[0].message).toBe('Test message')
    })

    it('should generate unique IDs', () => {
      const id1 = toastStore.getState().addToast({
        message: 'Toast 1',
        type: 'info',
      })
      const id2 = toastStore.getState().addToast({
        message: 'Toast 2',
        type: 'success',
      })

      expect(id1).not.toBe(id2)
    })

    it('should replace toast with same tag', () => {
      toastStore.getState().addToast({
        message: 'First',
        type: 'info',
        tag: 'connection',
      })

      toastStore.getState().addToast({
        message: 'Second',
        type: 'success',
        tag: 'connection',
      })

      const toasts = toastStore.getState().toasts
      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe('Second')
    })

    it('should not replace toasts without matching tag', () => {
      toastStore.getState().addToast({
        message: 'First',
        type: 'info',
        tag: 'tag-a',
      })
      toastStore.getState().addToast({
        message: 'Second',
        type: 'info',
        tag: 'tag-b',
      })

      expect(toastStore.getState().toasts).toHaveLength(2)
    })

    it('should accumulate toasts without tags', () => {
      toastStore.getState().addToast({ message: 'A', type: 'info' })
      toastStore.getState().addToast({ message: 'B', type: 'info' })
      toastStore.getState().addToast({ message: 'C', type: 'info' })

      expect(toastStore.getState().toasts).toHaveLength(3)
    })
  })

  describe('removeToast', () => {
    it('should remove toast by ID', () => {
      const id = toastStore.getState().addToast({
        message: 'Test',
        type: 'info',
      })

      toastStore.getState().removeToast(id!)
      expect(toastStore.getState().toasts).toHaveLength(0)
    })

    it('should remove toast by tag', () => {
      toastStore.getState().addToast({
        message: 'Test',
        type: 'info',
        tag: 'my-tag',
      })

      toastStore.getState().removeToast('my-tag')
      expect(toastStore.getState().toasts).toHaveLength(0)
    })

    it('should not affect other toasts', () => {
      const id1 = toastStore.getState().addToast({
        message: 'Keep',
        type: 'info',
      })
      const id2 = toastStore.getState().addToast({
        message: 'Remove',
        type: 'error',
      })

      toastStore.getState().removeToast(id2!)
      expect(toastStore.getState().toasts).toHaveLength(1)
      expect(toastStore.getState().toasts[0].id).toBe(id1)
    })
  })

  describe('closeToast', () => {
    it('should mark toast as closing', () => {
      const id = toastStore.getState().addToast({
        message: 'Test',
        type: 'info',
      })

      toastStore.getState().closeToast(id!)

      const toast = toastStore.getState().toasts[0]
      expect(toast.closing).toBe(true)
    })

    it('should remove toast after 300ms', () => {
      const id = toastStore.getState().addToast({
        message: 'Test',
        type: 'info',
      })

      toastStore.getState().closeToast(id!)

      // Still present but closing
      expect(toastStore.getState().toasts).toHaveLength(1)

      jest.advanceTimersByTime(300)

      // Now removed
      expect(toastStore.getState().toasts).toHaveLength(0)
    })

    it('should close by tag', () => {
      toastStore.getState().addToast({
        message: 'Test',
        type: 'info',
        tag: 'close-me',
      })

      toastStore.getState().closeToast('close-me')

      expect(toastStore.getState().toasts[0].closing).toBe(true)

      jest.advanceTimersByTime(300)
      expect(toastStore.getState().toasts).toHaveLength(0)
    })
  })
})
