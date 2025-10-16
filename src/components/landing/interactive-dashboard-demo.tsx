'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Users, Euro, Star, Bell, Check,
  TrendingUp, Clock, Package, ChevronRight,
  Plus, X, Search, Filter, Settings
} from 'lucide-react'

export function InteractiveDashboardDemo() {
  const [currentAction, setCurrentAction] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isPlaying, setIsPlaying] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Demo-Aktionen
  const actions = [
    {
      id: 'hover-stats',
      description: 'Dashboard-Übersicht',
      mouseTarget: { x: 150, y: 120 },
      duration: 2000
    },
    {
      id: 'click-appointment',
      description: 'Neuen Termin anlegen',
      mouseTarget: { x: 480, y: 200 },
      click: true,
      duration: 2500
    },
    {
      id: 'select-customer',
      description: 'Kunde auswählen',
      mouseTarget: { x: 300, y: 250 },
      click: true,
      duration: 2000
    },
    {
      id: 'check-stats',
      description: 'Umsatz analysieren',
      mouseTarget: { x: 150, y: 120 },
      duration: 2000
    },
    {
      id: 'view-team',
      description: 'Team-Status prüfen',
      mouseTarget: { x: 500, y: 350 },
      duration: 2000
    }
  ]

  // Auto-play Animation
  useEffect(() => {
    if (!isPlaying) return

    const timer = setTimeout(() => {
      setCurrentAction((prev) => (prev + 1) % actions.length)
    }, actions[currentAction].duration)

    return () => clearTimeout(timer)
  }, [currentAction, isPlaying])

  // Maus-Animation
  useEffect(() => {
    const target = actions[currentAction].mouseTarget
    setMousePosition(target)
  }, [currentAction])

  const [appointments, setAppointments] = useState([
    { id: 1, time: '09:00', customer: 'Lisa Weber', service: 'Balayage & Schnitt', status: 'confirmed' },
    { id: 2, time: '10:30', customer: 'Anna Schmidt', service: 'Färben', status: 'confirmed' },
    { id: 3, time: '12:00', customer: '', service: 'Mittagspause', status: 'break' },
    { id: 4, time: '14:00', customer: 'Tom Meyer', service: 'Herrenschnitt', status: 'pending' }
  ])

  const [showNewAppointment, setShowNewAppointment] = useState(false)

  // Trigger Aktionen basierend auf currentAction
  useEffect(() => {
    if (actions[currentAction].id === 'click-appointment') {
      setTimeout(() => setShowNewAppointment(true), 1000)
    } else {
      setShowNewAppointment(false)
    }
  }, [currentAction])

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Erleben Sie Ihr neues Dashboard
        </h2>
        <p className="text-lg text-gray-600">
          Intuitiv, übersichtlich und immer aktuell
        </p>
      </div>

      {/* Dashboard Container */}
      <div
        ref={containerRef}
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
        style={{ height: '600px' }}
      >
        {/* Top Bar */}
        <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="font-bold text-sm">SE</span>
            </div>
            <div>
              <h3 className="font-semibold">Salon Elegance</h3>
              <p className="text-xs text-gray-400">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-5 w-5 text-gray-400" />
              {currentAction > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                />
              )}
            </div>
            <div className="w-8 h-8 bg-gray-800 rounded-full" />
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 bg-gradient-to-br from-gray-50 to-white h-full">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`bg-white p-4 rounded-xl border ${
                currentAction === 0 || currentAction === 3 ? 'border-blue-500 shadow-lg' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Euro className="h-5 w-5 text-blue-500" />
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">€2,847</div>
              <div className="text-xs text-gray-500">Tagesumsatz</div>
              {currentAction === 3 && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  className="mt-2 pt-2 border-t"
                >
                  <div className="text-xs text-green-600">+34% vs. Vorwoche</div>
                </motion.div>
              )}
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-4 rounded-xl border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  18
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">22</div>
              <div className="text-xs text-gray-500">Termine heute</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-4 rounded-xl border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-green-500" />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div className="text-2xl font-bold text-gray-900">5/6</div>
              <div className="text-xs text-gray-500">Team Online</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-4 rounded-xl border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-xs text-gray-400">NEU</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">4.9</div>
              <div className="text-xs text-gray-500">Bewertung</div>
            </motion.div>
          </div>

          {/* Calendar Section */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-900">Heutige Termine</h4>
                  <button
                    className={`px-3 py-1 bg-blue-500 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-blue-600 transition-colors ${
                      currentAction === 1 ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    Neuer Termin
                  </button>
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  <AnimatePresence>
                    {appointments.map((appointment, idx) => (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          appointment.status === 'break'
                            ? 'bg-gray-50'
                            : appointment.status === 'pending'
                            ? 'bg-yellow-50 border border-yellow-200'
                            : 'bg-blue-50 border border-blue-200'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900 w-16">
                          {appointment.time}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{appointment.customer || appointment.service}</div>
                          {appointment.customer && (
                            <div className="text-xs text-gray-500">{appointment.service}</div>
                          )}
                        </div>
                        {appointment.status === 'confirmed' && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* New Appointment Modal */}
                  <AnimatePresence>
                    {showNewAppointment && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 bg-black/20 flex items-center justify-center z-20"
                      >
                        <motion.div
                          initial={{ y: 20 }}
                          animate={{ y: 0 }}
                          className="bg-white rounded-xl shadow-2xl p-6 w-96"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-900">Neuer Termin</h3>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <X className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm text-gray-600">Kunde</label>
                              <div className={`mt-1 p-2 border rounded-lg ${
                                currentAction === 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                              }`}>
                                <input
                                  type="text"
                                  placeholder="Kunde auswählen..."
                                  className="w-full bg-transparent outline-none text-sm"
                                  value={currentAction === 2 ? 'Marie Müller' : ''}
                                  readOnly
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm text-gray-600">Datum</label>
                                <div className="mt-1 p-2 border border-gray-200 rounded-lg">
                                  <input type="text" value="29.09.2024" className="w-full bg-transparent outline-none text-sm" readOnly />
                                </div>
                              </div>
                              <div>
                                <label className="text-sm text-gray-600">Uhrzeit</label>
                                <div className="mt-1 p-2 border border-gray-200 rounded-lg">
                                  <input type="text" value="15:00" className="w-full bg-transparent outline-none text-sm" readOnly />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Team Section */}
            <div className="col-span-4">
              <div className={`bg-white rounded-xl border p-4 ${
                currentAction === 4 ? 'border-blue-500 shadow-lg' : 'border-gray-200'
              }`}>
                <h4 className="font-semibold text-gray-900 mb-4">Team Status</h4>
                <div className="space-y-3">
                  {['Sarah M.', 'Tom K.', 'Lisa B.', 'Max S.', 'Anna L.'].map((member, idx) => (
                    <motion.div
                      key={member}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                        ['from-blue-400 to-blue-600', 'from-purple-400 to-purple-600',
                         'from-pink-400 to-pink-600', 'from-green-400 to-green-600',
                         'from-yellow-400 to-yellow-600'][idx]
                      }`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{member}</div>
                        <div className="text-xs text-gray-500">
                          {idx < 4 ? 'Online' : 'Pause'}
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        idx < 4 ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Schnellaktionen</h4>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 bg-white rounded-lg hover:bg-purple-100 transition-colors text-sm">
                    <Package className="h-4 w-4 inline mr-2 text-purple-600" />
                    Produkt verkaufen
                  </button>
                  <button className="w-full text-left px-3 py-2 bg-white rounded-lg hover:bg-purple-100 transition-colors text-sm">
                    <Clock className="h-4 w-4 inline mr-2 text-purple-600" />
                    Pause eintragen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Mouse Cursor */}
        <motion.div
          className="absolute z-30 pointer-events-none"
          animate={{
            x: mousePosition.x,
            y: mousePosition.y
          }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 200
          }}
        >
          <div className="relative">
            {/* Cursor */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                fill="black"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
            {/* Click Animation */}
            {actions[currentAction].click && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute top-0 left-0 w-6 h-6 border-2 border-blue-500 rounded-full"
              />
            )}
          </div>
        </motion.div>

        {/* Action Label */}
        <motion.div
          key={currentAction}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm"
        >
          {actions[currentAction].description}
        </motion.div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex justify-center gap-2">
        {actions.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentAction(idx)
              setIsPlaying(false)
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentAction
                ? 'bg-blue-500 w-8'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Play/Pause Button */}
      <div className="mt-4 text-center">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
        >
          {isPlaying ? 'Pause' : 'Fortsetzen'}
        </button>
      </div>
    </div>
  )
}