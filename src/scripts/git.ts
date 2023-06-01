#! /usr/bin/env node

import chalk from 'chalk'
import { spawn } from 'child_process'
import inquirer from 'inquirer'
import Os from 'os'
import ChatGpt from '../gpt/api.js'
import {
  getBranches,
  getChangedFiles,
  getCurrentBranch,
  getRemotes,
  getStagedFiles,
  getTags,
} from '../os/git.js'

const chatGpt = new ChatGpt()

const specifications = [
  'Just give me the direct answer, no explanation needed.',
  'Dont come with "it depends" or "it is not possible" or "im just a bot".',
  'Do not include the question in the answer.',
  'Do not put the answer in a code block.',
  'No "Answer:" or "Output:" or "Command:" or anything else.',
  'No "The answer is:" or "The output is:" or anything else.',
  'This is only for git related questions.',
  'Use the information of username and git info to answer the question. You dont need access to the machine to answer the question. I gave you all the information you need.',
  'You can use gitmoji to generate a commit message.',
  'I want a command line answer, not a script.',
  'It can be multiple commands, but append them with &&.',
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

async function buildQuery(query: string) {
  const [changedFiles, staged, remotes, branches, currentBranch, tags] =
    await Promise.all([
      getChangedFiles(),
      getStagedFiles(),
      getRemotes(),
      getBranches(),
      getCurrentBranch(),
      getTags(),
    ])

  return `
    System Info:
    ${await buildGitInfoHeader()}

    Git Info:
    ${
      changedFiles.length > 0
        ? `Changed Files:\n    ${changedFiles.join('\n    ')}\n`
        : 'No Changed Files'
    }
    ${
      staged.length > 0
        ? `Staged Files:\n    ${staged.join('\n    ')}\n`
        : 'Changed Files have to be staged first.'
    }
    ${
      remotes.length > 0
        ? `Remotes:\n    ${remotes.join('\n    ')}\n`
        : 'No Remotes'
    }
    ${
      branches.length > 0
        ? `Branches:\n    ${branches.join('\n    ')}\n`
        : 'No Branches'
    }
    ${
      currentBranch
        ? `Current Branch:\n    ${currentBranch}\n`
        : 'No Current Branch'
    }
    ${tags.length > 0 ? `Tags:\n    ${tags.join('\n    ')}\n` : 'No Tags'}

    Wanted Answer:
${specifications.map((specification) => `    ${specification}`).join('\n')}
    
${query.startsWith('Error:') ? '' : 'Question:'}
    ${query}
  `.trim()
}

async function ask(
  question: string,
  history: string[] = []
): Promise<string | boolean> {
  const response = await chatGpt.query(question, history)

  if (!response) {
    return false
  }

  if (response.length === 0) {
    return false
  } else if (response.length === 1) {
    const answer = response[0]

    if (answer.split('\n').length > 1) {
      console.log(answer)
      process.exit(0)
    }
  }
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'answer',
      message: 'Select a response:',
      choices: [
        ...response.map((response) => ({
          name: response,
          value: response,
        })),
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

    return ask(newQuestion.question, [...history, question])
  }

  return answers.answer
}

async function runCommand(command: string) {
  console.log('\n')
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
          [buildQuery(`Error: ${output}`), ...specifications].join('\n'),
          [command]
        )

        if (!answer) {
          console.log(chalk.red('No answer provided!'))
          process.exit(1)
        }

        if (answer === true) {
          process.exit(0)
        }

        await runCommand(answer)
      }

      return
    }
  })
}

async function run() {
  const args = process.argv.slice(2)
  const argsString = args.join(' ')

  if (args.length === 0) {
    console.log(chalk.red('No arguments provided!'))
    process.exit(1)
  }

  const answer = await ask(await buildQuery(argsString))

  if (!answer) {
    console.log(chalk.red('No answer provided!'))
    process.exit(1)
  }

  if (answer === true) {
    process.exit(0)
  }

  await runCommand(answer)
}

run()
