import { parseCommand } from '../utils.js'

async function run() {
  console.log(
    parseCommand(
      'git commit -m "✨ Add new feature to API" src/gpt/api.ts src/scripts/git.ts"'
    )
  )
}

run()
