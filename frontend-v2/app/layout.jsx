import { Analytics } from '@vercel/analytics/next'
import { Geist } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'] })

export const metadata = {
  title: 'Interview Plan Generator',
  description: 'Create a custom, AI-powered interview preparation plan from a job posting and your resume.',
  generator: 'v0.app',
}

export const viewport = {
  colorScheme: 'dark',
  themeColor: '#0d1020',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark bg-background">
      <body className={`${geistSans.className} antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
