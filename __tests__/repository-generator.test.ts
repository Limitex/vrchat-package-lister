import { RepositoryGenerator } from '../src/repository-generator.js'
import {
  mockEmptyPackages,
  mockSinglePackage,
  mockMultiplePackages
} from '../__fixtures__/vpm-packages.js'

describe('RepositoryGenerator', () => {
  test('generates repository info with empty packages list', () => {
    const name = 'Test Repository'
    const id = 'com.test.repo'
    const url = 'https://test.example.com'
    const author = 'Test Author'

    const generator = new RepositoryGenerator(name, id, url, author)

    const result = generator.generateRepository(mockEmptyPackages)

    expect(result).toEqual({
      name,
      id,
      url,
      author,
      packages: mockEmptyPackages
    })
  })

  test('generates repository info with a single package', () => {
    const name = 'Test Repository'
    const id = 'com.test.repo'
    const url = 'https://test.example.com'
    const author = 'Test Author'

    const generator = new RepositoryGenerator(name, id, url, author)

    const result = generator.generateRepository(mockSinglePackage)

    expect(result).toEqual({
      name,
      id,
      url,
      author,
      packages: mockSinglePackage
    })

    expect(result.packages['com.test.package']).toBeDefined()
    expect(result.packages['com.test.package'].versions['1.0.0']).toBeDefined()
    expect(result.packages['com.test.package'].versions['1.0.0'].name).toBe(
      'com.test.package'
    )
  })

  test('generates repository info with multiple packages and versions', () => {
    const name = 'Test Repository'
    const id = 'com.test.repo'
    const url = 'https://test.example.com'
    const author = 'Test Author'

    const generator = new RepositoryGenerator(name, id, url, author)

    const result = generator.generateRepository(mockMultiplePackages)

    expect(result).toEqual({
      name,
      id,
      url,
      author,
      packages: mockMultiplePackages
    })

    expect(result.packages['com.test.package1']).toBeDefined()
    expect(result.packages['com.test.package2']).toBeDefined()

    expect(result.packages['com.test.package1'].versions['1.0.0']).toBeDefined()
    expect(result.packages['com.test.package1'].versions['1.1.0']).toBeDefined()

    expect(
      result.packages['com.test.package2'].versions['0.5.0'].vpmDependencies
    ).toEqual({
      'com.test.package1': '1.0.0'
    })
  })
})
