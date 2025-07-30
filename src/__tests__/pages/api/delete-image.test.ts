import { createMocks } from 'node-mocks-http'
import deleteImage from '@/pages/api/delete-image'
import fs from 'fs'
import path from 'path'

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  promises: {
    unlink: jest.fn(),
  },
}))

const mockFs = fs as jest.Mocked<typeof fs>

describe('/api/delete-image', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should reject non-DELETE requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await deleteImage(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed',
    })
  })

  it('should reject requests without filename', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      body: {},
    })

    await deleteImage(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Filename is required',
    })
  })

  it('should reject path traversal attempts', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      body: {
        filename: '../../../etc/passwd',
      },
    })

    await deleteImage(req, res)

    expect(res._getStatusCode()).toBe(404)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'File not found',
    })
  })

  it('should handle non-existent files', async () => {
    mockFs.existsSync.mockReturnValue(false)

    const { req, res } = createMocks({
      method: 'DELETE',
      body: {
        filename: 'test.jpg',
      },
    })

    await deleteImage(req, res)

    expect(res._getStatusCode()).toBe(404)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'File not found',
    })
  })

  it('should successfully delete existing file', async () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.promises.unlink = jest.fn().mockResolvedValue(undefined)

    const { req, res } = createMocks({
      method: 'DELETE',
      body: {
        filename: 'test.jpg',
      },
    })

    await deleteImage(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      message: 'File deleted successfully',
      filename: 'test.jpg',
    })
    expect(mockFs.promises.unlink).toHaveBeenCalled()
  })

  it('should handle file deletion errors', async () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.promises.unlink = jest
      .fn()
      .mockRejectedValue(new Error('Delete failed'))

    const { req, res } = createMocks({
      method: 'DELETE',
      body: {
        filename: 'test.jpg',
      },
    })

    await deleteImage(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to delete file',
    })
  })
})
