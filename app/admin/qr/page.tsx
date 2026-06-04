'use client'
import { useState } from 'react'
import QRCode from 'react-qr-code'
import { Printer, QrCode } from 'lucide-react'

const SCREENS = ['Screen 1', 'Screen 2', 'Screen 3']

function parseRows(input: string): string[] {
  const match = input.trim().toUpperCase().match(/^([A-Z])-([A-Z])$/)
  if (!match) return []
  const start = match[1].charCodeAt(0)
  const end = match[2].charCodeAt(0)
  if (end < start) return []
  return Array.from({ length: end - start + 1 }, (_, i) => String.fromCharCode(start + i))
}

export default function AdminQRPage() {
  const [screen, setScreen] = useState(SCREENS[0])
  const [rowRange, setRowRange] = useState('A-H')
  const [seatsPerRow, setSeatsPerRow] = useState(15)
  const [generated, setGenerated] = useState(false)

  const rows = parseRows(rowRange)
  const seats = rows.flatMap(row =>
    Array.from({ length: seatsPerRow }, (_, i) => `${row}${i + 1}`)
  )

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  function qrUrl(seat: string) {
    return `${baseUrl}/order?screen=${encodeURIComponent(screen)}&seat=${encodeURIComponent(seat)}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-2xl font-bold">QR Code Generator</h1>
        {generated && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#c41e3a] hover:bg-[#9b1530] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" /> Print All
          </button>
        )}
      </div>

      {/* Config */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 mb-6 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Screen</label>
            <select
              value={screen}
              onChange={e => { setScreen(e.target.value); setGenerated(false) }}
              className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-xl px-3 py-2.5 text-white focus:border-[#c41e3a] focus:outline-none text-sm"
            >
              {SCREENS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Row Range <span className="text-gray-600">(e.g. A-H)</span></label>
            <input
              type="text"
              value={rowRange}
              onChange={e => { setRowRange(e.target.value); setGenerated(false) }}
              placeholder="A-H"
              className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:border-[#c41e3a] focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Seats per Row</label>
            <input
              type="number"
              value={seatsPerRow}
              onChange={e => { setSeatsPerRow(Math.max(1, parseInt(e.target.value) || 1)); setGenerated(false) }}
              min={1} max={50}
              className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded-xl px-3 py-2.5 text-white focus:border-[#c41e3a] focus:outline-none text-sm"
            />
          </div>
        </div>

        {rows.length === 0 && rowRange.trim() && (
          <div className="text-xs text-red-400 mb-3">Invalid row range. Use format like "A-H"</div>
        )}

        <button
          onClick={() => setGenerated(true)}
          disabled={rows.length === 0}
          className="bg-[#c41e3a] hover:bg-[#9b1530] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <QrCode className="w-4 h-4" />
          Generate {rows.length * seatsPerRow} QR Codes for {screen}
        </button>
      </div>

      {/* QR Grid */}
      {generated && seats.length > 0 && (
        <>
          <div className="text-xs text-gray-500 mb-4 print:hidden">
            {seats.length} QR codes — each links to the ordering page with seat + screen pre-filled
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 print:grid-cols-5 print:gap-4">
            {seats.map(seat => (
              <div key={seat} className="bg-white rounded-xl p-3 flex flex-col items-center gap-1.5">
                <QRCode
                  value={qrUrl(seat)}
                  size={90}
                  style={{ width: '100%', height: 'auto', maxWidth: '90px' }}
                />
                <div className="text-[11px] font-bold text-black">{seat}</div>
                <div className="text-[9px] text-gray-500 text-center">{screen}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
