'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Hero3DBackground } from './hero-3d-background'
import { HeroDashboardAnimated } from './hero-dashboard-animated'

export function HeroSectionModern() {
  const usps = [
    'Keine Provisionen',
    'Eigene Website',
    'Deutsche Server'
  ]

  return (
    <section className="relative min-h-screen flex items-center py-20 overflow-hidden">
      <Hero3DBackground />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full mb-8"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-900">Speziell für Friseursalons entwickelt</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight" style={{ lineHeight: '1.2' }}>
              Ihr Salon
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent pb-2">
                Digital vereinfacht
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Die digitale Komplettlösung für Ihren Friseursalon.
              Termine, Kunden und Team - alles in einer App.
            </p>

            {/* USPs */}
            <div className="flex flex-wrap gap-4 mb-8">
              {usps.map((usp, i) => (
                <motion.div
                  key={usp}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{usp}</span>
                </motion.div>
              ))}
            </div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                className="bg-black hover:bg-gray-800 text-white px-8"
                asChild
              >
                <Link href="/register">
                  14 Tage kostenlos testen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-300"
                asChild
              >
                <Link href="#interactive-demo">
                  So funktioniert's
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Dashboard Preview - Animated */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <HeroDashboardAnimated />

            {/* Floating Elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, type: "spring" }}
              className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
            >
              Live Dashboard
            </motion.div>
          </motion.div>
        </div>

      </div>
    </section>
  )
}