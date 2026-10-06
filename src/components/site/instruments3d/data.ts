import type { ModelKey } from './models'

export type Instrument = {
  id: string
  name: string
  /** One-line classification shown under the name. */
  kind: string
  photo: string
  photoAlt: string
  facts: { label: string; value: string }[]
  description: string
  /** Built-in stand-in, used until a scan is attached. */
  model: ModelKey
  /** A GLB/GLTF exported from KIRI Engine. Takes precedence over `model`. */
  scan?: string
  /** A KIRI Engine embed URL. Takes precedence over both. */
  embed?: string
}

/**
 * Demo content for the 3D preview prototype. In production these would be
 * fields on a Payload collection, with `scan` an uploaded GLB.
 */
export const INSTRUMENTS: Record<string, Instrument> = {
  gangsa: {
    id: 'gangsa',
    name: 'Gangsa',
    kind: 'Metallophone · Gamelan Gong Kebyar',
    photo: '/img-mb-17.jpeg',
    photoAlt: 'Young players striking gangsa keys with wooden mallets',
    facts: [
      { label: 'Keys', value: '10 bronze' },
      { label: 'Resonators', value: 'Bamboo tubes' },
      { label: 'Played with', value: 'Panggul (wooden mallet)' },
    ],
    description:
      'The busy middle of the ensemble. Gangsa are played in pairs tuned slightly apart, so that together they shimmer, and their players split fast figuration between them in interlocking parts.',
    model: 'gangsa',
  },
  reyong: {
    id: 'reyong',
    name: 'Reyong',
    kind: 'Kettle-gong row · Gamelan Gong Kebyar',
    photo: '/img-mb-10.jpg',
    photoAlt: 'A row of bronze kettle gongs in the foreground of a rehearsal',
    facts: [
      { label: 'Kettles', value: '12 bronze' },
      { label: 'Players', value: 'Four, side by side' },
      { label: 'Played with', value: 'Wooden sticks' },
    ],
    description:
      'A long frame of small kettle gongs shared by four players. Besides melody, the reyong punctuates the music with sharp, damped accents, a sound closely tied to kebyar style.',
    model: 'reyong',
  },
  gong: {
    id: 'gong',
    name: 'Gong Ageng',
    kind: 'Hanging gong · Colotomic',
    photo: '/img-mb-8.jpg',
    photoAlt: 'A carved gong stand with large bronze gongs below',
    facts: [
      { label: 'Material', value: 'Forged bronze' },
      { label: 'Usually', value: 'A pair, lanang and wadon' },
      { label: 'Role', value: 'Closes each musical cycle' },
    ],
    description:
      'The largest and deepest instrument, hung from a carved stand. Its stroke marks the end of the gongan, the cycle the rest of the ensemble moves through.',
    model: 'gong',
  },
  selonding: {
    id: 'selonding',
    name: 'Selonding',
    kind: 'Iron-keyed ensemble · Sacred',
    photo: '/img-mb-12.jpg',
    photoAlt: 'Forged iron selonding keys resting on stones',
    facts: [
      { label: 'Keys', value: 'Forged iron' },
      { label: 'Resonator', value: 'Wooden trough' },
      { label: 'Found in', value: 'Bali Aga villages' },
    ],
    description:
      'One of the oldest ensembles on the island, kept in villages such as Tenganan Pegeringsingan. Its iron keys are laid across an open wooden trough and the instruments are treated as sacred.',
    model: 'selonding',
  },
}
