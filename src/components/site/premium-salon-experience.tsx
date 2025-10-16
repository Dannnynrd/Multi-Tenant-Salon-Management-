'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useInView, useMotionValue, useSpring, MotionValue } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Calendar, Clock, Star, MapPin, Phone, Mail, Instagram, Facebook, Globe,
  Award, Users, Sparkles, ChevronRight, ArrowRight, Play, Pause,
  Menu, X, ChevronDown, Check, ChevronLeft, ArrowUpRight,
  User, Heart, TrendingUp, Shield, Zap, Coffee, Gem, Percent,
  CheckCircle2, Timer, MessageCircle, Crown, Scissors, Palette,
  Smartphone, CreditCard, Gift, Info, Plus, Minus
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface PremiumSalonExperienceProps {
  tenant: any
  activeServices: any[]
  activeStaff: any[]
  testimonials?: any[]
  beforeAfterImages?: any[]
}

// Lazy loaded components for performance
// const VideoBackground = dynamic(() => import('@/components/ui/video-background'), {
//   ssr: false,
//   loading: () => <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800" />
// })

// Premium Animation Presets
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2
    }
  }
}

const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

// Conversion Counter Component
const ConversionCounter = ({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return

    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [inView, value])

  return (
    <div ref={ref} className="text-center">
      <div className="text-5xl lg:text-6xl font-thin tracking-tight mb-2">
        {count.toLocaleString('fr-FR')}{suffix}
      </div>
      <div className="text-xs tracking-[0.4em] uppercase opacity-60">
        {label}
      </div>
    </div>
  )
}

// Trust Badge Component
const TrustBadge = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <motion.div
    whileHover={{ scale: 1.05, y: -2 }}
    className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-5 py-3"
  >
    <Icon className="w-5 h-5" />
    <span className="text-sm font-light tracking-wide">{text}</span>
  </motion.div>
)

// Service Card with Conversion Focus
const ServiceCard = ({ service, onClick }: { service: any; onClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="group cursor-pointer relative"
    >
      <div className="relative h-[500px] overflow-hidden bg-gradient-to-b from-gray-100 to-gray-50">
        <motion.div
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={service.image || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800'}
            alt={service.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </motion.div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Premium Badge */}
        {service.popular && (
          <motion.div
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            className="absolute top-6 left-0 bg-gradient-to-r from-gold-500 to-gold-600 text-white px-6 py-2 text-xs tracking-[0.3em] uppercase"
          >
            Best Seller
          </motion.div>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <motion.div
            animate={{ y: isHovered ? -10 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-3xl font-light mb-3 tracking-tight">
              {service.name}
            </h3>
            <p className="text-sm opacity-80 mb-6 line-clamp-2">
              {service.description_short || service.description}
            </p>

            <div className="flex items-end justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <Badge className="bg-white/20 backdrop-blur border-0 text-white">
                    <Clock className="w-3 h-3 mr-1" />
                    {service.duration} min
                  </Badge>
                  {service.category && (
                    <Badge className="bg-white/20 backdrop-blur border-0 text-white">
                      {service.category}
                    </Badge>
                  )}
                </div>
                <div className="text-4xl font-thin">
                  {service.price}€
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-xl"
              >
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.article>
  )
}

// Team Member Card - Premium
const TeamMemberCard = ({ member }: { member: any }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-gray-100 to-gray-50">
        <Image
          src={member.photo_url || 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=800'}
          alt={`${member.first_name} ${member.last_name}`}
          fill
          className="object-cover object-top transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />

        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"
        />

        {/* Content */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{
            y: isHovered ? 0 : 50,
            opacity: isHovered ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 left-0 right-0 p-6 text-white"
        >
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-4 h-4",
                  i < Math.floor(member.rating || 4.5)
                    ? "fill-white text-white"
                    : "fill-white/30 text-white/30"
                )}
              />
            ))}
            <span className="ml-2 text-sm">
              {member.rating || 4.5} ({member.reviews || 0})
            </span>
          </div>

          <p className="text-sm mb-4">
            {member.years_experience || 5}+ années d'expérience
          </p>

          {member.specializations && (
            <div className="flex flex-wrap gap-2">
              {member.specializations.slice(0, 3).map((spec: string, i: number) => (
                <span key={i} className="text-xs bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                  {spec}
                </span>
              ))}
            </div>
          )}

          <Button
            className="w-full mt-4 bg-white text-black hover:bg-white/90 rounded-none text-xs tracking-wider py-3"
          >
            RÉSERVER AVEC {member.first_name.toUpperCase()}
          </Button>
        </motion.div>
      </div>

      {/* Info Bar */}
      <div className="bg-white p-4 border-x border-b">
        <h3 className="text-xl font-light mb-1">
          {member.first_name} {member.last_name}
        </h3>
        <p className="text-sm text-gray-600 tracking-wider">
          {member.role || 'Expert Coiffeur'}
        </p>
      </div>
    </motion.div>
  )
}

export default function PremiumSalonExperience({
  tenant,
  activeServices,
  activeStaff,
  testimonials = [],
  beforeAfterImages = []
}: PremiumSalonExperienceProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [bookingStep, setBookingStep] = useState(1)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const { scrollY } = useScroll()
  const headerBg = useTransform(scrollY, [0, 100], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.95)'])
  const headerShadow = useTransform(scrollY, [0, 100], ['none', '0 1px 20px rgba(0,0,0,0.08)'])

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setIsMenuOpen(false)
  }

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Premium Header - Fixed with Blur */}
      <motion.header
        style={{
          backgroundColor: headerBg,
          boxShadow: headerShadow
        }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
      >
        <nav className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded flex items-center justify-center">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-light tracking-wider">
                  {tenant.name}
                </h1>
                <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase">
                  L'Oréal Professionnel Partner
                </p>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-10">
              {[
                { label: 'Services', id: 'services' },
                { label: 'Experts', id: 'experts' },
                { label: 'Transformations', id: 'transformations' },
                { label: 'Salon', id: 'salon' }
              ].map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  whileHover={{ y: -2 }}
                  className="relative text-sm tracking-wide hover:text-gray-600 transition-colors"
                >
                  {item.label}
                  <motion.div
                    className="absolute -bottom-2 left-0 right-0 h-px bg-black"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                  />
                </motion.button>
              ))}
            </nav>

            {/* CTA Group */}
            <div className="flex items-center gap-4">
              <motion.a
                href={`tel:${tenant.phone}`}
                whileHover={{ scale: 1.05 }}
                className="hidden lg:flex items-center gap-2 text-sm"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="font-light">{tenant.phone}</span>
              </motion.a>

              <Button
                onClick={() => scrollToSection('booking')}
                className="hidden lg:flex bg-black text-white hover:bg-gray-900 px-8 py-5 text-xs tracking-wider rounded-none"
              >
                RÉSERVER EN LIGNE
                <ArrowRight className="ml-3 w-4 h-4" />
              </Button>

              {/* Mobile Menu */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2"
              >
                <div className="w-6 h-5 relative">
                  <motion.span
                    className="absolute w-full h-0.5 bg-black"
                    animate={{
                      rotate: isMenuOpen ? 45 : 0,
                      y: isMenuOpen ? 10 : 0
                    }}
                  />
                  <motion.span
                    className="absolute w-full h-0.5 bg-black top-2"
                    animate={{ opacity: isMenuOpen ? 0 : 1 }}
                  />
                  <motion.span
                    className="absolute w-full h-0.5 bg-black top-4"
                    animate={{
                      rotate: isMenuOpen ? -45 : 0,
                      y: isMenuOpen ? -10 : 0
                    }}
                  />
                </div>
              </button>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-40 pt-20"
          >
            <nav className="container mx-auto px-4 py-8">
              <div className="space-y-6">
                {['Services', 'Experts', 'Transformations', 'Salon', 'Contact'].map((item) => (
                  <motion.button
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => scrollToSection(item.toLowerCase())}
                    className="block text-3xl font-light w-full text-left"
                  >
                    {item}
                  </motion.button>
                ))}
                <Button
                  onClick={() => scrollToSection('booking')}
                  className="w-full bg-black text-white py-6 text-sm tracking-wider rounded-none mt-8"
                >
                  RÉSERVER MAINTENANT
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section - Conversion Optimized */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=3000"
            alt="Luxury salon"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl text-white">
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="space-y-6"
            >
              {/* Trust Badges */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap gap-4 mb-8"
              >
                <TrustBadge icon={Award} text="Salon Certifié L'Oréal" />
                <TrustBadge icon={Star} text="4.9/5 • 2000+ Avis" />
                <TrustBadge icon={Shield} text="Protocole Sanitaire Strict" />
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeInUp}
                className="text-5xl lg:text-7xl font-thin leading-tight"
              >
                L'Excellence de la
                <span className="block text-6xl lg:text-8xl font-light">
                  Coiffure Parisienne
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl font-light opacity-90 max-w-2xl"
              >
                Découvrez l'art de la beauté avec nos experts certifiés L'Oréal Professionnel.
                Une expérience unique dans un cadre luxueux.
              </motion.p>

              {/* Offer Banner */}
              <motion.div
                variants={fadeInUp}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center">
                    <Percent className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-medium">Offre Exclusive Nouveaux Clients</p>
                    <p className="text-sm opacity-80">-30% sur votre première visite + Diagnostic capillaire offert</p>
                  </div>
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Button
                  onClick={() => scrollToSection('booking')}
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 px-10 py-6 text-sm tracking-wider rounded-none group"
                >
                  RÉSERVER MAINTENANT
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-black px-10 py-6 text-sm tracking-wider rounded-none"
                  onClick={() => scrollToSection('services')}
                >
                  DÉCOUVRIR NOS SERVICES
                </Button>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                variants={fadeInUp}
                className="flex items-center gap-8 pt-8"
              >
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-full bg-gray-300 border-2 border-white overflow-hidden"
                    >
                      <Image
                        src={`https://images.unsplash.com/photo-${1594744803329 + i}-e58b31de8bf5?w=100`}
                        alt="Client"
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium">+500 clients ce mois</p>
                  <p className="text-xs opacity-70">Rejoignez notre communauté</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            onClick={() => scrollToSection('stats')}
            className="cursor-pointer"
          >
            <ChevronDown className="w-8 h-8 text-white" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section - Trust Building */}
      <section id="stats" className="py-20 bg-black text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            <motion.div variants={fadeInUp}>
              <ConversionCounter
                value={tenant.stats?.totalCustomers || 12500}
                label="Clients Satisfaits"
                suffix="+"
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <ConversionCounter
                value={98}
                label="Taux de Satisfaction"
                suffix="%"
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <ConversionCounter
                value={tenant.stats?.teamMembers || 25}
                label="Experts Certifiés"
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <ConversionCounter
                value={tenant.stats?.yearsInBusiness || 15}
                label="Années d'Excellence"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services Section - Conversion Focused */}
      <section id="services" className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 px-6 py-2 text-xs tracking-[0.3em]">
                NOS PRESTATIONS
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-5xl lg:text-6xl font-thin mb-6"
            >
              Services d'Exception
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Des techniques innovantes et des produits premium pour sublimer votre beauté
            </motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {activeServices.slice(0, 6).map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <ServiceCard
                  service={service}
                  onClick={() => setSelectedService(service)}
                />
              </motion.div>
            ))}
          </div>

          {/* Service CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button
              onClick={() => scrollToSection('booking')}
              size="lg"
              className="bg-black text-white hover:bg-gray-900 px-12 py-6 text-sm tracking-wider rounded-none"
            >
              VOIR TOUS NOS SERVICES
              <ArrowRight className="ml-3 w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Team Section - Expert Showcase */}
      <section id="experts" className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 px-6 py-2 text-xs tracking-[0.3em]">
                NOTRE ÉQUIPE
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-5xl lg:text-6xl font-thin mb-6"
            >
              Experts Certifiés
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Une équipe passionnée, formée aux dernières techniques par L'Oréal Professionnel
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeStaff.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <TeamMemberCard member={member} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Transformations Gallery */}
      {beforeAfterImages.length > 0 && (
        <section id="transformations" className="py-24 bg-gray-50">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.div variants={fadeInUp}>
                <Badge className="mb-4 px-6 py-2 text-xs tracking-[0.3em]">
                  RÉALISATIONS
                </Badge>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="text-5xl lg:text-6xl font-thin mb-6"
              >
                Transformations
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-xl text-gray-600 max-w-3xl mx-auto"
              >
                Découvrez le talent de nos experts à travers leurs réalisations
              </motion.p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {beforeAfterImages.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden bg-white border">
                    <div className="grid grid-cols-2">
                      <div className="relative aspect-[3/4]">
                        <Image
                          src={item.before}
                          alt="Avant"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 text-xs tracking-wider">
                          AVANT
                        </div>
                      </div>
                      <div className="relative aspect-[3/4]">
                        <Image
                          src={item.after}
                          alt="Après"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 text-black px-3 py-1 text-xs tracking-wider">
                          APRÈS
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-light mb-2">{item.service}</h3>
                      <p className="text-sm text-gray-600">Réalisé par {item.stylist}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials - Social Proof */}
      {testimonials.length > 0 && (
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.div variants={fadeInUp}>
                <Badge className="mb-4 px-6 py-2 text-xs tracking-[0.3em]">
                  TÉMOIGNAGES
                </Badge>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="text-5xl lg:text-6xl font-thin mb-6"
              >
                Nos Clients Témoignent
              </motion.h2>
              <motion.div
                variants={fadeInUp}
                className="flex items-center justify-center gap-2 text-yellow-500"
              >
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-current" />
                ))}
                <span className="ml-3 text-gray-600 text-lg">
                  4.9/5 • {tenant.stats?.totalReviews || 2000}+ avis vérifiés
                </span>
              </motion.div>
            </motion.div>

            <div className="max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gray-50 p-12 relative"
                >
                  <Quote className="absolute top-6 left-6 w-8 h-8 text-gray-200" />

                  <blockquote className="relative z-10">
                    <p className="text-2xl font-light leading-relaxed mb-8 italic">
                      "{testimonials[activeTestimonial].text}"
                    </p>

                    <footer className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden">
                        <Image
                          src={testimonials[activeTestimonial].avatar}
                          alt={testimonials[activeTestimonial].name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <cite className="not-italic">
                          <p className="font-medium text-lg">
                            {testimonials[activeTestimonial].name}
                          </p>
                          <p className="text-gray-600">
                            {testimonials[activeTestimonial].role}
                          </p>
                        </cite>
                      </div>
                      {testimonials[activeTestimonial].verified && (
                        <Badge className="ml-auto">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Vérifié
                        </Badge>
                      )}
                    </footer>
                  </blockquote>
                </motion.div>
              </AnimatePresence>

              {/* Pagination */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i === activeTestimonial
                        ? "w-8 bg-black"
                        : "bg-gray-300 hover:bg-gray-400"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Booking Section - High Conversion */}
      <section id="booking" className="py-24 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-5xl mx-auto"
          >
            {/* Header */}
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <Badge className="mb-6 bg-white/10 backdrop-blur border-white/20 px-6 py-2 text-xs tracking-[0.3em]">
                RÉSERVATION EN LIGNE
              </Badge>
              <h2 className="text-5xl lg:text-6xl font-thin mb-6">
                Réservez Votre Moment
              </h2>
              <p className="text-xl opacity-80 max-w-3xl mx-auto">
                Système de réservation en ligne 24/7 • Confirmation instantanée • Rappel automatique
              </p>
            </motion.div>

            {/* Booking Benefits */}
            <motion.div
              variants={fadeInUp}
              className="grid md:grid-cols-3 gap-6 mb-12"
            >
              {[
                {
                  icon: Calendar,
                  title: 'Réservation Flexible',
                  text: "Modifiez ou annulez jusqu'à 24h avant"
                },
                {
                  icon: Gift,
                  title: '-30% Premier RDV',
                  text: 'Offre exclusive nouveaux clients'
                },
                {
                  icon: Shield,
                  title: 'Paiement Sécurisé',
                  text: 'Vos données sont protégées'
                }
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  className="bg-white/5 backdrop-blur border border-white/10 p-6 text-center"
                >
                  <benefit.icon className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{benefit.title}</h3>
                  <p className="text-sm opacity-70">{benefit.text}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-100 px-12 py-7 text-sm tracking-wider rounded-none group"
                onClick={() => scrollToSection('contact')}
              >
                RÉSERVER EN LIGNE
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-black px-12 py-7 text-sm tracking-wider rounded-none"
              >
                <Phone className="mr-3 w-5 h-5" />
                {tenant.phone}
              </Button>
            </motion.div>

            {/* Urgency Indicator */}
            <motion.div
              variants={fadeInUp}
              className="text-center mt-8"
            >
              <p className="text-sm opacity-70">
                <Timer className="inline w-4 h-4 mr-2" />
                Prochaine disponibilité dans 2h • 3 clients consultent cette page
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Salon Info */}
      <section id="salon" className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-6 px-6 py-2 text-xs tracking-[0.3em]">
                NOTRE SALON
              </Badge>
              <h2 className="text-4xl font-thin mb-8">Un Espace d'Exception</h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xs tracking-[0.3em] text-gray-500 mb-3">ADRESSE</h3>
                  <p className="text-lg">
                    {tenant.address}<br />
                    {tenant.postal_code} {tenant.city}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs tracking-[0.3em] text-gray-500 mb-3">CONTACT</h3>
                  <p className="text-lg mb-1">{tenant.phone}</p>
                  <p className="text-lg">{tenant.email}</p>
                </div>

                <div>
                  <h3 className="text-xs tracking-[0.3em] text-gray-500 mb-3">HORAIRES</h3>
                  <div className="space-y-2">
                    {Object.entries(tenant.opening_hours || {}).map(([day, hours]: [string, any]) => (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize">{day}</span>
                        <span className="font-light">{hours[0]?.[0]} - {hours[0]?.[1]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs tracking-[0.3em] text-gray-500 mb-3">SUIVEZ-NOUS</h3>
                  <div className="flex gap-4">
                    {tenant.instagram && (
                      <motion.a
                        whileHover={{ scale: 1.1 }}
                        href={`https://instagram.com/${tenant.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center"
                      >
                        <Instagram className="w-5 h-5" />
                      </motion.a>
                    )}
                    {tenant.facebook && (
                      <motion.a
                        whileHover={{ scale: 1.1 }}
                        href={`https://facebook.com/${tenant.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center"
                      >
                        <Facebook className="w-5 h-5" />
                      </motion.a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[600px] bg-gray-100"
            >
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
                  tenant.address + ', ' + tenant.city
                )}&zoom=15`}
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <p className="text-center text-xs tracking-[0.3em] text-gray-500 mb-8">
            NOS PARTENAIRES
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {["L'Oréal Professionnel", "Kérastase", "Redken", "Shu Uemura", "Biolage"].map((partner, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-xl font-light text-gray-400"
              >
                {partner}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-12 mb-12">
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-light mb-4">{tenant.name}</h3>
              <p className="text-sm opacity-70 mb-6">
                Votre salon de coiffure premium à {tenant.city}.
                Excellence, innovation et passion depuis {new Date().getFullYear() - (tenant.stats?.yearsInBusiness || 10)}.
              </p>
              <div className="flex gap-4">
                <Badge className="bg-white/10 backdrop-blur border-white/20">
                  <Award className="w-3 h-3 mr-1" />
                  Certifié L'Oréal
                </Badge>
                <Badge className="bg-white/10 backdrop-blur border-white/20">
                  <Shield className="w-3 h-3 mr-1" />
                  Protocole COVID-19
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="text-xs tracking-[0.3em] mb-6">LIENS RAPIDES</h4>
              <div className="space-y-3">
                {['Services', 'Experts', 'Réservation', 'Contact'].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item.toLowerCase())}
                    className="block text-sm opacity-70 hover:opacity-100 transition-opacity"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs tracking-[0.3em] mb-6">NEWSLETTER</h4>
              <p className="text-sm opacity-70 mb-4">
                Recevez nos offres exclusives et conseils beauté
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="flex-1 bg-white/10 backdrop-blur border border-white/20 px-4 py-2 text-sm rounded-none"
                />
                <Button className="bg-white text-black hover:bg-gray-100 px-6 rounded-none">
                  OK
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col lg:flex-row justify-between items-center gap-4">
            <p className="text-xs opacity-50">
              © {new Date().getFullYear()} {tenant.name}. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-xs opacity-50">
              <a href="#" className="hover:opacity-100">Mentions légales</a>
              <a href="#" className="hover:opacity-100">Politique de confidentialité</a>
              <a href="#" className="hover:opacity-100">CGV</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Service Modal */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setSelectedService(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white max-w-5xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid lg:grid-cols-2">
                {/* Image */}
                <div className="relative h-96 lg:h-full">
                  <Image
                    src={selectedService.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'}
                    alt={selectedService.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Content */}
                <div className="p-12">
                  <button
                    onClick={() => setSelectedService(null)}
                    className="absolute top-6 right-6 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <Badge className="mb-4">
                    {selectedService.category}
                  </Badge>

                  <h2 className="text-4xl font-light mb-6">
                    {selectedService.name}
                  </h2>

                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    {selectedService.description}
                  </p>

                  <div className="space-y-6 mb-8">
                    <div className="flex items-center gap-4">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Durée</p>
                        <p className="font-medium">{selectedService.duration} minutes</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Prix</p>
                        <p className="text-3xl font-light">{selectedService.price}€</p>
                      </div>
                    </div>

                    {selectedService.popular && (
                      <div className="flex items-center gap-4">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="text-sm text-gray-500">Popularité</p>
                          <p className="font-medium">Service le plus demandé</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-6 mb-8">
                    <p className="text-sm text-gray-600 mb-2">
                      <Info className="inline w-4 h-4 mr-2" />
                      Offre Nouveau Client
                    </p>
                    <p className="font-medium">
                      -30% sur ce service pour votre première visite
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      size="lg"
                      className="flex-1 bg-black text-white hover:bg-gray-900 rounded-none py-4"
                      onClick={() => {
                        setSelectedService(null)
                        scrollToSection('booking')
                      }}
                    >
                      RÉSERVER CE SERVICE
                      <ArrowRight className="ml-3 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Quote icon component
const Quote = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
  </svg>
)