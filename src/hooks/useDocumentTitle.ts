import { useEffect } from 'react'

export interface DocumentTitleOptions {
  readonly restoreOnUnmount?: boolean
  readonly fallbackTitle?: string
}

export function useDocumentTitle(title: string, options: DocumentTitleOptions = {}): void {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const { restoreOnUnmount = true, fallbackTitle } = options
    const previousTitle = document.title
    document.title = title

    return () => {
      if (!restoreOnUnmount) {
        return
      }
      document.title = fallbackTitle ?? previousTitle
    }
  }, [title, options.restoreOnUnmount, options.fallbackTitle])
}
