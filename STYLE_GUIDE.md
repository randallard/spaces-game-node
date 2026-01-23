# Spaces Game - Style Guide

This document outlines the styling conventions and patterns used throughout the Spaces Game codebase.

## Table of Contents

- [Button States](#button-states)
- [Color Palette](#color-palette)
- [Typography](#typography)
- [Spacing](#spacing)
- [Component Patterns](#component-patterns)

---

## Button States

### Disabled State

Disabled buttons should consistently use the following pattern:

```css
.buttonName:disabled {
  background-color: #9ca3af; /* Gray-400 */
  cursor: not-allowed;
  opacity: 0.6;
}
```

**Key properties:**
- `background-color: #9ca3af` - Standard disabled gray
- `cursor: not-allowed` - Indicates non-interactive state
- `opacity: 0.6` - Visual feedback that button is disabled

### Hover State (Interactive)

Use `:hover:not(:disabled)` to prevent hover effects on disabled buttons:

```css
.buttonName:hover:not(:disabled) {
  background-color: #357abd;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}
```

### Loading/Processing State

For buttons in loading state (e.g., "Generating Link..."):

```css
.buttonName:disabled {
  background-color: #9ca3af;
  cursor: wait; /* Or not-allowed */
  opacity: 0.6;
  animation: pulse 1.5s ease-in-out infinite; /* Optional */
}
```

**Button text pattern:**
```tsx
{isLoading ? '⏳ Generating Link...' : '📋 Copy Link'}
```

---

## Color Palette

### Primary Colors

Defined in `src/App.module.css`:

```css
--bg-primary: #1a1a1a;
--bg-secondary: #2a2a2a;
--bg-tertiary: #3a3a3a;

--text-primary: #ffffff;
--text-secondary: #b0b0b0;

--button-primary: #4a90e2;
--button-hover: #3a7bc8;
--button-disabled: #9ca3af; /* Matches #bfbfbf in some places */
```

### Semantic Colors

```css
/* Success/Green */
--success: #52c41a;
--success-hover: #45a317;

/* Warning/Orange */
--warning: #f59e0b;
--warning-hover: #d97706;

/* Error/Red */
--error: #ef4444;

/* Info/Blue */
--info: #3b82f6;
--info-hover: #2563eb;
```

### Gray Scale

```css
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

---

## Typography

### Font Families

```css
--font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
  sans-serif;

--font-mono: 'Courier New', monospace;
```

### Font Sizes

```css
--font-xs: 0.75rem;    /* 12px */
--font-sm: 0.875rem;   /* 14px */
--font-base: 1rem;     /* 16px */
--font-lg: 1.125rem;   /* 18px */
--font-xl: 1.25rem;    /* 20px */
--font-2xl: 1.5rem;    /* 24px */
--font-3xl: 1.875rem;  /* 30px */
--font-4xl: 2.25rem;   /* 36px */
```

---

## Spacing

### Spacing Scale

Defined in `src/App.module.css`:

```css
--spacing-xs: 0.25rem;  /* 4px */
--spacing-sm: 0.5rem;   /* 8px */
--spacing-md: 1rem;     /* 16px */
--spacing-lg: 1.5rem;   /* 24px */
--spacing-xl: 2rem;     /* 32px */
--spacing-2xl: 3rem;    /* 48px */
```

### Usage Examples

```css
/* Button padding */
padding: var(--spacing-md) var(--spacing-lg); /* 1rem 1.5rem */

/* Card spacing */
margin-bottom: var(--spacing-lg); /* 1.5rem */

/* Section gaps */
gap: var(--spacing-md); /* 1rem */
```

---

## Component Patterns

### Modal Overlay

```css
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
```

### Card Component

```css
.card {
  background-color: var(--bg-secondary);
  border-radius: var(--spacing-sm);
  padding: var(--spacing-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

### Button Variants

#### Primary Button
```css
.primaryButton {
  padding: 1rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.primaryButton:hover:not(:disabled) {
  background: #2563eb;
}

.primaryButton:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}
```

#### Secondary Button
```css
.secondaryButton {
  padding: 1rem 1.5rem;
  background: #e5e7eb;
  color: #374151;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.secondaryButton:hover:not(:disabled) {
  background: #d1d5db;
}

.secondaryButton:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
  opacity: 0.6;
}
```

### Animations

#### Pulse Animation (Loading States)
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.loadingElement {
  animation: pulse 1.5s ease-in-out infinite;
}
```

#### Slide In Animation
```css
@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slideInElement {
  animation: slideIn 0.3s ease-out;
}
```

---

## Responsive Breakpoints

### Mobile First Approach

```css
/* Small devices (phones, less than 640px) */
/* Default styles - no media query needed */

/* Medium devices (tablets, 640px and up) */
@media (min-width: 640px) {
  /* ... */
}

/* Large devices (desktops, 1024px and up) */
@media (min-width: 1024px) {
  /* ... */
}

/* Extra large devices (large desktops, 1280px and up) */
@media (min-width: 1280px) {
  /* ... */
}
```

### Common Mobile Adjustments

```css
@media (max-width: 640px) {
  .primaryButton,
  .secondaryButton {
    padding: 0.875rem 1.25rem;
    font-size: 0.9375rem;
  }
}
```

---

## Best Practices

### DO's ✅

- Always use `:hover:not(:disabled)` for interactive hover states
- Use consistent disabled state styling across all buttons
- Provide visual feedback for loading states
- Use CSS custom properties (variables) for colors and spacing
- Follow mobile-first responsive design
- Add appropriate `cursor` styles (`pointer`, `not-allowed`, `wait`)
- Use semantic class names (`.submitButton`, `.cancelButton`, `.primaryButton`)

### DON'Ts ❌

- Don't hardcode color values - use CSS variables
- Don't forget to style disabled states
- Don't use different disabled styles across components
- Don't apply hover effects to disabled buttons
- Don't use inline styles unless absolutely necessary
- Don't use emojis unless explicitly requested by user requirements

---

## File Organization

### CSS Module Pattern

Each React component should have its own CSS module:

```
src/
  components/
    ComponentName/
      ComponentName.tsx
      ComponentName.module.css
```

### Import Pattern

```tsx
import styles from './ComponentName.module.css';

export function ComponentName() {
  return (
    <button className={styles.primaryButton}>
      Click Me
    </button>
  );
}
```

---

## Testing Accessibility

### Keyboard Navigation

All interactive elements should be keyboard accessible:

```tsx
<button
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  aria-label="Descriptive label"
  disabled={isDisabled}
>
  Button Text
</button>
```

### Screen Reader Support

```tsx
<button
  aria-label="Copy challenge link"
  aria-disabled={isGeneratingUrl}
  disabled={isGeneratingUrl}
>
  {isGeneratingUrl ? '⏳ Generating Link...' : '📋 Copy Link'}
</button>
```

---

## Version History

- **v1.0.0** (2026-01-18) - Initial style guide creation
  - Documented button states and disabled styling
  - Added color palette and spacing system
  - Included component patterns and best practices
