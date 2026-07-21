import {
  isLocalLlmHost,
  isLocalOrPrivateHost,
  isLoopbackHost,
  isSameMachineHost,
} from '@/lib/api-services/serverUrlGuard'

describe('serverUrlGuard', () => {
  describe('isLoopbackHost', () => {
    it('detects loopback names and addresses only', () => {
      expect(isLoopbackHost('localhost')).toBe(true)
      expect(isLoopbackHost('app.localhost')).toBe(true)
      expect(isLoopbackHost('127.0.0.1')).toBe(true)
      expect(isLoopbackHost('::1')).toBe(true)
      expect(isLoopbackHost('::ffff:127.0.0.1')).toBe(true)
      expect(isLoopbackHost('192.168.1.10')).toBe(false)
      expect(isLoopbackHost('::ffff:10.0.0.1')).toBe(false)
      expect(isLoopbackHost('127.attacker.example')).toBe(false)
    })
  })

  describe('isLocalOrPrivateHost', () => {
    it('detects IPv4-mapped IPv6 localhost and private ranges', () => {
      expect(isLocalOrPrivateHost('::ffff:127.0.0.1')).toBe(true)
      expect(isLocalOrPrivateHost('::ffff:10.0.0.1')).toBe(true)
      expect(isLocalOrPrivateHost('0:0:0:0:0:ffff:192.168.1.10')).toBe(true)
    })

    it('detects compressed IPv4-mapped IPv6 private ranges', () => {
      expect(isLocalOrPrivateHost('::ffff:7f00:1')).toBe(true)
      expect(isLocalOrPrivateHost('::ffff:a00:1')).toBe(true)
      expect(isLocalOrPrivateHost('::ffff:c0a8:10a')).toBe(true)
    })

    it('does not treat public IPv4-mapped IPv6 addresses as private', () => {
      expect(isLocalOrPrivateHost('::ffff:8.8.8.8')).toBe(false)
      expect(isLocalOrPrivateHost('::ffff:808:808')).toBe(false)
    })

    it('detects the full IPv6 link-local range', () => {
      expect(isLocalOrPrivateHost('fe80::1')).toBe(true)
      expect(isLocalOrPrivateHost('fe90::1')).toBe(true)
      expect(isLocalOrPrivateHost('febf::1')).toBe(true)
      expect(isLocalOrPrivateHost('fec0::1')).toBe(false)
    })

    it('does not treat IP-prefixed hostnames as private addresses', () => {
      expect(isLocalOrPrivateHost('127.attacker.example')).toBe(false)
      expect(isLocalOrPrivateHost('192.168.attacker.example')).toBe(false)
    })
  })

  describe('isLocalLlmHost', () => {
    it('accepts LAN machine names used by LM Studio and Ollama', () => {
      expect(isLocalLlmHost('STUDIO-PC')).toBe(true)
      expect(isLocalLlmHost('studio-mac.local')).toBe(true)
      expect(isLocalLlmHost('studio-mac.local.')).toBe(true)
    })

    it('keeps public hostnames outside the local LLM boundary', () => {
      expect(isLocalLlmHost('llm.example.com')).toBe(false)
      expect(isLocalLlmHost('127.attacker.example')).toBe(false)
      expect(isLocalLlmHost('')).toBe(false)
    })
  })

  describe('isSameMachineHost', () => {
    const machineHostname = 'studio-pc.local'
    const localInterfaceAddresses = ['192.168.1.20', 'fe80::1234']

    it('accepts the OS hostname, its short name, and local interface addresses', () => {
      expect(
        isSameMachineHost(
          'studio-pc.local',
          machineHostname,
          localInterfaceAddresses
        )
      ).toBe(true)
      expect(
        isSameMachineHost('STUDIO-PC', machineHostname, localInterfaceAddresses)
      ).toBe(true)
      expect(
        isSameMachineHost(
          '192.168.1.20',
          machineHostname,
          localInterfaceAddresses
        )
      ).toBe(true)
    })

    it('rejects other LAN machine names and addresses', () => {
      expect(
        isSameMachineHost('other-pc', machineHostname, localInterfaceAddresses)
      ).toBe(false)
      expect(
        isSameMachineHost(
          '192.168.1.21',
          machineHostname,
          localInterfaceAddresses
        )
      ).toBe(false)
    })
  })
})
