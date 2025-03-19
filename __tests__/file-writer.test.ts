import { jest } from '@jest/globals'
import { mockMkdir, mockWriteFile, resetFsMocks } from '../__fixtures__/fs.js'
import { mockDirname, resetPathMocks } from '../__fixtures__/path.js'

const mockCoreDebug = jest.fn()
const mockCoreError = jest.fn()
jest.unstable_mockModule('@actions/core', () => ({
  debug: mockCoreDebug,
  error: mockCoreError
}))

jest.unstable_mockModule('fs', () => ({
  promises: {
    mkdir: mockMkdir,
    writeFile: mockWriteFile
  }
}))

jest.unstable_mockModule('node:path', () => ({
  default: {
    dirname: mockDirname,
    join: jest.fn().mockImplementation((dir, filename) => `${dir}/${filename}`)
  }
}))

const { FileWriter } = await import('../src/file-writer')

describe('FileWriter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetFsMocks()
    resetPathMocks()

    mockCoreDebug.mockClear()
    mockCoreError.mockClear()
  })

  test('getFilePath returns correct path', async () => {
    const dir = '/path/to'
    const filename = 'file.json'

    const result = FileWriter.getFilePath(dir, filename)

    expect(result).toBe('/path/to/file.json')
  })

  test('writeFile creates directory and writes file successfully', async () => {
    const testPath = '/path/to/file.json'
    const testContent = '{"test": "data"}'
    const testDir = '/fake/dir//path/to/file.json'

    mockDirname.mockReturnValueOnce(testDir)

    await FileWriter.writeFile(testPath, testContent)

    expect(mockDirname).toHaveBeenCalledWith(testPath)
    expect(mockMkdir).toHaveBeenCalledWith(testDir, { recursive: true })
    expect(mockWriteFile).toHaveBeenCalledWith(testPath, testContent)
  })

  test('writeFile handles file system errors', async () => {
    const testPath = '/path/to/file.json'
    const testContent = '{"test": "data"}'
    const testError = new Error('Permission denied')
    const testDir = '/fake/dir//path/to/file.json'

    mockDirname.mockReturnValueOnce(testDir)
    mockMkdir.mockRejectedValueOnce(testError as never)

    await expect(FileWriter.writeFile(testPath, testContent)).rejects.toThrow(
      testError
    )
  })

  test('writeFile handles non-Error objects in catch block', async () => {
    const testPath = '/path/to/file.json'
    const testContent = '{"test": "data"}'
    const testError = 'String error'
    const testDir = '/fake/dir//path/to/file.json'

    mockDirname.mockReturnValueOnce(testDir)
    mockMkdir.mockRejectedValueOnce(testError as never)

    await expect(FileWriter.writeFile(testPath, testContent)).rejects.toBe(
      testError
    )
  })

  test('writeFile handles writeFile error', async () => {
    const testPath = '/path/to/file.json'
    const testContent = '{"test": "data"}'
    const testError = new Error('Write error')
    const testDir = '/fake/dir//path/to/file.json'

    mockDirname.mockReturnValueOnce(testDir)
    mockWriteFile.mockRejectedValueOnce(testError as never)

    await expect(FileWriter.writeFile(testPath, testContent)).rejects.toThrow(
      testError
    )
  })
})
