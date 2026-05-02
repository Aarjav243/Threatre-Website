'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Stats = {
  todayBookings: number
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  totalBookings: number
  pendingRefunds: number
  todayOccupancy: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString()

      const [todayRes, weekRes, monthRes, refundRes, totalRes, recentRes] = await Promise.all([
        supabase.from('bookings').select('total_amount, ticket_amount').gte('created_at', today).eq('status', 'confirmed'),
        supabase.from('bookings').select('total_amount').gte('created_at', weekAgo).eq('status', 'confirmed'),
        supabase.from('bookings').select('total_amount').gte('created_at', monthAgo).eq('status', 'confirmed'),
        supabase.from('refunds').select('id').eq('status', 'pending'),
        supabase.from('bookings').select('id').eq('status', 'confirmed'),
        supabase.from('bookings').select('*, shows(show_time, show_date, movies(title), screens(name))').order('created_at', { ascending: false }).limit(8)
      ])

      const todayRevenue = (todayRes.data || []).reduce((s, b) => s + b.total_amount, 0)
      const todayTickets = (todayRes.data || []).length
      const totalSeatsToday = 3 * 4 * 449
      setStats({
        todayBookings: todayTickets,
        todayRevenue,
        weekRevenue: (weekRes.data || []).reduce((s, b) => s + b.total_amount, 0),
        monthRevenue: (monthRes.data || []).reduce((s, b) => s + b.total_amount, 0),
        totalBookings: totalRes.data?.length || 0,
        pendingRefunds: refundRes.data?.length || 0,
        todayOccupancy: totalSeatsToday > 0 ? Math.round((todayTickets / totalSeatsToday) * 100) : 0
      })
      setRecentBookings(recentRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-gray-400 animate-pulse">Loading dashboard...</div>

  const statCards = [
    { label: "Today's Revenue", value: `₹${stats!.todayRevenue.toLocaleString()}`, sub: `${stats!.todayBookings} bookings`, color: 'border-green-700 bg-green-900/10' },
    { label: "This Week", value: `₹${stats!.weekRevenue.toLocaleString()}`, sub: '7-day revenue', color: 'border-blue-700 bg-blue-900/10' },
    { label: "This Month", value: `₹${stats!.monthRevenue.toLocaleString()}`, sub: '30-day revenue', color: 'border-purple-700 bg-purple-900/10' },
    { label: "Occupancy Today", value: `${stats!.todayOccupancy}%`, sub: 'avg across all shows', color: 'border-yellow-700 bg-yellow-900/10' },
    { label: "Total Bookings", value: stats!.totalBookings.toLocaleString(), sub: 'all time confirmed', color: 'border-[#c41e3a] bg-red-900/10' },
    { label: "Pending Refunds", value: stats!.pendingRefunds.toString(), sub: 'awaiting processing', color: stats!.pendingRefunds > 0 ? 'border-orange-600 bg-orange-900/10' : 'border-[#2a2a2a] bg-[#1a1a1a]' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map(c => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.color}`}>
            <div className="text-xs text-gray-400 mb-1">{c.label}</div>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="font-semibold">Recent Bookings</h2>
          <a href="/admin/bookings" className="text-xs text-[#c41e3a] hover:text-[#f5a623]">View all →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-[#2a2a2a]">
                <th className="text-left p-3">Reference</th>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Movie</th>
                <th className="text-left p-3">Show</th>
                <th className="text-right p-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map(b => (
                <tr key={b.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#2a2a2a]/30">
                  <td className="p-3 font-mono text-xs text-gray-300">{b.booking_reference}</td>
                  <td className="p-3">
                    <div>{b.customer_name}</div>
                    <div className="text-xs text-gray-500">{b.customer_phone}</div>
                  </td>
                  <td className="p-3 text-gray-300">{b.shows?.movies?.title || '—'}</td>
                  <td className="p-3 text-gray-400 text-xs">
                    <div>{b.shows?.screens?.name}</div>
                    <div>{b.shows?.show_date} · {b.shows?.show_time?.slice(0, 5)}</div>
                  </td>
                  <td className="p-3 text-right font-semibold text-[#f5a623]">₹{b.total_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
