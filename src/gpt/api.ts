import axios from 'axios'
import chalk from 'chalk'
import dotenv from 'dotenv'

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
    const response = await axios.post(
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

    if (response.data.error) {
      console.log(chalk.red('Error: ' + response.data.error))
      return null
    }

    return response.data.choices.map((choice: any) =>
      choice.message.content.replace(/Answer:|Question:/g, '').trim()
    )
  }
}

export default ChatGPT
