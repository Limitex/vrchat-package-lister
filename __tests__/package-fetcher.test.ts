import { jest } from '@jest/globals'
import * as coreFixtures from '../__fixtures__/core.js'
import {
  mockFetch,
  resetFetchMocks,
  mockSuccessResponse,
  mockErrorResponse,
  mockNetworkError
} from '../__fixtures__/fetch.js'
import {
  mockReleaseAssets,
  mockInvalidReleaseAssets,
  mockRepositoryInfo,
  mockPackageV100,
  mockPackageV110,
  mockPackageWithDifferentName
} from '../__fixtures__/package-data.js'
import { ReleaseAssets, RepositoryPackageData } from '../src/types.js'

class MockGitHubReleaseClient {
  getMatchingAssetDownloadUrls =
    jest.fn<
      (
        owner: string,
        repo: string,
        pattern?: RegExp
      ) => Promise<ReleaseAssets[]>
    >()

  constructor() {
    this.getMatchingAssetDownloadUrls.mockResolvedValue([])
  }
}

const mockClient = new MockGitHubReleaseClient()

jest.unstable_mockModule('../src/github-release-client.js', () => ({
  GitHubReleaseClient: jest.fn().mockImplementation(() => mockClient)
}))

jest.unstable_mockModule('node-fetch', () => ({
  default: mockFetch
}))

jest.unstable_mockModule('@actions/core', () => coreFixtures)

const { PackageFetcher } = await import('../src/package-fetcher.js')

describe('PackageFetcher', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetFetchMocks()
    mockClient.getMatchingAssetDownloadUrls.mockReset()

    coreFixtures.debug.mockClear()
    coreFixtures.warning.mockClear()
    coreFixtures.error.mockClear()
  })

  describe('fetchRepositoryInfo', () => {
    test('returns repository info when valid releases are found', async () => {
      mockClient.getMatchingAssetDownloadUrls.mockResolvedValueOnce(
        mockReleaseAssets
      )

      const fetcher = new PackageFetcher('test-token')
      const result = await fetcher.fetchRepositoryInfo('testAuthor/testRepo')

      expect(result).toEqual(mockRepositoryInfo)
      expect(mockClient.getMatchingAssetDownloadUrls).toHaveBeenCalledWith(
        'testAuthor',
        'testRepo',
        /package\.json/
      )
      expect(coreFixtures.debug).toHaveBeenCalledWith(
        'Fetching repository information: testAuthor/testRepo'
      )
    })

    test('returns null when repository format is invalid', async () => {
      const fetcher = new PackageFetcher('test-token')
      const result = await fetcher.fetchRepositoryInfo('invalid-format')

      expect(result).toBeNull()
      expect(coreFixtures.warning).toHaveBeenCalledWith(
        'Invalid repository format: invalid-format'
      )
      expect(mockClient.getMatchingAssetDownloadUrls).not.toHaveBeenCalled()
    })

    test('returns null when no releases are found', async () => {
      mockClient.getMatchingAssetDownloadUrls.mockResolvedValueOnce([])

      const fetcher = new PackageFetcher('test-token')
      const result = await fetcher.fetchRepositoryInfo('testAuthor/testRepo')

      expect(result).toBeNull()
      expect(coreFixtures.warning).toHaveBeenCalledWith(
        'No releases found for testAuthor/testRepo'
      )
    })

    test('returns null when no valid targets are found', async () => {
      mockClient.getMatchingAssetDownloadUrls.mockResolvedValueOnce(
        mockInvalidReleaseAssets
      )

      const fetcher = new PackageFetcher('test-token')
      const result = await fetcher.fetchRepositoryInfo('testAuthor/testRepo')

      expect(result).toBeNull()
      expect(coreFixtures.warning).toHaveBeenCalledWith(
        'No valid targets found for testAuthor/testRepo'
      )
    })

    test('returns null and logs error when an exception occurs', async () => {
      mockClient.getMatchingAssetDownloadUrls.mockRejectedValueOnce(
        new Error('API error')
      )

      const fetcher = new PackageFetcher('test-token')
      const result = await fetcher.fetchRepositoryInfo('testAuthor/testRepo')

      expect(result).toBeNull()
      expect(coreFixtures.error).toHaveBeenCalledWith(
        'Error fetching repository info for testAuthor/testRepo: Error: API error'
      )
    })
  })

  describe('fetchRepositoryPackageData', () => {
    test('fetches package data successfully from multiple releases', async () => {
      mockSuccessResponse(mockPackageV100)
      mockSuccessResponse(mockPackageV110)

      const fetcher = new PackageFetcher('test-token')
      const result =
        await fetcher.fetchRepositoryPackageData(mockRepositoryInfo)

      expect(result).toEqual({
        packageNameId: 'com.test.package',
        packageJson: {
          '1.0.0': mockPackageV100,
          '1.1.0': mockPackageV110
        }
      })
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(coreFixtures.debug).toHaveBeenCalledWith(
        'Fetching package data for testAuthor/testRepo...'
      )
    })

    test('handles HTTP error when fetching package data', async () => {
      mockErrorResponse(404, 'Not Found')
      mockSuccessResponse(mockPackageV110)

      const fetcher = new PackageFetcher('test-token')
      const result =
        await fetcher.fetchRepositoryPackageData(mockRepositoryInfo)

      expect(result).toEqual({
        packageNameId: 'com.test.package',
        packageJson: {
          '1.1.0': mockPackageV110
        }
      })
      expect(coreFixtures.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to fetch https://example.com/author/repo/v1.0.0/package.json'
        )
      )
    })

    test('handles network error when fetching package data', async () => {
      mockSuccessResponse(mockPackageV100)
      mockNetworkError('Network failure')

      const fetcher = new PackageFetcher('test-token')
      const result =
        await fetcher.fetchRepositoryPackageData(mockRepositoryInfo)

      expect(result).toEqual({
        packageNameId: 'com.test.package',
        packageJson: {
          '1.0.0': mockPackageV100
        }
      })
      expect(coreFixtures.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to fetch https://example.com/author/repo/v1.1.0/package.json'
        )
      )
    })

    test('warns when package name is inconsistent across releases', async () => {
      mockSuccessResponse(mockPackageV100)
      mockSuccessResponse(mockPackageWithDifferentName)

      const fetcher = new PackageFetcher('test-token')
      const result =
        await fetcher.fetchRepositoryPackageData(mockRepositoryInfo)

      expect(result).toEqual({
        packageNameId: 'com.test.package',
        packageJson: {
          '1.0.0': mockPackageV100,
          '1.1.0': mockPackageWithDifferentName
        }
      })
      expect(coreFixtures.warning).toHaveBeenCalledWith(
        expect.stringContaining(
          'Package name is not consistent for testAuthor/testRepo'
        )
      )
    })

    test('returns null when no valid targets are provided', async () => {
      const fetcher = new PackageFetcher('test-token')
      const result = await fetcher.fetchRepositoryPackageData({
        ...mockRepositoryInfo,
        releases: []
      })

      expect(result).toBeNull()
      expect(coreFixtures.warning).toHaveBeenCalledWith(
        'No valid targets for testAuthor/testRepo'
      )
    })

    test('returns null when no package names are found', async () => {
      mockErrorResponse(404, 'Not Found')
      mockErrorResponse(404, 'Not Found')

      const fetcher = new PackageFetcher('test-token')
      const result =
        await fetcher.fetchRepositoryPackageData(mockRepositoryInfo)

      expect(result).toBeNull()
      expect(coreFixtures.warning).toHaveBeenCalledWith(
        'No package names found for testAuthor/testRepo'
      )
    })

    test('handles errors in Promise.all', async () => {
      resetFetchMocks()
      coreFixtures.error.mockClear()

      const testError = new Error('Promise.all failed')
      mockFetch.mockRejectedValue(testError)

      const fetcher = new PackageFetcher('test-token')
      const result =
        await fetcher.fetchRepositoryPackageData(mockRepositoryInfo)

      expect(result).toBeNull()

      expect(coreFixtures.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch')
      )
      expect(coreFixtures.error).toHaveBeenCalledWith(
        expect.stringContaining('Promise.all failed')
      )
    })

    test('trims "v" prefix from release tags', async () => {
      resetFetchMocks()

      mockSuccessResponse(mockPackageV100)
      mockSuccessResponse(mockPackageV110)

      const fetcher = new PackageFetcher('test-token')
      const result =
        await fetcher.fetchRepositoryPackageData(mockRepositoryInfo)

      expect(result).not.toBeNull()

      if (!result) return

      expect(Object.keys(result.packageJson)).toContain('1.0.0')
      expect(Object.keys(result.packageJson)).toContain('1.1.0')
      expect(Object.keys(result.packageJson)).not.toContain('v1.0.0')
      expect(Object.keys(result.packageJson)).not.toContain('v1.1.0')
    })

    test('handles case when packageNames.values().next().value is null', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({})
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({})
      })

      const fetcher = new PackageFetcher('test-token')
      const result =
        await fetcher.fetchRepositoryPackageData(mockRepositoryInfo)

      expect(result).toBeNull()
      expect(coreFixtures.warning).toHaveBeenCalledWith(
        'No package name found for testAuthor/testRepo'
      )
    })

    test('handles all fetch errors properly', async () => {
      resetFetchMocks()

      mockFetch.mockImplementation(() => {
        throw new Error('Network error')
      })

      const fetcher = new PackageFetcher('test-token')
      const result =
        await fetcher.fetchRepositoryPackageData(mockRepositoryInfo)

      expect(result).toBeNull()
      expect(coreFixtures.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch')
      )
      expect(coreFixtures.warning).toHaveBeenCalledWith(
        'No package names found for testAuthor/testRepo'
      )
    })

    test('handles catastrophic error in Promise.all execution', async () => {
      resetFetchMocks()
      coreFixtures.error.mockClear()

      const originalPromiseAll = Promise.all
      const mockPromiseAll = jest.fn().mockImplementationOnce(() => {
        throw new Error('Catastrophic Promise.all error')
      })

      // @ts-expect-error Mocking Promise.all for testing purposes
      Promise.all = mockPromiseAll

      try {
        const fetcher = new PackageFetcher('test-token')
        const result =
          await fetcher.fetchRepositoryPackageData(mockRepositoryInfo)

        expect(result).toBeNull()
        expect(coreFixtures.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Error fetching package data for testAuthor/testRepo: Error: Catastrophic Promise.all error'
          )
        )
      } finally {
        Promise.all = originalPromiseAll
      }
    })

    test('correctly handles both v-prefixed and non-v-prefixed tags', async () => {
      resetFetchMocks()

      const mockRepoInfoWithMixedTags = {
        ...mockRepositoryInfo,
        releases: [
          {
            tag: 'v1.0.0',
            url: 'https://example.com/author/repo/v1.0.0/package.json'
          },
          {
            tag: '2.0.0',
            url: 'https://example.com/author/repo/2.0.0/package.json'
          }
        ]
      }

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () =>
            Promise.resolve({
              ...mockPackageV100,
              version: '1.0.0'
            })
        })
      )

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () =>
            Promise.resolve({
              ...mockPackageV110,
              version: '2.0.0'
            })
        })
      )

      const fetcher = new PackageFetcher('test-token')
      const result = await fetcher.fetchRepositoryPackageData(
        mockRepoInfoWithMixedTags
      )

      expect(result).not.toBeNull()

      const packageData = result as RepositoryPackageData

      expect(Object.keys(packageData.packageJson)).toContain('1.0.0')
      expect(Object.keys(packageData.packageJson)).toContain('2.0.0')

      expect(Object.keys(packageData.packageJson)).not.toContain('v1.0.0')

      expect(packageData.packageJson['1.0.0']).toBeDefined()
      expect(packageData.packageJson['2.0.0']).toBeDefined()
    })
  })
})
