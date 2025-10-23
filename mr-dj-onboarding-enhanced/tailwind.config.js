/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Basis kleuren
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        
        // RentGuy Enterprise Palet
        background: '#F9FAFB', // Zakelijke lichte achtergrond
        foreground: '#1F2937', // Donkere tekst
        
        // Primaire Accent (CTA's, Knoppen)
        primary: {
          DEFAULT: '#007AFF', // Blauw
          foreground: '#FFFFFF',
        },
        
        // Secundaire Accent (Grafieken, Hoofdingen)
        secondary: {
          DEFAULT: '#5856D6', // Indigo
          foreground: '#FFFFFF',
        },
        
        // Status Kleuren
        destructive: {
          DEFAULT: '#FF3B30', // Rood voor fouten/kritieke conflicten
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#34C759', // Groen voor succes/validatie
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#FF9500', // Oranje voor waarschuwingen/milde conflicten
          foreground: '#FFFFFF',
        },
        
        // Kaart/Paneel Kleuren
        card: {
          DEFAULT: '#FFFFFF', // Witte kaarten
          foreground: '#1F2937',
        },
        
        // Grijstinten voor neutrale elementen
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      // Typografie (Inter is standaard in veel moderne setups, maar hier expliciet)
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

