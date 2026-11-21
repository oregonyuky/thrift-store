---
version: alpha
name: ThriftStore Operations Dashboard
description: A precise, accessible design system for dense administrative dashboards, operational metrics, tables, charts, and stateful workflows.
colors:
  primary: "#1D4ED8"
  primary-hover: "#1E40AF"
  surface: "#FFFFFF"
  surface-subtle: "#F8FAFC"
  surface-hover: "#F1F5F9"
  text: "#111827"
  text-muted: "#4B5563"
  border: "#D1D5DB"
  sidebar: "#111827"
  sidebar-text: "#F9FAFB"
  success-surface: "#DCFCE7"
  success-text: "#166534"
  warning-surface: "#FEF3C7"
  warning-text: "#92400E"
  error-surface: "#FEE2E2"
  error-text: "#991B1B"
  info-surface: "#DBEAFE"
  info-text: "#1E40AF"
  focus: "#93C5FD"
typography:
  page-title:
    fontFamily: Source Sans Pro
    fontSize: 32px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.01em
  section-title:
    fontFamily: Source Sans Pro
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
  card-title:
    fontFamily: Source Sans Pro
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.3
  kpi-value:
    fontFamily: Source Sans Pro
    fontSize: 30px
    fontWeight: 900
    lineHeight: 1
    letterSpacing: -0.01em
  body-md:
    fontFamily: Source Sans Pro
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Source Sans Pro
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
  label-md:
    fontFamily: Source Sans Pro
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.2
  table-header:
    fontFamily: Source Sans Pro
    fontSize: 12px
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: 0.02em
  caption:
    fontFamily: Source Sans Pro
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.35
  numeric-data:
    fontFamily: Source Sans Pro
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.25
    fontFeature: "tnum"
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 14px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
components:
  app-shell:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.text}"
    typography: "{typography.body-md}"
    padding: "{spacing.xl}"
  sidebar:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.sidebar-text}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "{spacing.md}"
    width: "250px"
  sidebar-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
    height: "42px"
  page-heading:
    textColor: "{colors.text}"
    typography: "{typography.page-title}"
    padding: "{spacing.xs}"
  section-heading:
    textColor: "{colors.text}"
    typography: "{typography.section-title}"
    padding: "{spacing.sm}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
    height: "42px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
    height: "42px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
    height: "42px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
    height: "44px"
  focus-indicator:
    backgroundColor: "{colors.focus}"
    rounded: "{rounded.sm}"
    size: "3px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  card-heading:
    textColor: "{colors.text}"
    typography: "{typography.card-title}"
    padding: "{spacing.sm}"
  kpi-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.kpi-value}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  kpi-label:
    textColor: "{colors.text-muted}"
    typography: "{typography.caption}"
    padding: "{spacing.xs}"
  table:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
  table-header:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.text-muted}"
    typography: "{typography.table-header}"
    padding: "{spacing.md}"
    height: "44px"
  table-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    typography: "{typography.body-sm}"
    padding: "{spacing.md}"
    height: "48px"
  table-row-hover:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.text}"
    typography: "{typography.body-sm}"
  numeric-cell:
    textColor: "{colors.text}"
    typography: "{typography.numeric-data}"
    padding: "{spacing.md}"
  divider:
    backgroundColor: "{colors.border}"
    rounded: "{rounded.none}"
    height: "1px"
  status-success:
    backgroundColor: "{colors.success-surface}"
    textColor: "{colors.success-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "{spacing.sm}"
  status-warning:
    backgroundColor: "{colors.warning-surface}"
    textColor: "{colors.warning-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "{spacing.sm}"
  status-error:
    backgroundColor: "{colors.error-surface}"
    textColor: "{colors.error-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "{spacing.sm}"
  status-info:
    backgroundColor: "{colors.info-surface}"
    textColor: "{colors.info-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "{spacing.sm}"
  chart-canvas:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    height: "320px"
  modal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.2xl}"
  empty-state:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.text-muted}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.3xl}"
---

# ThriftStore Operations Dashboard Design System

## Overview

ThriftStore dashboards should feel **operational, calm, and exact**. The primary audience is a store administrator who needs to scan orders, inventory, customers, payments, and exceptions quickly. Interfaces favor clear hierarchy and compact information density over decorative presentation.

This system formalizes the project's existing ASP.NET Core Razor Pages stack with AdminLTE, Bootstrap, Syncfusion grids, Vue, and Source Sans Pro. New work should reuse those foundations rather than introduce Tailwind or a second component framework. The design must remain usable on desktop and translate dense tables into labeled cards or deliberately scrollable views on small screens.

Every dashboard follows this reading order: page title and primary action, critical alerts, KPI summary, filters, visualization or dense table, then secondary details. The most important metric or exception must be identifiable within five seconds without relying on color alone.

## Colors

The palette combines the existing dark slate navigation and blue interaction color with neutral surfaces optimized for long administrative sessions.

- **Primary blue (`#1D4ED8`)** identifies the single primary action, active navigation, selected filters, links, and chart series. Use the darker hover blue for pointer and pressed feedback.
- **Surfaces** use white for content and `#F8FAFC` for the application canvas, table headers, filter bands, and quiet grouping.
- **Text** uses near-black for titles and essential values. Muted slate is reserved for metadata, descriptions, and non-primary table cells; it still meets WCAG AA on white.
- **Semantic states** use paired background and text tokens. Always combine color with a label, icon, or pattern so status remains understandable without color perception.
- **Focus blue** is a visible outline/ring, never the only indication of an error or selected state.

Chart palettes must start with primary blue, then use the semantic colors only when their meaning matches the data. Do not use success green for neutral growth or error red for an ordinary comparison series.

## Typography

Source Sans Pro is the dashboard typeface because it is already loaded by AdminLTE and remains legible in dense tables. System sans-serif fonts are the fallback. Do not add display fonts to operational screens.

- Page titles are 32px/800 and occur once per view.
- Section headings are 24px/700; card headings are 16px/700.
- KPI values are 30px/900 with short labels placed above or below them.
- Default UI copy is 14px with a 1.5 line height. Dense table cells may use 13px, never smaller.
- Table headers are 12px/800. Use concise sentence case; uppercase is acceptable only for very short established labels.
- Numeric cells use tabular figures and right alignment so magnitudes can be compared vertically.
- Avoid more than three simultaneous weights in one region. Bold text communicates hierarchy, not decoration.

## Layout

Use a 4px base rhythm expressed by the spacing tokens. Desktop screens retain the existing 250px sidebar and place page content on the subtle application canvas. Standard page padding is 24px, increasing to 32px only on wide summary views. Keep the primary content width fluid so tables can use available space.

Dashboard composition:

1. A page header aligns title/context left and one primary action right.
2. KPI cards use a responsive grid with equal heights and a minimum useful width near 180px.
3. Filters form a compact band directly above the data they affect. Place search first, common filters next, and destructive/reset actions last.
4. Tables use sticky headers when vertically scrolling and horizontal scrolling when columns cannot be responsibly collapsed.
5. Mobile layouts turn administrative rows into labeled cards, maintain 44px interaction targets, and keep the most important value first.

Use 12px gaps inside compact controls, 16px between related components, 24px between dashboard regions, and 32–48px only between major narrative sections or for empty states. Do not create arbitrary spacing values when a token is sufficient.

## Elevation & Depth

Hierarchy comes primarily from tonal layers, borders, and spacing. The application canvas is subtle gray; cards and table containers are white with a 1px neutral border. Use shadows sparingly for overlays, sticky elements, menus, and modals—not for every dashboard card.

KPI cards may use a restrained tinted surface tied to the metric's semantic meaning, but their text must use the paired accessible color. Sticky table headers must remain opaque and visually separated by a border. Modal backdrops need enough opacity to suppress the underlying dashboard without obscuring spatial context.

## Shapes

Shapes are practical and consistent. Inputs, buttons, navigation items, and compact controls use an 8px radius. Tables and chart containers use 12px. Dashboard cards use 14px. Status badges and avatar-like indicators use the full pill radius.

Do not mix radii within the same component family. Square corners are reserved for full-bleed structural regions and 1px dividers. Clickable icons must sit inside a visible or hover-revealed target of at least 44px even when the glyph itself is smaller.

## Components

### KPI cards

Show a short label, one prominent value, optional comparison, and a compact context line. Put the value in tabular numerals when it can change frequently. A KPI card is not a button unless the entire card has a clear label, focus state, and navigation affordance. Limit the first dashboard row to the metrics needed for the current decision.

### Tables and grids

Dense tables are the primary operational component. Default rows are approximately 48px high, headers 44px, and numeric content is right-aligned. Keep identifiers and primary names visually stronger than metadata. Use zebra striping only when it improves tracking across wide rows; hover highlighting must not shift layout.

Sorting, filtering, pagination, selection, and bulk actions need visible labels or tooltips and keyboard access. Preserve sticky headers for long datasets. On mobile, use labeled cards for task-oriented records; keep horizontal scrolling for comparison tables where column alignment is essential.

### Charts

Charts answer one stated question and should sit near the KPIs or table they summarize. Include a textual title, time range, accessible legend, units, and a no-data state. Start axes at zero when magnitude comparison is the purpose. Never encode status or series with color alone; add labels, patterns, markers, or direct annotations.

### Buttons and inputs

Use one primary filled button per action region. Secondary actions are white with readable slate text and a neutral border. Destructive actions require an error label/icon and confirmation proportional to consequence. Inputs are at least 44px high, have persistent labels, visible focus, helper/error text, and never rely on placeholder text as the label.

### Status, feedback, and overlays

Status pills combine semantic surface/text pairs with a concise word and optional icon. Loading states preserve layout and identify the affected region. Empty states explain why no data appears and provide the most useful next action. Errors state what happened, what remains safe, and how to recover. Modals are reserved for focused edits or confirmations and must return focus to their trigger.

## Do's and Don'ts

- Do place the most decision-relevant KPIs before charts and tables.
- Do keep table density consistent and preserve 44px minimum interactive targets.
- Do pair every semantic color with text, an icon, or another non-color cue.
- Do maintain WCAG AA contrast: at least 4.5:1 for normal text and 3:1 for large text and essential UI boundaries.
- Do use Source Sans Pro, the defined spacing rhythm, and tabular figures for comparable metrics.
- Do provide loading, empty, error, disabled, hover, focus, and selected states for interactive components.
- Don't use gradients, shadows, or saturated colors merely to decorate operational data.
- Don't show more KPI cards than a user can scan as one group; move secondary metrics closer to their relevant table or chart.
- Don't truncate essential identifiers or currency values without a reliable way to reveal the complete value.
- Don't make charts the only source of exact values when a table or accessible summary is appropriate.
- Don't introduce Tailwind, another font family, or a parallel component library without an explicit migration decision.
- Don't create one-off colors, radii, or spacing values when a DESIGN.md token already expresses the intent.
