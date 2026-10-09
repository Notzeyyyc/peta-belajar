---
version: alpha
name: Peta Belajar Mint
description: Pale mint learning workspace on a dark canvas for elementary students. Flat surfaces, calm typography, Lucide icons, and semantic roadmap status colors.
colors:
  primary: "#1B1B1B"
  canvas: "#161616"
  window: "#E3EDE5"
  card: "#F4F6F3"
  dark: "#1B1B1B"
  dark-elev: "#252B26"
  ink: "#171717"
  ink-2: "#657066"
  line: "#D2DCD3"
  inverse: "#FFFFFF"
  status-gap: "#B3452F"
  status-half: "#C8A02E"
  status-master: "#3E7C4F"
typography:
  display:
    fontFamily: Manrope
    fontSize: 60px
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-2px"
  display-emphasis:
    fontFamily: Manrope
    fontSize: 60px
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-2px"
  heading:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-1px"
  title:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
  meta:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.45
rounded:
  frame: 40px
  card: 24px
  tile: 18px
  control: 14px
  pill: 999px
spacing:
  unit: 8px
  page: 42px
  column: 18px
components:
  button-primary:
    backgroundColor: "{colors.dark}"
    textColor: "{colors.inverse}"
    rounded: "{rounded.pill}"
    padding: 14px
    typography: title
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: 14px
    typography: title
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: 20px
    typography: body
  chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: 11px
    typography: meta
  roadmap-gap:
    backgroundColor: "{colors.status-gap}"
    textColor: "{colors.inverse}"
    rounded: "{rounded.pill}"
    size: 27px
  roadmap-half:
    backgroundColor: "{colors.status-half}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    size: 27px
  roadmap-master:
    backgroundColor: "{colors.status-master}"
    textColor: "{colors.inverse}"
    rounded: "{rounded.pill}"
    size: 27px
---

## Overview

Peta Belajar is a focused learning-map workspace for SD students. The mint window is the identity carrier, floating on a dark canvas. The seven connected surfaces are landing, login/register, home, AI clarification, roadmap menu, roadmap material detail, and profile. The primary surface is **Operate / Learn**: every screen presents one clear next step.

## Colors

Pale mint and off-white surfaces make the content feel like paper and approachable. Near-black panels provide strong contrast for focused actions and AI guidance. Red, yellow, and green are reserved strictly for roadmap meaning: `gap`, `setengah`, and `kuasai`; each state also has text or an icon.

## Typography

Manrope is used throughout. Light headings paired with bold emphasis create a calm but confident voice. Copy uses short Indonesian sentences and “kamu” so children can understand the action quickly.

## Layout

Desktop uses a rounded mint app frame with top navigation. Home balances the active roadmap against a small set of relevant materials and progress. Roadmap uses a vertical competency path. Mobile collapses content to one column and adds bottom navigation with large touch targets.

## Elevation & Depth

The design is flat: no box shadows, blur, or glass. Contrast between canvas, mint window, dark panel, and light cards provides hierarchy. Dashed separators organize list content without decoration.

## Shapes

Use the 40px app frame, 24px content cards, 18px tiles, 14px controls, and full pills/circles for chips, buttons, and roadmap nodes.

## Components

Lucide icons clarify map, home, AI guidance, profile, settings, materials, navigation, and completion. The AI screen uses short message bubbles and answer chips. The roadmap uses semantic nodes on a vertical track, with the next gap emphasized by the action button. Material detail shows format and duration for each lesson.

## Interaction

The prototype path is clickable: landing → login/register → home → Tanya AI → roadmap → material. Top navigation and mobile bottom navigation share destinations. Course cards open material detail; “Buka materi” opens the relevant lesson surface.

## Do's and Don'ts

- Do keep the mint window as the strongest visual signature.
- Do use Lucide icons to clarify actions, not as decoration on every block.
- Do pair status colors with labels/icons and reserve them for roadmap data.
- Do keep one obvious next action per screen.
- Don't turn the AI into a freeform answer machine.
- Don't use gradients, shadows, or saturated colors across the chrome.
- Don't invent metrics, testimonials, or unrelated dashboard statistics.
- Don't use tiny controls; production hit targets should be at least 44px.
