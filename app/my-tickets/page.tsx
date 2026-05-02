'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatTime, formatDate } from '@/lib/utils'
import { Ticket, Search, Check } from 'lucide-react'

type Booking = {
  id: string
  booking_reference: string
  customer_name: string
  customer_phone: string
  total_amount: number
  ticket_amount: number
  snack_amount: number
  status: 'confirmed' | 'cancelled'
  payment_status: string
  created_at: string
  shows: {
    show_date: string
    show_time: string
    audio_format: string
    movies: { title: string; language: string; genre: string }
    screens: { name: string }
  }
  booking_seats: { id: string; seats: { row_letter: string; seat_number: number; category: string } }[]
  booking_snacks: { quantity: number; unit_price: number; snack_items: { name: string } }[]
}

export default function MyTicketsPage() {
  const [phone, setPhone] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set())
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function searchBookings() {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    setError('')
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        shows(show_date, show_time, audio_format, movies(title, language, genre), screens(name)),
        booking_seats(id, seats(row_letter, seat_number, category)),
        booking_snacks(quantity, unit_price, snack_items(name))
      `)
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false })

    setBookings((data as Booking[]) || [])
    setSearched(true)
    setLoading(false)
  }

  async function confirmCancel(booking: Booking) {
    setCancellingId(booking.id)
    setConfirmingId(null)
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
    await supabase.from('refunds').insert({
      booking_id: booking.id,
      amount: booking.total_amount,
      reason: 'Customer cancellation via website',
      status: 'pending'
    })
    setCancelledIds(prev => new Set([...prev, booking.id]))
    setCancellingId(null)
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'cancelled' } : b))
  }

  function getShowStatus(booking: Booking) {
    if (booking.status === 'cancelled') return { label: 'Cancelled', color: 'text-red-400 bg-red-900/30 border-red-800' }
    const showDateTime = new Date(`${booking.shows.show_date}T${booking.shows.show_time}`)
    const now = new Date()
    const diffMs = showDateTime.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    if (diffMs < 0) return { label: 'Show Completed', color: 'text-gray-400 bg-gray-800/30 border-gray-700' }
    if (diffHours < 2) return { label: 'Starting Soon', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-700' }
    return { label: 'Confirmed', color: 'text-green-400 bg-green-900/30 border-green-700' }
  }

  function canCancel(booking: Booking) {
    if (booking.status === 'cancelled') return false
    const showDateTime = new Date(`${booking.shows.show_date}T${booking.shows.show_time}`)
    return new Date() < showDateTime
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <Ticket className="w-10 h-10 mx-auto mb-3 text-[#c41e3a]" />
        <h1 className="text-2xl font-bold">My Tickets</h1>
        <p className="text-gray-400 text-sm mt-1">Enter your mobile number to view and manage your bookings</p>
      </div>

      {/* Search */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 mb-8">
        <label className="text-xs text-gray-400 block mb-1.5">Mobile Number</label>
        <div className="flex gap-3">
          <input
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            onKeyDown={e => e.key === 'Enter' && searchBookings()}
            placeholder="Enter 10-digit number"
            className="flex-1 bg-[#0a0a0a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#c41e3a] focus:outline-none text-sm"
          />
          <button
            onClick={searchBookings}
            disabled={loading && searched}
            className="bg-[#c41e3a] hover:bg-[#9b1530] disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap"
          >
            {loading && searched ? '...' : 'Find Tickets'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {/* Results */}
      {searched && (
        bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Search className="w-10 h-10 mx-auto mb-3 text-gray-700" />
            <div className="font-medium text-gray-400">No bookings found</div>
            <div className="text-sm mt-1">No tickets linked to this mobile number</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-400 mb-2">{bookings.length} booking{bookings.length > 1 ? 's' : ''} found</div>

            {bookings.map(booking => {
              const status = getShowStatus(booking)
              const eligible = canCancel(booking)
              const justCancelled = cancelledIds.has(booking.id)
              const isConfirming = confirmingId === booking.id
              const isCancelling = cancellingId === booking.id

              return (
                <div key={booking.id} className={`bg-[#1a1a1a] border rounded-2xl overflow-hidden transition-all ${booking.status === 'cancelled' ? 'border-[#2a2a2a] opacity-70' : 'border-[#2a2a2a] hover:border-[#c41e3a]/30'}`}>
                  <div className={`h-1 w-full ${booking.status === 'cancelled' ? 'bg-red-900' : 'bg-[#c41e3a]'}`} />

                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="font-mono text-xs text-gray-400">{booking.booking_reference}</div>
                        <div className="font-bold text-lg mt-0.5">{booking.shows?.movies?.title}</div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold flex-shrink-0 ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Show details */}
                    <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">Date</div>
                        <div className="font-medium">{formatDate(booking.shows?.show_date)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">Time</div>
                        <div className="font-medium text-[#f5a623]">{formatTime(booking.shows?.show_time)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">Screen</div>
                        <div className="font-medium">{booking.shows?.screens?.name}</div>
                      </div>
                    </div>

                    {/* Seats */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1.5">Seats</div>
                      <div className="flex flex-wrap gap-1.5">
                        {booking.booking_seats?.map(bs => (
                          <span key={bs.id} className="text-xs bg-[#2a2a2a] border border-[#3a3a3a] font-mono px-2 py-0.5 rounded">
                            {bs.seats?.row_letter}{bs.seats?.seat_number}
                            <span className="text-gray-500 ml-1">{bs.seats?.category}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Snacks */}
                    {booking.booking_snacks?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">Snacks</div>
                        <div className="flex flex-wrap gap-2">
                          {booking.booking_snacks.map((bs, i) => (
                            <span key={i} className="text-xs text-gray-300 bg-[#2a2a2a] px-2 py-0.5 rounded">
                              {bs.quantity}× {bs.snack_items?.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer / cancel area */}
                    <div className="pt-3 border-t border-[#2a2a2a]">

                      {/* Inline cancel confirmation */}
                      {isConfirming ? (
                        <div className="bg-red-950/40 border border-red-800 rounded-xl p-4">
                          <div className="font-semibold text-red-300 mb-1">Cancel this ticket?</div>
                          <div className="text-sm text-gray-300 mb-3">
                            You'll receive a <span className="text-green-400 font-semibold">100% refund of ₹{booking.total_amount}</span>. Refunds are processed within 3–5 business days.
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => confirmCancel(booking)}
                              className="bg-red-700 hover:bg-red-600 text-white text-sm px-5 py-2 rounded-lg font-semibold transition-colors"
                            >
                              Yes, Cancel Ticket
                            </button>
                            <button
                              onClick={() => setConfirmingId(null)}
                              className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 text-sm px-5 py-2 rounded-lg font-semibold transition-colors"
                            >
                              Keep Ticket
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-gray-500">Total Paid </span>
                            <span className="font-bold text-[#f5a623]">₹{booking.total_amount}</span>
                          </div>

                          {justCancelled ? (
                            <div className="text-xs text-green-400 bg-green-900/20 border border-green-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                              <Check className="w-3 h-3" /> Cancelled · Refund pending
                            </div>
                          ) : isCancelling ? (
                            <div className="text-xs text-gray-400 animate-pulse">Cancelling...</div>
                          ) : eligible ? (
                            <button
                              onClick={() => setConfirmingId(booking.id)}
                              className="text-xs text-red-400 hover:text-white hover:bg-red-800 border border-red-800 px-3 py-1.5 rounded-lg transition-all"
                            >
                              Cancel Ticket
                            </button>
                          ) : booking.status === 'cancelled' ? (
                            <div className="text-xs text-gray-500">Refund will be processed within 3–5 days</div>
                          ) : (
                            <div className="text-xs text-gray-500 italic">Show started · No cancellation</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-3 text-xs text-gray-500">
              <span className="text-gray-300 font-medium">Refund Policy: </span>
              100% refund if cancelled before show starts · 0% after show begins · Refunds processed in 3–5 business days
            </div>
          </div>
        )
      )}
    </div>
  )
}
