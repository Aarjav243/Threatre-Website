import { QrCode, UtensilsCrossed } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-full bg-[#c41e3a]/10 border border-[#c41e3a]/30 flex items-center justify-center mb-6">
        <UtensilsCrossed className="w-9 h-9 text-[#c41e3a]" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Order Food & Beverages</h1>
      <p className="text-gray-400 text-sm max-w-xs mb-6">
        Scan the QR code on your seat to browse our menu and place an order — delivered right to you.
      </p>
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3">
        <QrCode className="w-4 h-4" />
        <span>Scan QR on your seat to get started</span>
      </div>
    </div>
  )
}
