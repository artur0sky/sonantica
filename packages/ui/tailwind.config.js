/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                background: 'var(--color-background)',
                surface: 'var(--color-surface)',
                'surface-elevated': 'var(--color-surface-elevated)',
                text: 'var(--color-text)',
                'text-muted': 'var(--color-text-muted)',
                accent: 'var(--color-accent)',
                'accent-hover': 'var(--color-accent-hover)',
                border: 'var(--color-border)',
            },
            fontFamily: {
                sans: 'var(--font-sans)',
                mono: 'var(--font-mono)',
            },
        },
    },
    plugins: [],
};
