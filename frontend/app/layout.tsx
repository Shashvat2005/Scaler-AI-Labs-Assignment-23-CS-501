import './styles.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Typeflow',
  description: 'Thoughtful forms',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
