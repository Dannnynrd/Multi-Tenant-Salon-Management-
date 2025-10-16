'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { TrendingUp, Users, Calendar, Euro, Star } from 'lucide-react'

function AnimatedNumber({
  value,
  duration = 2,
  format
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true)
      const startTime = Date.now()
      const endTime = startTime + (duration * 1000)

      const updateValue = () => {
        const now = Date.now()
        const progress = Math.min(1, (now - startTime) / (duration * 1000))

        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const current = Math.round(value * easeOutQuart)

        setDisplayValue(current)

        if (progress < 1) {
          requestAnimationFrame(updateValue)
        }
      }

      requestAnimationFrame(updateValue)
    }
  }, [isInView, value, duration, hasAnimated])

  const formattedValue = format ? format(displayValue) : displayValue.toString()

  return <span ref={ref}>{formattedValue}</span>
}

export function KPICounter() {
  const kpis = [
    {
      icon: Users,
      value: 100,
      suffix: '%',
      label: 'Deutscher Support',
      description: 'Persönlich für Sie da',
      color: 'from-blue-500 to-cyan-500',
      delay: 0
    },
    {
      icon: Calendar,
      value: 30,
      suffix: ' Tage',
      label: 'Kostenlos testen',
      description: 'Ohne Risiko starten',
      color: 'from-purple-500 to-pink-500',
      delay: 0.1
    },
    {
      icon: Euro,
      value: 0,
      suffix: '€',
      label: 'Setup-Kosten',
      description: 'Keine versteckten Gebühren',
      color: 'from-green-500 to-emerald-500',
      delay: 0.2
    },
    {
      icon: Star,
      value: 24,
      suffix: '/7',
      label: 'Verfügbarkeit',
      description: 'Immer erreichbar',
      color: 'from-yellow-500 to-orange-500',
      delay: 0.3
    }
  ]

  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-black text-white relative overflow-hidden">
      {/* Animated Background Grid - Responsive */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, #ffffff10 1px, transparent 1px), linear-gradient(to bottom, #ffffff10 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}
        className="sm:block"
        />
        {/* Floating Orbs - Smaller on mobile */}
        <div
          className="absolute top-10 sm:top-20 -left-20 sm:left-20 w-48 sm:w-96 h-48 sm:h-96 bg-blue-500 rounded-full blur-3xl opacity-20"
          style={{
            animation: 'float 20s linear infinite'
          }}
        />
        <div
          className="absolute bottom-10 sm:bottom-20 -right-20 sm:right-20 w-48 sm:w-96 h-48 sm:h-96 bg-purple-500 rounded-full blur-3xl opacity-20"
          style={{
            animation: 'float 25s linear infinite reverse'
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative">
        {/* Header - Responsive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur border border-white/20 rounded-full mb-6 sm:mb-8">
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            <span className="text-xs sm:text-sm font-medium">Unsere Zahlen</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6">
            Faire Konditionen für Ihren Start
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto px-4 sm:px-0">
            Transparenz von Anfang an. Keine versteckten Kosten, keine Überraschungen.
          </p>
        </motion.div>

        {/* KPI Grid - Mobile optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: kpi.delay }}
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <div className="relative bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 overflow-hidden">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                  {/* Icon - Smaller on mobile */}
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center mb-3 sm:mb-4 lg:mb-6`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                  </div>

                  {/* Value - Responsive text */}
                  <div className="text-xl sm:text-2xl lg:text-4xl font-bold mb-1 sm:mb-2">
                    <AnimatedNumber
                      value={kpi.value}
                      duration={2}
                      format={kpi.format}
                    />
                    <span className="text-sm sm:text-lg lg:text-2xl text-gray-400 ml-0.5 sm:ml-1">{kpi.suffix}</span>
                  </div>

                  {/* Label - Smaller on mobile */}
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-0.5 sm:mb-1 leading-tight">{kpi.label}</h3>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-gray-400 leading-tight">{kpi.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(100px, -100px);
          }
          50% {
            transform: translate(-100px, -150px);
          }
          75% {
            transform: translate(-50px, 100px);
          }
        }
      `}</style>
    </section>
  )
}