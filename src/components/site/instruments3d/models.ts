import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

/**
 * Stand-in models, built from primitives so the prototype works before any
 * instrument has been scanned. Once a KIRI Engine export exists for an
 * instrument, the viewer loads that file instead and none of this runs.
 *
 * Units are roughly metres; the viewer frames whatever it is given, so scale
 * only matters relative to the other parts of the same instrument.
 */
export type ModelKey = 'gangsa' | 'reyong' | 'gong' | 'selonding'

const materials = () => ({
  bronze: new THREE.MeshStandardMaterial({ color: 0xc08a3e, metalness: 0.95, roughness: 0.28 }),
  // Lathed shells are open, so their inside faces must render too.
  bronzeShell: new THREE.MeshStandardMaterial({
    color: 0xc08a3e,
    metalness: 0.95,
    roughness: 0.3,
    side: THREE.DoubleSide,
  }),
  lacquer: new THREE.MeshStandardMaterial({ color: 0x4e130d, metalness: 0.15, roughness: 0.45 }),
  gilt: new THREE.MeshStandardMaterial({ color: 0xd9ad55, metalness: 0.85, roughness: 0.3 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x3d2615, roughness: 0.8 }),
  bamboo: new THREE.MeshStandardMaterial({ color: 0x8f7442, roughness: 0.7 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x3b3936, metalness: 0.7, roughness: 0.6 }),
  cord: new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.9 }),
})
type Materials = ReturnType<typeof materials>

const box = (
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  radius = Math.min(w, h, d) * 0.2,
) => {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, radius), material)
  mesh.position.set(x, y, z)
  return mesh
}

/** A flat disc facing +z — the gilt rosettes studded along the frames. */
const rosette = (radius: number, m: Materials, x: number, y: number, z: number) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.8, 0.012, 24), m.gilt)
  mesh.rotation.x = Math.PI / 2
  mesh.position.set(x, y, z)
  return mesh
}

/**
 * The flame-topped end board of a gamelan frame, extruded from a 2D outline.
 * Faces along x, so it caps a frame that runs left to right.
 */
const endBoard = (width: number, height: number, thickness: number, material: THREE.Material) => {
  const w = width / 2
  const shape = new THREE.Shape()
  shape.moveTo(-w, 0)
  shape.lineTo(w, 0)
  shape.lineTo(w, height * 0.55)
  shape.bezierCurveTo(w, height * 0.8, w * 0.2, height * 0.78, w * 0.25, height * 0.95)
  shape.quadraticCurveTo(0, height * 1.12, -w * 0.25, height * 0.95)
  shape.bezierCurveTo(-w * 0.2, height * 0.78, -w, height * 0.8, -w, height * 0.55)
  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 24,
  })
  geometry.translate(0, 0, -thickness / 2)
  geometry.rotateY(Math.PI / 2)
  return new THREE.Mesh(geometry, material)
}

/** A lacquered, gilt-trimmed box frame with carved ends — gangsa and reyong share it. */
const frame = (m: Materials, length: number, depth: number, height: number, endHeight: number) => {
  const group = new THREE.Group()
  const base = 0.06
  const top = base + height

  for (const side of [-1, 1]) {
    const z = (side * depth) / 2
    group.add(box(length, height, 0.05, m.lacquer, 0, base + height / 2, z))
    group.add(box(length + 0.01, 0.025, 0.06, m.gilt, 0, top, z, 0.008))
    group.add(box(length + 0.01, 0.02, 0.06, m.gilt, 0, base + 0.04, z, 0.008))

    const count = Math.max(3, Math.round(length / 0.3))
    for (let i = 0; i < count; i++) {
      const x = -length / 2 + (length / count) * (i + 0.5)
      const disc = rosette(0.03, m, x, base + height / 2, z + side * 0.032)
      if (side < 0) disc.rotation.x = -Math.PI / 2
      group.add(disc)
    }

    const board = endBoard(depth + 0.08, endHeight, 0.07, m.lacquer)
    board.position.set((side * (length + 0.07)) / 2, base, 0)
    group.add(board)

    const boss = rosette(0.05, m, 0, base + endHeight * 0.45, 0)
    boss.rotation.set(0, 0, Math.PI / 2)
    boss.position.x = side * (length / 2 + 0.075)
    group.add(boss)

    for (const end of [-1, 1]) {
      group.add(box(0.1, base, 0.1, m.wood, (end * length) / 2.3, base / 2, z))
    }
  }
  return group
}

const gangsa = (m: Materials) => {
  const group = new THREE.Group()
  const length = 1.5
  const depth = 0.5
  const height = 0.3
  group.add(frame(m, length, depth, height, 0.55))

  const keys = 10
  const span = length * 0.88
  const pitch = span / keys
  const top = 0.06 + height

  for (const z of [-0.14, 0.14]) {
    group.add(box(span + 0.04, 0.014, 0.018, m.cord, 0, top + 0.012, z, 0.005))
  }

  for (let i = 0; i < keys; i++) {
    const x = -span / 2 + pitch * (i + 0.5)
    // Lower notes on the left: longer, wider keys over longer resonators.
    const t = i / (keys - 1)
    const keyLength = 0.44 - t * 0.12
    group.add(box(pitch * 0.82, 0.026, keyLength, m.bronze, x, top + 0.034, 0, 0.008))

    const tube = 0.26 - t * 0.12
    const resonator = new THREE.Mesh(
      new THREE.CylinderGeometry(pitch * 0.32, pitch * 0.32, tube, 20),
      m.bamboo,
    )
    resonator.position.set(x, top - tube / 2 - 0.01, 0)
    group.add(resonator)
  }

  // A panggul resting across the keys.
  const mallet = new THREE.Group()
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.3, 12), m.wood)
  handle.rotation.z = Math.PI / 2
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.09, 16), m.wood)
  head.position.x = 0.15
  mallet.add(handle, head)
  mallet.position.set(0.15, top + 0.07, 0.08)
  mallet.rotation.y = 0.5
  group.add(mallet)

  return group
}

/** Half-profile of a kettle gong, revolved around y. Radius 1, boss on top. */
const KETTLE_PROFILE: [number, number][] = [
  [0.001, 0.62],
  [0.12, 0.62],
  [0.2, 0.57],
  [0.24, 0.5],
  [0.26, 0.42],
  [0.4, 0.38],
  [0.82, 0.34],
  [0.95, 0.28],
  [1.0, 0.15],
  [1.0, 0.0],
  [0.96, 0.0],
]

/** Half-profile of a hanging gong: flat face, boss and a deep rim. */
const GONG_PROFILE: [number, number][] = [
  [0.001, 0.16],
  [0.06, 0.16],
  [0.1, 0.13],
  [0.12, 0.09],
  [0.16, 0.075],
  [0.85, 0.06],
  [0.97, 0.03],
  [1.0, 0.0],
  [1.0, -0.22],
  [0.97, -0.22],
]

const lathe = (profile: [number, number][], radius: number, m: Materials) => {
  const points = profile.map(([r, y]) => new THREE.Vector2(r * radius, y * radius))
  const group = new THREE.Group()
  group.add(new THREE.Mesh(new THREE.LatheGeometry(points, 48), m.bronzeShell))
  return group
}

const reyong = (m: Materials) => {
  const group = new THREE.Group()
  const length = 2.3
  const depth = 0.36
  const height = 0.2
  group.add(frame(m, length, depth, height, 0.42))

  const top = 0.06 + height
  for (const z of [-0.09, 0.09]) {
    group.add(box(length * 0.95, 0.014, 0.018, m.cord, 0, top + 0.008, z, 0.005))
  }

  const kettles = 12
  const span = length * 0.92
  const pitch = span / kettles
  for (let i = 0; i < kettles; i++) {
    const kettle = lathe(KETTLE_PROFILE, pitch * 0.42, m)
    kettle.position.set(-span / 2 + pitch * (i + 0.5), top + 0.012, 0)
    group.add(kettle)
  }
  return group
}

const gong = (m: Materials) => {
  const group = new THREE.Group()
  const postHeight = 1.5
  const halfSpan = 0.75

  for (const side of [-1, 1]) {
    const x = side * halfSpan
    group.add(box(0.1, postHeight, 0.12, m.lacquer, x, postHeight / 2 + 0.08, 0))
    group.add(box(0.13, 0.1, 0.62, m.wood, x, 0.05, 0))
    for (const y of [0.3, 0.9, 1.4]) {
      group.add(box(0.12, 0.03, 0.14, m.gilt, x, y, 0, 0.008))
    }
  }

  const barY = postHeight + 0.12
  group.add(box(halfSpan * 2 + 0.3, 0.12, 0.14, m.lacquer, 0, barY, 0))
  group.add(box(halfSpan * 2 + 0.32, 0.025, 0.16, m.gilt, 0, barY - 0.07, 0, 0.008))

  // Carved crest above the crossbar, faced forward.
  const crest = endBoard(1.1, 0.4, 0.06, m.lacquer)
  crest.rotation.y = Math.PI / 2
  crest.position.set(0, barY + 0.06, 0)
  group.add(crest)
  group.add(rosette(0.07, m, 0, barY + 0.24, 0.045))

  const radius = 0.55
  const disc = lathe(GONG_PROFILE, radius, m)
  disc.rotation.x = Math.PI / 2
  const centre = 0.82
  disc.position.set(0, centre, 0)
  group.add(disc)

  for (const side of [-1, 1]) {
    const from = new THREE.Vector3(side * 0.22, barY - 0.06, 0)
    const to = new THREE.Vector3(side * 0.18, centre + radius * 0.92, -0.06)
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, from.distanceTo(to), 8),
      m.cord,
    )
    cord.position.copy(from).add(to).multiplyScalar(0.5)
    cord.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      to.clone().sub(from).normalize(),
    )
    group.add(cord)
  }
  return group
}

const selonding = (m: Materials) => {
  const group = new THREE.Group()
  const length = 1.4
  const depth = 0.55
  const height = 0.34
  const wall = 0.04

  // An open wooden trough — the resonator the keys sit across.
  group.add(box(length, wall, depth, m.wood, 0, wall / 2, 0, 0.01))
  for (const side of [-1, 1]) {
    group.add(box(length, height, wall, m.wood, 0, height / 2, (side * (depth - wall)) / 2, 0.01))
    group.add(box(wall, height, depth, m.wood, (side * (length - wall)) / 2, height / 2, 0, 0.01))
  }

  for (const z of [-0.22, 0.22]) {
    group.add(box(length * 0.94, 0.014, 0.02, m.cord, 0, height + 0.007, z, 0.005))
  }

  const keys = 8
  const span = length * 0.9
  const pitch = span / keys
  for (let i = 0; i < keys; i++) {
    const keyLength = 0.62 - (i / (keys - 1)) * 0.1
    const geometry = new THREE.BoxGeometry(pitch * 0.78, 0.03, keyLength, 1, 1, 16)
    // Forged keys are slightly arched along their length.
    const position = geometry.attributes.position
    for (let v = 0; v < position.count; v++) {
      const z = position.getZ(v) / (keyLength / 2)
      position.setY(v, position.getY(v) + 0.025 * (1 - z * z))
    }
    geometry.computeVertexNormals()
    const key = new THREE.Mesh(geometry, m.iron)
    key.position.set(-span / 2 + pitch * (i + 0.5), height + 0.02, 0)
    group.add(key)
  }
  return group
}

const BUILDERS: Record<ModelKey, (m: Materials) => THREE.Group> = {
  gangsa,
  reyong,
  gong,
  selonding,
}

export const buildModel = (key: ModelKey) => BUILDERS[key](materials())
