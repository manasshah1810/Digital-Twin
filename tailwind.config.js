/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                white: 'rgb(var(--color-white) / <alpha-value>)',
                black: 'rgb(var(--color-black) / <alpha-value>)',
                surface: {
                    50: 'rgb(var(--surface-50) / <alpha-value>)',
                    100: 'rgb(var(--surface-100) / <alpha-value>)',
                    200: 'rgb(var(--surface-200) / <alpha-value>)',
                    300: 'rgb(var(--surface-300) / <alpha-value>)',
                    400: 'rgb(var(--surface-400) / <alpha-value>)',
                    500: 'rgb(var(--surface-500) / <alpha-value>)',
                    600: 'rgb(var(--surface-600) / <alpha-value>)',
                    700: 'rgb(var(--surface-700) / <alpha-value>)',
                    800: 'rgb(var(--surface-800) / <alpha-value>)',
                    900: 'rgb(var(--surface-900) / <alpha-value>)',
                    950: 'rgb(var(--surface-950) / <alpha-value>)',
                },
                brand: {
                    500: 'rgb(var(--brand-500) / <alpha-value>)'
                },
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [],
};
