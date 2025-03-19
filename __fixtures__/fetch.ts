import { jest } from '@jest/globals'

interface MockResponse {
  ok: boolean
  status: number
  statusText: string
  json: () => Promise<unknown>
}

export const mockFetch = jest.fn<() => Promise<MockResponse>>()

export const resetFetchMocks = (): void => {
  mockFetch.mockReset()
}

export const mockSuccessResponse = (data: unknown): void => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(data)
  })
}

export const mockErrorResponse = (
  status = 404,
  statusText = 'Not Found'
): void => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText,
    json: () => Promise.reject(new Error(`HTTP Error: ${status}`))
  })
}

export const mockNetworkError = (message = 'Network error'): void => {
  mockFetch.mockImplementation(() => Promise.reject(new Error(message)))
}
