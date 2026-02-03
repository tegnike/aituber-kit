import { generateMessageId } from '@/utils/messageUtils'

describe('generateMessageId', () => {
  it('should start with msg_ prefix', () => {
    const id = generateMessageId()
    expect(id).toMatch(/^msg_/)
  })

  it('should contain a UUID after the prefix', () => {
    const id = generateMessageId()
    const uuidPart = id.replace('msg_', '')
    expect(uuidPart).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
  })

  it('should generate unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateMessageId()))
    expect(ids.size).toBe(100)
  })
})
