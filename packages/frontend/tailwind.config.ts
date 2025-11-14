import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic theme colors mapped to CSS variables
        'app-bg': {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
          elevated: 'var(--color-bg-elevated)',
        },
        'app-border': {
          primary: 'var(--color-border-primary)',
          secondary: 'var(--color-border-secondary)',
        },
        'app-text': {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          muted: 'var(--color-text-muted)',
        },
        'app-interactive': {
          primary: 'var(--color-interactive-primary)',
          'primary-hover': 'var(--color-interactive-primary-hover)',
          secondary: 'var(--color-interactive-secondary)',
        },
        'app-status': {
          success: 'var(--color-success)',
          error: 'var(--color-error)',
          'error-bg': 'var(--color-error-bg)',
          'error-border': 'var(--color-error-border)',
          warning: 'var(--color-warning)',
        },
        'app-selected': {
          bg: 'var(--color-selected-bg)',
          border: 'var(--color-selected-border)',
        },
      }
    }
  },
  plugins: [
    require("@tailwindcss/typography")
  ]
};

export default config;

