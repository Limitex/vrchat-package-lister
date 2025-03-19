import * as core from '@actions/core'
import { PackageFetcher } from './package-fetcher.js'
import { RepositoryGenerator } from './repository-generator.js'
import {
  RepositoryInfo,
  RepositoryPackageData,
  VPMPackagesCollection
} from './types.js'
import { FileWriter } from './file-writer.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const token = core.getInput('token', { required: true })
    const packageTitle = core.getInput('package-title', { required: true })
    const packageAuthor = core.getInput('package-author', { required: true })
    const packageId = core.getInput('package-id', { required: true })
    const packageUrl = core.getInput('package-url', { required: true })
    const repositories = core.getInput('repositories', { required: true })
    const outoutDir = core.getInput('output', { required: true })
    const filename = core.getInput('filename', { required: true })
    const minified =
      core.getInput('minified', { required: false }).toLowerCase() === 'true'

    core.debug('Starting VPM repository generation...')

    const packageFetcher = new PackageFetcher(token)

    core.debug('Fetching package information...')
    const packageInfoPromises = repositories
      .split(',')
      .map(async (repoString) =>
        packageFetcher.fetchRepositoryInfo(repoString.trim())
      )

    const packageInfoResults = await Promise.all(packageInfoPromises)
    const packageInfos = packageInfoResults.filter(
      (info): info is RepositoryInfo => info !== null
    )
    core.debug('Fetching package information... Done')

    core.debug('Fetching package data...')
    const packageDataPromises = packageInfos.map((packageInfo) =>
      packageFetcher.fetchRepositoryPackageData(packageInfo)
    )

    const packageDataResults = await Promise.all(packageDataPromises)
    const packageDataList = packageDataResults.filter(
      (data): data is RepositoryPackageData => data !== null
    )
    core.debug('Fetching package data... Done')

    core.debug('Generating JSON...')
    const packagesList: VPMPackagesCollection = {}
    packageDataList.forEach((data) => {
      packagesList[data.packageNameId] = {
        versions: data.packageJson
      }
    })

    const repositoryGenerator = new RepositoryGenerator(
      packageTitle,
      packageId,
      packageUrl,
      packageAuthor
    )

    const result = repositoryGenerator.generateRepository(packagesList)
    const output = minified
      ? JSON.stringify(result)
      : JSON.stringify(result, null, 2)

    core.setOutput('package', output)

    const filePath = FileWriter.getFilePath(outoutDir, filename)

    if (filePath !== '') {
      try {
        await FileWriter.writeFile(filePath, output)
        core.setOutput('output', outoutDir)
        core.setOutput('filename', filename)
        core.setOutput('path', filePath)
      } catch (err) {
        core.error(`Failed to write file to ${filePath}: ${err}`)
      }
    } else {
      core.debug('No path specified, skipping file creation')
    }

    core.debug('Generating JSON... Done')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
