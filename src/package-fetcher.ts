import * as core from '@actions/core'
import fetch from 'node-fetch'
import { GitHubReleaseClient } from './github-release-client.js'
import {
  RepositoryInfo,
  ReleaseTarget,
  VPMPackage,
  RepositoryPackageData,
  VPMPackageVersions
} from './types.js'

export class PackageFetcher {
  private client: GitHubReleaseClient

  constructor(token: string) {
    this.client = new GitHubReleaseClient({ token })
  }

  async fetchRepositoryInfo(
    repoString: string
  ): Promise<RepositoryInfo | null> {
    const [author, repo] = repoString.split('/')
    if (!author || !repo) {
      core.warning(`Invalid repository format: ${repoString}`)
      return null
    }

    core.debug(`Fetching repository information: ${author}/${repo}`)

    try {
      const releases = await this.client.getMatchingAssetDownloadUrls(
        author,
        repo,
        /package\.json/
      )

      if (releases.length === 0) {
        core.warning(`No releases found for ${author}/${repo}`)
        return null
      }

      const targets: ReleaseTarget[] = releases
        .filter((release) => release.tag && release.assets[0]?.downloadUrl)
        .map((release) => ({
          tag: release.tag,
          url: release.assets[0].downloadUrl
        }))

      if (targets.length === 0) {
        core.warning(`No valid targets found for ${author}/${repo}`)
        return null
      }

      return { author, repo, releases: targets }
    } catch (error) {
      core.error(
        `Error fetching repository info for ${author}/${repo}: ${error}`
      )
      return null
    }
  }

  async fetchRepositoryPackageData(
    repositoryInfo: RepositoryInfo
  ): Promise<RepositoryPackageData | null> {
    const { author, repo, releases } = repositoryInfo
    const validTargets = releases.filter((t) => t.tag && t.url)

    if (validTargets.length === 0) {
      core.warning(`No valid targets for ${author}/${repo}`)
      return null
    }

    core.debug(`Fetching package data for ${author}/${repo}...`)

    const packageNames = new Set<string>()
    const packageVersions: VPMPackageVersions = {}

    try {
      const fetchPromises = validTargets.map(async (target, index) => {
        try {
          core.debug(
            `(${index + 1}/${validTargets.length}) Fetching ${target.url}`
          )
          const response = await fetch(target.url)
          if (!response.ok) {
            throw new Error(
              `Failed to fetch: ${response.status} ${response.statusText}`
            )
          }
          core.debug(`Fetched ${target.url}`)
          const data = (await response.json()) as VPMPackage
          return { tag: target.tag, data }
        } catch (error) {
          core.error(`Failed to fetch ${target.url}: ${error}`)
          return null
        }
      })

      const results = await Promise.all(fetchPromises)
      results.forEach((result) => {
        if (result) {
          const tag = result.tag.startsWith('v')
            ? result.tag.substring(1)
            : result.tag
          packageVersions[tag] = result.data
          packageNames.add(result.data.name)
        }
      })
    } catch (error) {
      core.error(`Error fetching package data for ${author}/${repo}: ${error}`)
      return null
    } finally {
      core.debug(`Fetching package data for ${author}/${repo}... Done`)
    }

    if (packageNames.size === 0) {
      core.warning(`No package names found for ${author}/${repo}`)
      return null
    }

    if (packageNames.size > 1) {
      core.warning(
        `Package name is not consistent for ${author}/${repo}: ${Array.from(
          packageNames
        ).join(', ')}`
      )
    }

    const packageNameId = packageNames.values().next().value
    if (!packageNameId) {
      core.warning(`No package name found for ${author}/${repo}`)
      return null
    }

    return { packageNameId, packageJson: packageVersions }
  }
}
