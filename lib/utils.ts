export function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
}

export function generateBookingRef() {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `RKT-${dateStr}-${rand}`
}

export function getCategoryColor(category: string) {
  switch (category) {
    case 'VIP': return 'text-purple-400 bg-purple-900/30 border-purple-700'
    case 'PLATINUM': return 'text-blue-400 bg-blue-900/30 border-blue-700'
    case 'GOLD': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700'
    case 'SILVER': return 'text-gray-400 bg-gray-800/30 border-gray-600'
    default: return 'text-gray-400'
  }
}

export function groupSeatsByRow(seats: import('./types').Seat[]) {
  const rows: Record<string, import('./types').Seat[]> = {}
  for (const seat of seats) {
    if (!rows[seat.row_letter]) rows[seat.row_letter] = []
    rows[seat.row_letter].push(seat)
  }
  for (const row of Object.values(rows)) {
    row.sort((a, b) => a.seat_number - b.seat_number)
  }
  return rows
}
