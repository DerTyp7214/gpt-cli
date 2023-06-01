import { parseCommand } from '../utils.js'

async function run() {
  console.log(
    parseCommand(
      'git mv .github/workflows/run-ci.yml .github/workflows/workflow.yml && git add . && git commit -m ":recycle: Rename workflow file to workflow"'
    )
  )
}

run()
