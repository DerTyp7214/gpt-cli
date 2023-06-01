import findProcess from 'find-process'
import Os, { UserInfo } from 'os'

export interface SystemInfo {
  os: string
  osVersion: string
  shell?: string
  shellExecutable?: [string, string]
  currentDirectory: string
  time: string
  date: string
  username: string
}

async function getShell(): Promise<[string, string]> {
  if (process.platform !== 'win32') {
    return [process.env.SHELL ?? 'Unknown', process.env.SHELL ?? 'Unknown']
  }
  try {
    let lastShell: string | undefined = undefined
    let lastShellBin: string | undefined = undefined
    const pidTest = async (pid?: number) => {
      if (!pid) return
      const list = await findProcess('pid', pid ?? 0, false)
      if (list.length === 0) {
        return
      }
      const shell = list[0].name
      if (
        ['powershell.exe', 'pwsh.exe', 'node.exe', 'cmd.exe'].includes(shell)
      ) {
        lastShell = shell
        lastShellBin = (list[0] as any).bin
      } else return
      await pidTest(list[0]?.ppid)
    }
    await pidTest(process.pid)
    lastShell = lastShell ?? process.env.ComSpec ?? 'Unknown'
    return [lastShell, lastShellBin ?? lastShell]
  } catch (error) {
    return [process.env.ComSpec ?? 'Unknown', process.env.ComSpec ?? 'Unknown']
  }
}

async function getCurrentShell(
  userInfo: UserInfo<string>,
  shellExecutable: string
): Promise<string> {
  const shell = process.env.SHELL ?? userInfo.shell
  if (!shell) {
    return shellExecutable === 'pwsh.exe' ||
      shellExecutable === 'powershell.exe'
      ? 'PowerShell'
      : process.env.ComSpec ?? 'Unknown'
  }

  return shell
}

export async function getSystemInfo(): Promise<SystemInfo> {
  const userInfo = Os.userInfo()

  const fetchShell = process.env.GPT_FETCH_SHELL

  const os = Os.type()
  const osVersion = Os.release()
  const shellExecutable = fetchShell ? await getShell() : undefined
  const shell =
    fetchShell && shellExecutable
      ? await getCurrentShell(userInfo, shellExecutable[0])
      : undefined
  const currentDirectory = process.cwd()
  const time = new Date().toLocaleTimeString()
  const date = new Date().toLocaleDateString()
  const username = userInfo.username

  return {
    os,
    osVersion,
    shell,
    shellExecutable,
    currentDirectory,
    time,
    date,
    username,
  }
}
