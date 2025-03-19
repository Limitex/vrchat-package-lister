/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import {
  RepositoryInfo,
  RepositoryPackageData,
  VPMPackage
} from '../src/types.js'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)

const mockWriteFile = jest.fn().mockImplementation(() => Promise.resolve())
jest.unstable_mockModule('../src/file-writer.js', () => ({
  FileWriter: {
    writeFile: mockWriteFile
  }
}))

const mockFetchRepositoryInfo = jest.fn<() => Promise<RepositoryInfo | null>>()
const mockFetchRepositoryPackageData =
  jest.fn<() => Promise<RepositoryPackageData | null>>()
jest.unstable_mockModule('../src/package-fetcher.js', () => ({
  PackageFetcher: jest.fn().mockImplementation(() => ({
    fetchRepositoryInfo: mockFetchRepositoryInfo,
    fetchRepositoryPackageData: mockFetchRepositoryPackageData
  }))
}))

const mockGenerateRepository = jest.fn()
const mockRepositoryGeneratorConstructor = jest.fn().mockImplementation(() => ({
  generateRepository: mockGenerateRepository
}))

jest.unstable_mockModule('../src/repository-generator.js', () => ({
  RepositoryGenerator: mockRepositoryGeneratorConstructor
}))

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

describe('main.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'token':
          return 'test-token'
        case 'package-title':
          return 'Test Package'
        case 'package-author':
          return 'Test Author'
        case 'package-id':
          return 'com.test.package'
        case 'package-url':
          return 'https://example.com/test'
        case 'repositories':
          return 'testAuthor/testRepo'
        case 'path':
          return 'output/vpm.json'
        case 'minified':
          return 'false'
        default:
          return ''
      }
    })

    mockFetchRepositoryInfo.mockResolvedValue({
      author: 'testAuthor',
      repo: 'testRepo',
      releases: []
    } as RepositoryInfo)

    const mockPackage: Partial<VPMPackage> = {
      name: 'com.test.package'
    }

    mockFetchRepositoryPackageData.mockResolvedValue({
      packageNameId: 'com.test.package',
      packageJson: { '1.0.0': mockPackage as VPMPackage }
    } as RepositoryPackageData)

    mockGenerateRepository.mockReturnValue({
      name: 'Test Package',
      id: 'com.test.package',
      url: 'https://example.com/test',
      author: 'Test Author',
      packages: {}
    })
  })

  test('sets debug messages for the workflow', async () => {
    await run()

    expect(core.debug).toHaveBeenCalledWith(
      'Starting VPM repository generation...'
    )
    expect(core.debug).toHaveBeenCalledWith('Fetching package information...')

    expect(core.debug).toHaveBeenCalledWith('Generating JSON...')
    expect(core.debug).toHaveBeenCalledWith('Generating JSON... Done')
  })

  test('filters out null repository infos', async () => {
    mockFetchRepositoryInfo.mockResolvedValueOnce(null).mockResolvedValueOnce({
      author: 'testAuthor',
      repo: 'testRepo',
      releases: []
    } as RepositoryInfo)

    const baseImplementation = core.getInput.getMockImplementation()
    core.getInput.mockImplementation((name) => {
      if (name === 'repositories') return 'nullRepo/test,testAuthor/testRepo'
      return baseImplementation ? baseImplementation(name) : ''
    })

    await run()

    expect(mockFetchRepositoryInfo).toHaveBeenCalledTimes(2)
    expect(mockFetchRepositoryPackageData).toHaveBeenCalledTimes(1)
  })

  test('filters out null package data results', async () => {
    const mockPackage: Partial<VPMPackage> = {
      name: 'com.test.package'
    }

    mockFetchRepositoryPackageData
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        packageNameId: 'com.test.package',
        packageJson: { '1.0.0': mockPackage as VPMPackage }
      } as RepositoryPackageData)

    mockFetchRepositoryInfo
      .mockResolvedValueOnce({
        author: 'testAuthor1',
        repo: 'testRepo1',
        releases: []
      } as RepositoryInfo)
      .mockResolvedValueOnce({
        author: 'testAuthor2',
        repo: 'testRepo2',
        releases: []
      } as RepositoryInfo)

    const baseImplementation = core.getInput.getMockImplementation()
    core.getInput.mockImplementation((name) => {
      if (name === 'repositories')
        return 'testAuthor1/testRepo1,testAuthor2/testRepo2'
      return baseImplementation ? baseImplementation(name) : ''
    })

    await run()

    expect(mockFetchRepositoryPackageData).toHaveBeenCalledTimes(2)
    expect(mockGenerateRepository).toHaveBeenCalledWith(expect.any(Object))
  })

  test('creates RepositoryGenerator with correct params and calls generateRepository', async () => {
    await run()

    expect(mockRepositoryGeneratorConstructor).toHaveBeenCalledWith(
      'Test Package', // packageTitle
      'com.test.package', // packageId
      'https://example.com/test', // packageUrl
      'Test Author' // packageAuthor
    )

    expect(mockGenerateRepository).toHaveBeenCalled()
  })

  test('formats JSON with indentation when minified=false', async () => {
    const baseImplementation = core.getInput.getMockImplementation()
    core.getInput.mockImplementation((name) => {
      if (name === 'minified') return 'false'
      return baseImplementation ? baseImplementation(name) : ''
    })

    await run()

    expect(core.setOutput).toHaveBeenCalledWith('package', expect.any(String))

    expect(mockWriteFile).toHaveBeenCalledWith(
      'output/vpm.json',
      expect.any(String)
    )
  })

  test('formats JSON without indentation when minified=true', async () => {
    const baseImplementation = core.getInput.getMockImplementation()
    core.getInput.mockImplementation((name) => {
      if (name === 'minified') return 'true'
      return baseImplementation ? baseImplementation(name) : ''
    })

    const mockResult = {
      name: 'Test Package',
      id: 'com.test.package'
    }

    mockGenerateRepository.mockReturnValue(mockResult)

    await run()

    expect(core.setOutput).toHaveBeenCalledWith(
      'package',
      expect.not.stringContaining('\n')
    )

    expect(mockWriteFile).toHaveBeenCalledWith(
      'output/vpm.json',
      expect.not.stringContaining('\n')
    )
  })

  test('skips file creation when path is empty', async () => {
    const baseImplementation = core.getInput.getMockImplementation()
    core.getInput.mockImplementation((name) => {
      if (name === 'path') return ''
      return baseImplementation ? baseImplementation(name) : ''
    })

    await run()

    expect(mockWriteFile).not.toHaveBeenCalled()
    expect(core.debug).toHaveBeenCalledWith(
      'No path specified, skipping file creation'
    )
  })

  test('handles file write errors', async () => {
    mockWriteFile.mockRejectedValueOnce(new Error('File write error') as never)

    await run()

    expect(mockWriteFile).toHaveBeenCalled()
    expect(core.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to write file')
    )
  })

  test('calls setFailed when an error is thrown', async () => {
    const testError = new Error('Test error message')
    mockFetchRepositoryInfo.mockRejectedValueOnce(testError)

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('Test error message')
  })

  test('handles non-Error objects in catch block', async () => {
    mockFetchRepositoryInfo.mockRejectedValueOnce('String error message')

    await run()

    expect(core.setFailed).not.toHaveBeenCalled()
  })
})
