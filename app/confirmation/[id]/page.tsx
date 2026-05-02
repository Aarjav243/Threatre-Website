'use client'
import { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import type { Booking, BookingSeat, BookingSnack } from '@/lib/types'
import { formatTime, formatDate } from '@/lib/utils'
import { Check } from 'lucide-react'

export default function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [bookedSeats, setBookedSeats] = useState<BookingSeat[]>([])
  const [bookedSnacks, setBookedSnacks] = useState<BookingSnack[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [bRes, bsRes, bsnRes] = await Promise.all([
        supabase.from('bookings').select('*, shows(*, movies(*), screens(*))').eq('id', id).single(),
        supabase.from('booking_seats').select('*, seats(*)').eq('booking_id', id),
        supabase.from('booking_snacks').select('*, snack_items(*)').eq('booking_id', id)
      ])
      setBooking(bRes.data)
      setBookedSeats(bsRes.data || [])
      setBookedSnacks(bsnRes.data || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="flex justify-center py-20 text-gray-400 animate-pulse">Loading...</div>
  if (!booking) return <div className="flex justify-center py-20 text-gray-400">Booking not found</div>

  const show = (booking as any).shows

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      {/* Success banner */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-green-900/30 border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-green-400 mb-1">Booking Confirmed!</h1>
        <p className="text-gray-400 text-sm">SMS sent to {booking.customer_phone}</p>
      </div>

      {/* Ticket card */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden mb-6">
        {/* Header */}
        <div className="bg-[#c41e3a] p-4 text-center">
          <div className="text-sm font-semibold opacity-80">RADHAKRISHNA THEATRE</div>
          <div className="text-xs opacity-60">Ichalkaranji · 3 Screen Multiplex</div>
        </div>

        {/* Booking ref */}
        <div className="text-center py-4 border-b border-[#2a2a2a]">
          <div className="text-xs text-gray-400 mb-1">Booking Reference</div>
          <div className="text-xl font-bold font-mono tracking-wider">{booking.booking_reference}</div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <div className="text-xs text-gray-400">Movie</div>
            <div className="font-bold text-lg">{show?.movies?.title}</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-gray-400">Date</div>
              <div className="text-sm font-semibold">{show ? formatDate(show.show_date) : '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Time</div>
              <div className="text-sm font-semibold text-[#f5a623]">{show ? formatTime(show.show_time) : '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Screen</div>
              <div className="text-sm font-semibold">{show?.screens?.name}</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Seats</div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {bookedSeats.map(bs => (
                <span key={bs.id} className="text-sm bg-[#2a2a2a] font-mono px-2 py-0.5 rounded">
                  {(bs.seats as any)?.row_letter}{(bs.seats as any)?.seat_number}
                  <span className="text-xs text-gray-500 ml-1">{(bs.seats as any)?.category}</span>
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Customer</div>
            <div className="text-sm font-semibold">{booking.customer_name}</div>
          </div>

          {bookedSnacks.length > 0 && (
            <div>
              <div className="text-xs text-gray-400">Snacks</div>
              {bookedSnacks.map(bs => (
                <div key={bs.id} className="text-sm text-gray-300">
                  {bs.quantity}× {(bs.snack_items as any)?.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dashed divider */}
        <div className="border-t-2 border-dashed border-[#2a2a2a] mx-4" />

        <div className="p-4 flex justify-between items-center">
          <span className="text-gray-400 text-sm">Total Paid</span>
          <span className="font-bold text-[#f5a623] text-xl">₹{booking.total_amount}</span>
        </div>
      </div>

      {/* Refund policy */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-xs text-gray-400">
        <div className="font-semibold text-gray-300 mb-1">Refund Policy</div>
        <div>· 100% refund if cancelled before the show starts</div>
        <div>· 0% refund after the show begins</div>
        <div className="mt-2 text-gray-500">To cancel, contact the theatre box office with your booking reference.</div>
      </div>

      <a href="/" className="block text-center mt-6 text-[#c41e3a] hover:text-[#f5a623] transition-colors text-sm font-semibold">
        ← Back to Movies
      </a>
    </div>
  )
}
