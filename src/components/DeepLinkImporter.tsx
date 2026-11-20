import { useEffect } from 'react'
import { useSnackbar } from '../contexts/SnackbarContext'
import { importFromParams, takeDeepLinkParams } from '../lib/deepLink'
import { t } from '../i18n'

/** Renders nothing: on startup, imports data passed in the URL by an iOS Shortcut. */
export function DeepLinkImporter() {
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    const params = takeDeepLinkParams()
    if (!params) return
    importFromParams(params)
      .then((r) => showSnackbar(r.message))
      .catch(() => showSnackbar(t('common.importSaveError')))
  }, [showSnackbar])

  return null
}
