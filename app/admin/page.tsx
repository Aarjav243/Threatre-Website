'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/lib/types'
import { ORDER_STATUSES, STATUS_COLORS, STATUS_NEXT, STATUS_NEXT_LABEL, formatTime } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<'active' | 'all' | 'delivered'>('active')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  async function loadOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(200)
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()

    const channel = supabase
      .channel('admin-orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function advanceStatus(order: Order) {
    const next = STATUS_NEXT[order.status]
    if (!next) return
    setUpdating(order.id)
    await supabase.from('orders').update({ status: next }).eq('id', order.id)
    setUpdating(null)
  }

  const filtered = orders.filter(o => {
    if (filter === 'active') return o.status !== 'delivered'
    if (filter === 'delivered') return o.status === 'delivered'
    return true
  })

  const newCount = orders.filter(o => o.status === 'placed').length
  const activeCount = orders.filter(o => o.status !== 'delivered').length
  const deliveredCount = orders.filter(o => o.status === 'delivered').length

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Live Orders</h1>
        <div className="flex items-center gap-2">
          {newCount > 0 && (
            <div className="bg-[#c41e3a] text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
              {newCount} new
            </div>
          )}
          <button onClick={loadOrders} className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="border border-yellow-700 bg-yellow-900/10 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{newCount}</div>
          <div className="text-xs text-gray-400 mt-0.5">New</div>
        </div>
        <div className="border border-blue-700 bg-blue-900/10 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{activeCount}</div>
          <div className="text-xs text-gray-400 mt-0.5">Active</div>
        </div>
        <div className="border border-green-700 bg-green-900/10 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{deliveredCount}</div>
          <div className="text-xs text-gray-400 mt-0.5">Delivered</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'active', label: 'Active' },
          { key: 'all', label: 'All' },
          { key: 'delivered', label: 'Delivered' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-[#c41e3a] text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders grid */}
      {loading ? (
        <div className="text-gray-400 text-sm animate-pulse">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500 text-sm">
          {filter === 'active' ? 'No active orders right now' : 'No orders yet'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(order => (
            <div
              key={order.id}
              className={`bg-[#1a1a1a] rounded-xl overflow-hidden border transition-all ${
                order.status === 'placed'
                  ? 'border-yellow-600/60 shadow-[0_0_12px_rgba(202,138,4,0.15)]'
                  : 'border-[#2a2a2a]'
              }`}
            >
              {/* Card header */}
              <div className="px-4 py-3 bg-[#111] border-b border-[#2a2a2a] flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">Seat {order.seat_number}</div>
                  <div className="text-xs text-gray-400">{order.screen_name} · {order.customer_name}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-xs px-2 py-0.5 rounded-full border inline-block ${STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUSES.find(s => s.key === order.status)?.label}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{formatTime(order.created_at)}</div>
                </div>
              </div>

              {/* Items */}
              <div className="px-4 py-3 space-y-1.5">
                {(order.order_items || []).map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{item.item_name} <span className="text-gray-500">×{item.quantity}</span></span>
                    <span className="text-gray-500 text-xs">₹{item.unit_price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-[#2a2a2a] flex items-center justify-between">
                <span className="font-bold text-[#f5a623]">₹{order.total_amount}</span>
                {STATUS_NEXT[order.status] && (
                  <button
                    onClick={() => advanceStatus(order)}
                    disabled={updating === order.id}
                    className="bg-[#c41e3a] hover:bg-[#9b1530] disabled:opacity-60 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                  >
                    {updating === order.id ? '...' : STATUS_NEXT_LABEL[order.status]}
                  </button>
                )}
                {order.status === 'delivered' && (
                  <span className="text-xs text-green-500 font-medium">✓ Delivered</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
