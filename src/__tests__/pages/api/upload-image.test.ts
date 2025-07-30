import { createMocks } from 'node-mocks-http'
import uploadImage from '@/pages/api/upload-image'
import { IMAGE_CONSTANTS } from '@/constants/images'
import fs from 'fs'
import path from 'path'

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  promises: {
    copyFile: jest.fn(),
  },
}))

jest.mock('formidable', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      parse: jest.fn(),
    })),
  }
})

const mockFs = fs as jest.Mocked<typeof fs>

describe('/api/upload-image', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should reject non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await uploadImage(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed',
    })
  })

  it('should reject requests with no file', async () => {
    const formidable = require('formidable')
    const mockForm = {
      parse: jest.fn().mockResolvedValue([{}, {}]),
    }
    formidable.default.mockReturnValue(mockForm)

    const { req, res } = createMocks({
      method: 'POST',
    })

    await uploadImage(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'No file uploaded',
    })
  })

  it('should reject invalid file extensions', async () => {
    const formidable = require('formidable')
    const mockForm = {
      parse: jest.fn().mockResolvedValue([
        {},
        {
          file: [
            {
              originalFilename: 'test.txt',
              filepath: '/tmp/test',
              mimetype: 'text/plain',
            },
          ],
        },
      ]),
    }
    formidable.default.mockReturnValue(mockForm)

    const { req, res } = createMocks({
      method: 'POST',
    })

    await uploadImage(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid file type',
      message: 'Only JPG, PNG, GIF and WebP images can be uploaded',
    })
  })

  it('should reject invalid MIME types', async () => {
    const formidable = require('formidable')
    const mockForm = {
      parse: jest.fn().mockResolvedValue([
        {},
        {
          file: [
            {
              originalFilename: 'test.jpg',
              filepath: '/tmp/test',
              mimetype: 'text/plain', // Invalid MIME type for image
            },
          ],
        },
      ]),
    }
    formidable.default.mockReturnValue(mockForm)

    const { req, res } = createMocks({
      method: 'POST',
    })

    await uploadImage(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid MIME type',
      message: 'File content does not match allowed image types',
    })
  })

  it('should successfully upload valid image file', async () => {
    const formidable = require('formidable')
    const mockForm = {
      parse: jest.fn().mockResolvedValue([
        {},
        {
          file: [
            {
              originalFilename: 'test.jpg',
              filepath: '/tmp/test',
              mimetype: 'image/jpeg',
            },
          ],
        },
      ]),
    }
    formidable.default.mockReturnValue(mockForm)

    mockFs.existsSync.mockReturnValue(true)
    mockFs.promises.copyFile = jest.fn().mockResolvedValue(undefined)

    const { req, res } = createMocks({
      method: 'POST',
    })

    await uploadImage(req, res)

    expect(res._getStatusCode()).toBe(200)
    const responseData = JSON.parse(res._getData())
    expect(responseData).toHaveProperty('path')
    expect(responseData).toHaveProperty('filename')
    expect(responseData.path).toMatch(
      /^\/images\/uploaded\/\d+_test\.jpg\.jpg$/
    )
  })

  it('should sanitize malicious filenames', async () => {
    const formidable = require('formidable')
    const mockForm = {
      parse: jest.fn().mockResolvedValue([
        {},
        {
          file: [
            {
              originalFilename: '../../../etc/passwd.jpg',
              filepath: '/tmp/test',
              mimetype: 'image/jpeg',
            },
          ],
        },
      ]),
    }
    formidable.default.mockReturnValue(mockForm)

    mockFs.existsSync.mockReturnValue(true)
    mockFs.promises.copyFile = jest.fn().mockResolvedValue(undefined)

    const { req, res } = createMocks({
      method: 'POST',
    })

    await uploadImage(req, res)

    expect(res._getStatusCode()).toBe(200)
    const responseData = JSON.parse(res._getData())
    expect(responseData.filename).toMatch(/^\d+_\._\._\._etc_passwd\.jpg\.jpg$/)
  })

  it('should handle file copy errors', async () => {
    const formidable = require('formidable')
    const mockForm = {
      parse: jest.fn().mockResolvedValue([
        {},
        {
          file: [
            {
              originalFilename: 'test.jpg',
              filepath: '/tmp/test',
              mimetype: 'image/jpeg',
            },
          ],
        },
      ]),
    }
    formidable.default.mockReturnValue(mockForm)

    mockFs.existsSync.mockReturnValue(true)
    mockFs.promises.copyFile = jest
      .fn()
      .mockRejectedValue(new Error('Copy failed'))

    const { req, res } = createMocks({
      method: 'POST',
    })

    await uploadImage(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to upload file',
    })
  })
})
