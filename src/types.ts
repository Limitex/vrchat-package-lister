import { RestEndpointMethodTypes } from '@octokit/rest'

export type RepositoryInfo = {
  author: string
  repo: string
  releases: ReleaseTarget[]
}

export type ReleaseTarget = {
  tag: string
  url: string
}

export type VPMPackage = {
  name: string
  version: string
  displayName: string
  description: string
  unity: string
  unityRelease: string
  dependencies: { [key: string]: string }
  keywords: string[]
  author: {
    name: string
    email: string
    url: string
  }
  documentationUrl: string
  vpmDependencies: { [key: string]: string }
  url: string
  license: string
}

export type VPMPackageVersions = { [version: string]: VPMPackage }

export type VPMPackagesCollection = {
  [packageName: string]: {
    versions: VPMPackageVersions
  }
}

export type RepositoryPackageData = {
  packageNameId: string
  packageJson: VPMPackageVersions
}

export type VPMRepositoryInfo = {
  name: string
  id: string
  url: string
  author: string
  packages: VPMPackagesCollection
}

export type Release =
  RestEndpointMethodTypes['repos']['listReleases']['response']['data'][number]

export type ReleaseAssets = {
  tag: string
  assets: AssetInfo[]
}

export type GitHubClientOptions = {
  perPage?: number
  token?: string
}

export type AssetInfo = {
  name: string
  downloadUrl: string
}
