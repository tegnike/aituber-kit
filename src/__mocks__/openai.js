const mockOpenAI = jest.fn().mockImplementation(() => ({
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
}))

export default mockOpenAI
