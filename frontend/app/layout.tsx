import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'CAFlow — Practice Management for CAs',
  description: 'Multi-tenant SaaS platform for Chartered Accountants to manage clients, compliance, tasks, billing, and team.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#171717',
              border: 'none',
              boxShadow: '0px 0px 0px 1px rgba(0,0,0,0.08), 0px 4px 12px rgba(0,0,0,0.08), inset 0px 0px 0px 1px #fafafa',
              fontSize: '14px',
              fontFeatureSettings: '"liga" 1',
              fontWeight: 500,
              borderRadius: '8px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ff5b4f', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
