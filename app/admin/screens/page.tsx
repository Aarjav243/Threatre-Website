'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Screen, Movie, Show } from '@/lib/types'
import { formatTime } from '@/lib/utils'
import { MonitorPlay, X } from 'lucide-react'

const SHOW_TIMES = ['10:00', '12:30', '15:00', '17:30', '18:00', '21:00', '21:30', '22:00']
const AUDIO_FORMATS = ['DOLBY ATMOS', 'DOLBY 7.1 JBL SOUND', 'STEREO']

export default function ScreenManager() {
  const [screens, setScreens] = useState<Screen[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [shows, setShows] = useState<Show[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [newMovie, setNewMovie] = useState({ title: '', language: 'Hindi', genre: '', duration_minutes: 120, rating: 'U/A', description: '' })
  const [showAddMovie, setShowAddMovie] = useState(false)

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => { fetchData() }, [selectedDate])

  async function fetchData() {
    setLoading(true)
    const [scRes, mvRes, shRes] = await Promise.all([
      supabase.from('screens').select('*').order('screen_number'),
      supabase.from('movies').select('*').eq('is_active', true).order('title'),
      supabase.from('shows').select('*, movies(*), screens(*)').eq('show_date', selectedDate).order('show_time')
    ])
    setScreens(scRes.data || [])
    setMovies(mvRes.data || [])
    setShows(shRes.data || [])
    setLoading(false)
  }

  async function assignShow(screenId: string, movieId: string, time: string, audioFormat: string) {
    setSaving(true)
    await supabase.from('shows').upsert({
      screen_id: screenId, movie_id: movieId, show_date: selectedDate,
      show_time: time, audio_format: audioFormat, is_active: true
    }, { onConflict: 'screen_id,show_date,show_time' })
    await fetchData()
    setMsg('Show saved!')
    setTimeout(() => setMsg(''), 2000)
    setSaving(false)
  }

  async function removeShow(showId: string) {
    await supabase.from('shows').delete().eq('id', showId)
    await fetchData()
  }

  async function addMovie() {
    if (!newMovie.title.trim()) return
    await supabase.from('movies').insert(newMovie)
    setNewMovie({ title: '', language: 'Hindi', genre: '', duration_minutes: 120, rating: 'U/A', description: '' })
    setShowAddMovie(false)
    fetchData()
  }

  const screenShows = (screenId: string) => shows.filter(s => s.screen_id === screenId)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Screen Manager</h1>
        <button onClick={() => setShowAddMovie(!showAddMovie)} className="text-sm bg-[#c41e3a] hover:bg-[#9b1530] text-white px-4 py-2 rounded-lg">+ Add Movie</button>
      </div>

      {msg && <div className="bg-green-900/30 border border-green-700 text-green-300 rounded-lg px-4 py-2 text-sm mb-4">{msg}</div>}

      {/* Add movie form */}
      {showAddMovie && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
          <h2 className="font-semibold mb-3">Add New Movie</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Title *', key: 'title', type: 'text' },
              { label: 'Language', key: 'language', type: 'text' },
              { label: 'Genre', key: 'genre', type: 'text' },
              { label: 'Duration (mins)', key: 'duration_minutes', type: 'number' },
              { label: 'Rating', key: 'rating', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-400 block mb-1">{f.label}</label>
                <input type={f.type} value={(newMovie as any)[f.key]}
                  onChange={e => setNewMovie(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded px-3 py-1.5 text-sm text-white focus:border-[#c41e3a] focus:outline-none" />
              </div>
            ))}
            <div className="col-span-2 md:col-span-3">
              <label className="text-xs text-gray-400 block mb-1">Description</label>
              <input value={newMovie.description}
                onChange={e => setNewMovie(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded px-3 py-1.5 text-sm text-white focus:border-[#c41e3a] focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addMovie} className="bg-[#c41e3a] text-white px-4 py-1.5 rounded text-sm">Save Movie</button>
            <button onClick={() => setShowAddMovie(false)} className="bg-[#2a2a2a] text-gray-300 px-4 py-1.5 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Date selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {dates.map(d => {
          const date = new Date(d)
          const isToday = d === new Date().toISOString().split('T')[0]
          return (
            <button key={d} onClick={() => setSelectedDate(d)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-lg border text-xs transition-all ${d === selectedDate ? 'bg-[#c41e3a] border-[#c41e3a] text-white' : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#c41e3a]/50'}`}>
              <span className="font-bold">{isToday ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
              <span>{date.getDate()} {date.toLocaleDateString('en-IN', { month: 'short' })}</span>
            </button>
          )
        })}
      </div>

      {loading ? <div className="text-gray-400 animate-pulse">Loading...</div> : (
        <div className="space-y-6">
          {screens.map(screen => (
            <div key={screen.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2a2a] bg-[#111] flex items-center gap-2">
                <MonitorPlay className="w-5 h-5 text-[#c41e3a]" />
                <span className="font-semibold">{screen.name}</span>
                <span className="text-xs text-gray-500">· {screen.total_seats} seats</span>
              </div>

              {/* Existing shows */}
              <div className="p-4">
                {screenShows(screen.id).length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-400 font-semibold uppercase mb-2">Scheduled Shows</div>
                    <div className="flex flex-wrap gap-2">
                      {screenShows(screen.id).map(show => (
                        <div key={show.id} className="flex items-center gap-2 bg-[#0a0a0a] border border-[#3a3a3a] rounded-lg px-3 py-1.5">
                          <span className="text-sm font-semibold text-[#f5a623]">{formatTime(show.show_time)}</span>
                          <span className="text-sm">{(show as any).movies?.title}</span>
                          <span className="text-xs text-gray-500">{show.audio_format}</span>
                          <button onClick={() => removeShow(show.id)} className="text-red-500 hover:text-red-400 ml-1"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add show */}
                <AddShowForm
                  screenId={screen.id}
                  movies={movies}
                  existingTimes={screenShows(screen.id).map(s => s.show_time)}
                  onSave={(movieId, time, audio) => assignShow(screen.id, movieId, time, audio)}
                  saving={saving}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AddShowForm({ screenId, movies, existingTimes, onSave, saving }: {
  screenId: string; movies: Movie[]; existingTimes: string[]
  onSave: (movieId: string, time: string, audio: string) => void; saving: boolean
}) {
  const [movieId, setMovieId] = useState(movies[0]?.id || '')
  const [time, setTime] = useState('10:00')
  const [audio, setAudio] = useState('DOLBY ATMOS')
  const [open, setOpen] = useState(false)

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-sm text-[#c41e3a] hover:text-[#f5a623] flex items-center gap-1">
      + Add show for this screen
    </button>
  )

  return (
    <div className="mt-2 p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Movie</label>
          <select value={movieId} onChange={e => setMovieId(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-2 py-1.5 text-sm text-white focus:outline-none">
            {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Show Time</label>
          <select value={time} onChange={e => setTime(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-2 py-1.5 text-sm text-white focus:outline-none">
            {SHOW_TIMES.filter(t => !existingTimes.includes(t)).map(t => (
              <option key={t} value={t}>{formatTime(t)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Audio Format</label>
          <select value={audio} onChange={e => setAudio(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded px-2 py-1.5 text-sm text-white focus:outline-none">
            {AUDIO_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => { onSave(movieId, time, audio); setOpen(false) }} disabled={saving || !movieId}
          className="bg-[#c41e3a] disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm">
          {saving ? 'Saving...' : 'Save Show'}
        </button>
        <button onClick={() => setOpen(false)} className="bg-[#2a2a2a] text-gray-300 px-4 py-1.5 rounded text-sm">Cancel</button>
      </div>
    </div>
  )
}
