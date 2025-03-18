import * as fs from 'fs'
import pathModule from 'node:path'
import * as core from '@actions/core'

export class FileWriter {
  static async writeFile(outputPath: string, content: string): Promise<void> {
    try {
      const dir = pathModule.dirname(outputPath)
      await fs.promises.mkdir(dir, { recursive: true })
      await fs.promises.writeFile(outputPath, content)
      core.debug(`File written successfully at ${outputPath}`)
    } catch (err) {
      core.error(
        `Failed to create file at ${outputPath}: ${
          err instanceof Error ? err.message : String(err)
        }`
      )
      throw err
    }
  }
}
