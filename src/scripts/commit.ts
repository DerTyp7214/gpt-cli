#!/usr/bin/env node
import chalk from 'chalk'
import { spawn } from 'child_process'
import inquirer from 'inquirer'
import Os from 'os'
import ChatGpt from '../gpt/api.js'
import {
  getAllFiles,
  getCreatedFiles,
  getCurrentBranch,
  getDeletedFiles,
  getDiff,
  isGitRepo,
} from '../os/git.js'
import { buildGitCommands, parseCommand } from '../utils.js'

const chatGpt = new ChatGpt()

const specifications = [
  'give me a description of these changes if possible in less than 50 characters using gitmoji',
]

async function buildGitInfoHeader() {
  return [
    `OS: ${Os.type()} ${Os.release()}`,
    `Current Directory: ${process.cwd()}`,
    `Username: ${Os.userInfo().username}`,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

async function buildQuery(files: string[]) {
  const [currentBranch, diffs, created, deleted] = await Promise.all([
    getCurrentBranch(),
    getDiff(files),
    getCreatedFiles(),
    getDeletedFiles(),
  ])

  return `
    System Info:
    ${await buildGitInfoHeader()}

    Git Info:
    ${
      currentBranch
        ? `Current Branch:\n    ${currentBranch}\n`
        : 'No Current Branch'
    }

${specifications.map((specification) => `    ${specification}`).join('\n')}

    ${created.length > 0 ? `Created Files:\n    ${created.join('\n    ')}` : ''}
    ${deleted.length > 0 ? `Deleted Files:\n    ${deleted.join('\n    ')}` : ''}

    Diff:
    ${diffs}

  `.trim()
}

async function ask(
  files: string[],
  question: string,
  history: string[] = []
): Promise<string | boolean> {
  const response = await chatGpt.query(question, history)

  if (!response) {
    return false
  }

  if (response.length === 0) {
    return false
  }

  const command = buildGitCommands(files, response[0], false)
  const commandWithPush = buildGitCommands(files, response[0], true)

  console.log('')
  console.log(chalk.magentaBright('Without push:'))
  console.log(parseCommand(command))
  console.log('')
  console.log(chalk.magentaBright('With push:'))
  console.log(parseCommand(commandWithPush))
  console.log('')

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'answer',
      message: '🤖',
      prefix: '',
      choices: [
        { name: 'Commit', value: 'commit' },
        { name: 'Commit and push', value: 'commit-push' },
        { type: 'separator', name: 'Other' },
        { name: 'Specify a new response', value: 'internal-new' },
        { name: 'Exit', value: 'internal-exit' },
      ],
    },
  ])

  if (answers.answer === 'internal-exit') {
    return true
  }

  if (answers.answer === 'internal-new') {
    const newQuestion = await inquirer.prompt([
      {
        type: 'input',
        name: 'question',
        message: 'Enter a new question:',
      },
    ])

    return ask(files, newQuestion.question, [...history, question])
  }

  if (answers.answer === 'commit') {
    return command
  }

  return commandWithPush
}

async function runCommand(command: string, files: string[] = []) {
  const child = spawn(command, {
    stdio: 'inherit',
    shell: true,
  })

  let output = ''

  child.stdout?.on('data', (data) => {
    output += data
  })

  child.stderr?.on('data', (data) => {
    output += data
  })

  await new Promise((resolve, rejects) => {
    child.on('exit', (code) => {
      if (code === 0) resolve(code)
      else rejects(code)
    })
  }).catch(async (code) => {
    if (code === 1) {
      const prompt = await inquirer.prompt([
        {
          type: 'list',
          name: 'answer',
          message: 'Ask again?',
          choices: ['Yes', 'No'],
        },
      ])

      if (prompt.answer === 'Yes') {
        const answer = await ask(
          files,
          [output, ...specifications].join('\n'),
          [command]
        )

        if (!answer) {
          console.log(chalk.red('No answer provided!'))
          process.exit(1)
        }

        if (answer === true) {
          process.exit(0)
        }

        await runCommand(answer, files)
      }

      return
    }
  })
}

async function run() {
  const args = process.argv.slice(2)

  const files = args.length > 0 ? args : await getAllFiles()

  if (!(await isGitRepo())) {
    console.log(chalk.red('Not a git repository!'))
    process.exit(1)
  }

  const answer = await ask(files, await buildQuery(files))

  if (!answer) {
    console.log(chalk.red('No answer provided!'))
    process.exit(1)
  }

  if (answer === true) {
    process.exit(0)
  }

  console.log(
    `\n\n${chalk.magentaBright('Running')}:\n${parseCommand(answer)}\n`
  )
  await runCommand(answer)
}

run()
