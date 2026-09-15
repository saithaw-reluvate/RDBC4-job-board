import type { Config } from "tailwindcss";

/**
 * Theme colours are declared as CSS custom properties in `globals.css` and
 * consumed here as `rgb(var(--token) / <alpha-value>)`.
 *
 * Brand tokens are fixed. Semantic tokens (bg/surface/fg/line/primary/...) are
 * the ones a future dark theme would redefine — see `globals.css`. Components
 * must use these tokens rather than hardcoded colour values.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          700: "rgb(var(--brand-navy-700) / <alpha-value>)",
          900: "rgb(var(--brand-navy-900) / <alpha-value>)",
        },
        brand: {
          50: "rgb(var(--brand-blue-50) / <alpha-value>)",
          600: "rgb(var(--brand-blue-600) / <alpha-value>)",
          700: "rgb(var(--brand-blue-700) / <alpha-value>)",
        },
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          muted: "rgb(var(--surface-muted) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--line) / <alpha-value>)",
          strong: "rgb(var(--line-strong) / <alpha-value>)",
          control: "rgb(var(--line-control) / <alpha-value>)",
        },
        fg: {
          DEFAULT: "rgb(var(--fg) / <alpha-value>)",
          muted: "rgb(var(--fg-muted) / <alpha-value>)",
          subtle: "rgb(var(--fg-subtle) / <alpha-value>)",
          onDark: "rgb(var(--fg-on-dark) / <alpha-value>)",
          onDarkMuted: "rgb(var(--fg-on-dark-muted) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          hover: "rgb(var(--primary-hover) / <alpha-value>)",
          fg: "rgb(var(--primary-fg) / <alpha-value>)",
          soft: "rgb(var(--primary-soft) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--success) / <alpha-value>)",
          soft: "rgb(var(--success-soft) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--danger) / <alpha-value>)",
          soft: "rgb(var(--danger-soft) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(11 15 25 / 0.04), 0 1px 3px 0 rgb(11 15 25 / 0.04)",
        lift: "0 8px 24px -8px rgb(11 15 25 / 0.14), 0 2px 6px -2px rgb(11 15 25 / 0.06)",
        panel: "0 24px 48px -12px rgb(11 15 25 / 0.28)",
      },
      maxWidth: {
        container: "80rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(12px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "slide-in-right": "slide-in-right 200ms ease-out",
        "slide-up": "slide-up 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
