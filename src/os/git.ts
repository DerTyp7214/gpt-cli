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
