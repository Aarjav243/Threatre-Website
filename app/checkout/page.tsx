'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Show, Seat, SnackItem, Movie, Screen } from '@/lib/types'
import { formatTime, formatDate, generateBookingRef } from '@/lib/utils'
import { QrCode, Check } from 'lucide-react'

function CheckoutContent() {
  const params = useSearchParams()
  const router = useRouter()
  const showId = params.get('showId')!
  const seatIds = params.get('seats')!.split(',')
  const ticketTotal = Number(params.get('total'))

  const [show, setShow] = useState<(Show & { movies: Movie; screens: Screen }) | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [snacks, setSnacks] = useState<SnackItem[]>([])
  const [snackCart, setSnackCart] = useState<Record<string, number>>({})
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    async function load() {
      const [showRes, seatsRes, snacksRes] = await Promise.all([
        supabase.from('shows').select('*, movies(*), screens(*)').eq('id', showId).single(),
        supabase.from('seats').select('*').in('id', seatIds),
        supabase.from('snack_items').select('*').eq('is_available', true).order('category')
      ])
      if (showRes.data) setShow(showRes.data as Show & { movies: Movie; screens: Screen })
      if (seatsRes.data) setSeats(seatsRes.data)
      if (snacksRes.data) setSnacks(snacksRes.data)
    }
    load()
  }, [])

  const snackTotal = Object.entries(snackCart).reduce((sum, [id, qty]) => {
    const s = snacks.find(s => s.id === id)
    return sum + (s ? s.price * qty : 0)
  }, 0)
  const grandTotal = ticketTotal + snackTotal

  function updateSnack(id: string, delta: number) {
    setSnackCart(prev => {
      const next = { ...prev }
      next[id] = Math.max(0, (next[id] || 0) + delta)
      if (next[id] === 0) delete next[id]
      return next
    })
  }

  async function handleProceedToPay() {
    if (!name.trim()) return setError('Please enter your name')
    if (!/^[6-9]\d{9}$/.test(phone)) return setError('Enter a valid 10-digit mobile number')
    setError('')
    setShowQR(true)
  }

  async function handleConfirmPayment() {
    setSubmitting(true)
    const bookingRef = generateBookingRef()
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .insert({
        booking_reference: bookingRef,
        show_id: showId,
        customer_name: name.trim(),
        customer_phone: phone,
        total_amount: grandTotal,
        ticket_amount: ticketTotal,
        snack_amount: snackTotal,
        status: 'confirmed',
        payment_status: 'paid'
      })
      .select()
      .single()

    if (bErr || !booking) { setError('Booking failed. Try again.'); setSubmitting(false); return }

    const seatInserts = seatIds.map(sid => ({ booking_id: booking.id, seat_id: sid, show_id: showId }))
    await supabase.from('booking_seats').insert(seatInserts)

    const snackInserts = Object.entries(snackCart).map(([id, qty]) => ({
      booking_id: booking.id, snack_item_id: id, quantity: qty,
      unit_price: snacks.find(s => s.id === id)?.price || 0
    }))
    if (snackInserts.length > 0) await supabase.from('booking_snacks').insert(snackInserts)

    await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name, bookingRef, movie: show?.movies?.title, time: show?.show_time, date: show?.show_date, seats: seatIds.length, total: grandTotal })
    }).catch(() => {})

    router.push(`/confirmation/${booking.id}`)
  }

  const snacksByCategory = snacks.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {} as Record<string, SnackItem[]>)

  if (!show) return <div className="flex justify-center py-20 text-gray-400 animate-pulse">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Complete Your Booking</h1>

      {/* Show summary */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
        <div className="font-bold text-lg">{show.movies?.title}</div>
        <div className="text-sm text-gray-400 mt-1">
          {show.screens?.name} · {formatDate(show.show_date)} · {formatTime(show.show_time)} · {show.audio_format}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {seats.map(s => (
            <span key={s.id} className="text-xs bg-[#2a2a2a] px-2 py-1 rounded font-mono">
              {s.row_letter}{s.seat_number} <span className="text-gray-500">{s.category}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Customer info */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
        <h2 className="font-semibold mb-4">Your Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Full Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#c41e3a] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Mobile Number *</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#c41e3a] focus:outline-none"
            />
            <p className="text-[10px] text-gray-500 mt-1">Booking confirmation will be sent via SMS</p>
          </div>
        </div>
      </div>

      {/* Snacks */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
        <h2 className="font-semibold mb-1">Add Snacks <span className="text-xs text-gray-400 font-normal ml-1">(Optional)</span></h2>
        <p className="text-xs text-gray-500 mb-4">Pre-order snacks and skip the queue!</p>
        {Object.entries(snacksByCategory).map(([cat, items]) => (
          <div key={cat} className="mb-4">
            <div className="text-xs uppercase text-gray-500 font-bold mb-2 tracking-wider">{cat}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map(snack => (
                <div key={snack.id} className="flex items-center justify-between bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">{snack.name}</div>
                    <div className="text-xs text-[#f5a623]">₹{snack.price}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(snackCart[snack.id] || 0) > 0 ? (
                      <>
                        <button onClick={() => updateSnack(snack.id, -1)} className="w-7 h-7 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white font-bold text-sm flex items-center justify-center">−</button>
                        <span className="w-4 text-center text-sm font-bold">{snackCart[snack.id]}</span>
                        <button onClick={() => updateSnack(snack.id, 1)} className="w-7 h-7 rounded-full bg-[#c41e3a] hover:bg-[#9b1530] text-white font-bold text-sm flex items-center justify-center">+</button>
                      </>
                    ) : (
                      <button onClick={() => updateSnack(snack.id, 1)} className="text-xs bg-[#2a2a2a] hover:bg-[#c41e3a] text-white px-3 py-1.5 rounded-lg transition-colors">Add</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Order summary */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
        <h2 className="font-semibold mb-3">Order Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">{seats.length} Ticket{seats.length > 1 ? 's' : ''}</span>
            <span>₹{ticketTotal}</span>
          </div>
          {snackTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Snacks</span>
              <span>₹{snackTotal}</span>
            </div>
          )}
          <div className="border-t border-[#2a2a2a] pt-2 flex justify-between font-bold text-base">
            <span>Total</span>
            <span className="text-[#f5a623]">₹{grandTotal}</span>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}

      {!showQR ? (
        <button
          onClick={handleProceedToPay}
          className="w-full bg-[#c41e3a] hover:bg-[#9b1530] text-white py-4 rounded-xl font-bold text-lg transition-colors"
        >
          Proceed to Pay · ₹{grandTotal}
        </button>
      ) : (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 text-center">
          <h2 className="font-bold text-lg mb-2">Scan to Pay</h2>
          <p className="text-gray-400 text-sm mb-4">Pay ₹{grandTotal} to complete your booking</p>
          <div className="w-48 h-48 bg-white rounded-xl mx-auto flex items-center justify-center mb-4">
            <div className="text-[#0a0a0a] text-xs text-center p-2">
              <QrCode className="w-10 h-10 mx-auto mb-2 text-[#0a0a0a]" />
              <div className="font-bold">QR Code</div>
              <div className="text-gray-500 text-[10px]">Placeholder — replace with actual QR</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">After payment, click the button below to confirm</p>
          <button
            onClick={handleConfirmPayment}
            disabled={submitting}
            className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors"
          >
            {submitting ? 'Confirming...' : <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" /> I have paid — Confirm Booking</span>}
          </button>
        </div>
      )}
    </div>
  )
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="flex justify-center py-20 text-gray-400">Loading...</div>}><CheckoutContent /></Suspense>
}
