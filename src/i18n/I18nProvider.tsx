import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { getLang, subscribeLang } from './index'

/**
 * Re-renders the whole app when the language changes, so every `t()` call
 * (in components and in formatting helpers alike) picks up the new language
 * at once, without a page reload. Data and the current screen are untouched.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(getLang)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  useEffect(() => subscribeLang(setLangState), [])
  return <Fragment key={lang}>{children}</Fragment>
}
