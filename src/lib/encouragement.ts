import { formatMinutes } from '@/lib/utils'

const MESSAGES = [
  'Good work — you earned {amount}!',
  'Nice one. {amount} added to your balance.',
  'That counts. {amount} of screen time is yours.',
  'You showed up and it paid off — {amount} earned.',
  'Solid effort. Enjoy your {amount}.',
  'Keep it up! {amount} unlocked.',
  'Well done — {amount} heading your way.',
  'Another win. {amount} earned.',
]

export function getEncouragingMessage(earnedMinutes: number): string {
  const amount = formatMinutes(earnedMinutes)
  const template = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
  return template.replace('{amount}', amount)
}
