<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Implementation Guide

## 1. Architectural Pattern (Hexagonal Architecture)
- **Strict Layering**: The application must strictly follow Hexagonal Architecture (Ports and Adapters).
- **Core Domain**: Business logic must reside in the core domain layer, completely agnostic of Next.js, HTTP requests, or Supabase.
- **Ports (Interfaces)**: Define strict TypeScript interfaces for all external dependencies (e.g., Repositories, external APIs).
- **Adapters (Infrastructure)**: Supabase is an infrastructure detail. All Supabase calls must be encapsulated within repository adapters that implement the defined domain ports.

## 2. Backend & Data Access (Next.js Layer)
- **Next.js as BFF**: Next.js API Routes or Server Actions act as the strict middle layer (Backend for Frontend).
- **No Frontend Supabase Calls**: The frontend client code MUST NOT import or call the Supabase client directly. All data fetching must be routed through the Next.js backend layer.
- **Security & Authorization**: The Next.js backend layer is strictly responsible for enforcing authentication, role-based access control (RBAC), and business logic *before* calling the database.
- **Data Validation**: All incoming requests to the backend must be strictly validated against schemas (e.g., using Zod) before reaching the domain layer.

## 3. Frontend & Component Design
- **Component-Driven Flow**: Build the UI using strict component-driven principles. Isolate complex business logic from presentation.
- **Reusable Primitives**: UI primitives (Buttons, Inputs, Cards) must be highly reusable, visually consistent, and properly documented.
- **Server Components First**: Maximize the use of React Server Components (RSC) for data-fetching and SEO. Only use `"use client"` when client-side interactivity, state, or React hooks are strictly required.
- **State Management**: Keep global client-side state minimal. Rely on server-state management for API requests.

## 4. Code Quality & Standards
- **Strict TypeScript**: Avoid `any`. Define precise types for domain models, API payloads, and component props.
- **Standardized Error Handling**: The domain layer should return structured errors (or Use Case responses), and the Next.js layer should translate these into appropriate HTTP status codes and user-friendly messages.
- **Testability**: Domain logic and adapters must be entirely decoupled, ensuring they are independently testable using unit tests (e.g., Vitest).


# UI / UX DESIGN SYSTEM — LOYALTY APP

## Core visual direction

The application must use a premium, modern SaaS interface inspired by the design principles of Airbnb:

- clean
- minimal
- spacious
- friendly
- premium
- highly readable
- strong visual hierarchy
- generous whitespace
- rounded UI elements
- subtle borders
- subtle shadows
- restrained use of color
- excellent mobile and desktop responsiveness

Do NOT copy Airbnb's branding, logo, exact components, illustrations, or proprietary visual identity.

Use an "Airbnb-inspired" design language rather than an Airbnb clone.

---

# 1. Design philosophy

Every screen should feel:

> Simple enough for a cashier to understand immediately, but polished enough to feel like a premium commercial product.

Avoid:

- dense enterprise dashboards
- excessive tables
- tiny text
- excessive borders
- gradients everywhere
- excessive shadows
- overly colorful interfaces
- unnecessary animations
- decorative UI without purpose
- generic Bootstrap-looking components

Prefer:

- whitespace
- clear hierarchy
- large readable typography
- rounded cards
- simple navigation
- clear primary actions
- subtle secondary actions
- consistent spacing

---

# 2. Layout

Use a responsive application shell.

Desktop:

```text
┌────────────────────────────────────────────────────────────┐
│ Logo / Store                         User / Account         │
├───────────────┬────────────────────────────────────────────┤
│               │                                            │
│ Dashboard     │                                            │
│ Customers     │              Main Content                  │
│ Transactions  │                                            │
│               │                                            │
│               │                                            │
└───────────────┴────────────────────────────────────────────┘
```

The sidebar must be minimal and clean.

On smaller screens, replace the sidebar with a mobile navigation.

Main content should have a maximum readable width rather than stretching indefinitely.

Use generous horizontal and vertical spacing.

---

# 3. Spacing system

Use a consistent spacing scale.

Prefer:

```text
4px
8px
12px
16px
24px
32px
48px
64px
```

Do not randomly choose spacing values.

Use larger spacing between sections and smaller spacing between related elements.

---

# 4. Border radius

Use rounded components consistently.

Recommended:

```text
Buttons: 12px
Inputs: 12px
Cards: 16px
Dialogs: 20px
Large containers: 20px
```

Avoid excessive pill-shaped components except for:

- badges
- status indicators
- compact filters

---

# 5. Buttons

Buttons must have a clear hierarchy.

## Primary button

Use for the main action of a screen.

Examples:

```text
Ajouter un achat
Créer le client
Confirmer
```

Characteristics:

- solid background
- strong contrast
- rounded corners
- medium/bold typography
- comfortable horizontal padding
- minimum height around 44px

## Secondary button

Use for secondary actions.

Examples:

```text
Annuler
Voir l'historique
```

Use a subtle background, border or neutral treatment.

## Destructive action

For actions such as:

```text
Supprimer
Annuler une opération
```

Use a clearly destructive style and confirmation when appropriate.

Never make destructive actions visually identical to the primary action.

---

# 6. Inputs

Inputs should be large enough for fast cashier usage.

Minimum height:

```text
44px
```

Prefer:

```text
Label
Input
Helper/error text
```

Example:

```text
Nom

┌──────────────────────────────────────┐
│ Bayechou                             │
└──────────────────────────────────────┘
```

Search inputs should be visually prominent.

The customer search field is one of the most important elements of the application.

---

# 7. Customer search

The main cashier workflow should prioritize customer search.

Use a large search component:

```text
┌──────────────────────────────────────────────────────┐
│ 🔎  Nom, prénom, téléphone ou email                  │
└──────────────────────────────────────────────────────┘
```

It should feel like the central action of the application.

Search results should be presented as clean cards/list rows.

Example:

```text
Ahmed Bayechou
06 12 34 56 78
ahmed@example.com

GOLD · 2 450 points
```

Avoid dense data tables for customer selection.

---

# 8. Cards

Cards should be used to group meaningful information.

Example customer summary:

```text
┌──────────────────────────────────────┐
│ Ahmed Bayechou                       │
│                                      │
│ GOLD                                 │
│                                      │
│ 2 450             750                │
│ Historique        Disponibles        │
│                                      │
│ [ Ajouter un achat ]                 │
└──────────────────────────────────────┘
```

Cards should have:

- generous padding
- subtle border
- very subtle shadow when useful
- rounded corners
- clear hierarchy

Do not put every tiny piece of information inside a card.

---

# 9. Typography

Use a modern sans-serif font.

Preferred hierarchy:

```text
Page title
32px

Section title
24px

Card title
18–20px

Body
14–16px

Secondary information
13–14px
```

Use font weight to establish hierarchy instead of using many colors.

Prefer:

```text
Regular
Medium
Semibold
Bold
```

Avoid excessive use of bold.

---

# 10. Color system

IMPORTANT:

Do not hardcode colors throughout components.

Create semantic design tokens.

Example:

```css
--color-background
--color-surface
--color-text
--color-text-muted
--color-border
--color-primary
--color-primary-hover
--color-success
--color-warning
--color-danger
```

Components must use semantic tokens instead of raw colors.

BAD:

```css
color: #ff385c;
```

GOOD:

```css
color: var(--color-primary);
```

---

# 11. Configurable theme

The entire visual theme must be configurable.

Create a central theme configuration.

Example:

```typescript
export const theme = {
  colors: {
    primary: "...",
    primaryHover: "...",
    background: "...",
    surface: "...",
    text: "...",
    textMuted: "...",
    border: "...",
    success: "...",
    warning: "...",
    danger: "...",
  },

  radius: {
    sm: "...",
    md: "...",
    lg: "...",
    xl: "...",
  },

  typography: {
    fontFamily: "...",
  },

  spacing: {
    ...
  }
};
```

Do NOT scatter theme values throughout the application.

---

# 12. Theme presets

Support theme presets.

At minimum create:

```text
default
```

The architecture must make it easy to add:

```text
default
dark
premium
custom
```

without rewriting components.

Example:

```typescript
const themes = {
  default: {...},
  premium: {...},
  dark: {...}
};
```

The application should consume semantic theme variables.

---

# 13. AI-configurable theme

The application must be designed so that an AI agent can modify the visual identity by changing a single configuration.

The AI should be able to receive a request such as:

> "Make the application warmer, use a terracotta primary color, cream backgrounds and slightly larger rounded corners."

The AI should modify the theme configuration rather than manually editing dozens of components.

Example:

```typescript
const theme = {
  colors: {
    primary: "#...",
    background: "#...",
    surface: "#...",
    text: "#...",
    textMuted: "#...",
    border: "#..."
  },

  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px"
  }
};
```

---

# 14. Component architecture

Build reusable UI primitives.

At minimum:

```text
Button
Input
SearchInput
Card
Badge
Modal
Dialog
Dropdown
Table
EmptyState
Toast
Skeleton
Avatar
StatCard
CustomerCard
```

Business screens must compose these components instead of implementing their own styles.

For example:

```text
CustomerPage
    ↓
CustomerCard
    ↓
Card
Button
Badge
```

Do not duplicate button, input or card styles across pages.

---

# 15. Status badges

Customer statuses:

```text
Bronze
Silver
Gold
VIP
```

must be represented using a reusable `StatusBadge` component.

Example:

```text
BRONZE
SILVER
GOLD
VIP
```

The component should receive semantic status data:

```typescript
<StatusBadge status="gold" />
```

and determine the correct styling from the theme/configuration.

Do not hardcode styles in each page.

---

# 16. Dashboard

The dashboard should prioritize the cashier's most common actions.

Recommended hierarchy:

```text
Page title

Large customer search

Quick statistics

Recent activity

Other secondary information
```

Do not make the dashboard look like an analytics-heavy enterprise application.

The primary purpose is:

> Find a customer quickly and perform a loyalty operation.

---

# 17. Customer page

The customer page should immediately communicate:

```text
Name
Contact information
Status
Available points
Historical points
```

Then show the primary actions:

```text
+ Ajouter un achat
- Utiliser des points
```

Then show history.

The most important information should be visible without scrolling on desktop.

---

# 18. Transaction workflow

Adding an purchase should be extremely fast.

Flow:

```text
Search customer
      ↓
Select customer
      ↓
Add purchase
      ↓
Enter amount
      ↓
Automatically calculate points
      ↓
Confirm
```

The confirmation should clearly show:

```text
75,50 €

+75 points
```

before the cashier confirms.

---

# 19. Responsive design

The application must work well on:

- desktop
- laptop
- tablet
- mobile

The cashier interface should remain usable on smaller screens.

Never rely only on hover interactions.

Touch targets should generally be at least 44px.

---

# 20. Accessibility

Follow accessible UI principles:

- sufficient contrast
- visible focus states
- keyboard navigation
- semantic HTML
- accessible labels
- accessible dialogs
- clear error messages

Do not sacrifice accessibility for visual appearance.

---

# 21. Animation

Use animation sparingly.

Allowed:

- subtle hover transitions
- modal transitions
- toast appearance
- loading states
- small success feedback

Avoid:

- excessive page animations
- large transitions
- distracting effects

The application should feel fast.

---

# 22. Design consistency rule

Before creating a new component, check whether an existing component can be reused.

Before adding a new color, spacing value, radius or typography value, check the design tokens.

Do not introduce one-off styles unless there is a strong reason.

---

# 23. AI implementation rule

When modifying the application visually:

1. First inspect the existing design system.
2. Reuse existing components.
3. Modify theme tokens when the requested change is global.
4. Modify reusable components when the change affects a component category.
5. Only modify individual pages when the change is page-specific.
6. Never duplicate styles unnecessarily.

The goal is to maintain a coherent design system over the lifetime of the project.

---

# Final visual target

The application should feel like:

> Airbnb-inspired SaaS + modern POS + premium loyalty application.

Characteristics:

- clean
- white/neutral surfaces
- generous whitespace
- rounded corners
- subtle borders
- excellent typography
- strong primary actions
- minimal visual noise
- responsive
- polished
- fast

It should look intentionally designed, not like a collection of default UI components.
