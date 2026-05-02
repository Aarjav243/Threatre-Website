import type { Metadata } from 'next'
import { Ticket } from 'lucide-react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Radhakrishna Theatre | Ichalkaranji',
  description: 'Book movie tickets at Radhakrishna Theatre, Ichalkaranji',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a] text-white">
        <header className="bg-[#111] border-b border-[#2a2a2a] sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#c41e3a] flex items-center justify-center font-bold text-lg">
                RK
              </div>
              <div>
                <div className="font-bold text-white text-sm leading-tight">Radhakrishna Theatre</div>
                <div className="text-[10px] text-gray-400">Ichalkaranji · 3 Screen Multiplex</div>
              </div>
            </a>
            <nav className="flex items-center gap-4">
              <a href="/" className="text-sm text-gray-300 hover:text-white transition-colors">Movies</a>
              <a href="/my-tickets" className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1.5">
                <Ticket className="w-4 h-4" /> My Tickets
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#2a2a2a] mt-16 py-8 text-center text-gray-500 text-sm">
          <div className="max-w-6xl mx-auto px-4">
            <div className="font-semibold text-gray-300 mb-1">Radhakrishna Theatre</div>
            <div className="text-xs">Ichalkaranji, Maharashtra · 3 Screen Multiplex · Dolby Atmos</div>
            <div className="text-xs mt-2">© {new Date().getFullYear()} Radhakrishna Theatre. All rights reserved.</div>
          </div>
        </footer>
      </body>
    </html>
  )
}
