'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Show, Seat, Movie, Screen } from '@/lib/types'
import { formatTime, formatDate, groupSeatsByRow } from '@/lib/utils'

const CATEGORY_ORDER = ['VIP', 'PLATINUM', 'GOLD', 'SILVER']
const ROW_CATEGORIES: Record<string, string> = {
  A: 'VIP', B: 'PLATINUM', C: 'PLATINUM', D: 'PLATINUM', E: 'PLATINUM',
  F: 'GOLD', G: 'GOLD', H: 'GOLD', I: 'GOLD', J: 'SILVER', K: 'SILVER'
}

export default function BookingPage({ params }: { params: Promise<{ showId: string }> }) {
  const { showId } = use(params)
  const router = useRouter()

  const [show, setShow] = useState<(Show & { movies: Movie; screens: Screen }) | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [bookedSeatIds, setBookedSeatIds] = useState<Set<string>>(new Set())
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [showId])

  async function fetchData() {
    const [showRes, seatsRes, bookedRes] = await Promise.all([
      supabase.from('shows').select('*, movies(*), screens(*)').eq('id', showId).single(),
      supabase.from('seats').select('*').order('row_letter').order('seat_number'),
      supabase.from('booking_seats').select('seat_id').eq('show_id', showId)
    ])

    if (showRes.data) setShow(showRes.data as Show & { movies: Movie; screens: Screen })
    if (seatsRes.data) {
      const screenId = showRes.data?.screen_id
      setSeats(seatsRes.data.filter((s: Seat) => s.screen_id === screenId))
    }
    if (bookedRes.data) setBookedSeatIds(new Set(bookedRes.data.map((b: { seat_id: string }) => b.seat_id)))
    setLoading(false)
  }

  function toggleSeat(seat: Seat) {
    if (bookedSeatIds.has(seat.id)) return
    setSelectedSeats(prev => {
      const exists = prev.find(s => s.id === seat.id)
      if (exists) return prev.filter(s => s.id !== seat.id)
      if (prev.length >= 10) return prev
      return [...prev, seat]
    })
  }

  function proceedToCheckout() {
    if (selectedSeats.length === 0) return
    const seatIds = selectedSeats.map(s => s.id).join(',')
    const total = selectedSeats.reduce((sum, s) => sum + s.price, 0)
    router.push(`/checkout?showId=${showId}&seats=${seatIds}&total=${total}`)
  }

  const rowedSeats = groupSeatsByRow(seats)
  const total = selectedSeats.reduce((sum, s) => sum + s.price, 0)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-gray-400 animate-pulse">Loading seats...</div>
    </div>
  )

  if (!show) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-gray-400">Show not found</div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Show info */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h1 className="text-xl font-bold">{show.movies?.title}</h1>
            <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-400">
              <span>{show.screens?.name}</span>
              <span>·</span>
              <span>{formatDate(show.show_date)}</span>
              <span>·</span>
              <span className="text-[#f5a623] font-semibold">{formatTime(show.show_time)}</span>
              <span>·</span>
              <span>{show.audio_format}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Selected</div>
            <div className="text-2xl font-bold text-white">{selectedSeats.length} <span className="text-sm text-gray-400">seats</span></div>
          </div>
        </div>
      </div>

      {/* Screen indicator */}
      <div className="mb-6 text-center">
        <div className="inline-block w-64 h-2 rounded-b-full bg-gradient-to-r from-transparent via-[#c41e3a] to-transparent mb-1" />
        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Screen this way</div>
      </div>

      {/* Seat map */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-max mx-auto">
          {Object.entries(rowedSeats).map(([row, rowSeats]) => {
            const category = ROW_CATEGORIES[row] || 'SILVER'
            return (
              <div key={row} className="flex items-center gap-2 mb-1.5">
                <span className="w-5 text-[10px] text-gray-500 font-bold text-right">{row}</span>
                <div className="flex gap-1">
                  {/* Left block */}
                  {rowSeats.slice(0, Math.floor(rowSeats.length / 3)).map(seat => (
                    <SeatButton key={seat.id} seat={seat} category={category}
                      isBooked={bookedSeatIds.has(seat.id)}
                      isSelected={!!selectedSeats.find(s => s.id === seat.id)}
                      onClick={() => toggleSeat(seat)} />
                  ))}
                  <div className="w-4" />
                  {/* Center block */}
                  {rowSeats.slice(Math.floor(rowSeats.length / 3), Math.floor(rowSeats.length * 2 / 3)).map(seat => (
                    <SeatButton key={seat.id} seat={seat} category={category}
                      isBooked={bookedSeatIds.has(seat.id)}
                      isSelected={!!selectedSeats.find(s => s.id === seat.id)}
                      onClick={() => toggleSeat(seat)} />
                  ))}
                  <div className="w-4" />
                  {/* Right block */}
                  {rowSeats.slice(Math.floor(rowSeats.length * 2 / 3)).map(seat => (
                    <SeatButton key={seat.id} seat={seat} category={category}
                      isBooked={bookedSeatIds.has(seat.id)}
                      isSelected={!!selectedSeats.find(s => s.id === seat.id)}
                      onClick={() => toggleSeat(seat)} />
                  ))}
                </div>
                <span className="w-5 text-[10px] text-gray-500 font-bold">{row}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 mb-6">
        {[
          { label: 'VIP ₹270', cls: 'seat-vip' },
          { label: 'Platinum ₹250', cls: 'seat-platinum' },
          { label: 'Gold ₹250', cls: 'seat-gold' },
          { label: 'Silver ₹200', cls: 'seat-silver' },
          { label: 'Selected', cls: 'seat-gold seat-selected' },
          { label: 'Booked', cls: 'seat-booked' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`seat w-5 h-4 ${l.cls}`} />
            <span className="text-[11px] text-gray-400">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Sticky bottom bar */}
      {selectedSeats.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-[#2a2a2a] p-4 z-40">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">
                {selectedSeats.map(s => `${s.row_letter}${s.seat_number}`).join(', ')}
              </div>
              <div className="text-lg font-bold">₹{total} <span className="text-sm text-gray-400 font-normal">· {selectedSeats.length} ticket{selectedSeats.length > 1 ? 's' : ''}</span></div>
            </div>
            <button
              onClick={proceedToCheckout}
              className="bg-[#c41e3a] hover:bg-[#9b1530] text-white px-8 py-3 rounded-lg font-bold transition-colors"
            >
              Proceed →
            </button>
          </div>
        </div>
      )}
      <div className="h-20" />
    </div>
  )
}

function SeatButton({ seat, category, isBooked, isSelected, onClick }: {
  seat: Seat; category: string; isBooked: boolean; isSelected: boolean; onClick: () => void
}) {
  const catClass = category.toLowerCase()
  return (
    <button
      onClick={onClick}
      disabled={isBooked}
      title={isBooked ? 'Booked' : `${seat.row_letter}${seat.seat_number} · ₹${seat.price}`}
      className={`seat seat-${catClass} ${isBooked ? 'seat-booked' : ''} ${isSelected ? 'seat-selected !border-white scale-110' : ''}`}
    >
      {seat.seat_number}
    </button>
  )
}
