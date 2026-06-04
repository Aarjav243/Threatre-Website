import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Radhakrishna Theatre | Order Food & Beverages',
  description: 'Order food and beverages at Radhakrishna Theatre, Ichalkaranji',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a] text-white">
        <header className="bg-[#111] border-b border-[#2a2a2a] sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center">
            <a href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#c41e3a] flex items-center justify-center font-bold text-base">
                RK
              </div>
              <div>
                <div className="font-bold text-white text-sm leading-tight">Radhakrishna Theatre</div>
                <div className="text-[10px] text-gray-400">Ichalkaranji · Food & Beverages</div>
              </div>
            </a>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
