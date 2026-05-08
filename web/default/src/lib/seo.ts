import { useEffect } from 'react'

const SITE_NAME = 'New API'
const DEFAULT_DESCRIPTION =
  'A unified AI API gateway with multi-provider access, centralized billing, and model management.'
const DEFAULT_IMAGE = '/logo.png'

type JsonLdValue = Record<string, unknown> | Record<string, unknown>[]

type SeoProps = {
  title?: string
  description?: string
  path?: string
  type?: 'website' | 'article'
  image?: string
  robots?: string
  jsonLd?: JsonLdValue
}

function getSiteOrigin() {
  const configured = import.meta.env.VITE_PUBLIC_SITE_URL

  if (typeof configured === 'string' && configured.trim()) {
    return configured.replace(/\/+$/, '')
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
}

function getCanonicalUrl(path?: string) {
  const origin = getSiteOrigin()
  const canonicalPath =
    path || (typeof window !== 'undefined' ? window.location.pathname : '/')

  if (!origin) return canonicalPath
  return `${origin}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`
}

function getAbsoluteAssetUrl(src: string) {
  if (/^https?:\/\//i.test(src)) return src

  const origin = getSiteOrigin()
  if (!origin) return src

  return `${origin}${src.startsWith('/') ? src : `/${src}`}`
}

function setMetaAttribute(
  attribute: 'name' | 'property',
  key: string,
  content: string
) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`
  )

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

function setJsonLd(value: JsonLdValue | undefined) {
  const id = 'seo-json-ld'
  const current = document.getElementById(id)

  if (!value) {
    current?.remove()
    return
  }

  const element = current ?? document.createElement('script')
  element.id = id
  element.setAttribute('type', 'application/ld+json')
  element.textContent = JSON.stringify(value)

  if (!current) document.head.appendChild(element)
}

export function Seo(props: SeoProps) {
  const title = props.title ? `${props.title} | ${SITE_NAME}` : SITE_NAME
  const description = props.description ?? DEFAULT_DESCRIPTION
  const canonicalUrl = getCanonicalUrl(props.path)
  const imageUrl = getAbsoluteAssetUrl(props.image ?? DEFAULT_IMAGE)
  const robots = props.robots ?? 'index,follow,max-image-preview:large'
  const type = props.type ?? 'website'

  useEffect(() => {
    document.title = title

    setMetaAttribute('name', 'title', title)
    setMetaAttribute('name', 'description', description)
    setMetaAttribute('name', 'robots', robots)
    setMetaAttribute('property', 'og:type', type)
    setMetaAttribute('property', 'og:title', title)
    setMetaAttribute('property', 'og:description', description)
    setMetaAttribute('property', 'og:url', canonicalUrl)
    setMetaAttribute('property', 'og:image', imageUrl)
    setMetaAttribute('property', 'og:image:width', '1200')
    setMetaAttribute('property', 'og:image:height', '630')
    setMetaAttribute('name', 'twitter:card', 'summary_large_image')
    setMetaAttribute('name', 'twitter:title', title)
    setMetaAttribute('name', 'twitter:description', description)
    setMetaAttribute('name', 'twitter:image', imageUrl)
    setLink('canonical', canonicalUrl)
    setJsonLd(props.jsonLd)
  }, [canonicalUrl, description, imageUrl, props.jsonLd, robots, title, type])

  return null
}

export const seoDefaults = {
  siteName: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  image: DEFAULT_IMAGE,
}

export function buildWebsiteJsonLd() {
  const origin = getSiteOrigin()

  if (!origin) return undefined

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: origin,
      logo: getAbsoluteAssetUrl(DEFAULT_IMAGE),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: origin,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${origin}/pricing?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ]
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  const origin = getSiteOrigin()

  if (!origin) return undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${origin}${item.path}`,
    })),
  }
}
