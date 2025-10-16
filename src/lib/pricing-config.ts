/**
 * Pricing Configuration
 * Zentrale Verwaltung aller Preise und Features
 */

export interface PricingTier {
  name: string
  price: number
  originalPrice?: number
  users: string
  popular?: boolean
  save?: string
  features: string[]
}

export interface PricingData {
  monthly: {
    starter: PricingTier
    professional: PricingTier
    premium: PricingTier
  }
  yearly: {
    starter: PricingTier
    professional: PricingTier
    premium: PricingTier
  }
}

export const pricingData: PricingData = {
  monthly: {
    starter: {
      name: "Starter",
      price: 29,
      users: "Bis zu 2 Mitarbeiter",
      features: [
        "Unbegrenzte Termine",
        "Basis Online-Buchung",
        "E-Mail Benachrichtigungen",
        "E-Mail Support",
        "Basis-Statistik",
        "Subdomain (salon.salonmanager.de)",
        "Kundenverwaltung"
      ]
    },
    professional: {
      name: "Professional",
      price: 49,
      users: "Bis zu 10 Mitarbeiter",
      popular: true,
      features: [
        "Alles aus Starter +",
        "Eigene Domain (www.ihrsalon.de)",
        "Kundenkartei & Notizen",
        "Google Business Integration",
        "Erweiterte Statistiken",
        "SMS-Benachrichtigungen",
        "Marketing Features:",
        "Loyalty Programm",
        "Kampagnen-Tool",
        "Bewertungsanfragen",
        "Priority Support"
      ]
    },
    premium: {
      name: "Premium",
      price: 199,
      users: "Unbegrenzte Mitarbeiter",
      features: [
        "Alles aus Professional +",
        "Multi-Salon Management",
        "Personalplanung",
        "KI-Umsatzprognosen",
        "KI-Preisoptimierung",
        "Benutzerrollen & Rechte",
        "Eigene Mobile App",
        "API-Zugriff",
        "Premium Support 24/7",
        "Dedizierter Success Manager"
      ]
    }
  },
  yearly: {
    starter: {
      name: "Starter",
      price: 24,
      originalPrice: 29,
      users: "Bis zu 2 Mitarbeiter",
      save: "2 Monate gratis",
      features: [
        "Unbegrenzte Termine",
        "Basis Online-Buchung",
        "E-Mail Benachrichtigungen",
        "E-Mail Support",
        "Basis-Statistik",
        "Subdomain (salon.salonmanager.de)",
        "Kundenverwaltung"
      ]
    },
    professional: {
      name: "Professional",
      price: 33,
      originalPrice: 49,
      users: "Bis zu 10 Mitarbeiter",
      popular: true,
      save: "4 Monate gratis",
      features: [
        "Alles aus Starter +",
        "Eigene Domain (www.ihrsalon.de)",
        "Kundenkartei & Notizen",
        "Google Business Integration",
        "Erweiterte Statistiken",
        "SMS-Benachrichtigungen",
        "Marketing Features:",
        "Loyalty Programm",
        "Kampagnen-Tool",
        "Bewertungsanfragen",
        "Priority Support"
      ]
    },
    premium: {
      name: "Premium",
      price: 125,
      originalPrice: 199,
      users: "Unbegrenzte Mitarbeiter",
      save: "€888/Jahr sparen",
      features: [
        "Alles aus Professional +",
        "Multi-Salon Management",
        "Personalplanung",
        "KI-Umsatzprognosen",
        "KI-Preisoptimierung",
        "Benutzerrollen & Rechte",
        "Eigene Mobile App",
        "API-Zugriff",
        "Premium Support 24/7",
        "Dedizierter Success Manager"
      ]
    }
  }
}

// Hauptfeatures für Feature-Sektion
export const mainFeatures = [
  {
    title: "Intelligenter Kalender",
    description: "Drag & Drop Terminplanung mit Konflikterkennung",
    details: "Automatische Terminvorschläge, Pufferzeiten, Mitarbeiter-Verfügbarkeit",
    icon: "CalendarCheck",
    gradient: "from-blue-500 to-cyan-500",
    stats: "50% weniger Leerlauf"
  },
  {
    title: "Kunden-Management",
    description: "360° Kundenansicht mit Historie und Präferenzen",
    details: "Automatische Segmentierung, Notizen, Umsatz-Tracking",
    icon: "Users",
    gradient: "from-purple-500 to-pink-500",
    stats: "3x höhere Wiederkehrrate"
  },
  {
    title: "Online-Buchung 24/7",
    description: "Kunden buchen selbst - rund um die Uhr",
    details: "Mobile-optimiert, Echtzeit-Verfügbarkeit, automatische Bestätigung",
    icon: "Globe",
    gradient: "from-green-500 to-emerald-500",
    stats: "40% mehr Buchungen"
  },
  {
    title: "Business Intelligence",
    description: "Datengetriebene Entscheidungen mit KI-Insights",
    details: "Umsatz-Prognosen, Auslastungsanalyse, Mitarbeiter-Performance",
    icon: "LineChart",
    gradient: "from-orange-500 to-red-500",
    stats: "25% mehr Umsatz"
  }
]

// FAQ Daten
export const faqItems = [
  {
    question: "Wie funktioniert die 30-tägige kostenlose Testphase?",
    answer: "Sie können SalonManager 30 Tage lang vollständig kostenlos testen. Keine Kreditkarte erforderlich, keine versteckten Kosten. Nach Ablauf der Testphase können Sie ein Abonnement wählen oder Ihr Konto wird automatisch deaktiviert."
  },
  {
    question: "Kann ich jederzeit kündigen?",
    answer: "Ja, Sie können Ihr Abonnement jederzeit kündigen. Bei monatlicher Zahlung endet der Zugang am Ende des aktuellen Abrechnungszeitraums. Bei jährlicher Zahlung erhalten Sie eine anteilige Rückerstattung für nicht genutzte Monate."
  },
  {
    question: "Wie viele Salons kann ich verwalten?",
    answer: "Mit dem Starter und Professional Plan können Sie einen Salon verwalten. Der Premium Plan unterstützt unbegrenzte Standorte und ist ideal für Ketten oder Franchise-Unternehmen."
  },
  {
    question: "Sind meine Daten sicher?",
    answer: "Absolut. Wir verwenden modernste Verschlüsselung (AES-256), tägliche Backups und sind DSGVO-konform. Unsere Server befinden sich in Deutschland und erfüllen höchste Sicherheitsstandards."
  },
  {
    question: "Kann ich meinen Plan später ändern?",
    answer: "Ja, Sie können jederzeit upgraden oder downgraden. Bei Upgrades zahlen Sie nur die Differenz, bei Downgrades wird die Differenz für den nächsten Abrechnungszeitraum gutgeschrieben."
  },
  {
    question: "Gibt es eine Einrichtungsgebühr?",
    answer: "Nein, es gibt keine Einrichtungsgebühren oder versteckte Kosten. Sie zahlen nur die monatliche oder jährliche Gebühr. Wir bieten sogar kostenlose Schulungen und Onboarding-Support."
  },
  {
    question: "Funktioniert das System auf mobilen Geräten?",
    answer: "Ja, SalonManager ist vollständig mobil optimiert. Es funktioniert auf jedem Gerät mit Internetverbindung. Premium-Kunden erhalten zusätzlich native iOS und Android Apps."
  },
  {
    question: "Was passiert mit meinen Daten wenn ich kündige?",
    answer: "Sie können Ihre Daten jederzeit exportieren. Nach der Kündigung bewahren wir Ihre Daten 90 Tage auf, falls Sie sich umentscheiden. Danach werden alle Daten sicher gelöscht."
  }
]