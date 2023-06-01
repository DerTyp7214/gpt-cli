import chalk from 'chalk'

export function parseCommand(line: string, newLines: boolean = true): string {
  if (line.includes('\n')) {
    return line
      .split('\n')
      .map((line) => parseCommand(line))
      .join('\n')
  }

  if (line.includes(' | ')) {
    return colorizePipeCommand(line, newLines)
  }

  if (line.includes(' && ')) {
    return colorizeAndCommand(line, newLines)
  }

  return colorizeCommand(line)
}

function colorizePipeCommand(
  command: string,
  newLines: boolean = true
): string {
  return command
    .split(' | ')
    .map(colorizeCommand)
    .join(chalk.blackBright(' |' + (newLines ? '\n' : ' ')))
}

function colorizeAndCommand(command: string, newLines: boolean = true): string {
  return command
    .split(' && ')
    .map(colorizeCommand)
    .join(chalk.blackBright(' &&' + (newLines ? '\n' : ' ')))
}

function colorizeCommand(command: string): string {
  const [cmd, ...args] = command.split(' ')

  if (cmd === 'git') {
    return `${chalk.yellow(cmd)} ${colorizeGitCommand(args)}`
  }

  return `${chalk.yellow(cmd)} ${args.join(' ')}`
}

function colorizeGitCommand(args: string[]): string {
  const [cmd, ...rest] = args

  if (cmd === 'commit') {
    return `${cmd} ${colorizeGitCommitCommand(rest)}`
  }

  return `${cmd} ${rest
    .map((arg) => {
      if (arg.startsWith('-')) {
        return chalk.blueBright(arg)
      }

      return arg
    })
    .join(' ')}`
}

function colorizeGitCommitCommand(args: string[]): string {
  const [cmd, ...rest] = args

  if (cmd === '-m' || cmd === '--message' || cmd === '-am') {
    return `${chalk.blueBright(cmd)} ${colorizeGitCommitMessageCommand(rest)}`
  }

  if (cmd.startsWith('-')) {
    return `${chalk.blueBright(cmd)} ${rest.join(' ')}`
  }

  return `${chalk.magenta(cmd)} ${rest.join(' ')}`
}

function colorizeGitCommitMessageCommand(args: string[]): string {
  const message = args.join(' ')
  const messageStart = message.indexOf('"')
  const messageEnd = message.lastIndexOf('"')
  const messageContent = message.substring(messageStart + 1, messageEnd)
  const messageColorized = chalk.green(replaceGitmojiWithEmoji(messageContent))
  const messageColorizedFull =
    message.substring(0, messageStart + 1) +
    messageColorized +
    message.substring(messageEnd)

  return messageColorizedFull
}

function replaceGitmojiWithEmoji(message: string): string {
  const gitmojiRegex = /:[a-z0-9_]+:/g
  const gitmojis = message.match(gitmojiRegex)

  if (gitmojis) {
    for (const gitmoji of gitmojis) {
      const emoji = gitmoji.replace(/:/g, '')
      const emojiSupported = emoji in emojiMap

      if (emojiSupported) {
        message = message.replace(gitmoji, emojiMap[emoji])
      }
    }
  }

  return message
}

const emojiMap: Record<string, string> = {
  art: '🎨',
  zap: '⚡️',
  fire: '🔥',
  bug: '🐛',
  ambulance: '🚑',
  sparkles: '✨',
  memo: '📝',
  rocket: '🚀',
  lipstick: '💄',
  tada: '🎉',
  white_check_mark: '✅',
  lock: '🔒',
  closed_lock_with_key: '🔐',
  bookmark: '🔖',
  rotating_light: '🚨',
  construction: '🚧',
  green_heart: '💚',
  arrow_down: '⬇️',
  arrow_up: '⬆️',
  pushpin: '📌',
  construction_worker: '👷',
  chart_with_upwards_trend: '📈',
  recycle: '♻️',
  heavy_plus_sign: '➕',
  heavy_minus_sign: '➖',
  wrench: '🔧',
  hammer: '🔨',
  globe_with_meridians: '🌐',
  pencil2: '✏️',
  pencil: '✏️',
  poop: '💩',
  rewind: '⏪',
  twisted_rightwards_arrows: '🔀',
  package: '📦',
  alien: '👽',
  truck: '🚚',
  page_facing_up: '📄',
  boom: '💥',
  bento: '🍱',
  wheelchair: '♿️',
  bulb: '💡',
  beers: '🍻',
  speech_balloon: '💬',
  card_file_box: '🗃️',
  loud_sound: '🔊',
  mute: '🔇',
  busts_in_silhouette: '👥',
  children_crossing: '🚸',
  building_construction: '🏗️',
  iphone: '📱',
  clown_face: '🤡',
  egg: '🥚',
  see_no_evil: '🙈',
  camera_flash: '📸',
  alembic: '⚗️',
  mag: '🔍',
  label: '🏷️',
  seedling: '🌱',
  triangular_flag_on_post: '🚩',
  goal_net: '🥅',
  dizzy: '💫',
  wastebasket: '🗑️',
  passport_control: '🛂',
  adhesive_bandage: '🩹',
  monocle_face: '🧐',
  coffin: '⚰️',
  test_tube: '🧪',
  necktie: '👔',
  stethoscope: '🩺',
  bricks: '🧱',
  technologist: '🧑‍💻',
  money_with_wings: '💸',
  thread: '🧵',
  safety_vest: '🦺',
}
