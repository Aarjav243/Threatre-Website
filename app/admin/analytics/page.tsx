'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCategoryColor } from '@/lib/utils'

type MovieStat = { title: string; tickets: number; revenue: number }
type SnackStat = { name: string; qty: number; revenue: number }
type ShowStat = { time: string; avg_fill: number; bookings: number }
type CategoryStat = { category: string; tickets: number; revenue: number }

export default function AnalyticsPage() {
  const [movieStats, setMovieStats] = useState<MovieStat[]>([])
  const [snackStats, setSnackStats] = useState<SnackStat[]>([])
  const [catStats, setCatStats] = useState<CategoryStat[]>([])
  const [peakHours, setPeakHours] = useState<{ hour: number; count: number }[]>([])
  const [range, setRange] = useState<'7' | '30' | '90'>('30')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ totalRevenue: 0, totalTickets: 0, totalSnackRevenue: 0, avgTicketValue: 0, repeatCustomers: 0 })

  useEffect(() => { fetchAnalytics() }, [range])

  async function fetchAnalytics() {
    setLoading(true)
    const since = new Date(Date.now() - Number(range) * 86400000).toISOString()

    const [bookingsRes, bookingSeatsRes, bookingSnacksRes] = await Promise.all([
      supabase.from('bookings').select('*, shows(show_time, movies(title))').gte('created_at', since).eq('status', 'confirmed'),
      supabase.from('booking_seats').select('*, bookings!inner(created_at, status), seats(category, price)').gte('bookings.created_at', since).eq('bookings.status', 'confirmed'),
      supabase.from('booking_snacks').select('*, bookings!inner(created_at, status), snack_items(name, price)').gte('bookings.created_at', since).eq('bookings.status', 'confirmed')
    ])

    const bookings = bookingsRes.data || []
    const allSeats = bookingSeatsRes.data || []
    const allSnacks = bookingSnacksRes.data || []

    // Summary
    const totalRevenue = bookings.reduce((s, b) => s + b.total_amount, 0)
    const totalTickets = allSeats.length
    const totalSnackRevenue = bookings.reduce((s, b) => s + (b.snack_amount || 0), 0)
    const phones = bookings.map(b => b.customer_phone)
    const uniquePhones = new Set(phones)
    const repeatCustomers = phones.length - uniquePhones.size
    setSummary({ totalRevenue, totalTickets, totalSnackRevenue, avgTicketValue: totalTickets > 0 ? Math.round(totalRevenue / bookings.length) : 0, repeatCustomers })

    // Movie stats
    const movieMap = new Map<string, MovieStat>()
    for (const b of bookings) {
      const title = (b.shows as any)?.movies?.title || 'Unknown'
      if (!movieMap.has(title)) movieMap.set(title, { title, tickets: 0, revenue: 0 })
      const existing = movieMap.get(title)!
      existing.revenue += b.ticket_amount
    }
    for (const bs of allSeats) {
      const b = bookings.find(b => b.id === bs.booking_id)
      if (!b) continue
      const title = (b.shows as any)?.movies?.title || 'Unknown'
      if (movieMap.has(title)) movieMap.get(title)!.tickets++
    }
    setMovieStats(Array.from(movieMap.values()).sort((a, b) => b.tickets - a.tickets))

    // Category stats
    const catMap = new Map<string, CategoryStat>()
    for (const bs of allSeats) {
      const cat = (bs.seats as any)?.category || 'UNKNOWN'
      if (!catMap.has(cat)) catMap.set(cat, { category: cat, tickets: 0, revenue: 0 })
      catMap.get(cat)!.tickets++
      catMap.get(cat)!.revenue += (bs.seats as any)?.price || 0
    }
    setCatStats(Array.from(catMap.values()).sort((a, b) => b.tickets - a.tickets))

    // Snack stats
    const snackMap = new Map<string, SnackStat>()
    for (const bs of allSnacks) {
      const name = (bs.snack_items as any)?.name || 'Unknown'
      if (!snackMap.has(name)) snackMap.set(name, { name, qty: 0, revenue: 0 })
      snackMap.get(name)!.qty += bs.quantity
      snackMap.get(name)!.revenue += bs.quantity * bs.unit_price
    }
    setSnackStats(Array.from(snackMap.values()).sort((a, b) => b.qty - a.qty))

    // Peak booking hours
    const hourMap = new Map<number, number>()
    for (const b of bookings) {
      const hour = new Date(b.created_at).getHours()
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
    }
    setPeakHours(Array.from(hourMap.entries()).map(([hour, count]) => ({ hour, count })).sort((a, b) => b.count - a.count).slice(0, 6))

    setLoading(false)
  }

  const maxMovieTickets = Math.max(...movieStats.map(m => m.tickets), 1)
  const maxSnackQty = Math.max(...snackStats.map(s => s.qty), 1)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          {(['7', '30', '90'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm ${range === r ? 'bg-[#c41e3a] text-white' : 'bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white'}`}>
              {r}d
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="text-gray-400 animate-pulse">Loading analytics...</div> : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: 'Total Revenue', value: `₹${summary.totalRevenue.toLocaleString()}` },
              { label: 'Tickets Sold', value: summary.totalTickets.toLocaleString() },
              { label: 'Snack Revenue', value: `₹${summary.totalSnackRevenue.toLocaleString()}` },
              { label: 'Avg Booking Value', value: `₹${summary.avgTicketValue}` },
              { label: 'Repeat Customers', value: summary.repeatCustomers.toString() },
            ].map(s => (
              <div key={s.label} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 text-center">
                <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                <div className="text-xl font-bold">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Movie performance */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
              <h2 className="font-semibold mb-4">Movie Performance</h2>
              {movieStats.length === 0 ? <div className="text-gray-500 text-sm">No data</div> : (
                <div className="space-y-3">
                  {movieStats.map(m => (
                    <div key={m.title}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium truncate max-w-40">{m.title}</span>
                        <span className="text-gray-400">{m.tickets} tickets · ₹{m.revenue.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div className="h-full bg-[#c41e3a] rounded-full transition-all" style={{ width: `${(m.tickets / maxMovieTickets) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category breakdown */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
              <h2 className="font-semibold mb-4">Seat Category Breakdown</h2>
              {catStats.length === 0 ? <div className="text-gray-500 text-sm">No data</div> : (
                <div className="space-y-3">
                  {catStats.map(c => (
                    <div key={c.category} className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded border w-20 text-center flex-shrink-0 ${getCategoryColor(c.category)}`}>{c.category}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{c.tickets} tickets</span>
                          <span className="text-[#f5a623]">₹{c.revenue.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div className="h-full bg-[#f5a623] rounded-full" style={{ width: `${(c.tickets / (catStats[0]?.tickets || 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Snack analytics */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
              <h2 className="font-semibold mb-4">Top Snacks</h2>
              {snackStats.length === 0 ? <div className="text-gray-500 text-sm">No snack orders yet</div> : (
                <div className="space-y-3">
                  {snackStats.map(s => (
                    <div key={s.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate max-w-40">{s.name}</span>
                        <span className="text-gray-400">{s.qty} sold · ₹{s.revenue}</span>
                      </div>
                      <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div className="h-full bg-orange-600 rounded-full" style={{ width: `${(s.qty / maxSnackQty) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Peak booking hours */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
              <h2 className="font-semibold mb-4">Peak Booking Hours</h2>
              {peakHours.length === 0 ? <div className="text-gray-500 text-sm">No data</div> : (
                <div className="space-y-2">
                  {peakHours.map(h => {
                    const label = h.hour < 12 ? `${h.hour || 12} AM` : `${h.hour === 12 ? 12 : h.hour - 12} PM`
                    return (
                      <div key={h.hour} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-12">{label}</span>
                        <div className="flex-1 h-6 bg-[#2a2a2a] rounded overflow-hidden flex items-center">
                          <div className="h-full bg-blue-700 rounded flex items-center px-2" style={{ width: `${(h.count / (peakHours[0]?.count || 1)) * 100}%` }}>
                            <span className="text-xs text-white font-bold">{h.count}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
