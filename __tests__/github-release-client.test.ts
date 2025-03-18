import { jest } from '@jest/globals'
import {
  OctokitMock,
  mockListReleases,
  resetOctokitMocks,
  createTestReleases
} from '../__fixtures__/octokit.js'

// Set up module mocks
jest.unstable_mockModule('@octokit/rest', () => ({
  Octokit: OctokitMock
}))

// Mock @actions/core
const mockCoreError = jest.fn()
jest.unstable_mockModule('@actions/core', () => ({
  error: mockCoreError
}))

// Import the module after setting up mocks
const { GitHubReleaseClient } = await import('../src/github-release-client')

describe('GitHubReleaseClient', () => {
  beforeEach(() => {
    resetOctokitMocks()
    mockCoreError.mockClear()
  })

  test('getAllReleases retrieves releases across multiple pages', async () => {
    // First page returns releases, second page is empty
    mockListReleases
      .mockResolvedValueOnce({ data: [{ tag_name: 'v1.0.0', assets: [] }] })
      .mockResolvedValueOnce({ data: [] })

    const client = new GitHubReleaseClient()
    const releases = await client.getAllReleases('testOwner', 'testRepo')

    expect(mockListReleases).toHaveBeenCalledTimes(2)
    expect(releases).toHaveLength(1)
    expect(releases[0].tag_name).toBe('v1.0.0')
  })

  test('getAllReleases handles empty first page responses', async () => {
    // First page is empty already
    mockListReleases.mockResolvedValueOnce({ data: [] })

    const client = new GitHubReleaseClient()
    const releases = await client.getAllReleases('testOwner', 'testRepo')

    expect(mockListReleases).toHaveBeenCalledTimes(1)
    expect(releases).toHaveLength(0)
  })

  test('getMatchingAssetDownloadUrls returns correct asset URLs', async () => {
    const fakeReleases = createTestReleases()

    mockListReleases
      .mockResolvedValueOnce({ data: fakeReleases })
      .mockResolvedValueOnce({ data: [] })

    const client = new GitHubReleaseClient()
    const pattern = /\.zip$/
    const assetUrls = await client.getMatchingAssetDownloadUrls(
      'testOwner',
      'testRepo',
      pattern
    )

    expect(assetUrls).toEqual([
      {
        tag: 'v1.0.0',
        assets: [
          {
            name: 'file1.zip',
            downloadUrl: 'http://example.com/file1.zip'
          }
        ]
      },
      {
        tag: 'v1.1.0',
        assets: [
          {
            name: 'file2.zip',
            downloadUrl: 'http://example.com/file2.zip'
          }
        ]
      }
    ])
  })

  test('getAllReleases throws an error when Octokit fails', async () => {
    const errorMessage = 'Network error'
    mockListReleases.mockRejectedValue(new Error(errorMessage))
    const client = new GitHubReleaseClient()

    await expect(
      client.getAllReleases('testOwner', 'testRepo')
    ).rejects.toThrow(errorMessage)

    expect(mockCoreError).toHaveBeenCalled()
    expect(mockCoreError.mock.calls[0][0]).toContain('Failed to fetch releases')
    expect(mockCoreError.mock.calls[0][0]).toContain(errorMessage)
  })

  test('getMatchingAssetDownloadUrls throws an error when getAllReleases fails', async () => {
    const errorMessage = 'API failure'
    mockListReleases.mockRejectedValue(new Error(errorMessage))
    const client = new GitHubReleaseClient()
    const pattern = /\.zip$/

    await expect(
      client.getMatchingAssetDownloadUrls('testOwner', 'testRepo', pattern)
    ).rejects.toThrow(errorMessage)

    expect(mockCoreError).toHaveBeenCalled()
    expect(mockCoreError.mock.calls[0][0]).toContain('Failed to fetch releases')
    expect(mockCoreError.mock.calls[0][0]).toContain(errorMessage)
  })

  test('getAllReleases handles non-Error objects in catch block', async () => {
    const errorObj = 'String error'
    mockListReleases.mockRejectedValue(errorObj)
    const client = new GitHubReleaseClient()

    await expect(
      client.getAllReleases('testOwner', 'testRepo')
    ).rejects.toThrow('Failed to fetch releases: String error')

    expect(mockCoreError).toHaveBeenCalled()
  })
})
