'use client'

import { Badge } from '@/components/ui/badge'

export function EnterpriseIntegrations() {
  const enterpriseLogos = [
    // Payment & Finance
    {
      name: 'Stripe',
      logo: (
        <svg viewBox="0 0 60 25" className="h-8" fill="#635BFF">
          <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-3.06 9.64v9.5h-4.12V5.57h3.76l.08 1.22c.61-1.05 1.87-1.5 2.86-1.5.24 0 .5.02.73.04v3.93c-.21-.03-.48-.04-.72-.04-1.24 0-2.02.54-2.59 1.3zm-8.53-5.23c-2.7 0-4.36 2.3-4.36 5.47 0 3.2 1.66 5.5 4.36 5.5 1.04 0 1.93-.2 2.73-.63v3.4a7.08 7.08 0 0 1-3.35.73c-4.62 0-7.88-3.65-7.88-8.98 0-5.3 3.3-9 8.05-9 1.28 0 2.44.24 3.29.68v3.44a5.73 5.73 0 0 0-2.84-.61z"/>
        </svg>
      )
    },
    {
      name: 'PayPal',
      logo: (
        <svg viewBox="0 0 256 302" className="h-8" preserveAspectRatio="xMidYMid">
          <path fill="#27346A" d="M217.168 23.507C203.234 7.625 178.046.816 145.823.816h-93.52A13.393 13.393 0 0 0 39.076 12.11L.136 259.077c-.774 4.87 2.997 9.28 7.933 9.28h57.736l14.5-91.971-.45 2.88c1.033-6.501 6.593-11.296 13.177-11.296h27.436c53.898 0 96.101-21.892 108.429-85.221.366-1.873.683-3.696.957-5.477-1.556-.824-1.556-.824 0 0 3.671-23.407-.025-39.34-12.686-53.765"/>
          <path fill="#2790C3" d="M228.897 82.749c-12.328 63.32-54.53 85.221-108.429 85.221H93.024c-6.584 0-12.145 4.795-13.168 11.296L61.817 293.621c-.674 4.262 2.622 8.124 6.934 8.124h48.67a11.71 11.71 0 0 0 11.563-9.854l.474-2.48 9.173-58.136.591-3.213a11.71 11.71 0 0 1 11.562-9.854h7.284c47.147 0 84.064-19.154 94.852-74.55 4.503-23.15 2.173-42.478-9.739-56.054-3.613-4.112-8.1-7.508-13.327-10.28-.283 1.79-.59 3.604-.957 5.477z"/>
        </svg>
      )
    },
    {
      name: 'Klarna',
      logo: (
        <span className="text-xl font-bold text-pink-500">Klarna</span>
      )
    },
    {
      name: 'DATEV',
      logo: (
        <span className="text-lg font-bold text-green-600 bg-green-600 text-white px-3 py-1 rounded">DATEV</span>
      )
    },
    {
      name: 'Salesforce',
      logo: (
        <span className="text-lg font-bold text-blue-500">Salesforce</span>
      )
    },

    // Communication
    {
      name: 'Microsoft Teams',
      logo: (
        <span className="text-lg font-bold text-purple-600">Teams</span>
      )
    },
    {
      name: 'Slack',
      logo: (
        <span className="text-lg font-bold" style={{color: '#4A154B'}}>Slack</span>
      )
    },
    {
      name: 'WhatsApp',
      logo: (
        <svg viewBox="0 0 175.216 175.552" className="h-8">
          <path fill="#25CF43" d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.559 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.524h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.929z"/>
          <path fill="#FFF" d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"/>
        </svg>
      )
    },
    {
      name: 'Google',
      logo: (
        <svg viewBox="0 0 256 262" className="h-8" preserveAspectRatio="xMidYMid">
          <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"/>
          <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"/>
          <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"/>
          <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EA4335"/>
        </svg>
      )
    },
    {
      name: 'Microsoft 365',
      logo: (
        <span className="text-lg font-bold text-orange-600">Microsoft</span>
      )
    },
    {
      name: 'Zoom',
      logo: (
        <span className="text-lg font-bold text-blue-500">Zoom</span>
      )
    },
    {
      name: 'Mailchimp',
      logo: (
        <span className="text-lg font-bold text-yellow-500">Mailchimp</span>
      )
    },
    {
      name: 'HubSpot',
      logo: (
        <span className="text-lg font-bold text-orange-500">HubSpot</span>
      )
    },
    {
      name: 'Instagram',
      logo: (
        <svg viewBox="0 0 256 256" className="h-8" preserveAspectRatio="xMidYMid">
          <defs>
            <linearGradient id="ig-gradient" x1="50%" x2="50%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#E52D5A"/>
              <stop offset="50%" stopColor="#D72B83"/>
              <stop offset="100%" stopColor="#FCAF45"/>
            </linearGradient>
          </defs>
          <path fill="url(#ig-gradient)" d="M128 0C93.237 0 88.878.147 75.226.77c-13.625.622-22.93 2.786-31.071 5.95-8.418 3.271-15.556 7.648-22.672 14.764C14.367 28.6 9.991 35.738 6.72 44.155 3.555 52.297 1.392 61.602.77 75.226.147 88.878 0 93.237 0 128s.147 39.122.77 52.774c.622 13.625 2.785 22.93 5.95 31.071 3.27 8.417 7.647 15.556 14.763 22.672 7.116 7.116 14.254 11.492 22.672 14.763 8.142 3.165 17.446 5.328 31.07 5.95 13.653.623 18.012.77 52.775.77s39.122-.147 52.774-.77c13.624-.622 22.929-2.785 31.07-5.95 8.418-3.27 15.556-7.647 22.672-14.763 7.116-7.116 11.493-14.254 14.764-22.672 3.164-8.142 5.327-17.446 5.95-31.07.623-13.653.77-18.012.77-52.775s-.147-39.122-.77-52.774c-.623-13.624-2.786-22.929-5.95-31.07-3.271-8.418-7.648-15.556-14.764-22.672C227.4 14.368 220.262 9.99 211.845 6.72c-8.142-3.164-17.447-5.328-31.071-5.95C167.122.147 162.763 0 128 0zm0 23.027c34.234 0 38.279.13 51.8.746 12.48.57 19.258 2.655 23.769 4.408 5.974 2.322 10.238 5.096 14.717 9.575 4.48 4.479 7.253 8.743 9.575 14.717 1.753 4.511 3.838 11.289 4.408 23.768.616 13.522.746 17.567.746 51.8 0 34.234-.13 38.279-.746 51.8-.57 12.48-2.655 19.258-4.408 23.77-2.322 5.973-5.096 10.237-9.575 14.716-4.479 4.48-8.743 7.254-14.717 9.575-4.511 1.753-11.289 3.839-23.769 4.408-13.514.616-17.558.746-51.8.746-34.241 0-38.286-.13-51.8-.746-12.48-.57-19.257-2.655-23.768-4.408-5.974-2.321-10.238-5.095-14.717-9.575-4.48-4.479-7.254-8.743-9.576-14.717-1.753-4.51-3.838-11.288-4.408-23.768-.616-13.522-.746-17.567-.746-51.8 0-34.234.13-38.279.746-51.8.57-12.48 2.655-19.257 4.408-23.769 2.322-5.974 5.096-10.238 9.576-14.717 4.479-4.479 8.743-7.253 14.717-9.575 4.51-1.753 11.288-3.838 23.768-4.408 13.522-.616 17.567-.746 51.8-.746zm0 39.237c-36.302 0-65.736 29.434-65.736 65.736S91.698 193.736 128 193.736 193.736 164.302 193.736 128 164.302 62.264 128 62.264zm0 108.397c-23.564 0-42.661-19.098-42.661-42.661S104.436 85.339 128 85.339s42.661 19.098 42.661 42.661-19.098 42.661-42.661 42.661zm83.686-110.994c0 8.484-6.876 15.36-15.36 15.36-8.483 0-15.36-6.876-15.36-15.36 0-8.483 6.877-15.36 15.36-15.36 8.484 0 15.36 6.877 15.36 15.36z"/>
        </svg>
      )
    },
    {
      name: 'Zapier',
      logo: (
        <span className="text-lg font-bold text-orange-600">Zapier</span>
      )
    }
  ]

  // Duplicate logos for seamless infinite scroll
  const scrollLogos = [...enterpriseLogos, ...enterpriseLogos]

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="w-full">
        <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-12 lg:mb-16 px-4 sm:px-6">
          <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-purple-100 text-purple-700 border-0 text-xs sm:text-sm">
            Unsere Partner
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Nahtlos integriert in Ihr Ökosystem
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600">
            Arbeiten Sie mit den Tools, die Sie bereits kennen und lieben.
            Perfekte Integration in Ihre bestehenden Workflows.
          </p>
        </div>

        {/* Mobile Grid - Static display */}
        <div className="block sm:hidden px-4">
          <div className="grid grid-cols-3 gap-4">
            {enterpriseLogos.slice(0, 9).map((logo) => (
              <div
                key={logo.name}
                className="flex items-center justify-center h-16 bg-white rounded-lg border border-gray-200 p-3"
              >
                <div className="scale-[0.6] grayscale opacity-70">
                  {logo.logo}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">+ viele weitere Integrationen</p>
          </div>
        </div>

        {/* Desktop Infinite Scrolling Logo Carousel */}
        <div className="hidden sm:block w-full overflow-hidden">
          <div className="relative">
            {/* Gradient Masks for Fade Effect */}
            <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <div
              className="flex items-center gap-8 sm:gap-12 lg:gap-16"
              style={{
                animation: 'scroll 40s linear infinite'
              }}
            >
              {scrollLogos.map((logo, index) => (
                <div
                  key={`${logo.name}-${index}`}
                  className="flex items-center justify-center min-w-[100px] sm:min-w-[120px] lg:min-w-[140px] h-10 sm:h-12 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                >
                  <div className="flex items-center justify-center scale-[0.65] sm:scale-[0.7] lg:scale-75">
                    {logo.logo}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
        `}</style>
      </div>
    </section>
  )
}