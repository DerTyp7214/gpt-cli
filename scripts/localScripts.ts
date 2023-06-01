import fs from 'fs/promises'
import path from 'path'

async function run() {
  const files = [
    'gpt-cli',
    'gpt-cli.cmd',
    'gpt-cli.ps1',
    'gpt-git',
    'gpt-git.cmd',
    'gpt-git.ps1',
  ]

  const nodePath = path.dirname(process.execPath)

  for (const file of files) {
    const filePath = path.join('localScripts', file)
    const newFilePath = path.join(nodePath, file)

    console.log(`Copying ${filePath} to ${newFilePath}`)
    await fs.copyFile(filePath, newFilePath)
  }
}

run()
