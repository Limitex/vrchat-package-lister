import { VPMPackagesCollection } from '../src/types.js'

export const mockEmptyPackages: VPMPackagesCollection = {}

export const mockSinglePackage: VPMPackagesCollection = {
  'com.test.package': {
    versions: {
      '1.0.0': {
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
    }
  }
}

export const mockMultiplePackages: VPMPackagesCollection = {
  'com.test.package1': {
    versions: {
      '1.0.0': {
        name: 'com.test.package1',
        version: '1.0.0',
        displayName: 'Test Package 1',
        description: 'First test package',
        unity: '2019.4',
        unityRelease: '31f1',
        dependencies: {},
        keywords: ['test', 'package'],
        author: {
          name: 'Test Author',
          email: 'test@example.com',
          url: 'https://example.com'
        },
        documentationUrl: 'https://docs.example.com/package1',
        vpmDependencies: {},
        url: 'https://github.com/test/package1',
        license: 'MIT'
      },
      '1.1.0': {
        name: 'com.test.package1',
        version: '1.1.0',
        displayName: 'Test Package 1',
        description: 'First test package (updated)',
        unity: '2019.4',
        unityRelease: '31f1',
        dependencies: {},
        keywords: ['test', 'package', 'updated'],
        author: {
          name: 'Test Author',
          email: 'test@example.com',
          url: 'https://example.com'
        },
        documentationUrl: 'https://docs.example.com/package1',
        vpmDependencies: {},
        url: 'https://github.com/test/package1',
        license: 'MIT'
      }
    }
  },
  'com.test.package2': {
    versions: {
      '0.5.0': {
        name: 'com.test.package2',
        version: '0.5.0',
        displayName: 'Test Package 2',
        description: 'Second test package',
        unity: '2019.4',
        unityRelease: '31f1',
        dependencies: {},
        keywords: ['test', 'package', 'second'],
        author: {
          name: 'Test Author',
          email: 'test@example.com',
          url: 'https://example.com'
        },
        documentationUrl: 'https://docs.example.com/package2',
        vpmDependencies: {
          'com.test.package1': '1.0.0'
        },
        url: 'https://github.com/test/package2',
        license: 'MIT'
      }
    }
  }
}
