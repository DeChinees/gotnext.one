import { randomInt } from 'crypto'

export const taglines = [
  'No subs, no mercy.',
  "If you’re late, you’re out.",
  'Run or run home.',
  'Your spot ain’t yours until you show.',
  'Buckets decide, not feelings.',
  'Less ads, more bricks.',
  'Now with 40% fewer excuses.',
  'Powered by missed layups and bad calls.',
  'RSVP or STFU.',
  'Not Tinder, just runs.',
  'Game starts when the ball checks.',
  'Respect the run, respect the waitlist.',
  'Your next is here.',
  'We don’t run clocks, we run it back.',
  'No refs, no techs, just hoops.',
  'We don’t f* with flakes.',
  'GotNext: because your excuses don’t score.',
  "This ain’t cardio, it’s war.",
  'You quit? We promote.',
  'Hoops don’t lie, but players do.',
] as const

export type Tagline = (typeof taglines)[number]

export function pickRandomTagline(): Tagline {
  return taglines[randomInt(taglines.length)]
}

export const intros = [
  'GotNext.one helps you organise your basketball runs. Create teams, set up games, manage RSVPs, and keep the run flowing—without the endless group chat chaos.',
  'Tired of “who’s in?” blowing up your phone? With GotNext.one, you set the run, lock the squad, and hoop stress-free. No flakes, no fuss—just buckets.',
  'The app that saves you from that guy who always says “maybe” and never shows. GotNext.one makes sure only real hoopers touch the ball. Everyone else? Bench.',
] as const

export type Intro = (typeof intros)[number]

export function pickRandomIntro(): Intro {
  return intros[randomInt(intros.length)]
}
