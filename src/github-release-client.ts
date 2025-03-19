import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'
import { Release, ReleaseAssets, GitHubClientOptions } from './types.js'

const DEFAULT_OPTIONS: GitHubClientOptions = {
  perPage: 100
}

export class GitHubReleaseClient {
  private octokit: Octokit
  private options: GitHubClientOptions

  constructor(options: GitHubClientOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.octokit = new Octokit({
      auth: this.options.token
    })
  }

  async getAllReleases(owner: string, repo: string): Promise<Release[]> {
    try {
      let page = 1
      const allReleases: Release[] = []

      while (true) {
        const { data } = await this.octokit.repos.listReleases({
          owner,
          repo,
          per_page: this.options.perPage,
          page
        })

        if (data.length === 0) break

        allReleases.push(...data)
        page++
      }

      return allReleases
    } catch (error) {
      core.error(`Failed to fetch releases for ${owner}/${repo}: ${error}`)
      throw new Error(
        `Failed to fetch releases: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  async getMatchingAssetDownloadUrls(
    owner: string,
    repo: string,
    pattern?: RegExp
  ): Promise<ReleaseAssets[]> {
    try {
      const releases = await this.getAllReleases(owner, repo)
      const result: ReleaseAssets[] = []

      for (const release of releases) {
        const tag = release.tag_name
        if (!tag) continue

        const matchedAssets = release.assets
          .filter((asset) => !pattern || pattern.test(asset.name))
          .map((asset) => ({
            name: asset.name,
            downloadUrl: asset.browser_download_url
          }))

        if (matchedAssets.length > 0) {
          result.push({ tag, assets: matchedAssets })
        }
      }

      return result
    } catch (error) {
      core.error(`Failed to get matching assets for ${owner}/${repo}: ${error}`)
      throw new Error(`Failed to get matching assets: ${error}`)
    }
  }
}
