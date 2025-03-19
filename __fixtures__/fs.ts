import { jest } from '@jest/globals'

export const mockMkdir = jest.fn()
export const mockWriteFile = jest.fn()

export const resetFsMocks = (): void => {
  mockMkdir.mockReset()
  mockWriteFile.mockReset()

  mockMkdir.mockResolvedValue(undefined as never)
  mockWriteFile.mockResolvedValue(undefined as never)
}
