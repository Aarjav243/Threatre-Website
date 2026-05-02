'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Banknote, Check } from 'lucide-react'

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'processed' | 'all'>('pending')

  useEffect(() => { fetchRefunds() }, [filter])

  async function fetchRefunds() {
    setLoading(true)
    let q = supabase.from('refunds')
      .select('*, bookings(booking_reference, customer_name, customer_phone, total_amount, shows(movies(title)))')
      .order('requested_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setRefunds(data || [])
    setLoading(false)
  }

  async function processRefund(id: string) {
    await supabase.from('refunds').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', id)
    fetchRefunds()
  }

  async function rejectRefund(id: string) {
    await supabase.from('refunds').update({ status: 'rejected', processed_at: new Date().toISOString() }).eq('id', id)
    fetchRefunds()
  }

  const pendingTotal = refunds.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Refunds</h1>
        {filter !== 'all' && refunds.some(r => r.status === 'pending') && (
          <div className="bg-orange-900/30 border border-orange-700 text-orange-300 px-4 py-2 rounded-lg text-sm">
            Pending: ₹{pendingTotal.toLocaleString()} to process
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {(['pending', 'processed', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize ${filter === f ? 'bg-[#c41e3a] text-white' : 'bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-400 animate-pulse">Loading...</div>
      ) : refunds.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Banknote className="w-10 h-10 mx-auto mb-3 text-gray-700" />
          <div>No {filter === 'all' ? '' : filter} refunds</div>
        </div>
      ) : (
        <div className="space-y-3">
          {refunds.map(r => (
            <div key={r.id} className={`bg-[#1a1a1a] border rounded-xl p-4 ${r.status === 'pending' ? 'border-orange-800' : 'border-[#2a2a2a]'}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-gray-300">{r.bookings?.booking_reference}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === 'pending' ? 'bg-orange-900/40 text-orange-400' :
                      r.status === 'processed' ? 'bg-green-900/40 text-green-400' :
                      'bg-red-900/40 text-red-400'
                    }`}>{r.status}</span>
                  </div>
                  <div className="font-semibold">{r.bookings?.customer_name}</div>
                  <div className="text-sm text-gray-400">{r.bookings?.customer_phone}</div>
                  <div className="text-sm text-gray-400">Movie: {r.bookings?.shows?.movies?.title}</div>
                  {r.reason && <div className="text-xs text-gray-500">Reason: {r.reason}</div>}
                  <div className="text-xs text-gray-500">Requested: {new Date(r.requested_at).toLocaleString('en-IN')}</div>
                  {r.processed_at && <div className="text-xs text-gray-500">Processed: {new Date(r.processed_at).toLocaleString('en-IN')}</div>}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#f5a623]">₹{r.amount}</div>
                  <div className="text-xs text-gray-500 mb-2">to refund</div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => processRefund(r.id)}
                        className="bg-green-800 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <Check className="w-3 h-3" /> Mark Paid
                      </button>
                      <button onClick={() => rejectRefund(r.id)}
                        className="bg-red-900/50 hover:bg-red-800 text-red-300 text-xs px-3 py-1.5 rounded-lg">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
