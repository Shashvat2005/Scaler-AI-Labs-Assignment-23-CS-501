'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Shell({ children }: { children: React.ReactNode }) {
  const p = usePathname()
  return (
    <>
      <header>
        <Link href="/" className="brand">
          typeflow<span>.</span>
        </Link>
        <nav>
          <Link className={p === '/' ? 'active' : ''} href="/">
            My forms
          </Link>
          <a href="https://www.typeform.com" target="_blank">
            Inspiration &#8599;
          </a>
        </nav>
        <div className="avatar">SG</div>
      </header>
      {children}
    </>
  )
}
