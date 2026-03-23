# Dashboard Design: Shared vs Previous Approach

## 1. Shared file – future conflict or performance impact?

### Conflicts
- **No.** Angular uses **view encapsulation**: each component’s styles (including anything pulled in via `@use 'dashboard-redesign.scss'`) are scoped to that component’s template.
- Selectors like `.dashboard-page .metric-card` only apply inside the component that imports the file (e.g. admin dashboard). They do not affect other routes or components.
- The only way “shared” styling applies elsewhere is if another component explicitly `@use`s the same file. So there is no accidental conflict.

### Performance
- **Small duplication cost:** Each of the 4 dashboards does `@use '../../config/dashboard-redesign.scss'`, so the **full** content of that file is compiled **once per component**. So the built CSS contains the same block of rules 4 times (once for admin, doctor, patient, analytics).
- In addition, the shared file defines all four variants (e.g. `.dashboard-page--admin`, `--doctor`, `--patient`, `--analytics`). Each dashboard only uses one variant, but gets all four in its chunk. So there is a bit of unused CSS per chunk.
- In practice this is a small amount of CSS; impact on load time or runtime is negligible. No meaningful performance degradation for normal use.

**Summary:** No future conflict from the shared file. Minor CSS duplication (and a tiny bit of dead code per chunk), but no significant performance degradation.

---

## 2. What was the previous design approach?

The **previous** design (before the New-Dashboards redesign) used a **per-dashboard, self-contained** approach:

- **No shared dashboard SCSS.** Each dashboard had its own `.scss` file with **all** styles defined locally:
  - `admin/dashboard/dashboard.scss` – page header, metric cards, section cards, quick links, action cards, animations, responsive rules.
  - `doctor-portal/dashboard/dashboard.scss` – same kinds of rules, tailored for the doctor dashboard.
  - `patient-portal/dashboard/dashboard.scss` – same idea, plus activity list, prescription list, skeleton.
- **No `@use` of a common dashboard design file.** Any reuse was by copy-paste or similar class names, not by a shared partial.
- **Result:** Each dashboard was independent; changing one did not touch the others. Downside: any design change (e.g. card radius, shadows, colors) had to be repeated in several files.

So the **previous approach** = **one SCSS file per dashboard, no shared design-system file.**

---

## 3. What if we use the same approach as previous?

Using the **same approach as previous** would mean:

1. **Remove** the shared file `src/app/config/dashboard-redesign.scss` (or stop using it for dashboards).
2. **Copy** the redesign styles into each dashboard’s own `.scss`:
   - Admin: only the styles (and variants) the admin dashboard needs.
   - Doctor: only what the doctor dashboard needs.
   - Patient: only what the patient dashboard needs.
   - Analytics: only what the analytics page needs.

### Comparison

| Aspect | Current (shared file) | Previous approach (no shared file) |
|--------|------------------------|-------------------------------------|
| **Conflict risk** | None (encapsulation) | None |
| **CSS size** | 4 × full shared file (includes all 4 variants in each chunk) | 4 × only what each dashboard needs (no unused variants) – slightly smaller |
| **Maintenance** | One place to change tokens/cards; all dashboards stay in sync | Change in 4 places for a global design tweak |
| **Coupling** | Dashboards depend on one config file | Each dashboard is self-contained |
| **Future changes** | Add a new dashboard → `@use` same file and use same classes | Add a new dashboard → copy or adapt one of the existing dashboard SCSS files |

### When to use which

- **Keep shared file** if you want one design system for all dashboards and are fine with a small amount of duplicated (and per-chunk slightly redundant) CSS.
- **Switch back to previous approach** if you prefer no shared dependency, smaller per-chunk CSS, and are okay maintaining the same visual rules in multiple files (or in a few copied blocks).

If you want to move back to the previous approach, the refactor is: for each of the four dashboards, replace `@use '...dashboard-redesign.scss'` with an inlined, trimmed copy of only the rules that dashboard uses (and remove the shared file from use).
