'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

import { buildModel, type ModelKey } from './models'
import { ViewerLoading } from './ViewerLoading'

type Props = {
  model: ModelKey
  /** GLB/GLTF exported from KIRI Engine; replaces the stand-in when set. */
  scan?: string
  /** KIRI Engine embed URL; rendered as an iframe instead of our own viewer. */
  embed?: string
  /** Drag to orbit and scroll to zoom. Off for the hover preview. */
  interactive?: boolean
  className?: string
}

/** A soft dark ellipse under the model, cheaper than real shadows. */
const contactShadow = (width: number, depth: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(32,20,13,0.55)')
  gradient.addColorStop(1, 'rgba(32,20,13,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      depthWrite: false,
    }),
  )
  plane.rotation.x = -Math.PI / 2
  plane.position.y = 0.001
  return plane
}

export default function InstrumentViewer({
  model,
  scan,
  embed,
  interactive = false,
  className,
}: Props) {
  const host = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el || embed) return

    let disposed = false
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.touchAction = interactive ? 'none' : 'auto'
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = environment

    const key = new THREE.DirectionalLight(0xffe2b8, 1.6)
    key.position.set(3, 5, 4)
    scene.add(key, new THREE.HemisphereLight(0xfff4e0, 0x332017, 0.6))

    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enabled = interactive
    controls.enablePan = false
    controls.enableDamping = true
    controls.autoRotate = !reduceMotion
    controls.autoRotateSpeed = interactive ? 1.2 : 2.4
    // Hand control to the reader once they grab the model.
    controls.addEventListener('start', () => {
      controls.autoRotate = false
    })

    const resize = () => {
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    resize()

    const frame = (object: THREE.Object3D) => {
      // Sit the model on the ground at the origin, then back the camera off
      // until all of it is in view.
      const bounds = new THREE.Box3().setFromObject(object)
      const size = bounds.getSize(new THREE.Vector3())
      const centre = bounds.getCenter(new THREE.Vector3())
      object.position.sub(new THREE.Vector3(centre.x, bounds.min.y, centre.z))

      scene.add(object, contactShadow(size.x * 1.5, size.z * 2.2 + size.x * 0.3))

      const radius = size.length() / 2
      // Fit whichever field of view is narrower, so a tall phone screen does not crop the sides.
      const vertical = THREE.MathUtils.degToRad(camera.fov)
      const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect)
      const distance = (radius / Math.sin(Math.min(vertical, horizontal) / 2))
      const direction = new THREE.Vector3(0.55, 0.42, 1).normalize()
      controls.target.set(0, size.y * 0.42, 0)
      camera.position.copy(controls.target).addScaledVector(direction, distance)
      controls.minDistance = distance * 0.35
      controls.maxDistance = distance * 2
      controls.update()

      renderer.setAnimationLoop(() => {
        controls.update()
        renderer.render(scene, camera)
      })
      setReady(true)
    }

    if (scan) {
      new GLTFLoader().load(scan, (gltf) => {
        if (!disposed) frame(gltf.scene)
      })
    } else {
      frame(buildModel(model))
    }

    return () => {
      disposed = true
      renderer.setAnimationLoop(null)
      observer.disconnect()
      controls.dispose()
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        object.geometry.dispose()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        for (const material of materials) {
          material.map?.dispose()
          material.dispose()
        }
      })
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      // dispose() leaves the GL context alive; browsers cap how many a page may hold.
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [model, scan, embed, interactive])

  if (embed) {
    return (
      <iframe
        src={embed}
        title="3D model"
        className={`size-full border-0 ${className ?? ''}`}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
      />
    )
  }

  return (
    <div className={`relative size-full ${className ?? ''}`}>
      <div
        ref={host}
        className={`absolute inset-0 transition-opacity duration-500 ${
          ready ? 'opacity-100' : 'opacity-0'
        } ${interactive ? 'cursor-grab active:cursor-grabbing' : ''}`}
      />
      {!ready && <ViewerLoading />}
    </div>
  )
}
