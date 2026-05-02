'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Movie, Show } from '@/lib/types'
import { formatTime } from '@/lib/utils'
import { Clapperboard, Film } from 'lucide-react'

type MovieWithShows = Movie & { shows: Show[] }

const GENRE_COLORS: Record<string, string> = {
  'Action/Historical': 'bg-orange-900/40 text-orange-300',
  'Action/Drama': 'bg-red-900/40 text-red-300',
  'Horror/Comedy': 'bg-purple-900/40 text-purple-300',
}

export default function HomePage() {
  const [movies, setMovies] = useState<MovieWithShows[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchMovies()
  }, [selectedDate])

  async function fetchMovies() {
    setLoading(true)
    const { data: shows } = await supabase
      .from('shows')
      .select('*, movies(*)')
      .eq('show_date', selectedDate)
      .eq('is_active', true)
      .order('show_time')

    if (!shows) { setLoading(false); return }

    const movieMap = new Map<string, MovieWithShows>()
    for (const show of shows) {
      const m = show.movies as Movie
      if (!m) continue
      if (!movieMap.has(m.id)) movieMap.set(m.id, { ...m, shows: [] })
      movieMap.get(m.id)!.shows.push(show)
    }
    setMovies(Array.from(movieMap.values()))
    setLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-[#c41e3a]/20 to-[#1a0a0f] border border-[#c41e3a]/20">
        <div className="flex items-center gap-3 mb-2">
          <Clapperboard className="w-7 h-7 text-[#c41e3a]" />
          <h1 className="text-2xl font-bold">Now Showing</h1>
        </div>
        <p className="text-gray-400 text-sm">Radhakrishna Theatre · Ichalkaranji · 3 Screen Multiplex · Dolby Atmos</p>
      </div>

      {/* Date picker */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-thin">
        {dates.map(d => {
          const date = new Date(d)
          const isToday = d === new Date().toISOString().split('T')[0]
          const isSelected = d === selectedDate
          return (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-[#c41e3a] border-[#c41e3a] text-white'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-300 hover:border-[#c41e3a]/50'
              }`}
            >
              <span className="text-[10px] uppercase font-semibold opacity-70">
                {isToday ? 'TODAY' : date.toLocaleDateString('en-IN', { weekday: 'short' })}
              </span>
              <span className="text-lg font-bold leading-tight">{date.getDate()}</span>
              <span className="text-[10px] opacity-70">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
            </button>
          )
        })}
      </div>

      {/* Movies */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#1a1a1a] rounded-xl h-80 animate-pulse border border-[#2a2a2a]" />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Film className="w-14 h-14 mx-auto mb-4 text-gray-700" />
          <div className="text-lg">No shows scheduled for this date</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {movies.map(movie => (
            <div key={movie.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#c41e3a]/40 transition-all group">
              {/* Poster */}
              <div className="h-56 bg-gradient-to-br from-[#2a1a1a] to-[#1a1a2a] flex items-center justify-center relative overflow-hidden">
                <Clapperboard className="w-20 h-20 text-gray-700" />
                <div className="absolute top-3 right-3 bg-black/70 text-yellow-400 text-xs font-bold px-2 py-1 rounded">
                  {movie.rating}
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${GENRE_COLORS[movie.genre] || 'bg-gray-800 text-gray-300'}`}>
                    {movie.genre}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h2 className="font-bold text-lg mb-1 group-hover:text-[#f5a623] transition-colors">{movie.title}</h2>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                  <span>{movie.language}</span>
                  <span>·</span>
                  <span>{movie.duration_minutes} mins</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {movie.shows.map(show => (
                    <a
                      key={show.id}
                      href={`/booking/${show.id}`}
                      className="text-xs border border-[#2a2a2a] hover:border-[#c41e3a] hover:bg-[#c41e3a]/10 text-gray-200 px-3 py-1.5 rounded transition-all font-medium"
                    >
                      {formatTime(show.show_time)}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seat Legend */}
      <div className="mt-12 p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
        <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">Seat Categories & Pricing</p>
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'VIP', price: 270, color: 'bg-purple-900/50 border-purple-700 text-purple-300' },
            { label: 'PLATINUM', price: 250, color: 'bg-blue-900/50 border-blue-700 text-blue-300' },
            { label: 'GOLD', price: 250, color: 'bg-yellow-900/50 border-yellow-700 text-yellow-300' },
            { label: 'SILVER', price: 200, color: 'bg-gray-800/50 border-gray-600 text-gray-300' },
          ].map(cat => (
            <div key={cat.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${cat.color}`}>
              <span>{cat.label}</span>
              <span className="opacity-70">₹{cat.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
