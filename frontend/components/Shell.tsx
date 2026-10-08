'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Shell({ children }: { children: React.ReactNode }) {
  const p = usePathname()
  return (
    <>
      <header className="header" role="banner">
        <Link href="/" className="header-brand" aria-label="Typeflow home">
          typeflow<span>.</span>
        </Link>
        <nav className="header-nav" aria-label="Main navigation">
          <Link className={`header-nav-item ${p === '/' ? 'active' : ''}`} href="/">
            My forms
          </Link>
          <a className="header-nav-item" href="https://www.typeform.com" target="_blank" rel="noopener noreferrer">
            Inspiration
          </a>
        </nav>
        <div className="header-actions">
          <div className="header-avatar">SG</div>
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}