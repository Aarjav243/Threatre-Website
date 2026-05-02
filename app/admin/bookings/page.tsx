'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatTime, formatDate } from '@/lib/utils'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => { fetchBookings() }, [filter])

  async function fetchBookings() {
    setLoading(true)
    let q = supabase.from('bookings')
      .select('*, shows(show_date, show_time, movies(title), screens(name)), booking_seats(id)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setBookings(data || [])
    setLoading(false)
  }

  async function cancelBooking(id: string, amount: number) {
    if (!confirm('Cancel this booking and create a refund?')) return
    setCancellingId(id)
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    await supabase.from('refunds').insert({ booking_id: id, amount, reason: 'Customer cancellation', status: 'pending' })
    await fetchBookings()
    setCancellingId(null)
  }

  const filtered = bookings.filter(b =>
    b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.customer_phone?.includes(search) ||
    b.booking_reference?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Bookings</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, reference..."
          className="flex-1 min-w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#c41e3a] focus:outline-none" />
        <div className="flex gap-2">
          {(['all', 'confirmed', 'cancelled'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm capitalize transition-colors ${filter === f ? 'bg-[#c41e3a] text-white' : 'bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-[#2a2a2a] bg-[#111]">
                  <th className="text-left p-3">Reference</th>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">Movie / Show</th>
                  <th className="text-left p-3">Seats</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Booked At</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#2a2a2a]/20">
                    <td className="p-3 font-mono text-xs text-gray-300">{b.booking_reference}</td>
                    <td className="p-3">
                      <div className="font-medium">{b.customer_name}</div>
                      <div className="text-xs text-gray-500">{b.customer_phone}</div>
                    </td>
                    <td className="p-3">
                      <div>{b.shows?.movies?.title}</div>
                      <div className="text-xs text-gray-500">{b.shows?.screens?.name} · {b.shows?.show_date} {b.shows?.show_time?.slice(0, 5)}</div>
                    </td>
                    <td className="p-3 text-gray-400">{b.booking_seats?.length || 0} seats</td>
                    <td className="p-3 text-right font-semibold text-[#f5a623]">₹{b.total_amount}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-500">{new Date(b.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-3">
                      {b.status === 'confirmed' && (
                        <button onClick={() => cancelBooking(b.id, b.total_amount)}
                          disabled={cancellingId === b.id}
                          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 border border-red-900/50 px-2 py-1 rounded">
                          {cancellingId === b.id ? '...' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="p-8 text-center text-gray-500">No bookings found</div>}
          </div>
        )}
      </div>
    </div>
  )
}
