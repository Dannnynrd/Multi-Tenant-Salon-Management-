'use client'

import { motion } from 'framer-motion'
import { Star, Calendar, Euro, TrendingUp } from 'lucide-react'

export function HeroDashboardAnimated() {
  return (
    <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
      {/* Browser Bar */}
      <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1 text-sm text-gray-600 mx-4">
          ihr-salon.de/dashboard
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-5 bg-gradient-to-br from-gray-50/30 to-white relative" style={{ minHeight: '400px' }}>
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">SE</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Salon Elegance</h3>
              <p className="text-xs text-gray-500">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            </div>
          </div>
        </div>


        {/* Main KPI Row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl text-white"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-[10px] opacity-90 uppercase tracking-wider">Tagesumsatz</div>
                <div className="text-xl font-bold">€2,347</div>
              </div>
              <Euro className="w-4 h-4 text-white/50" />
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[10px] font-medium">+28% heute</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl text-white"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-[10px] opacity-90 uppercase tracking-wider">Termine</div>
                <div className="text-xl font-bold">18/22</div>
              </div>
              <Calendar className="w-4 h-4 text-white/50" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium">86% ausgelastet</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl text-white"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-[10px] opacity-90 uppercase tracking-wider">Bewertung</div>
                <div className="text-xl font-bold">4.9</div>
              </div>
              <Star className="w-4 h-4 text-white/50" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium">312 Bewertungen</span>
            </div>
          </motion.div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-gray-900">Nächste Termine</span>
            <span className="text-[10px] text-gray-500">Heute</span>
          </div>
          <div className="space-y-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2"
            >
              <span className="text-[10px] text-gray-500 w-10">14:00</span>
              <div className="flex-1 h-7 bg-blue-100 rounded-md flex items-center px-2 border-l-2 border-blue-500">
                <span className="text-[10px] font-medium text-blue-900">Maria S. - Coloration</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2"
            >
              <span className="text-[10px] text-gray-500 w-10">15:30</span>
              <div className="flex-1 h-7 bg-purple-100 rounded-md flex items-center px-2 border-l-2 border-purple-500">
                <span className="text-[10px] font-medium text-purple-900">Sophie L. - Balayage</span>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  )
}