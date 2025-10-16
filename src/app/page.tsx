'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { EnterpriseIntegrations } from '@/components/landing/enterprise-integrations'
import { pricingData, faqItems } from '@/lib/pricing-config'
import { designSystem, getSectionClasses, getContainerClasses, getBadgeClasses, getCardClasses } from '@/lib/design-system'
import {
  ArrowRight,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Globe,
  Headphones,
  LineChart,
  Lock,
  MessageSquare,
  Phone,
  Scissors,
  Shield,
  Star,
  Store,
  Users
} from 'lucide-react'

export default function LandingPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [scrollY, setScrollY] = useState(0)
  const [activeFeature, setActiveFeature] = useState(0)
  const [activeMetric, setActiveMetric] = useState(0)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showNav, setShowNav] = useState(true)
  const [expandedPricingCategory, setExpandedPricingCategory] = useState<string | null>('grundfunktionen')

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show/hide logic for mobile nav
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        const scrollDiff = lastScrollY - currentScrollY

        if (currentScrollY < 10) {
          // At the very top
          setShowNav(true)
        } else if (scrollDiff > 35) {
          // Scrolling up with significant distance (35px threshold - weniger empfindlich)
          setShowNav(true)
        } else if (currentScrollY > lastScrollY && currentScrollY > 150) {
          // Scrolling down and past threshold (erhöht für bessere UX)
          setShowNav(false)
        }
      } else {
        // Desktop always shows nav
        setShowNav(true)
      }

      setScrollY(currentScrollY)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Performance-optimiert: Animationen nur wenn sichtbar
  useEffect(() => {
    let interval: NodeJS.Timeout
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            interval = setInterval(() => {
              setActiveFeature((prev) => (prev + 1) % 4)
            }, 3000)
          } else {
            clearInterval(interval)
          }
        })
      },
      { threshold: 0.1 }
    )

    // Observer für Feature-Animation (wenn vorhanden)
    const featureElement = document.querySelector('#features')
    if (featureElement) observer.observe(featureElement)

    return () => {
      clearInterval(interval)
      observer.disconnect()
    }
  }, [])

  // Data imported from config
  const currentPricing = pricingData[billingInterval]

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Subtle Gradient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-white to-white" />
        <div className="absolute top-20 -left-20 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 -right-20 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>


      {/* Navigation - Smart Hide on Mobile */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        showNav ? 'translate-y-0' : '-translate-y-full'
      } ${
        scrollY > 10 ? 'bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-10">
              <Link href="/" className="font-semibold text-lg tracking-tight">
                Damin Growth
              </Link>

              <div className="hidden md:flex items-center gap-7">
                <Link href="#features" className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors">
                  Features
                </Link>
                <Link href="#pricing" className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors">
                  Preise
                </Link>
                <Link href="#enterprise" className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors">
                  Enterprise
                </Link>
                <Link href="#integrations" className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors">
                  Integrationen
                </Link>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Link href="/auth/sign-in">
                <Button variant="ghost" size="sm" className="text-[13px] font-medium">
                  Anmelden
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm" className="bg-black hover:bg-gray-800 text-white text-[13px] font-medium px-4">
                  Kostenlos testen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Clean & Modern */}
      <section className="relative min-h-screen flex items-center py-16 sm:py-20 lg:py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          {/* Mobile Layout */}
          <div className="lg:hidden">
            <div className="text-center mb-8">

              {/* Main Heading */}
              <h1 className="text-[36px] sm:text-[44px] font-bold leading-[1.1] tracking-tight text-gray-900 mb-4">
                Die Zukunft der
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                  {" "}Salonverwaltung
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-[16px] sm:text-lg text-gray-600 mb-6 leading-relaxed max-w-md mx-auto">
                Ihre eigene professionelle Website.
                Keine Provisionen. Keine versteckten Kosten.
              </p>
            </div>

            {/* Dashboard Preview - Als Grafik erkennbar */}
            <div className="relative mb-8 px-6">
              <div className="relative max-w-sm mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl"></div>
                <div className="relative bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                  {/* Browser Bar für Kontext */}
                  <div className="bg-gray-100 px-3 py-2 flex items-center gap-2 border-b">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                      <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <span className="text-[9px] text-gray-500 bg-white px-2 py-0.5 rounded">
                        ihr-salon.de/dashboard
                      </span>
                    </div>
                  </div>
                  {/* Dashboard Content */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="text-[10px] text-gray-600 mb-2">Dashboard-Übersicht</div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg p-2 border border-gray-100">
                        <div className="text-lg font-bold text-blue-600">24</div>
                        <div className="text-[9px] text-gray-500">Termine</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-gray-100">
                        <div className="text-lg font-bold text-green-600">89%</div>
                        <div className="text-[9px] text-gray-500">Auslastung</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-gray-100">
                        <div className="text-lg font-bold text-purple-600">1.8k</div>
                        <div className="text-[9px] text-gray-500">Umsatz €</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Key Benefits */}
            <div className="bg-white rounded-2xl p-5 mb-8 border border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">€29</div>
                  <div className="text-[10px] text-gray-500">pro Monat</div>
                </div>
                <div className="border-x border-gray-200">
                  <div className="text-2xl font-bold text-gray-900">0%</div>
                  <div className="text-[10px] text-gray-500">Provision</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">30</div>
                  <div className="text-[10px] text-gray-500">Tage gratis</div>
                </div>
              </div>
            </div>

            {/* Mobile CTA */}
            <div className="space-y-4">
              <Link href="/auth/sign-up">
                <Button size="lg" className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium shadow-xl">
                  30 Tage kostenlos testen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <div className="flex justify-center items-center gap-4 text-[11px] text-gray-500 mt-3">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  30 Tage kostenlos
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Jederzeit kündbar
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative z-10">

              {/* Main Heading */}
              <h1 className="text-[72px] font-bold leading-[1.05] tracking-tight text-gray-900 mb-6">
                Die Zukunft der
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                  {" "}Salonverwaltung
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-xl">
                Ihre eigene professionelle Website. Keine Provisionen.
                Keine versteckten Kosten.
              </p>

              {/* Desktop Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-12">
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-900">€29</div>
                  <div className="text-xs text-gray-500">Ab/Monat</div>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-900">0%</div>
                  <div className="text-xs text-gray-500">Provisionen</div>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-900">24/7</div>
                  <div className="text-xs text-gray-500">Online-Buchung</div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="space-y-4">
                <Link href="/auth/sign-up">
                  <Button size="lg" className="h-12 px-8 bg-black hover:bg-gray-800 text-white font-medium">
                    30 Tage kostenlos testen
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                {/* Trust indicators */}
                <div className="flex items-center gap-6 text-xs text-gray-500 mt-2">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    30 Tage kostenlos
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Jederzeit kündbar
                  </span>
                </div>
              </div>
            </div>

            {/* Dashboard Preview - Responsive */}
            <div className="relative flex items-center justify-center mt-8 lg:mt-0">
              <div className="relative w-full max-w-[600px]">
                {/* Main Dashboard Card */}
                <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl lg:shadow-2xl overflow-hidden border border-gray-100">
                  {/* Browser Chrome */}
                  <div className="bg-white px-3 py-2 lg:px-4 lg:py-3 flex items-center gap-2 lg:gap-3 border-b">
                    <div className="flex gap-1 lg:gap-1.5">
                      <div className="w-2 h-2 lg:w-3 lg:h-3 bg-gray-300 rounded-full" />
                      <div className="w-2 h-2 lg:w-3 lg:h-3 bg-gray-300 rounded-full" />
                      <div className="w-2 h-2 lg:w-3 lg:h-3 bg-gray-300 rounded-full" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-white border border-gray-200 px-3 py-0.5 lg:px-4 lg:py-1 rounded-md text-[10px] lg:text-xs text-gray-400">
                        app.salonmanager.de
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Content */}
                  <div className="p-4 lg:p-8">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 mb-4 lg:mb-8">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 lg:p-4 rounded-lg lg:rounded-xl">
                        <div className="text-lg lg:text-2xl font-bold text-blue-900">24</div>
                        <div className="text-[10px] lg:text-xs text-blue-700">Heute</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 lg:p-4 rounded-lg lg:rounded-xl">
                        <div className="text-lg lg:text-2xl font-bold text-green-900">€1.8k</div>
                        <div className="text-[10px] lg:text-xs text-green-700">Umsatz</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 lg:p-4 rounded-lg lg:rounded-xl">
                        <div className="text-lg lg:text-2xl font-bold text-purple-900">89%</div>
                        <div className="text-[10px] lg:text-xs text-purple-700">Auslastung</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 lg:p-4 rounded-lg lg:rounded-xl">
                        <div className="text-lg lg:text-2xl font-bold text-orange-900">4.9</div>
                        <div className="text-[10px] lg:text-xs text-orange-700">Bewertung</div>
                      </div>
                    </div>

                    {/* Calendar Grid - Simplified on mobile */}
                    <div className="bg-white border border-gray-200 rounded-lg lg:rounded-xl p-3 lg:p-4">
                      <div className="grid grid-cols-7 gap-1 lg:gap-2">
                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => (
                          <div key={i} className="text-center">
                            <div className="text-[8px] lg:text-[10px] font-medium text-gray-500 mb-1 lg:mb-2">{day}</div>
                            <div className="space-y-0.5 lg:space-y-1">
                              {i < 5 && (
                                <>
                                  <div className="h-4 lg:h-8 bg-blue-200 rounded" />
                                  <div className="hidden lg:block h-6 bg-green-200 rounded-md" />
                                  {i % 2 === 0 && <div className="h-5 lg:h-10 bg-purple-200 rounded" />}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Cards - Hidden on mobile, visible on desktop */}
                <div className="hidden lg:block absolute -top-8 -right-8 bg-white rounded-xl shadow-xl p-4 w-48 animate-bounce" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Neue Buchung</div>
                      <div className="text-xs text-gray-500">Anna M. • 14:30</div>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:block absolute -bottom-6 -left-8 bg-white rounded-xl shadow-xl p-4 w-48 animate-bounce" style={{ animationDelay: '1.5s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Star className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Neue Bewertung</div>
                      <div className="text-xs text-gray-500">5 Sterne erhalten</div>
                    </div>
                  </div>
                </div>

                {/* Background Decoration */}
                <div className="absolute inset-0 -z-10">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 rounded-full blur-3xl opacity-30" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Features Section - Enterprise Design */}
      <section id="features" className="relative py-24 sm:py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-xs font-medium mb-8">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Enterprise Features
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Ihre eigene digitale Präsenz
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Eine vollständige Plattform mit <span className="font-semibold text-gray-900 border-b-2 border-gray-900">eigener Domain</span>,
              professionellem Design und allen Tools für Ihr Wachstum
            </p>
          </div>

          {/* Hero Feature - Eigene Website */}
          <div className="mb-24">
            <div className="relative bg-gradient-to-b from-gray-50 to-white rounded-3xl border border-gray-200 overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-72 h-72 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50" />

              <div className="relative grid lg:grid-cols-2 gap-12 p-8 lg:p-16">
                <div className="flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-xs font-semibold mb-6 self-start">
                    <Globe className="h-3.5 w-3.5" />
                    HAUPTFEATURE
                  </div>

                  <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                    Ihre eigene Website.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      Ihre eigene Domain.
                    </span>
                  </h3>

                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Während andere nur Tools anbieten, bekommen Sie bei uns eine komplette Online-Präsenz.
                    Mit eigener Domain, modernem Design und integrierter Buchungsfunktion.
                  </p>

                  <div className="space-y-4">
                    {[
                      { title: "www.ihr-salon.de", desc: "Professionelle Domain inklusive" },
                      { title: "Individuelles Design", desc: "Angepasst an Ihre Marke" },
                      { title: "SEO-optimiert", desc: "Bei Google ganz oben" },
                      { title: "Mobile First", desc: "Perfekt auf allen Geräten" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 group">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 group-hover:bg-green-200 transition-colors">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-500">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual Preview */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-2xl" />
                  <div className="relative w-full max-w-md">
                    {/* Desktop Preview */}
                    <div className="bg-gray-900 rounded-t-xl p-3 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                      </div>
                      <div className="flex-1 bg-gray-800 rounded px-3 py-1 text-center">
                        <span className="text-xs text-gray-300">www.ihr-salon.de</span>
                      </div>
                    </div>
                    <div className="bg-white border-x border-b border-gray-200 rounded-b-xl p-6">
                      <div className="h-40 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-lg mb-4 flex items-center justify-center">
                        <Scissors className="h-16 w-16 text-gray-300" />
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-8 bg-blue-500 rounded text-white text-xs flex items-center justify-center">
                          Termin buchen
                        </div>
                        <div className="h-8 bg-gray-100 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid - Enterprise Style */}
          <div className="mb-20">
            <h3 className="text-2xl font-bold text-gray-900 mb-10 text-center">
              Alles was ein moderner Salon braucht
            </h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Terminverwaltung */}
              <div className="group relative bg-white rounded-2xl border border-gray-200 p-8 hover:border-gray-300 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full opacity-50" />

                <div className="relative">
                  <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>

                  <h4 className="text-xl font-bold text-gray-900 mb-3">Intelligente Terminplanung</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Automatische Konflikterkennung, Pufferzeiten und intelligente Terminvorschläge.
                  </p>

                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Drag & Drop Kalender
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Mitarbeiter-Synchronisation
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Automatische Erinnerungen
                    </li>
                  </ul>
                </div>
              </div>

              {/* Kundenverwaltung */}
              <div className="group relative bg-white rounded-2xl border border-gray-200 p-8 hover:border-gray-300 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-50 to-transparent rounded-bl-full opacity-50" />

                <div className="relative">
                  <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Users className="h-7 w-7 text-white" />
                  </div>

                  <h4 className="text-xl font-bold text-gray-900 mb-3">360° Kundenansicht</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Komplette Historie, Präferenzen und automatische Kundensegmentierung.
                  </p>

                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Behandlungshistorie
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Notizen & Präferenzen
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Umsatz-Tracking
                    </li>
                  </ul>
                </div>
              </div>

              {/* Marketing Automation */}
              <div className="group relative bg-white rounded-2xl border border-gray-200 p-8 hover:border-gray-300 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-50 to-transparent rounded-bl-full opacity-50" />

                <div className="relative">
                  <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-7 w-7 text-white" />
                  </div>

                  <h4 className="text-xl font-bold text-gray-900 mb-3">Marketing Automation</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Automatisierte Kampagnen, Erinnerungen und Kundenbindungsprogramme.
                  </p>

                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      SMS & E-Mail Kampagnen
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Loyalty Programme
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Bewertungsanfragen
                    </li>
                  </ul>
                </div>
              </div>

              {/* Business Intelligence */}
              <div className="group relative bg-white rounded-2xl border border-gray-200 p-8 hover:border-gray-300 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-50 to-transparent rounded-bl-full opacity-50" />

                <div className="relative">
                  <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <LineChart className="h-7 w-7 text-white" />
                  </div>

                  <h4 className="text-xl font-bold text-gray-900 mb-3">Business Analytics</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    KI-gestützte Insights, Umsatzprognosen und Performance-Tracking.
                  </p>

                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Echtzeit-Dashboard
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Umsatzprognosen
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Auslastungsanalyse
                    </li>
                  </ul>
                </div>
              </div>

              {/* Team Management */}
              <div className="group relative bg-white rounded-2xl border border-gray-200 p-8 hover:border-gray-300 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-50 to-transparent rounded-bl-full opacity-50" />

                <div className="relative">
                  <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>

                  <h4 className="text-xl font-bold text-gray-900 mb-3">Team & Filialverwaltung</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Mitarbeiter-Management, Rechte-System und Multi-Location Support.
                  </p>

                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Schichtplanung
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Provisionsberechnung
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Multi-Salon Support
                    </li>
                  </ul>
                </div>
              </div>

              {/* Zahlungen */}
              <div className="group relative bg-white rounded-2xl border border-gray-200 p-8 hover:border-gray-300 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-50 to-transparent rounded-bl-full opacity-50" />

                <div className="relative">
                  <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Store className="h-7 w-7 text-white" />
                  </div>

                  <h4 className="text-xl font-bold text-gray-900 mb-3">Kassensystem & Zahlungen</h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Integrierte Kasse, Online-Zahlungen und automatische Buchhaltung.
                  </p>

                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Kartenzahlung
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Online-Vorauszahlung
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      Rechnungsexport
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Bar */}
          <div className="border-y border-gray-200 py-12 my-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">0€</div>
                <div className="text-sm text-gray-500">Setup-Kosten</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">30 Tage</div>
                <div className="text-sm text-gray-500">Kostenlos testen</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">24/7</div>
                <div className="text-sm text-gray-500">Support verfügbar</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">100%</div>
                <div className="text-sm text-gray-500">DSGVO-konform</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - Transparent & Clear */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className={`mb-4 ${getBadgeClasses('success')}`}>
              Transparente Preise
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Fair, transparent und ohne versteckte Kosten
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              30 Tage kostenlos testen. Keine Kreditkarte erforderlich.
              Jederzeit kündbar. Keine Setup-Gebühren.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center p-1 bg-white border border-gray-200 rounded-full">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  billingInterval === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Monatlich
              </button>
              <button
                onClick={() => setBillingInterval('yearly')}
                className={`px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  billingInterval === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Jährlich
                <Badge className="ml-2 bg-green-500 text-white text-xs px-1.5 py-0.5">
                  -20%
                </Badge>
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter */}
            <div className="relative bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all hover:scale-105">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 mb-4">
                  <Scissors className="h-3 w-3" />
                  Einzelsalon
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                <p className="text-gray-600">Perfekt für kleine Salons</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  {billingInterval === 'yearly' && currentPricing.starter.originalPrice && (
                    <span className="text-2xl text-gray-400 line-through">
                      €{currentPricing.starter.originalPrice}
                    </span>
                  )}
                  <span className="text-5xl font-bold text-gray-900">
                    €{currentPricing.starter.price}
                  </span>
                  <span className="text-gray-600">/Monat</span>
                </div>
                {billingInterval === 'yearly' && currentPricing.starter.save && (
                  <div className="mt-2">
                    <Badge className={getBadgeClasses('success')}>
                      {currentPricing.starter.save}
                    </Badge>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-3">
                  {currentPricing.starter.users}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {currentPricing.starter.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/auth/sign-up?plan=starter">
                <Button variant="outline" className="w-full h-11 font-medium hover:bg-gray-50">
                  30 Tage kostenlos testen
                </Button>
              </Link>
            </div>

            {/* Professional */}
            <div className="relative bg-gradient-to-b from-blue-50 to-white rounded-2xl p-8 border-2 border-blue-500 shadow-xl transform scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className={`${getBadgeClasses('accent')} px-4 py-1`}>
                  🔥 Beliebteste Wahl
                </Badge>
              </div>

              <div className="mb-6 pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full text-xs font-medium text-blue-700 mb-4">
                  <Store className="h-3 w-3" />
                  Wachsende Salons
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
                <p className="text-gray-600">Für ambitionierte Salons</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  {billingInterval === 'yearly' && currentPricing.professional.originalPrice && (
                    <span className="text-2xl text-gray-400 line-through">
                      €{currentPricing.professional.originalPrice}
                    </span>
                  )}
                  <span className="text-5xl font-bold text-gray-900">
                    €{currentPricing.professional.price}
                  </span>
                  <span className="text-gray-600">/Monat</span>
                </div>
                {billingInterval === 'yearly' && currentPricing.professional.save && (
                  <div className="mt-2">
                    <Badge className={getBadgeClasses('success')}>
                      {currentPricing.professional.save}
                    </Badge>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-3">
                  {currentPricing.professional.users}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {currentPricing.professional.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-700 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/auth/sign-up?plan=professional">
                <Button className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg">
                  30 Tage kostenlos testen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Premium/Enterprise */}
            <div className="relative bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all hover:scale-105">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full text-xs font-medium text-purple-700 mb-4">
                  <Building2 className="h-3 w-3" />
                  Mehrere Standorte
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                <p className="text-gray-600">Für Salon-Ketten</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  {billingInterval === 'yearly' && currentPricing.premium.originalPrice && (
                    <span className="text-2xl text-gray-400 line-through">
                      €{currentPricing.premium.originalPrice}
                    </span>
                  )}
                  <span className="text-5xl font-bold text-gray-900">
                    {typeof currentPricing.premium.price === 'number' ? `€${currentPricing.premium.price}` : currentPricing.premium.price}
                  </span>
                  {typeof currentPricing.premium.price === 'number' && (
                    <span className="text-gray-600">/Monat</span>
                  )}
                </div>
                {billingInterval === 'yearly' && currentPricing.premium.save && (
                  <div className="mt-2">
                    <Badge className={getBadgeClasses('success')}>
                      {currentPricing.premium.save}
                    </Badge>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-3">
                  {currentPricing.premium.users}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {currentPricing.premium.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full h-11 font-medium hover:bg-purple-50 border-purple-200">
                <Phone className="mr-2 h-4 w-4" />
                Beratung anfordern
              </Button>
            </div>
          </div>

          {/* Clean Pricing Comparison Table - Apple/Notion Style */}
          <div className="mt-20 px-2">
            <div className="text-center mb-8 px-2">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
                Detaillierter Vergleich
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm">
                Alle Features auf einen Blick
              </p>
            </div>

            <div className="w-full max-w-6xl mx-auto">
              {/* Mobile Note */}
              <div className="sm:hidden mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700">💡 Tipp: Wischen Sie horizontal für alle Features</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-white border-b-2 border-gray-200">
                    <tr>
                      <th className="text-left py-2 px-2 sm:py-4 sm:px-4 lg:px-6 w-[40%] sm:w-[35%]">
                        <div className="text-xs sm:text-sm uppercase tracking-wider text-gray-500 font-semibold">Features</div>
                      </th>
                      <th className="text-center py-2 px-1 sm:py-4 sm:px-3 lg:px-6 w-[20%] sm:w-auto">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Starter</div>
                        <div className="text-sm sm:text-2xl font-bold text-gray-900">€29</div>
                        <div className="hidden sm:block text-xs text-gray-400">/Monat</div>
                      </th>
                      <th className="text-center py-2 px-1 sm:py-4 sm:px-3 lg:px-6 bg-blue-50/30 relative w-[20%] sm:w-auto">
                        <Badge className="text-[6px] sm:text-[10px] bg-blue-100 text-blue-700 border-0 mb-0.5 font-semibold px-1 py-0 hidden sm:inline-flex">
                          BELIEBT
                        </Badge>
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Pro</div>
                        <div className="text-sm sm:text-2xl font-bold text-gray-900">€49</div>
                        <div className="hidden sm:block text-xs text-gray-400">/Monat</div>
                      </th>
                      <th className="text-center py-2 px-1 sm:py-4 sm:px-3 lg:px-6 w-[20%] sm:w-auto">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Premium</div>
                        <div className="text-sm sm:text-2xl font-bold text-gray-900">€199</div>
                        <div className="hidden sm:block text-xs text-gray-400">/Monat</div>
                      </th>
                    </tr>
                  </thead>
                <tbody>
                  {/* Grundfunktionen */}
                  <tr>
                    <td colSpan={4} className="py-2 px-2 sm:py-3 sm:px-4 bg-gray-50 font-semibold text-gray-900 text-xs sm:text-sm">Grundfunktionen</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Mitarbeiter</td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4 text-xs sm:text-sm font-medium">2</td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4 bg-blue-50/20 text-xs sm:text-sm font-medium">10</td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4 text-xs sm:text-sm font-medium">∞</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Termine/Tag</td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4 text-xs sm:text-sm">∞</td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4 bg-blue-50/20 text-xs sm:text-sm">∞</td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4 text-xs sm:text-sm">∞</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Kunden</td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4 text-xs sm:text-sm">∞</td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4 bg-blue-50/20 text-xs sm:text-sm">∞</td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4 text-xs sm:text-sm">∞</td>
                  </tr>

                  {/* Online-Präsenz */}
                  <tr>
                    <td colSpan={4} className="py-2 px-2 sm:py-3 sm:px-4 bg-gray-50 font-semibold text-gray-900 text-xs sm:text-sm">Online-Präsenz</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Online-Buchung</td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4 bg-blue-50/20"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Eigene Domain</td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4 text-gray-400 text-xs sm:text-sm">—</td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4 bg-blue-50/20"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>

                  {/* Benachrichtigungen */}
                  <tr>
                    <td colSpan={4} className="py-2 px-2 sm:py-3 sm:px-4 bg-gray-50 font-semibold text-gray-900 text-xs sm:text-sm">Benachrichtigungen</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">E-Mail</td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4 bg-blue-50/20"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">SMS</td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4 text-gray-400 text-xs sm:text-sm">—</td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4 bg-blue-50/20"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-1 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>

                  {/* Verwaltung */}
                  <tr>
                    <td colSpan={4} className="py-2 px-2 sm:py-3 sm:px-4 bg-gray-50 font-semibold text-gray-900 text-xs sm:text-sm">Verwaltung & CRM</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Basis-Kundenverwaltung</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Erweiterte Kundenkartei & Notizen</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Personalplanung</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Benutzerrollen & Rechte</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>

                  {/* Analytics */}
                  <tr>
                    <td colSpan={4} className="py-2 px-2 sm:py-3 sm:px-4 bg-gray-50 font-semibold text-gray-900 text-xs sm:text-sm">Analytics & Reports</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Basis-Statistiken</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Erweiterte Analytics</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">KI-Umsatzprognosen</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">KI-Preisoptimierung</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>

                  {/* Marketing */}
                  <tr>
                    <td colSpan={4} className="py-2 px-2 sm:py-3 sm:px-4 bg-gray-50 font-semibold text-gray-900 text-xs sm:text-sm">Marketing & Integration</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Google Business Integration</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Loyalty Programm</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Marketing-Kampagnen</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Bewertungsanfragen</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>

                  {/* Enterprise */}
                  <tr>
                    <td colSpan={4} className="py-2 px-2 sm:py-3 sm:px-4 bg-gray-50 font-semibold text-gray-900 text-xs sm:text-sm">Enterprise Features</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Multi-Salon Management</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Eigene Mobile App</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">API-Zugriff</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>

                  {/* Support */}
                  <tr>
                    <td colSpan={4} className="py-2 px-2 sm:py-3 sm:px-4 bg-gray-50 font-semibold text-gray-900 text-xs sm:text-sm">Support & Service</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Support-Typ</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm">E-Mail</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20 text-xs sm:text-sm font-medium">Priority</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm font-medium">24/7</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Dedizierter Success Manager</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20 text-gray-400">—</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm text-gray-700">Kostenlose Schulung</td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4 bg-blue-50/20"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-2 px-2 sm:py-3 sm:px-4"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

          {/* Money Back Guarantee */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-50 rounded-full">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-xs sm:text-sm font-medium text-green-800">
                30-Tage-Geld-zurück-Garantie • Keine Setup-Gebühren • Jederzeit kündbar
              </span>
            </div>
          </div>

      </section>

      {/* FAQ - Enhanced Modern Design */}
      <section className="py-16 sm:py-24 lg:py-32 bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Header */}
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-full mb-6">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Häufig gestellte Fragen
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
              Haben Sie Fragen?
              <span className="block text-2xl sm:text-3xl lg:text-4xl font-normal text-gray-600 mt-2">
                Wir haben Antworten
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
              Finden Sie schnell Antworten auf die wichtigsten Fragen zu SalonManager
            </p>
          </div>

          {/* FAQ Accordion - Single column on mobile, responsive */}
          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className={`group relative bg-white rounded-xl sm:rounded-2xl transition-all duration-300 ${
                  expandedFaq === index
                    ? 'shadow-lg border border-gray-300'
                    : 'shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300'
                }`}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-4 sm:px-6 py-4 sm:py-5 text-left flex items-start justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      {/* Number indicator */}
                      <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                        expandedFaq === index
                          ? 'bg-gray-900 text-white'
                          : 'bg-white border border-gray-200 text-gray-500'
                      }`}>
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <h3 className={`text-sm sm:text-base lg:text-lg font-semibold leading-tight transition-colors ${
                        expandedFaq === index ? 'text-gray-900' : 'text-gray-900'
                      }`}>
                        {item.question}
                      </h3>
                    </div>
                  </div>
                  <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all transform ${
                    expandedFaq === index
                      ? 'bg-white border border-gray-300 rotate-180'
                      : 'bg-white border border-gray-200 group-hover:border-gray-300'
                  }`}>
                    <ChevronDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors ${
                      expandedFaq === index ? 'text-gray-900' : 'text-gray-400'
                    }`} />
                  </div>
                </button>

                {/* Animated content */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedFaq === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-4 sm:px-6 pb-4 sm:pb-5 ml-0 sm:ml-10">
                    <div className="prose prose-sm sm:prose-base prose-gray max-w-none">
                      <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                        {item.answer}
                      </p>
                      {/* Optional: Add feature highlights for some questions */}
                      {index === 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Keine Kreditkarte
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            30 Tage kostenlos
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            Jederzeit kündbar
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Simple help text at the bottom */}
          <div className="text-center mt-12 sm:mt-16">
            <p className="text-sm text-gray-500">
              Weitere Fragen? Schauen Sie in unsere
              <Link href="/docs" className="text-blue-600 hover:text-blue-700 font-medium ml-1">
                Dokumentation
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Partners/Integrations - Nach FAQ platziert */}
      <EnterpriseIntegrations />

      {/* CTA Section - Apple/Stripe Style */}
      <section className="relative py-32 px-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent" />

        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(to right, #ffffff10 1px, transparent 1px), linear-gradient(to bottom, #ffffff10 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-blue-400">30 Tage kostenlos testen</span>
          </div>

          <h2 className="text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
            Bereit durchzustarten?
          </h2>
          <p className="text-xl lg:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
            Seien Sie von Anfang an dabei.
            <span className="block mt-2 text-gray-500">Keine Kreditkarte erforderlich.</span>
          </p>

          {/* Visual Dashboard Preview */}
          <div className="relative mb-12 max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl border border-gray-700 p-1 shadow-2xl">
              <div className="bg-gray-800 rounded-xl p-8">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-gradient-to-br from-gray-700 to-gray-750 rounded-lg p-4 border border-gray-600">
                      <div className="h-2 bg-gray-600 rounded mb-2" />
                      <div className="h-8 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded" />
                    </div>
                  ))}
                </div>
                <div className="bg-gradient-to-br from-gray-700 to-gray-750 rounded-lg p-6 border border-gray-600">
                  <div className="h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/sign-up">
              <Button
                size="lg"
                className="h-14 px-8 bg-white text-black hover:bg-gray-100 font-medium text-lg"
              >
                Kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-gray-800">
            {[
              { icon: Shield, label: "DSGVO konform" },
              { icon: Lock, label: "SSL verschlüsselt" },
              { icon: Building2, label: "Made in Germany" },
              { icon: Headphones, label: "Deutscher Support" }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <item.icon className="h-6 w-6 text-gray-500" />
                <span className="text-sm text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - Notion/Stripe Style */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-6">
          {/* Main Footer */}
          <div className="py-20">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
              {/* Brand Column */}
              <div className="col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                    <Scissors className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-semibold">SalonManager</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-xs">
                  Die moderne Salon-Software ohne Provisionen.
                  Ihre eigene Website. Ihr Erfolg.
                </p>
                {/* Social Links */}
                <div className="flex gap-3">
                  {[
                    { icon: 'github', href: '#' },
                    { icon: 'twitter', href: '#' },
                    { icon: 'linkedin', href: '#' }
                  ].map((social) => (
                    <a
                      key={social.icon}
                      href={social.href}
                      className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <div className="w-4 h-4 bg-gray-600" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Product */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Produkt</h3>
                <ul className="space-y-3 text-sm">
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Features</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Preise</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Integrationen</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Changelog</Link></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Ressourcen</h3>
                <ul className="space-y-3 text-sm">
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Blog</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Guides</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">API Docs</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Status</Link></li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Unternehmen</h3>
                <ul className="space-y-3 text-sm">
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Über uns</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Karriere</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Partner</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Presse</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Rechtliches</h3>
                <ul className="space-y-3 text-sm">
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Datenschutz</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">AGB</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Impressum</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Cookies</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-200 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>© 2024 SalonManager GmbH</span>
                <span className="text-gray-300">•</span>
                <span>Alle Rechte vorbehalten</span>
              </div>

              <div className="flex items-center gap-6">
                {/* Status Indicator */}
                <a href="#" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Alle Systeme operational</span>
                </a>

                {/* Security Badges */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Shield className="h-4 w-4" />
                    <span>DSGVO</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Lock className="h-4 w-4" />
                    <span>SSL</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Award className="h-4 w-4" />
                    <span>Made in Germany</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}