export type Movie = {
  id: string
  title: string
  language: string
  genre: string
  duration_minutes: number
  poster_url: string | null
  description: string
  rating: string
  is_active: boolean
  created_at: string
}

export type Screen = {
  id: string
  name: string
  screen_number: number
  total_seats: number
}

export type Show = {
  id: string
  movie_id: string
  screen_id: string
  show_date: string
  show_time: string
  audio_format: string
  is_active: boolean
  movies?: Movie
  screens?: Screen
}

export type Seat = {
  id: string
  screen_id: string
  row_letter: string
  seat_number: number
  category: 'VIP' | 'PLATINUM' | 'GOLD' | 'SILVER'
  price: number
}

export type SnackItem = {
  id: string
  name: string
  price: number
  category: string
  is_available: boolean
  image_url: string | null
}

export type Booking = {
  id: string
  booking_reference: string
  show_id: string
  customer_name: string
  customer_phone: string
  total_amount: number
  ticket_amount: number
  snack_amount: number
  status: 'confirmed' | 'cancelled'
  payment_status: 'pending' | 'paid'
  created_at: string
  shows?: Show & { movies?: Movie; screens?: Screen }
}

export type BookingSeat = {
  id: string
  booking_id: string
  seat_id: string
  show_id: string
  seats?: Seat
}

export type BookingSnack = {
  id: string
  booking_id: string
  snack_item_id: string
  quantity: number
  unit_price: number
  snack_items?: SnackItem
}

export type Refund = {
  id: string
  booking_id: string
  amount: number
  reason: string
  status: 'pending' | 'processed' | 'rejected'
  requested_at: string
  processed_at: string | null
  bookings?: Booking
}

export type CartItem = {
  seat: Seat
  showId: string
}

export type SnackCartItem = {
  snack: SnackItem
  quantity: number
}
