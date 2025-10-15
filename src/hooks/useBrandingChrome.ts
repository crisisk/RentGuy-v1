import { useEffect } from 'react'

export interface BrandingChromeOptions {
  readonly background: string
  readonly textColor: string
  readonly fontFamily: string
  readonly fontHref: string
  readonly fontLinkId?: string
  readonly resetMargin?: boolean
}

const DEFAULT_FONT_LINK_ID = 'app-brand-fonts'

export function useBrandingChrome(options: BrandingChromeOptions): void {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const {
      background,
      textColor,
      fontFamily,
      fontHref,
      fontLinkId = DEFAULT_FONT_LINK_ID,
      resetMargin = true,
    } = options

    if (!document.getElementById(fontLinkId)) {
      const link = document.createElement('link')
      link.id = fontLinkId
      link.rel = 'stylesheet'
      link.href = fontHref
      document.head.appendChild(link)
    }

    const previousBackground = document.body.style.background
    const previousColor = document.body.style.color
    const previousFontFamily = document.body.style.fontFamily
    const previousMargin = document.body.style.margin

    document.body.style.background = background
    document.body.style.color = textColor
    document.body.style.fontFamily = fontFamily
    if (resetMargin) {
      document.body.style.margin = '0'
    }

    return () => {
      document.body.style.background = previousBackground
      document.body.style.color = previousColor
      document.body.style.fontFamily = previousFontFamily
      if (resetMargin) {
        document.body.style.margin = previousMargin
      }
    }
  }, [
    options.background,
    options.textColor,
    options.fontFamily,
    options.fontHref,
    options.fontLinkId,
    options.resetMargin,
  ])
}
