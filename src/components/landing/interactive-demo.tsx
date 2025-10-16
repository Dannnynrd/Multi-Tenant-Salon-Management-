'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Users, Clock, Check, ChevronRight, Sparkles,
  Monitor, Smartphone, CreditCard, Bell, Globe, Shield
} from 'lucide-react'

export function InteractiveDemo() {
  const [activeStep, setActiveStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  const steps = [
    {
      id: 'service',
      title: 'Service wählen',
      icon: Sparkles,
      description: 'Kunde wählt aus Ihrem Servicekatalog'
    },
    {
      id: 'staff',
      title: 'Mitarbeiter',
      icon: Users,
      description: 'Bevorzugten Mitarbeiter auswählen'
    },
    {
      id: 'time',
      title: 'Termin',
      icon: Calendar,
      description: 'Verfügbare Zeiten in Echtzeit'
    },
    {
      id: 'confirm',
      title: 'Bestätigung',
      icon: Check,
      description: 'Sofortige Buchungsbestätigung'
    }
  ]

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [isPlaying, steps.length])

  return (
    <section className="py-32 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
            <Monitor className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Live Demo</span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Buchung in 30 Sekunden
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Erleben Sie, wie einfach Ihre Kunden online Termine buchen können
          </p>
        </motion.div>

        {/* Device Mockup with Animation */}
        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Device Frame */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Laptop Frame */}
              <div className="relative bg-gray-900 rounded-2xl p-2 shadow-2xl">
                <div className="bg-gray-800 rounded-xl p-1">
                  {/* Browser Bar */}
                  <div className="bg-gray-700 rounded-t-lg px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 bg-gray-600 rounded mx-8 px-3 py-1">
                      <span className="text-xs text-gray-300">ihr-salon.de</span>
                    </div>
                  </div>

                  {/* Screen Content */}
                  <div className="bg-white rounded-b-lg p-8 h-96 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      {activeStep === 0 && (
                        <motion.div
                          key="service"
                          initial={{ opacity: 0, x: 100 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          className="absolute inset-0 p-8"
                        >
                          <h3 className="text-lg font-semibold mb-4">Wählen Sie einen Service</h3>
                          <div className="space-y-3">
                            {['Haarschnitt Herren', 'Haarschnitt Damen', 'Färben & Tönen'].map((service, i) => (
                              <motion.div
                                key={service}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-all"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{service}</span>
                                  <span className="text-gray-500">ab €{25 + i * 20}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {activeStep === 1 && (
                        <motion.div
                          key="staff"
                          initial={{ opacity: 0, x: 100 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          className="absolute inset-0 p-8"
                        >
                          <h3 className="text-lg font-semibold mb-4">Mitarbeiter wählen</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {['Maria', 'Thomas', 'Lisa', 'Max'].map((name, i) => (
                              <motion.div
                                key={name}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-4 border border-gray-200 rounded-lg text-center hover:border-blue-500 cursor-pointer"
                              >
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                                  {name[0]}
                                </div>
                                <span className="text-sm font-medium">{name}</span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {activeStep === 2 && (
                        <motion.div
                          key="time"
                          initial={{ opacity: 0, x: 100 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          className="absolute inset-0 p-8"
                        >
                          <h3 className="text-lg font-semibold mb-4">Termin auswählen</h3>
                          <div className="grid grid-cols-7 gap-2 mb-4">
                            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => (
                              <div key={day} className="text-center">
                                <div className="text-xs text-gray-500 mb-1">{day}</div>
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  className={`p-2 rounded-lg border ${i === 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} cursor-pointer`}
                                >
                                  {15 + i}
                                </motion.div>
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {['09:00', '10:30', '14:00', '15:30'].map((time, i) => (
                              <motion.button
                                key={time}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-2 bg-gray-100 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                {time}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {activeStep === 3 && (
                        <motion.div
                          key="confirm"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 p-8 flex items-center justify-center"
                        >
                          <div className="text-center">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", bounce: 0.5 }}
                              className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center"
                            >
                              <Check className="h-10 w-10 text-white" />
                            </motion.div>
                            <h3 className="text-xl font-semibold mb-2">Termin gebucht!</h3>
                            <p className="text-gray-600">Bestätigung wurde per E-Mail versendet</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Mobile Frame Overlay */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-4 -right-4 w-32 bg-gray-900 rounded-2xl p-2 shadow-xl"
              >
                <div className="bg-gray-800 rounded-xl p-1">
                  <div className="bg-white rounded-lg p-2 h-48">
                    <div className="bg-blue-50 rounded p-2 mb-2">
                      <div className="h-2 bg-blue-200 rounded" />
                    </div>
                    <div className="space-y-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-2 bg-gray-100 rounded" />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Steps Timeline */}
            <div className="space-y-6">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === activeStep
                const isPassed = index < activeStep

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`relative flex items-start gap-4 cursor-pointer`}
                    onClick={() => {
                      setActiveStep(index)
                      setIsPlaying(false)
                    }}
                  >
                    {/* Line */}
                    {index < steps.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-full -bottom-6 bg-gray-200">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: isPassed ? '100%' : '0%' }}
                          transition={{ duration: 0.5 }}
                          className="w-full bg-blue-500"
                        />
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`
                      relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all
                      ${isActive ? 'bg-blue-500 scale-110' : isPassed ? 'bg-green-500' : 'bg-gray-200'}
                    `}>
                      <Icon className={`h-6 w-6 ${isActive || isPassed ? 'text-white' : 'text-gray-500'}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>

                    {/* Step Number */}
                    <div className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}
                    `}>
                      {index + 1}/{steps.length}
                    </div>
                  </motion.div>
                )
              })}

              {/* Play/Pause Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPlaying(!isPlaying)}
                className="mt-8 px-6 py-3 bg-black text-white rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors"
              >
                {isPlaying ? 'Demo pausieren' : 'Demo fortsetzen'}
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}