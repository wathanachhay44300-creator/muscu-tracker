import { useEffect } from 'react'
import { useSnackbar } from '../contexts/SnackbarContext'
import { importFromParams, takeDeepLinkParams } from '../lib/deepLink'

/** Renders nothing: on startup, imports data passed in the URL by an iOS Shortcut. */
export function DeepLinkImporter() {
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    const params = takeDeepLinkParams()
    if (!params) return
    importFromParams(params)
      .then((r) => showSnackbar(r.message))
      .catch(() => showSnackbar('Import impossible : erreur d’enregistrement'))
  }, [showSnackbar])

  return null
}
