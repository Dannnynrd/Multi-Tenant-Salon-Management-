/**
 * Design System für konsistente UI
 * Basiert auf Apple/Stripe/Notion Design-Prinzipien
 */

export const designSystem = {
  // Spacing System - Konsistente Abstände
  spacing: {
    section: {
      mobile: 'py-16',
      tablet: 'sm:py-24',
      desktop: 'lg:py-32'
    },
    container: {
      padding: 'px-4 sm:px-6',
      maxWidth: 'max-w-7xl mx-auto'
    },
    card: {
      padding: {
        sm: 'p-4 sm:p-6',
        md: 'p-6 sm:p-8',
        lg: 'p-8 sm:p-10'
      }
    }
  },

  // Typography System - Einheitliche Schriftgrößen
  typography: {
    hero: {
      primary: 'text-4xl sm:text-5xl lg:text-6xl xl:text-7xl',
      secondary: 'text-lg sm:text-xl lg:text-2xl'
    },
    section: {
      title: 'text-3xl sm:text-4xl lg:text-5xl',
      subtitle: 'text-base sm:text-lg lg:text-xl'
    },
    card: {
      title: 'text-xl sm:text-2xl lg:text-3xl',
      body: 'text-sm sm:text-base',
      caption: 'text-xs sm:text-sm'
    },
    button: {
      sm: 'text-sm',
      md: 'text-sm sm:text-base',
      lg: 'text-base sm:text-lg'
    }
  },

  // Color System - Einheitliche Farben & Gradients
  colors: {
    // Brand Gradients (maximal 3)
    gradients: {
      primary: 'from-gray-900 to-gray-700', // Hauptmarke
      accent: 'from-blue-600 to-purple-600', // Akzente
      success: 'from-green-500 to-emerald-500' // Erfolg/Positiv
    },
    // Backgrounds
    backgrounds: {
      primary: 'bg-white',
      secondary: 'bg-gray-50',
      tertiary: 'bg-gray-100',
      dark: 'bg-gray-900',
      black: 'bg-black'
    },
    // Text Colors
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      tertiary: 'text-gray-500',
      inverse: 'text-white'
    },
    // Border Colors
    borders: {
      light: 'border-gray-200',
      medium: 'border-gray-300',
      dark: 'border-gray-400',
      focus: 'border-blue-500'
    }
  },

  // Component Variants - Einheitliche Komponenten
  components: {
    badge: {
      base: 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium',
      variants: {
        default: 'bg-gray-100 text-gray-700 border-0',
        primary: 'bg-gradient-to-r from-gray-900 to-gray-700 text-white',
        accent: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
        success: 'bg-green-100 text-green-700',
        info: 'bg-blue-100 text-blue-700'
      }
    },
    card: {
      base: 'bg-white rounded-xl sm:rounded-2xl border transition-all duration-300',
      variants: {
        default: 'border-gray-200 hover:border-gray-300 hover:shadow-md',
        elevated: 'border-gray-200 shadow-sm hover:shadow-lg',
        outlined: 'border-gray-300',
        featured: 'border-2 border-blue-500 shadow-xl'
      }
    },
    button: {
      sizes: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-sm sm:text-base',
        lg: 'h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg'
      }
    }
  },

  // Animation System - Konsistente Animationen
  animations: {
    transition: {
      fast: 'transition-all duration-200',
      medium: 'transition-all duration-300',
      slow: 'transition-all duration-500'
    },
    hover: {
      scale: 'hover:scale-105',
      lift: 'hover:-translate-y-1',
      glow: 'hover:shadow-xl'
    }
  },

  // Breakpoints - Responsive Design
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
}

// Helper Functions
export const getSpacing = (size: 'mobile' | 'tablet' | 'desktop' = 'mobile') => {
  return `${designSystem.spacing.section[size]}`
}

export const getSectionClasses = () => {
  return `${designSystem.spacing.section.mobile} ${designSystem.spacing.section.tablet} ${designSystem.spacing.section.desktop}`
}

export const getContainerClasses = () => {
  return `${designSystem.spacing.container.maxWidth} ${designSystem.spacing.container.padding}`
}

export const getBadgeClasses = (variant: keyof typeof designSystem.components.badge.variants = 'default') => {
  return `${designSystem.components.badge.base} ${designSystem.components.badge.variants[variant]}`
}

export const getCardClasses = (variant: keyof typeof designSystem.components.card.variants = 'default') => {
  return `${designSystem.components.card.base} ${designSystem.components.card.variants[variant]}`
}