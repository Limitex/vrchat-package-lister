import { VPMPackage, RepositoryInfo, ReleaseAssets } from '../src/types.js'

export const mockReleaseAssets: ReleaseAssets[] = [
  {
    tag: 'v1.0.0',
    assets: [
      {
        name: 'package.json',
        downloadUrl: 'https://example.com/author/repo/v1.0.0/package.json'
      }
    ]
  },
  {
    tag: 'v1.1.0',
    assets: [
      {
        name: 'package.json',
        downloadUrl: 'https://example.com/author/repo/v1.1.0/package.json'
      }
    ]
  }
]

export const mockEmptyReleaseAssets: ReleaseAssets[] = []

export const mockInvalidReleaseAssets: ReleaseAssets[] = [
  {
    tag: '',
    assets: []
  }
]

export const mockRepositoryInfo: RepositoryInfo = {
  author: 'testAuthor',
  repo: 'testRepo',
  releases: [
    {
      tag: 'v1.0.0',
      url: 'https://example.com/author/repo/v1.0.0/package.json'
    },
    {
      tag: 'v1.1.0',
      url: 'https://example.com/author/repo/v1.1.0/package.json'
    }
  ]
}

export const mockPackageV100: VPMPackage = {
  name: 'com.test.package',
  version: '1.0.0',
  displayName: 'Test Package',
  description: 'A test package',
  unity: '2019.4',
  unityRelease: '31f1',
  dependencies: {},
  keywords: ['test', 'package'],
  author: {
    name: 'Test Author',
    email: 'test@example.com',
    url: 'https://example.com'
  },
  documentationUrl: 'https://docs.example.com',
  vpmDependencies: {},
  url: 'https://github.com/test/package',
  license: 'MIT'
}

export const mockPackageV110: VPMPackage = {
  name: 'com.test.package',
  version: '1.1.0',
  displayName: 'Test Package',
  description: 'Updated test package',
  unity: '2019.4',
  unityRelease: '31f1',
  dependencies: {},
  keywords: ['test', 'package', 'updated'],
  author: {
    name: 'Test Author',
    email: 'test@example.com',
    url: 'https://example.com'
  },
  documentationUrl: 'https://docs.example.com',
  vpmDependencies: {},
  url: 'https://github.com/test/package',
  license: 'MIT'
}

export const mockPackageWithDifferentName: VPMPackage = {
  name: 'com.test.different-package',
  version: '1.0.0',
  displayName: 'Different Test Package',
  description: 'A different test package',
  unity: '2019.4',
  unityRelease: '31f1',
  dependencies: {},
  keywords: ['test', 'package'],
  author: {
    name: 'Test Author',
    email: 'test@example.com',
    url: 'https://example.com'
  },
  documentationUrl: 'https://docs.example.com',
  vpmDependencies: {},
  url: 'https://github.com/test/package',
  license: 'MIT'
}
