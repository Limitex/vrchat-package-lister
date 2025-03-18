import { VPMRepositoryInfo, VPMPackagesCollection } from './types.js'

export class RepositoryGenerator {
  private name: string
  private id: string
  private url: string
  private author: string

  constructor(name: string, id: string, url: string, author: string) {
    this.name = name
    this.id = id
    this.url = url
    this.author = author
  }

  generateRepository(packagesList: VPMPackagesCollection): VPMRepositoryInfo {
    return {
      name: this.name,
      id: this.id,
      url: this.url,
      author: this.author,
      packages: packagesList
    }
  }
}
