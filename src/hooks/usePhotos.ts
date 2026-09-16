import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getProgressPhotos } from '../lib/photoActions'

export function useProgressPhotos() {
  return useLiveQuery(() => getProgressPhotos(), [])
}

/** Manages the object-URL lifecycle for a photo blob: creates it when the
 * blob appears/changes and revokes it on cleanup, so URLs never leak. */
export function useObjectURL(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!blob) {
      setUrl(undefined)
      return
    }
    const objectUrl = URL.createObjectURL(blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [blob])

  return url
}
