'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useToast } from '../lib/toast'

const menuItems = {
  account: [
    { label: 'Account settings', action: 'account-settings' },
  ],
  resources: [
    { label: 'Support', action: 'support' },
    { label: 'Help center', action: 'help-center' },
    { label: 'Community', action: 'community' },
    { label: 'Apps & Integrations', action: 'apps-integrations' },
    { label: "What's New", action: 'whats-new' },
  ],
  referrals: [
    { label: 'Refer friends, get rewards', action: 'referrals' },
  ],
  bottom: [
    { label: 'Homepage', action: 'homepage', isLink: true, href: '/' },
    { label: 'Log out', action: 'logout', danger: true },
  ],
}

const placeholderMessages: Record<string, string> = {
  'account-settings': 'Account settings are coming soon.',
  support: 'Support is coming soon.',
  'help-center': 'Help center is coming soon.',
  community: 'Community is coming soon.',
  'apps-integrations': 'Apps & Integrations are coming soon.',
  'whats-new': "What's New is coming soon.",
  referrals: 'Referrals are coming soon.',
  logout: 'Authentication is simplified for this demo.',
}

export function Shell({ children }: { children: React.ReactNode }) {
  const p = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  const handleAction = useCallback((action: string, isLink?: boolean, href?: string) => {
    if (isLink && href) {
      setMenuOpen(false)
      return
    }
    setMenuOpen(false)
    const message = placeholderMessages[action]
    if (message) {
      showToast(message)
    }
  }, [showToast])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

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
          <div className="header-avatar-wrapper">
            <div
              ref={avatarRef}
              className="header-avatar"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="Account menu"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setMenuOpen(!menuOpen)
                }
              }}
              title="Placeholder avatar"
            >
              SG
            </div>
            {menuOpen && (
              <div
                ref={menuRef}
                className="avatar-menu"
                role="menu"
                aria-label="Account options"
              >
                <div className="avatar-menu-header">
                  <div className="avatar-menu-avatar" aria-hidden="true">SG</div>
                  <div className="avatar-menu-info">
                    <p className="avatar-menu-name">Shashvat Garg</p>
                    <p className="avatar-menu-email">shashvat2005@gmail.com</p>
                  </div>
                </div>

                <div className="avatar-menu-section">
                  <p className="avatar-menu-section-title">ACCOUNT</p>
                  <div className="avatar-menu-items">
                    {menuItems.account.map((item) => (
                      <button
                        key={item.action}
                        className="avatar-menu-item"
                        role="menuitem"
                        onClick={() => handleAction(item.action)}
                        tabIndex={-1}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="avatar-menu-divider" />

                <div className="avatar-menu-section">
                  <p className="avatar-menu-section-title">RESOURCES</p>
                  <div className="avatar-menu-items">
                    {menuItems.resources.map((item) => (
                      <button
                        key={item.action}
                        className="avatar-menu-item"
                        role="menuitem"
                        onClick={() => handleAction(item.action)}
                        tabIndex={-1}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="avatar-menu-divider" />

                <div className="avatar-menu-section">
                  <div className="avatar-menu-items">
                    {menuItems.referrals.map((item) => (
                      <button
                        key={item.action}
                        className="avatar-menu-item"
                        role="menuitem"
                        onClick={() => handleAction(item.action)}
                        tabIndex={-1}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="avatar-menu-divider" />

                <div className="avatar-menu-section">
                  <div className="avatar-menu-items">
                    {menuItems.bottom.map((item) => (
                      <button
                        key={item.action}
                        className={`avatar-menu-item ${item.danger ? 'avatar-menu-item-danger' : ''}`}
                        role="menuitem"
                        onClick={() => handleAction(item.action, item.isLink, item.href)}
                        tabIndex={-1}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}