import type { Adapter, GeneratedAdapter } from '@payloadcms/plugin-cloud-storage/types'
import { v2 as cloudinary } from 'cloudinary'

/**
 * Stores uploads in Cloudinary instead of on the local filesystem.
 *
 * Only the filename and metadata land in MongoDB — the bytes live in Cloudinary
 * and are served straight from its CDN. That is what makes the app deployable to
 * Vercel, whose filesystem is ephemeral: anything written to disk disappears on
 * the next cold start, leaving database rows pointing at files that no longer exist.
 *
 * Written against @payloadcms/plugin-cloud-storage's own adapter interface rather
 * than pulling in a third-party plugin, so nothing outside this repo sits in the
 * upload path.
 */

type CloudinaryAdapterArgs = {
  cloudName: string
  apiKey: string
  apiSecret: string
  /** Cloudinary folder everything is filed under. */
  folder?: string
}

/** `probe.png` → `probe`. Cloudinary derives the extension from the stored file. */
const stripExtension = (filename: string): string => filename.replace(/\.[^./]+$/, '')

const publicIdFor = (folder: string, filename: string): string =>
  `${folder}/${stripExtension(filename)}`

export const cloudinaryAdapter =
  ({ cloudName, apiKey, apiSecret, folder = 'mekar-bhuana' }: CloudinaryAdapterArgs): Adapter =>
  (): GeneratedAdapter => {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    })

    return {
      name: 'cloudinary',

      handleUpload: async ({ file }) => {
        await new Promise<void>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              public_id: publicIdFor(folder, file.filename),
              // `overwrite` keeps re-uploads of the same filename idempotent, which
              // matters because Payload writes each image size as its own file.
              overwrite: true,
              resource_type: 'auto',
            },
            (error) => (error ? reject(error) : resolve()),
          )
          stream.end(file.buffer)
        })
      },

      handleDelete: async ({ filename }) => {
        await cloudinary.uploader.destroy(publicIdFor(folder, filename), {
          resource_type: 'image',
          invalidate: true,
        })
      },

      generateURL: ({ filename }) =>
        cloudinary.url(publicIdFor(folder, filename), { secure: true, resource_type: 'image' }),

      /**
       * Payload still routes /api/media/file/<filename> through here. Redirecting
       * to the CDN keeps the URL stable while letting Cloudinary serve the bytes,
       * so images are never proxied through a serverless function.
       */
      staticHandler: async (_req, { params }) => {
        const url = cloudinary.url(publicIdFor(folder, params.filename), {
          secure: true,
          resource_type: 'image',
        })
        return Response.redirect(url, 302)
      },
    }
  }
