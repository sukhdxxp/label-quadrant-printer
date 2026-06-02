---
name: Label Quadrant Printer
description: A quiet, precise utility for placing labels on an A4 4-up sheet and printing them exactly.
colors:
  accent: "oklch(0.60 0.18 254)"
  accent-strong: "oklch(0.54 0.18 254)"
  accent-weak: "oklch(0.95 0.03 254)"
  on-accent: "oklch(0.99 0.005 254)"
  canvas: "oklch(0.97 0.004 254)"
  surface: "oklch(0.99 0.0015 254)"
  surface-sunken: "oklch(0.955 0.004 254)"
  border: "oklch(0.90 0.005 254)"
  border-strong: "oklch(0.84 0.006 254)"
  ink: "oklch(0.27 0.012 254)"
  ink-secondary: "oklch(0.50 0.010 254)"
  ink-tertiary: "oklch(0.64 0.008 254)"
  success: "oklch(0.62 0.14 150)"
  warning: "oklch(0.76 0.14 75)"
  danger: "oklch(0.58 0.20 25)"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.005em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Segoe UI\", system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.01em"
  readout:
    fontFamily: "ui-monospace, \"SF Mono\", \"SFMono-Regular\", Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
    typography: "{typography.title}"
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
    typography: "{typography.title}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    typography: "{typography.title}"
  input-number:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
    typography: "{typography.readout}"
  segment-track:
    backgroundColor: "{colors.surface-sunken}"
    rounded: "{rounded.md}"
    padding: "3px"
  segment-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
    typography: "{typography.label}"
---

# Design System: Label Quadrant Printer

## 1. Overview

**Creative North Star: "The Desk Instrument"**

This is a tool you reach for, use for ninety seconds, and put down. It should
feel like a well-made macOS system utility: a calm cool-gray window, generous
air, one confident blue for the single action that matters right now, and
nothing competing for attention. The interface is a means to a printed sheet,
not a place to linger. Its job is to make millimeter-precise placement feel
obvious and trustworthy, then get out of the way.

Precision is the personality. The product places an image onto a physical 105 x
148.5 mm label cell and promises the print will match the preview exactly. That
promise is expressed visually: real measurements are set in monospace with
tabular figures so digits never shift, the sheet preview is rendered as an
honest technical drawing rather than a glossy mockup, and the accent blue marks
exactly one thing at a time. Restraint here is not timidity; it is the
confidence of an instrument that does one thing correctly.

This system explicitly rejects three things named in PRODUCT.md. It is not
**enterprise software**: no dense toolbars, ribbon menus, or settings sprawl. It
is not **skeuomorphic**: no fake paper texture, no drop-shadowed "realistic"
label photos, no physical metaphors dressed up as chrome. And it is not
**generic SaaS**: no gradient accents, no hero-metric panels, no endless
identical card grids. When in doubt, remove.

**Key Characteristics:**
- Cool, blue-tinted neutrals; a single precise blue accent under 10% of any screen.
- System sans for the interface, monospace with tabular figures for every measurement.
- Flat by default; depth appears only for things that genuinely float (popovers, the crop dialog).
- Restrained motion: state changes only, 150 to 200 ms, no choreography.
- The preview reads as a drafting representation, not a product photo.

## 2. Colors

A cool near-monochrome built on a single blue hue (254), with one saturated blue
doing all the talking and a small set of semantic colors held in reserve.

### Primary
- **Precise Blue** (`oklch(0.60 0.18 254)`): The only chromatic voice in normal
  use. Primary buttons, the current wizard step, the selected quadrant, focus
  rings, active slider fills. One job per screen.
- **Pressed Blue** (`oklch(0.54 0.18 254)`): Hover and active depth for the
  primary action. Never used decoratively.
- **Blue Wash** (`oklch(0.95 0.03 254)`): The faint tint behind a selected or
  active region (selected quadrant fill, active segment hint). Quiet, never a
  block of color.

### Neutral
- **Canvas** (`oklch(0.97 0.004 254)`): The app background. A cool system gray,
  the grouped-window backdrop everything sits on.
- **Surface** (`oklch(0.99 0.0015 254)`): Raised content (panels, inputs,
  the active segment). Reads as white without being `#fff`.
- **Sunken** (`oklch(0.955 0.004 254)`): Recessed tracks and wells (segmented
  control track, slider groove).
- **Border** (`oklch(0.90 0.005 254)`): The default hairline separator. This is
  how surfaces are distinguished, not shadows.
- **Strong Border** (`oklch(0.84 0.006 254)`): Input outlines and dividers that
  need to read as a real edge.
- **Ink** (`oklch(0.27 0.012 254)`): Primary text. Near-black, tinted blue,
  never `#000`.
- **Secondary Ink** (`oklch(0.50 0.010 254)`): Supporting copy, descriptions,
  inactive labels.
- **Tertiary Ink** (`oklch(0.64 0.008 254)`): Placeholders, disabled text, the
  faintest hints.

### Tertiary (semantic, held in reserve)
- **Success Green** (`oklch(0.62 0.14 150)`): Export complete, calibration
  confirmed. Brief, then gone.
- **Warning Amber** (`oklch(0.76 0.14 75)`): Print-at-100% reminders, margin
  edge cases.
- **Danger Red** (`oklch(0.58 0.20 25)`): Upload failures and destructive
  confirmations only.

### Named Rules
**The One Voice Rule.** Precise Blue appears on at most 10% of any screen, and
only on the single most important live element: the next action, the current
step, the selected cell. If two blue things compete, one is wrong.

**The Tinted Extremes Rule.** Never `#000` or `#fff`. Every neutral carries hue
254 at chroma 0.004 to 0.012. The grays must feel cool and intentional, not
default.

## 3. Typography

**UI Font:** system sans (`-apple-system, BlinkMacSystemFont, "SF Pro Text",
"Segoe UI", system-ui, sans-serif`)
**Readout Font:** system monospace (`ui-monospace, "SF Mono", "SFMono-Regular",
Menlo, monospace`)

**Character:** Native and invisible. The sans gives the app a true system-utility
feel on every platform with zero font loading. The monospace is reserved for one
purpose: measurements. The pairing says "interface here, instrument readout
there" without a single label.

### Hierarchy
- **Display** (600, 1.625rem/26px, line-height 1.15, -0.01em): The app title in
  the header. Appears once.
- **Headline** (600, 1.125rem/18px, line-height 1.3): The current step's heading
  ("Upload a label", "Crop and rotate", "Lay out the sheet").
- **Title** (600, 0.9375rem/15px): Control group labels, button text, panel
  titles.
- **Body** (400, 0.875rem/14px, line-height 1.5): Instructions and descriptions.
  Cap prose at 65 to 75ch.
- **Label** (500, 0.75rem/12px, +0.01em): Small UI labels, segmented-control
  text, step names in the stepper.
- **Readout** (500, 0.8125rem/13px, monospace, `font-variant-numeric:
  tabular-nums`): Every numeric measurement. Margin in mm, offsets, rotation
  degrees, cell dimensions, calibration values.

### Named Rules
**The Tabular Numbers Rule.** Any number a user reads as a measurement is set in
the Readout monospace with tabular figures. Digits must never reflow or shift
width as values change while dragging a slider or stepping a field.

**The Tight Scale Rule.** Steps stay within a 1.15 to 1.25 ratio. This is a
dense product surface with many labels; exaggerated type contrast reads as noise.

## 4. Elevation

Flat by default. Surfaces are separated by hairline borders and the cool
canvas/surface tonal step, not by shadows. This is the macOS-utility posture:
the window is a calm plane, and shadow is spent only on things that genuinely
float above it.

### Shadow Vocabulary
- **Popover** (`box-shadow: 0 1px 2px oklch(0.4 0.02 254 / 0.08), 0 12px 32px -8px
  oklch(0.4 0.02 254 / 0.22)`): The crop-and-rotate dialog and any transient
  popover. A soft, cool, diffuse lift, paired with a hairline border.
- **Raised** (`box-shadow: 0 1px 2px oklch(0.4 0.02 254 / 0.06)`): The optional
  whisper of depth under the sheet preview so it reads as a physical sheet on the
  desk. Use at most once per screen.

### Named Rules
**The Flat-By-Default Rule.** Resting surfaces have no shadow. If a shadow is on
something that is not floating or actively focused, delete it and add a hairline
border instead.

**The Cool Shadow Rule.** Shadows are tinted with hue 254 and kept low opacity
(under 0.24). A neutral-black drop shadow reads as a 2014 app; a cool, diffuse,
short-offset shadow reads as current.

## 5. Components

### Buttons
- **Shape:** Gently rounded (`{rounded.md}`, 10px).
- **Primary:** Precise Blue fill, near-white text, 10px x 18px padding. Exactly
  one per screen, the next action ("Continue", "Export PDF").
- **Hover / Focus:** Hover deepens to Pressed Blue. Focus shows a 2px Precise Blue
  ring offset 2px from the surface. No transform on press beyond a subtle
  brightness shift.
- **Secondary:** Surface fill, Ink text, Strong Border hairline. For "Back",
  "Replace image", secondary paths.
- **Ghost:** Transparent, Precise Blue text, no border. For tertiary actions like
  "Generate calibration sheet" and inline toggles.
- **Disabled:** Surface fill, Tertiary Ink text, no border, no hover.

### Segmented Control (signature: quadrant selector and stepper)
- **Track:** Sunken background, 10px radius, 3px inner padding.
- **Segments:** Label-sized text. The active segment is a Surface "thumb" with a
  6px radius and the Raised whisper shadow; the thumb slides between positions.
- **Active text:** Ink. Inactive text: Secondary Ink. The selected quadrant also
  shows a Blue Wash fill in its preview cell, never a heavy block.
- **State:** Hover lifts inactive text toward Ink. Focus rings the whole control.

### Inputs and Steppers (margin, offset, rotation)
- **Style:** Surface fill, Strong Border hairline, 6px radius, Readout monospace
  for the value with a unit suffix (mm, deg) in Secondary Ink.
- **Focus:** Border shifts to Precise Blue plus a 2px ring. No glow.
- **Steppers:** Number field with attached minus/plus controls; values are
  tabular so the field never jumps width.
- **Sliders:** Sunken groove, Precise Blue fill to the thumb, circular Surface
  thumb with a hairline border. The live value rides in monospace nearby.

### Dropzone (upload)
- **Style:** A generous region with a 1.5px dashed Border, `{rounded.lg}` (14px)
  corners, Surface fill, centered icon and prompt. Not a card; it is a target.
- **Hover / Drag-over:** Border becomes Precise Blue, fill becomes Blue Wash,
  prompt text becomes Ink. The whole region confirms the drop.
- **Error:** Border and message switch to Danger Red, message in Body size.

### Sheet Preview (signature)
- **Style:** An honest technical drawing of the A4 sheet at true 2x2 proportion.
  The page is Surface with a Strong Border edge and the Raised whisper shadow;
  the four cells are divided by Border hairlines. No paper texture, no curl, no
  realistic shadowing of placed images.
- **Selected cell:** Blue Wash fill plus a 1px Precise Blue inner outline.
- **Optional ruler:** Hairline tick marks in Tertiary Ink with monospace labels;
  off by default, toggled by a ghost control.

### Navigation (the wizard)
- **Style:** A three-step stepper rendered as a segmented control or a connected
  numbered rail. The current step uses Precise Blue (filled number + Ink label);
  completed steps show a small success check in Secondary Ink; upcoming steps are
  Tertiary Ink. Linear and quiet; no breadcrumbs, no side nav.

## 6. Do's and Don'ts

### Do:
- **Do** keep Precise Blue on at most 10% of any screen, on the single live
  element that matters (next action, current step, selected cell).
- **Do** set every measurement in the Readout monospace with
  `font-variant-numeric: tabular-nums` so digits never shift while dragging.
- **Do** separate surfaces with hairline Borders and the canvas/surface tonal
  step; reserve shadow for the crop dialog and the sheet preview only.
- **Do** tint every neutral toward hue 254 (chroma 0.004 to 0.012); use Ink, not
  `#000`, and Surface, not `#fff`.
- **Do** keep motion to state changes at 150 to 200 ms with an ease-out curve;
  animate opacity and transform, never layout properties.
- **Do** render the sheet preview as a precise technical drawing that matches the
  exported PDF one to one.

### Don't:
- **Don't** add enterprise chrome: dense toolbars, ribbon menus, cluttered Office
  style panels, or settings sprawl.
- **Don't** be skeuomorphic: no fake paper texture, no realistic drop-shadowed
  label mockups, no physical metaphors dressed up as decoration.
- **Don't** reach for generic SaaS dressing: no gradient accents, no
  `background-clip: text` gradient headings, no hero-metric panels, no rows of
  identical icon-heading-text cards.
- **Don't** use a colored `border-left` or `border-right` stripe as an accent on
  panels, alerts, or list items. Use a full hairline border or a Blue Wash fill.
- **Don't** reach for a modal first. The crop-and-rotate dialog earns its
  floating treatment; everything else stays inline in the wizard.
- **Don't** let a second blue, a glow, or a drop shadow compete with the One
  Voice. If two elements both shout, one of them is wrong.
