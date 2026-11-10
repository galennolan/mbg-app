# UI Component Standardization Plan

**Project:** Nutri Kampus Hub (MBG & Smart EdTech CRM)
**Skill Applied:** ui-ux-pro-max + antislop-ui
**Status:** Completed (Phases 1-9 Executed)

---

## 1. Current State Analysis

### Existing Components (`src/components/ui/`)
| Component | Status | Issues |
|-----------|--------|--------|
| `Modal.tsx` | Good base | Missing focus trap, no initial focus restoration on close, z-index not systematized |
| `ModalField.tsx` | Good start | `ModalSelect` uses native `<select>` (not accessible on mobile), no `aria-describedby` wiring for errors in all fields, checkbox missing `aria-describedby` |
| `FeedbackBanner.tsx` | Basic | No `role="alert"` for auto-announcement, missing `type="button"` on dismiss |
| `PageHeader.tsx` | Decorative | Missing semantic `<header>` landmark, no `aria-labelledby` |
| `QualityCheckCard.tsx` (operasional) | Inline | Uses raw `<select>` with inconsistent styling, no shared `ModalSelect`, checkbox missing `aria-describedby` |

### Design Token Gaps
- No centralized token file (colors, spacing, radii, shadows, transitions)
- Raw hex/Tailwind classes scattered (e.g., `bg-emerald-600`, `rounded-2xl`, `focus:ring-brand-blue/20`)
- No dark-mode consideration for Glassmorphism surfaces

---

## 2. UX/UI Guideline Alignment (ui-ux-pro-max)

| Priority | Category | Key Requirements from Skill |
|----------|----------|----------------------------|
| 1 | **Accessibility** | Contrast 4.5:1, visible focus rings (2px min), keyboard nav, `aria-describedby` for errors, `role="alert"` for errors, visible labels (no placeholder-only) |
| 2 | **Touch & Interaction** | Min 44x44px (iOS) / 48dp (Android), 8px gap between targets, loading feedback, no hover-only actions |
| 3 | **Performance** | CLS < 0.1, lazy loading, reserve space |
| 8 | **Forms & Feedback** | Visible labels, error near field + `aria-describedby`, helper text, inline validation on blur, `role="alert"` for errors, error summary on submit |
| 9 | **Navigation** | Predictable back, z-index scale system (not `z-[9999]`), deep linking |

---

## 3. Plan Phases

### Phase 1: Design Token System (Foundation)
**Goal:** Single source of truth for all visual tokens

**Tasks:**
1. Create `src/lib/design-tokens.ts` with:
   - Colors (brand, semantic, surface, Glassmorphism)
   - Spacing scale (4px base)
   - Border radii (xs to full)
   - Shadows (elevation 1 to 5 + Glassmorphism)
   - Transitions (fast/normal/slow)
   - Z-index scale (10, 20, 30, 40, 50)
   - Focus ring tokens (width, color, offset)
   - Breakpoints (mobile-first)
2. Export as CSS variables + Tailwind `theme.extend` config
3. Update `tailwind.config.ts` to consume tokens

**Deliverable:** `design-tokens.ts` + updated `tailwind.config.ts`

---

### Phase 2: Base Input Primitives (Atoms)
**Goal:** Reusable, accessible, consistent input components

**Components to Create/Refactor:**
| Component | File | Key Improvements |
|-----------|------|------------------|
| `Input` | `src/components/ui/Input.tsx` | `forwardRef`, `aria-describedby` wiring, `inputMode`, `autoComplete`, focus ring tokens, error/helper slots, `leftIcon`/`rightIcon`, `loading` state |
| `Select` | `src/components/ui/Select.tsx` | **Custom combobox** (not native `<select>`) for mobile accessibility, searchable, keyboard nav, `aria-describedby`, option groups, clearable |
| `Textarea` | `src/components/ui/Textarea.tsx` | Same as Input + `autoResize`, `minRows`, `maxRows` |
| `Checkbox` | `src/components/ui/Checkbox.tsx` | `aria-describedby`, indeterminate, label clickable |
| `RadioGroup` / `Radio` | `src/components/ui/Radio.tsx` | `aria-describedby`, keyboard nav (arrow keys) |
| `Switch` / `Toggle` | `src/components/ui/Switch.tsx` | `role="switch"`, `aria-checked`, focus ring |
| `DatePicker` | `src/components/ui/DatePicker.tsx` | Native `<input type="date">` with custom trigger, locale `id-ID`, `min`/`max`, `aria-label` |
| `Label` | `src/components/ui/Label.tsx` | Required asterisk, `htmlFor` binding, helper/error slot |
| `FieldError` / `FieldHelper` | `src/components/ui/FieldMessage.tsx` | `role="alert"`, `aria-live="polite"`, `id` for `aria-describedby` |

**Shared Props Interface (DRY):**
```ts
interface BaseFieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  'aria-describedby'?: string; // auto-wired
}
```

---

### Phase 3: Compound Form Components (Molecules)
**Goal:** Compose atoms into reusable field groups

| Component | File | Use Case |
|-----------|------|----------|
| `FormField` | `src/components/ui/FormField.tsx` | Wraps Label + Input/Select/Textarea + Helper + Error, auto-generates `id`/`aria-describedby` |
| `FormSection` | `src/components/ui/FormSection.tsx` | Groups fields with legend/fieldset for accessibility |
| `FieldArray` | `src/components/ui/FieldArray.tsx` | Dynamic add/remove fields (e.g., multiple phone numbers) |

---

### Phase 4: Modal System Overhaul
**Goal:** Accessible, focus-trapped, reusable modal primitives

**Files:** `src/components/ui/Modal.tsx`, `src/components/ui/ModalConfirm.tsx`

**Improvements:**
1. **Focus Trap:** Use `focus-trap-react` or custom loop (Tab/Shift+Tab cycles within modal)
2. **Focus Restoration:** On close, return focus to trigger element
3. **Initial Focus:** `autoFocus` prop or `initialFocusSelector` (current) — ensure it works
4. **Z-Index System:** Use token `zIndex.modal` (50), `zIndex.overlay` (40), `zIndex.tooltip` (60)
5. **ARIA:** `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
6. **Scroll Lock:** Preserve scroll position, prevent body scroll
7. **Animation:** Use `motion`/`framer-motion` with `reduced-motion` respect
8. **Sizes:** `sm` (384px), `md` (448px), `lg` (512px), `xl` (640px), `full` (95vw)
9. **Close Variants:** Overlay click (configurable), Escape key, Close button
10. **Portal:** Render in `<body>` via `createPortal` (already done)
11. **Re-export:** `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter`, `ModalConfirm`

**New ConfirmModal:**
```tsx
<ModalConfirm
  isOpen={}
  title=""
  message=""
  variant="danger" | "primary" | "warning"
  confirmLabel=""
  cancelLabel=""
  onConfirm={}
  onCancel={}
  loading={}
/>
```

---

### Phase 5: Feedback & Notification System
**Goal:** Consistent, accessible feedback across the app

| Component | File | Improvements |
|-----------|------|--------------|
| `Toast` / `Snackbar` | `src/components/ui/Toast.tsx` | `role="status"`, `aria-live="polite"`, auto-dismiss, action button, stack |
| `Alert` / `Banner` | `src/components/ui/Alert.tsx` | `role="alert"`, `aria-live="assertive"`, dismissible, icon variants |
| `ErrorSummary` | `src/components/ui/ErrorSummary.tsx` | Top-of-form, links to fields via `href="#field-id"`, focus management |

---

### Phase 6: Form Validation & UX Utilities
**Goal:** Consistent validation UX patterns

**Files:**
- `src/lib/validation.ts` — Zod schemas + `formResolver` for React Hook Form
- `src/hooks/useFormValidation.ts` — Blur validation, submit handling, error map
- `src/hooks/useFieldFocus.ts` — Auto-focus first error, manage focus order

**Patterns:**
- Validate on `blur` (not on change) — per UX guideline
- Show inline error below field via `aria-describedby`
- On submit: focus first invalid field, show `ErrorSummary` at top
- Loading state on submit button with `aria-busy="true"`

---

### Phase 7: Replace Inline Components Across App
**Goal:** Migrate all pages to use new standardized components

**Migration Checklist:**

| Page | Components to Replace |
|------|----------------------|
| `/kedatangan` | `QualityCheckCard` selects to `Select`; checkbox to `Checkbox`; photo to `Input type="file"` |
| `/` (Student) | PIN inputs to `Input`; class select to `Select`; QR modal to `Modal` |
| `/dashboard` | Any raw selects/inputs |
| `/konfirmasi/kelas` | Raw inputs, modals |
| `/konfirmasi/individu` | Raw inputs, modals |
| `/laporan` | Date pickers, selects |
| `/admin/*` | All form fields, modals, tables |
| `/login` | Inputs, buttons |

**Pattern per page:**
```tsx
import { FormField, Input, Select, Checkbox, Button, Modal } from '@/components/ui';

<FormField label="Jam Tiba" required error={errors.jamTiba}>
  <Input type="time" {...register('jamTiba')} />
</FormField>

<FormField label="Kesimpulan" required>
  <Select options={[{value:'LAYAK_EDAR', label:'Layak Edar'}]} {...register('kesimpulan')} />
</FormField>
```

---

### Phase 8: Global Styles & Focus System
**Goal:** Consistent focus appearance app-wide

**Files:**
- `src/app/globals.css` — Add `:focus-visible` system using design tokens
- `tailwind.config.ts` — Ensure `focus-ring` utilities use tokens

```css
/* globals.css */
:focus-visible {
  outline: none;
  ring: var(--focus-ring-width) var(--focus-ring-color);
  ring-offset: var(--focus-ring-offset);
  ring-offset-color: var(--focus-ring-offset-color);
}

/* Ensure no outline-none without replacement */
*:focus { outline: none; }
*:focus-visible { /* token styles */ }
```

---

### Phase 9: Documentation & Storybook (Optional but Recommended)
**Goal:** Maintainability for future developers

**Deliverables:**
- `docs/components.md` — Component API reference
- `docs/design-tokens.md` — Token usage guide
- Storybook stories for each component (if Storybook added)

---

## 4. Implementation Priority & Dependencies

```
Phase 1 (Tokens) -> Phase 2 (Atoms) -> Phase 3 (Molecules) -> Phase 4 (Modals)
                                                      |
                        Phase 5 (Feedback) <- Phase 6 (Validation)
                                                      |
                                    Phase 7 (Migration) -> Phase 8 (Global Styles)
                                                      |
                                            Phase 9 (Docs)
```

- **Phase 1** must complete first (all other phases consume tokens)
- **Phase 2** before **Phase 3** (molecules compose atoms)
- **Phase 4** can run parallel with Phase 2/3 after tokens ready
- **Phase 7** (migration) is the largest effort — do incrementally per page

---

## 5. Acceptance Criteria (Definition of Done)

| Criterion | Verification |
|-----------|--------------|
| All inputs have visible labels (no placeholder-only) | Audit: `<label>` + `htmlFor` matches `id` |
| Focus ring visible on all interactive elements | Tab through app — 2px ring visible |
| Error messages announced by screen reader | NVDA/VoiceOver test: `role="alert"` |
| Touch targets >= 44x44px | DevTools device toolbar + ruler |
| No `z-[9999]` or arbitrary z-index | Grep for `z-\[` — only token values |
| No raw `<select>` in mobile views | Grep for `<select` in mobile components |
| Focus trapped in modals | Tab cycle stays inside modal |
| Focus restored on modal close | Open modal -> close -> trigger focused |
| Inline validation on blur | Type -> blur -> error appears |
| Error summary on submit | Submit invalid form -> summary at top |
| Design tokens used everywhere | No raw hex/Tailwind color classes in components |

---

## 6. Clarifying Questions

Before implementation, please confirm:

1. **React Hook Form + Zod?** Current code uses manual state. Should we adopt RHF + Zod for all forms?
2. **Date Picker:** Use native `<input type="date">` with custom trigger, or a full calendar component (e.g., `react-day-picker`)?
3. **Select Component:** Custom combobox (accessible, searchable) vs. styled native `<select>`? Custom is more accessible but more code.
4. **Toast Library:** Use `sonner` / `react-hot-toast` or build custom?
5. **Dark Mode:** Is dark mode required now, or only Glassmorphism light theme?
6. **Storybook:** Add Storybook for component documentation?
7. **Migration Strategy:** Big bang (all pages) or incremental per sprint?

---

## 7. Estimated Effort

| Phase | Effort (Days) | Risk |
|-------|---------------|------|
| 1. Tokens | 1 | Low |
| 2. Atoms (8 components) | 3 | Medium |
| 3. Molecules | 1 | Low |
| 4. Modal System | 2 | Medium (focus trap complexity) |
| 5. Feedback System | 1 | Low |
| 6. Validation Utils | 1 | Low |
| 7. Migration (15+ pages) | 5-7 | High (regression risk) |
| 8. Global Styles | 0.5 | Low |
| 9. Docs | 1 | Low |
| **Total** | **~16-18 days** | |

---

*Plan prepared per ui-ux-pro-max methodology. Ready for implementation upon approval.*
