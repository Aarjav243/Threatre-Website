export const ORDER_STATUSES: { key: string; label: string }[] = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
]

export const STATUS_COLORS: Record<string, string> = {
  placed: 'text-yellow-400 bg-yellow-900/20 border-yellow-700',
  confirmed: 'text-blue-400 bg-blue-900/20 border-blue-700',
  preparing: 'text-orange-400 bg-orange-900/20 border-orange-700',
  out_for_delivery: 'text-purple-400 bg-purple-900/20 border-purple-700',
  delivered: 'text-green-400 bg-green-900/20 border-green-700',
}

export const STATUS_NEXT: Record<string, string | null> = {
  placed: 'confirmed',
  confirmed: 'preparing',
  preparing: 'out_for_delivery',
  out_for_delivery: 'delivered',
  delivered: null,
}

export const STATUS_NEXT_LABEL: Record<string, string> = {
  placed: 'Confirm Order',
  confirmed: 'Start Preparing',
  preparing: 'Out for Delivery',
  out_for_delivery: 'Mark Delivered',
}

export function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
