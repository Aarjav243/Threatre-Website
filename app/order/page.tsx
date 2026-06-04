'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { MenuItem, MenuCategory, CartItem } from '@/lib/types'
import { ShoppingCart, Plus, Minus, X, UtensilsCrossed, QrCode } from 'lucide-react'

function OrderPage() {
  const params = useSearchParams()
  const router = useRouter()
  const screen = params.get('screen') || ''
  const seat = params.get('seat') || ''

  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [name, setName] = useState('')
  const [placing, setPlacing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [catRes, itemRes] = await Promise.all([
        supabase.from('menu_categories').select('*').order('display_order'),
        supabase.from('menu_items').select('*').eq('is_available', true),
      ])
      const cats = catRes.data || []
      setCategories(cats)
      setItems(itemRes.data || [])
      if (cats.length > 0) setActiveCategory(cats[0].id)
      setLoading(false)
    }
    load()
  }, [])

  if (!screen || !seat) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-4">
          <QrCode className="w-7 h-7 text-gray-500" />
        </div>
        <h1 className="text-lg font-bold mb-2">Scan Your Seat QR Code</h1>
        <p className="text-gray-400 text-sm">Please scan the QR code on your seat to start ordering food & beverages.</p>
      </div>
    )
  }

  const filteredItems = items.filter(i => i.category_id === activeCategory)
  const cartTotal = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0)
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0)

  function getQty(id: string) {
    return cart.find(c => c.menuItem.id === id)?.quantity || 0
  }

  function updateCart(item: MenuItem, delta: number) {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id)
      if (!existing) {
        if (delta <= 0) return prev
        return [...prev, { menuItem: item, quantity: delta }]
      }
      const newQty = existing.quantity + delta
      if (newQty <= 0) return prev.filter(c => c.menuItem.id !== item.id)
      return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: newQty } : c)
    })
  }

  async function placeOrder() {
    if (!name.trim()) { alert('Please enter your name'); return }
    setPlacing(true)

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        screen_name: screen,
        seat_number: seat,
        customer_name: name.trim(),
        total_amount: cartTotal,
        status: 'placed',
      })
      .select()
      .single()

    if (error || !order) {
      alert('Failed to place order. Please try again.')
      setPlacing(false)
      return
    }

    await supabase.from('order_items').insert(
      cart.map(c => ({
        order_id: order.id,
        menu_item_id: c.menuItem.id,
        item_name: c.menuItem.name,
        quantity: c.quantity,
        unit_price: c.menuItem.price,
      }))
    )

    router.push(`/order/${order.id}`)
  }

  return (
    <div className="max-w-lg mx-auto pb-28">
      {/* Seat info bar */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-3">
        <div className="text-sm font-bold text-white">Seat {seat}</div>
        <div className="text-xs text-gray-400">{screen}</div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-[#2a2a2a] bg-[#0a0a0a] sticky top-[57px] z-10 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-[#c41e3a] text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu items */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-[#1a1a1a] rounded-xl animate-pulse border border-[#2a2a2a]" />
          ))
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 text-gray-700" />
            <div className="text-sm">No items available in this category</div>
          </div>
        ) : (
          filteredItems.map(item => {
            const qty = getQty(item.id)
            return (
              <div
                key={item.id}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-white">{item.name}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                  )}
                  <div className="text-sm font-bold text-[#f5a623] mt-1.5">₹{item.price}</div>
                </div>
                <div className="flex-shrink-0">
                  {qty === 0 ? (
                    <button
                      onClick={() => updateCart(item, 1)}
                      className="flex items-center gap-1.5 bg-[#c41e3a] hover:bg-[#9b1530] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  ) : (
                    <div className="flex items-center gap-0 bg-[#c41e3a] rounded-lg">
                      <button
                        onClick={() => updateCart(item, -1)}
                        className="p-2 hover:bg-[#9b1530] rounded-l-lg transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold">{qty}</span>
                      <button
                        onClick={() => updateCart(item, 1)}
                        className="p-2 hover:bg-[#9b1530] rounded-r-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] to-transparent z-20">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full max-w-lg mx-auto flex bg-[#c41e3a] text-white px-4 py-3.5 rounded-xl items-center justify-between shadow-xl"
          >
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-md px-2 py-0.5 text-xs font-bold">{cartCount}</div>
              <span className="font-semibold text-sm">View Cart</span>
            </div>
            <span className="font-bold">₹{cartTotal}</span>
          </button>
        </div>
      )}

      {/* Cart bottom sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-30 flex items-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-[#111] border-t border-x border-[#2a2a2a] rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#111] px-4 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Your Cart
              </h2>
              <button onClick={() => setCartOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#2a2a2a] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-3 space-y-2">
              {cart.map(c => (
                <div key={c.menuItem.id} className="flex items-center gap-3 py-2 border-b border-[#2a2a2a]">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{c.menuItem.name}</div>
                    <div className="text-xs text-gray-500">₹{c.menuItem.price} each</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-[#2a2a2a] rounded-lg">
                      <button onClick={() => updateCart(c.menuItem, -1)} className="px-2 py-1.5 text-gray-400 hover:text-white">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{c.quantity}</span>
                      <button onClick={() => updateCart(c.menuItem, 1)} className="px-2 py-1.5 text-gray-400 hover:text-white">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[#f5a623] w-14 text-right">
                      ₹{c.menuItem.price * c.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 pb-4">
              <div className="flex items-center justify-between py-3 mb-4">
                <span className="font-bold text-base">Total</span>
                <span className="font-bold text-xl text-[#f5a623]">₹{cartTotal}</span>
              </div>

              <div className="mb-3">
                <label className="text-xs text-gray-400 block mb-1.5">Your Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-[#c41e3a] focus:outline-none text-sm"
                />
              </div>

              <div className="text-xs text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 mb-4">
                💵 Pay Cash / UPI when your order arrives at your seat
              </div>

              <button
                onClick={placeOrder}
                disabled={placing || !name.trim()}
                className="w-full bg-[#c41e3a] hover:bg-[#9b1530] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-base transition-colors"
              >
                {placing ? 'Placing Order...' : `Place Order · ₹${cartTotal}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrderPageWrapper() {
  return (
    <Suspense>
      <OrderPage />
    </Suspense>
  )
}
