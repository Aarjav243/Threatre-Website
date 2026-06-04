'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MenuItem, MenuCategory } from '@/lib/types'
import { Plus, X, ToggleLeft, ToggleRight } from 'lucide-react'

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', category_id: '', price: '', description: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const [catRes, itemRes] = await Promise.all([
      supabase.from('menu_categories').select('*').order('display_order'),
      supabase.from('menu_items').select('*').order('name'),
    ])
    setCategories(catRes.data || [])
    setItems(itemRes.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleAvailability(item: MenuItem) {
    await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i))
  }

  async function addItem() {
    if (!form.name.trim() || !form.category_id || !form.price) return
    setSaving(true)
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        name: form.name.trim(),
        category_id: form.category_id,
        price: parseInt(form.price),
        description: form.description.trim() || null,
      })
      .select()
      .single()
    if (data) {
      setItems(prev => [...prev, data])
      setForm({ name: '', category_id: '', price: '', description: '' })
      setAddOpen(false)
    }
    setSaving(false)
  }

  const itemsByCategory = categories.map(cat => ({
    cat,
    items: items.filter(i => i.category_id === cat.id),
  }))

  const availableCount = items.filter(i => i.is_available).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <div className="text-xs text-gray-500 mt-0.5">{availableCount} of {items.length} items available</div>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-[#c41e3a] hover:bg-[#9b1530] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm animate-pulse">Loading menu...</div>
      ) : (
        <div className="space-y-6">
          {itemsByCategory.map(({ cat, items: catItems }) => (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase text-gray-500 font-bold tracking-wider">{cat.name}</span>
                <span className="text-xs text-gray-600">({catItems.filter(i => i.is_available).length}/{catItems.length})</span>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
                {catItems.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-600">No items in this category</div>
                ) : (
                  catItems.map((item, i) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between px-4 py-3 gap-3 ${
                        i > 0 ? 'border-t border-[#2a2a2a]' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${item.is_available ? 'text-white' : 'text-gray-600 line-through'}`}>
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-sm font-bold ${item.is_available ? 'text-[#f5a623]' : 'text-gray-600'}`}>
                          ₹{item.price}
                        </span>
                        <button
                          onClick={() => toggleAvailability(item)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            item.is_available
                              ? 'bg-green-900/20 text-green-400 border-green-800 hover:bg-green-900/40'
                              : 'bg-[#0a0a0a] text-gray-500 border-gray-700 hover:border-gray-500'
                          }`}
                        >
                          {item.is_available
                            ? <><ToggleRight className="w-3.5 h-3.5" /> In Stock</>
                            : <><ToggleLeft className="w-3.5 h-3.5" /> Out of Stock</>
                          }
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add item modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setAddOpen(false)} />
          <div className="relative bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Add Menu Item</h2>
              <button onClick={() => setAddOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Category *</label>
                <select
                  value={form.category_id}
                  onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-xl px-3 py-2.5 text-white focus:border-[#c41e3a] focus:outline-none text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Item Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Salted Popcorn (Large)"
                  className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:border-[#c41e3a] focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Price (₹) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="120"
                  min={1}
                  className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:border-[#c41e3a] focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Description <span className="text-gray-600">(optional)</span></label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description"
                  className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:border-[#c41e3a] focus:outline-none text-sm"
                />
              </div>
            </div>

            <button
              onClick={addItem}
              disabled={saving || !form.name.trim() || !form.category_id || !form.price}
              className="w-full mt-5 bg-[#c41e3a] hover:bg-[#9b1530] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-colors"
            >
              {saving ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
