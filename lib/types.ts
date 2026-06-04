export type MenuCategory = {
  id: string
  name: string
  display_order: number
}

export type MenuItem = {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  is_available: boolean
  menu_categories?: MenuCategory
}

export type OrderStatus = 'placed' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered'

export type Order = {
  id: string
  screen_name: string
  seat_number: string
  customer_name: string
  status: OrderStatus
  total_amount: number
  created_at: string
  order_items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  menu_item_id: string | null
  item_name: string
  quantity: number
  unit_price: number
}

export type CartItem = {
  menuItem: MenuItem
  quantity: number
}
