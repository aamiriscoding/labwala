/**
 * LabWala Theme System
 * =====================
 * ALL colors and design tokens live here.
 * To change the entire theme, just edit these values.
 *
 * Structure:
 *  - themes.dark   → dark amber/hacker theme
 *  - themes.light  → light clean theme
 *
 * Usage in CSS: var(--color-primary), var(--color-bg), etc.
 */

export const themes = {
  dark: {
    name: 'dark',
    // Backgrounds
    '--color-bg':           '#0a0a0a',
    '--color-bg-secondary': '#111111',
    '--color-bg-card':      '#161616',
    '--color-bg-hover':     '#1e1e1e',
    '--color-bg-modal':     '#131313',

    // Primary accent — amber/orange
    '--color-primary':        '#f59e0b',
    '--color-primary-dim':    '#d97706',
    '--color-primary-glow':   'rgba(245, 158, 11, 0.15)',
    '--color-primary-glow-strong': 'rgba(245, 158, 11, 0.3)',

    // Secondary accent — orange
    '--color-secondary':      '#f97316',
    '--color-secondary-dim':  '#ea580c',

    // Text
    '--color-text':           '#f0f0f0',
    '--color-text-secondary': '#a0a0a0',
    '--color-text-muted':     '#606060',

    // Borders
    '--color-border':         '#282828',
    '--color-border-focus':   '#f59e0b',

    // Status
    '--color-success':        '#22c55e',
    '--color-danger':         '#ef4444',
    '--color-warning':        '#f59e0b',
    '--color-info':           '#3b82f6',

    // Admin notes — golden glow
    '--color-notes-bg':       'rgba(245, 158, 11, 0.06)',
    '--color-notes-border':   '#f59e0b',
    '--color-notes-text':     '#fcd34d',
    '--color-notes-glow':     '0 0 20px rgba(245, 158, 11, 0.3), 0 0 40px rgba(245, 158, 11, 0.1)',

    // Cart badge
    '--color-badge-bg':       '#f59e0b',
    '--color-badge-text':     '#000000',

    // Scrollbar
    '--color-scrollbar':      '#2a2a2a',
    '--color-scrollbar-thumb':'#f59e0b',

    // Shadows
    '--shadow-card':          '0 4px 24px rgba(0,0,0,0.4)',
    '--shadow-hover':         '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.1)',
    '--shadow-glow':          '0 0 30px rgba(245, 158, 11, 0.2)',
  },

  light: {
    name: 'light',
    // Backgrounds
    '--color-bg':           '#fafaf9',
    '--color-bg-secondary': '#f4f4f2',
    '--color-bg-card':      '#ffffff',
    '--color-bg-hover':     '#f0ede8',
    '--color-bg-modal':     '#ffffff',

    // Primary accent — amber/orange
    '--color-primary':        '#d97706',
    '--color-primary-dim':    '#b45309',
    '--color-primary-glow':   'rgba(217, 119, 6, 0.12)',
    '--color-primary-glow-strong': 'rgba(217, 119, 6, 0.25)',

    // Secondary accent — orange
    '--color-secondary':      '#ea580c',
    '--color-secondary-dim':  '#c2410c',

    // Text
    '--color-text':           '#1a1a1a',
    '--color-text-secondary': '#525252',
    '--color-text-muted':     '#9a9a9a',

    // Borders
    '--color-border':         '#e5e5e5',
    '--color-border-focus':   '#d97706',

    // Status
    '--color-success':        '#16a34a',
    '--color-danger':         '#dc2626',
    '--color-warning':        '#d97706',
    '--color-info':           '#2563eb',

    // Admin notes — golden glow (light)
    '--color-notes-bg':       'rgba(217, 119, 6, 0.06)',
    '--color-notes-border':   '#d97706',
    '--color-notes-text':     '#92400e',
    '--color-notes-glow':     '0 0 20px rgba(217, 119, 6, 0.2), 0 0 40px rgba(217, 119, 6, 0.08)',

    // Cart badge
    '--color-badge-bg':       '#d97706',
    '--color-badge-text':     '#ffffff',

    // Scrollbar
    '--color-scrollbar':      '#e5e5e5',
    '--color-scrollbar-thumb':'#d97706',

    // Shadows
    '--shadow-card':          '0 2px 12px rgba(0,0,0,0.06)',
    '--shadow-hover':         '0 8px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(217,119,6,0.15)',
    '--shadow-glow':          '0 0 20px rgba(217, 119, 6, 0.15)',
  }
};

export function applyTheme(themeName) {
  const theme = themes[themeName] || themes.dark;
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    if (key !== 'name') root.style.setProperty(key, value);
  });
  root.setAttribute('data-theme', themeName);
  localStorage.setItem('labwala-theme', themeName);
}

export function getStoredTheme() {
  return localStorage.getItem('labwala-theme') || 'dark';
}
