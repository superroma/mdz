# Theme System

This project uses CSS Custom Properties (CSS variables) for theming, allowing easy theme modifications with minimal file changes.

## Current Setup

**Files that define themes:**
1. `packages/frontend/src/index.css` - Theme color values
2. `packages/frontend/tailwind.config.ts` - Maps CSS variables to Tailwind classes

## How to Modify the Current Theme

To change colors, edit only `index.css`:

```css
:root {
  /* Change any color value */
  --color-bg-primary: #ffffff;        /* Main background */
  --color-text-primary: #0f172a;      /* Main text */
  /* etc... */
}
```

**That's it!** No component changes needed.

## How to Add a New Theme (e.g., Dark Mode)

### Option 1: Theme Attribute (Recommended)

In `index.css`, add:

```css
[data-theme="dark"] {
  color-scheme: dark;
  --color-bg-primary: #0f172a;        /* slate-900 */
  --color-bg-secondary: #1e293b;      /* slate-800 */
  --color-bg-tertiary: #334155;       /* slate-700 */
  --color-bg-elevated: #1e293b;       /* slate-800 */
  
  --color-border-primary: #334155;    /* slate-700 */
  --color-border-secondary: #475569;  /* slate-600 */
  
  --color-text-primary: #f1f5f9;      /* slate-100 */
  --color-text-secondary: #cbd5e1;    /* slate-300 */
  --color-text-tertiary: #94a3b8;     /* slate-400 */
  --color-text-muted: #64748b;        /* slate-500 */
  
  --color-interactive-primary: #0ea5e9;     /* sky-500 */
  --color-interactive-primary-hover: #0284c7; /* sky-600 */
  --color-interactive-secondary: #38bdf8;   /* sky-400 */
  
  --color-selected-bg: #334155;       /* slate-700 */
  --color-selected-border: #38bdf8;   /* sky-400 */
}
```

Then add/remove the attribute in JavaScript:
```typescript
document.documentElement.setAttribute('data-theme', 'dark');
// or remove for light theme
document.documentElement.removeAttribute('data-theme');
```

### Option 2: System Preference

Use `prefers-color-scheme`:

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* dark theme colors */
  }
}
```

## Available Theme Colors

Use these Tailwind classes in components:

### Backgrounds
- `bg-app-bg-primary` - Main background
- `bg-app-bg-secondary` - Sidebar, panels
- `bg-app-bg-tertiary` - Hover states
- `bg-app-bg-elevated` - Cards, elevated elements

### Borders
- `border-app-border-primary` - Main borders
- `border-app-border-secondary` - Secondary borders

### Text
- `text-app-text-primary` - Main text
- `text-app-text-secondary` - Secondary text
- `text-app-text-tertiary` - Muted text
- `text-app-text-muted` - Very muted text

### Interactive Elements
- `text-app-interactive-primary` - Links, buttons
- `hover:text-app-interactive-primary-hover` - Hover states
- `bg-app-interactive-primary` - Primary button background

### Status
- `text-app-status-error` - Error text
- `bg-app-status-error-bg` - Error background
- `border-app-status-error-border` - Error border

### Selected/Active States
- `bg-app-selected-bg` - Selected background
- `border-app-selected-border` - Selected accent

## Migration Status

⚠️ **Current State**: Components still use direct Tailwind colors (e.g., `bg-white`, `text-slate-900`)

To fully benefit from this theme system, components need to be gradually migrated to use the theme classes (e.g., `bg-app-bg-primary`, `text-app-text-primary`).

## Benefits of This Approach

✅ **Single source of truth** - All colors defined in one place  
✅ **Easy modifications** - Change one file to restyle entire app  
✅ **Multiple themes** - Add dark/high-contrast/custom themes easily  
✅ **Runtime switching** - Can change themes with JavaScript  
✅ **No build required** - CSS variables work at runtime  
✅ **Type-safe** - Tailwind config provides autocomplete  

## Example: Creating a Theme Switcher

```typescript
// In a React component
const [theme, setTheme] = useState<'light' | 'dark'>('light');

useEffect(() => {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}, [theme]);

return (
  <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
    Toggle Theme
  </button>
);
```

