import { jest } from '@jest/globals'

export const mockDirname = jest.fn()

export const resetPathMocks = (): void => {
  mockDirname.mockReset()
  mockDirname.mockImplementation((path) => `/fake/dir/${path}`)
}
