import fs from 'fs/promises'
import simpleGit from 'simple-git'

const git = simpleGit()

export async function isGitRepo(): Promise<boolean> {
  try {
    await git.status()
    return true
  } catch (error) {
    return false
  }
}

export async function getChangedFiles(): Promise<string[]> {
  const status = await git.status()
  return status.files.map((file) => `${file.index} ${file.path}`)
}

export async function getStagedFiles(): Promise<string[]> {
  const status = await git.status()
  return status.staged
}

export async function getRemotes(): Promise<string[]> {
  const remotes = await git.getRemotes(true)
  return remotes.map((remote) => remote.refs.push)
}

export async function getBranches(): Promise<string[]> {
  const branches = await git.branch()
  return branches.all
}

export async function getTags(): Promise<string[]> {
  const tags = await git.tags()
  return tags.all
}

export async function getCurrentBranch(): Promise<string> {
  const branches = await git.branch()
  return branches.current
}

export async function getDiff(files: string[]): Promise<string> {
  const diff = await git.diff(files)
  return diff
}

export async function getAllFiles(): Promise<string[]> {
  const status = await git.status()
  return status.files.map((file) => file.path)
}

export async function getCreatedFiles(
  fullDiff: boolean = false
): Promise<string[]> {
  const status = await git.status()
  if (fullDiff) {
    return await Promise.all(
      status.created.map(async (file) => {
        const content = await fs.readFile(file, 'utf8')
        return `${file}\n${content}`
      })
    )
  }
  return status.created
}

export async function getDeletedFiles(
  fullDiff: boolean = false
): Promise<string[]> {
  const status = await git.status()
  if (fullDiff) {
    return await Promise.all(
      status.deleted.map(async (file) => {
        const content = await fs.readFile(file, 'utf8')
        return `${file}\n${content}`
      })
    )
  }
  return status.deleted
}
