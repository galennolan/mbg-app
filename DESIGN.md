# DESIGN.md — Nutri Kampus Hub (MBG & Smart EdTech CRM)

## 1. Design Read & Dials
> Reading this as: Operational EdTech & Food Distribution PWA (`Nutri Kampus Hub — UBSI`) for high-school students, duty teachers (`Guru Piket`), school principals (`Kepala Sekolah`), and university marketing admins (`Super Admin`), in an institutional-crisp UBSI Royal Blue & High-Contrast Solid Surface style, dial **ENERGY 2 / RHYTHM 2 / MOTION 2**.

- **Dial:** `ENERGY 2 / RHYTHM 2 / MOTION 2`
- **Brand Identity:** Universitas Bina Sarana Informatika (UBSI) — Royal Blue (`#1769AA`), Deep Navy (`#172D50`), Crimson Red CTA (`#C62836`), and Food-Safety Emerald (`#21864B`).
- **Target Device Priority:** Smartphone-first (360px–430px Android/iOS viewports in school corridors & classrooms) scaling cleanly to desktop monitoring consoles (1024px–1440px).

## 2. One-Line Reasons for Major Visual Decisions (R-31)
- **Why this color palette (R-01, R-29)?** UBSI Royal Blue (`#1769AA`) and Deep Navy (`#172D50`) anchor institutional trust, Emerald (`#21864B`) signals food-safety clearance (`LAYAK_EDAR`), and Crimson Red (`#C62836`) is reserved strictly for primary high-priority actions and critical alerts.
- **Why solid card surfaces with capped glassmorphism (R-10, R-12)?** Capping `backdrop-filter: blur` strictly to sticky navigation and modal overlays keeps hierarchy clear and guarantees 60fps scrolling on budget student smartphones, while solid white cards (`#FFFFFF`) with crisp `1px` slate borders maximize WCAG AA text contrast (>7:1).
- **Why this typography (R-06)?** System UI / Plus Jakarta Sans geometric sans-serif provides immediate legibility on small mobile screens without network font-blocking, paired with tabular monospace strictly for 4-digit PIN codes, NISN numbers, and timestamps.
- **Why this layout & rhythm (R-05)?** Each screen is built around the single operational decision the user makes there (2-Click QC for Guru Piket, PIN/QR + 1-Tap Roster for Siswa, Live Class Progress + Audit Feed for Kepala Sekolah), varying between focused single-column workflows and 7:5 operational split views.
- **Why this border radius scale (R-11)?** Cards use `20px–24px` (`rounded-2xl`/`rounded-3xl`) for approachable container grouping, interactive inputs/buttons use `12px–16px` (`rounded-xl`/`rounded-2xl`) to signal tap targets (`>=44px`), and status tags use `8px` (`rounded-lg`) to avoid pill-everything monotony.
- **Why these micro-animations (R-19)?** Spring-based press feedback (`scale(0.97)` in `150ms`) confirms touch registration on mobile screens, self-drawing SVG icons in SweetAlert dialogs communicate outcome status instantaneously, and all motion respects `prefers-reduced-motion: reduce`.
- **Why icons without decorative emoji (R-04)?** Functional Lucide vector icons with explicit semantic relevance replace decorative emojis so status cues remain sharp, accessible (`aria-hidden="true"`), and screen-reader clean.

