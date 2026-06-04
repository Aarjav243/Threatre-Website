'use client'
import { use, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/lib/types'
import { ORDER_STATUSES, STATUS_COLORS, formatTime } from '@/lib/utils'
import { CheckCircle, Circle, Loader2 } from 'lucide-react'

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .single()
      setOrder(data)
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel(`order-track-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        payload => {
          setOrder(prev => prev ? { ...prev, status: payload.new.status } : prev)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400 text-sm">
        Order not found
      </div>
    )
  }

  const currentIdx = ORDER_STATUSES.findIndex(s => s.key === order.status)
  const isDelivered = order.status === 'delivered'

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Status badge */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border mb-3 ${STATUS_COLORS[order.status]}`}>
          {!isDelivered && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {ORDER_STATUSES.find(s => s.key === order.status)?.label}
        </div>
        <div className="text-white font-semibold">Seat {order.seat_number} · {order.screen_name}</div>
        <div className="text-gray-500 text-sm mt-1">Hi, {order.customer_name}!</div>
      </div>

      {/* Status stepper */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 mb-5">
        <div className="space-y-4">
          {ORDER_STATUSES.map((s, i) => {
            const done = i < currentIdx
            const active = i === currentIdx
            return (
              <div
                key={s.key}
                className={`flex items-center gap-3 transition-opacity ${
                  i > currentIdx ? 'opacity-40' : 'opacity-100'
                }`}
              >
                {done ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                ) : active ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#c41e3a] flex-shrink-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#c41e3a] animate-pulse" />
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-gray-600 flex-shrink-0" />
                )}
                <span className={`text-sm ${active ? 'font-bold text-white' : done ? 'text-green-400' : 'text-gray-500'}`}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Order summary */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-[#2a2a2a]">
          <span className="font-semibold text-sm">Order Summary</span>
          <span className="text-xs text-gray-500 ml-2">· {formatTime(order.created_at)}</span>
        </div>
        <div className="divide-y divide-[#2a2a2a]">
          {(order.order_items || []).map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <div className="text-sm">
                <span className="text-gray-200">{item.item_name}</span>
                <span className="text-gray-500 ml-2">× {item.quantity}</span>
              </div>
              <span className="text-sm font-semibold text-[#f5a623]">₹{item.unit_price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-3 bg-[#111] border-t border-[#2a2a2a]">
          <span className="font-bold">Total</span>
          <span className="font-bold text-lg text-[#f5a623]">₹{order.total_amount}</span>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3">
        💵 Please keep <strong className="text-gray-300">₹{order.total_amount}</strong> ready — pay Cash / UPI when your order arrives
      </div>
    </div>
  )
}
