import axios from 'axios'
import chalk from 'chalk'
import dotenv from 'dotenv'
import logUpdate from 'log-update'

const frameString = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
let frameIndex = 0
let lastFrame = Date.now()

function loading(line: string, index?: number): string {
  if (frameIndex >= frameString.length) frameIndex = 0
  const fIndex =
    lastFrame + 100 < Date.now() ? index ?? frameIndex++ : index ?? frameIndex
  if (lastFrame + 100 < Date.now()) lastFrame = Date.now()
  return line.replace(/\[ \]/g, `[${chalk.yellow(frameString[fIndex])}]`)
}

class ChatGPT {
  private _token: string

  constructor() {
    dotenv.config()
    this._token = process.env.CHAT_GPT_TOKEN ?? ''
  }

  async query(
    query: string,
    previousResponses?: string[]
  ): Promise<string[] | null> {
    logUpdate.done()
    const responsePromise = axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: query },
          ...(previousResponses ?? []).map((response) => ({
            role: 'assistant',
            content: response,
          })),
        ],
        temperature: 0.7,
        max_tokens: 750,
      },
      {
        headers: {
          Authorization: `Bearer ${this._token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const loadingInterval = setInterval(() => {
      logUpdate(loading('[ ] Waiting for response from GPT-3'))
    }, 100)

    const response = await responsePromise

    clearInterval(loadingInterval)

    logUpdate.clear()

    if (response.data.error) {
      console.log(chalk.red('Error: ' + response.data.error))
      return null
    }

    return response.data.choices.map((choice: any) =>
      choice.message.content.replace(/Answer:|Question:/g, '').trim()
    )
  }

  async queryDavinci(
    query: string,
    previousResponses?: string[]
  ): Promise<string[] | null> {
    logUpdate.done()
    const responsePromise = axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'text-davinci-003',
        prompt: query,
        temperature: 0.7,
        max_tokens: 50,
        stop: '\n',
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${this._token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const loadingInterval = setInterval(() => {
      logUpdate(loading('[ ] Waiting for response from Davinci'))
    }, 100)

    const response = await responsePromise

    clearInterval(loadingInterval)

    logUpdate.clear()

    if (response.data.error) {
      console.log(chalk.red('Error: ' + response.data.error))
      return null
    }

    return response.data.choices.map((choice: any) => choice.text)
  }
}

export default ChatGPT
