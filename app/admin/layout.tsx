'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Clapperboard, Ticket, Banknote, TrendingUp, Menu } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/screens', label: 'Screen Manager', icon: Clapperboard },
  { href: '/admin/bookings', label: 'Bookings', icon: Ticket },
  { href: '/admin/refunds', label: 'Refunds', icon: Banknote },
  { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    if (pathname === '/admin/login') { setAuthed(true); return }
    const ok = localStorage.getItem('rk_admin_auth') === 'true'
    if (!ok) { router.replace('/admin/login'); return }
    setAuthed(true)
  }, [pathname])

  function logout() {
    localStorage.removeItem('rk_admin_auth')
    router.replace('/admin/login')
  }

  if (!authed) return null
  if (pathname === '/admin/login') return <>{children}</>

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-[#111] border-r border-[#2a2a2a] transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:flex-shrink-0`}>
        <div className="p-4 border-b border-[#2a2a2a]">
          <div className="text-xs uppercase text-gray-500 font-bold tracking-wider">Admin Panel</div>
          <div className="text-sm font-semibold text-white mt-0.5">Radhakrishna Theatre</div>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map(item => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-[#c41e3a] text-white font-semibold'
                  : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-4 space-y-2">
          <a href="/" className="block text-xs text-gray-500 hover:text-gray-300 transition-colors">← Back to Website</a>
          <button onClick={logout} className="text-xs text-red-500 hover:text-red-400 transition-colors">Logout</button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0">
        <div className="md:hidden flex items-center gap-3 p-3 bg-[#111] border-b border-[#2a2a2a]">
          <button onClick={() => setOpen(true)} className="p-2 rounded text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
          <span className="text-sm font-semibold">Admin Panel</span>
        </div>
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  )
}
