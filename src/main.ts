import * as core from '@actions/core'

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
    const path = core.getInput('path', { required: false })
    const minified = core.getInput('minified', { required: false })

    core.debug('token:' + token)
    core.debug('package-title:' + packageTitle)
    core.debug('package-author:' + packageAuthor)
    core.debug('package-id:' + packageId)
    core.debug('package-url:' + packageUrl)
    core.debug('repositories:' + repositories)
    core.debug('path:' + path)
    core.debug('minified:' + minified)

    core.debug('Run action')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
