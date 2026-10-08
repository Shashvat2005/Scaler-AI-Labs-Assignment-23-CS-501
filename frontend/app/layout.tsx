import React from 'react'
import './styles.css'
import type { Metadata } from 'next'
import { ToastProvider } from '../lib/toast'
import { Shell } from '../components/Shell'

export const metadata: Metadata = {
  title: 'Typeflow',
  description: 'Thoughtful forms',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <Shell>{children}</Shell>
        </ToastProvider>
      </body>
    </html>
  )
}
