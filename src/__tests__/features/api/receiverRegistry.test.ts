import {
  createReceiverDescriptor,
  createReceiverId,
  getReceiverCapabilities,
  getReceiverDisplayName,
  getReceiverKind,
} from '@/features/api/receiverRegistry'

describe('receiverRegistry', () => {
  it('一時セッションIDからReceiver IDを生成する', () => {
    expect(createReceiverId('session-1')).toBe('aituber-receiver-session-1')
  })

  it('ブラウザとOBSを汎用Receiver種別として識別する', () => {
    expect(getReceiverKind('Mozilla/5.0 Chrome/140.0')).toBe('browser')
    expect(getReceiverKind('Mozilla/5.0 OBS/31.0')).toBe('obs')
    expect(
      getReceiverDisplayName(
        'Mozilla/5.0 Chrome/140.0',
        'aituber-receiver-12345678'
      )
    ).toBe('Chrome 12345678')
  })

  it('Message Receiver設定に応じて能力を公開する', () => {
    expect(getReceiverCapabilities(false)).toEqual(['presentation'])
    expect(getReceiverCapabilities(true)).toEqual([
      'presentation',
      'chat',
      'speech',
    ])
  })

  it('Producer非依存のReceiver記述を生成する', () => {
    expect(
      createReceiverDescriptor(
        'configured-stage',
        'session-12345678',
        'Mozilla/5.0 OBS/31.0',
        true
      )
    ).toEqual({
      receiverId: 'aituber-receiver-session-12345678',
      configuredClientId: 'configured-stage',
      displayName: 'OBS 12345678',
      kind: 'obs',
      capabilities: ['presentation', 'chat', 'speech'],
    })
  })
})
