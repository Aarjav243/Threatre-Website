import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { phone, name, bookingRef, movie, time, date, seats, total } = await req.json()
  const apiKey = process.env.FAST2SMS_API_KEY
  if (!apiKey || apiKey === 'your_fast2sms_api_key_here') {
    console.log(`[SMS skipped] To: ${phone}, Msg: Booking ${bookingRef} confirmed`)
    return NextResponse.json({ ok: true, skipped: true })
  }

  const showDate = new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const showTime = (() => {
    const [h, m] = time.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
  })()

  const message = `Hi ${name}! Your booking at Radhakrishna Theatre is CONFIRMED.\nMovie: ${movie}\nDate: ${showDate} at ${showTime}\nSeats: ${seats}\nRef: ${bookingRef}\nTotal: Rs.${total}\nEnjoy the show!`

  try {
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { 'authorization': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ route: 'q', message, language: 'english', flash: 0, numbers: phone })
    })
    const data = await res.json()
    return NextResponse.json({ ok: true, data })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
