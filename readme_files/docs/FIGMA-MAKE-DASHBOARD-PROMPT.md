# Figma Make Prompt: Medrotic Dashboard Redesign

**Use this entire document (or the "Figma Make Prompt" section below) as your prompt in Figma Make.**  
The design must stay **functionally identical** to the current Medrotic dashboards: same sections, same data fields, same actions and links. Only the visual design is being redesigned.

---

## Project context: Medrotic

Medrotic is a **healthcare management platform** (Angular app) with three user roles and four dashboard-style screens:

1. **Admin Dashboard** — system overview and management shortcuts  
2. **Doctor Portal Dashboard** — practice metrics, patients, uploads, quick actions  
3. **Patient Portal Dashboard** — health summary, vitals, activity, prescriptions  
4. **Admin Analytics & Reports** — KPIs and growth charts (Patient Growth, Doctor Growth)

**Design constraints (do not change):**
- All existing sections, cards, tables, lists, and buttons must remain so the Angular app can bind the same data and routes.
- Navigation targets (e.g. `/admin/manage-doctors`, `/doctor-portal/register-patient`, `/patient-portal/add-metrics`) must be represented as clickable areas (buttons/links) with the same labels.
- No new sections or removal of sections — only layout and visual treatment can change.

---

## Figma Make Prompt (copy from here)

**Task:** Redesign all Medrotic dashboards and the Analytics page in Figma with a **modern, minimalistic, seamless** look. Cards and graphs should feel **premium and “mind-blowing”** — clear hierarchy, refined typography, subtle depth, and polished data visualization. The result will be implemented in an Angular app, so keep structure and content identical; only improve visuals and layout.

**Design direction:**
- **Style:** Modern, minimal, seamless. Plenty of whitespace, clear hierarchy, no visual clutter. Soft shadows, subtle borders or none, rounded corners (e.g. 12–20px). Optional very subtle gradients or glassmorphism only where it adds clarity.
- **Typography:** Strong, readable hierarchy. Distinct display/numbers for key metrics; clean sans-serif for labels and body. Slight letter-spacing and line-height for a premium feel.
- **Cards:** Each card should feel like a focused “module”: clear title, optional small icon, content area, and primary action when applicable. Use consistent padding, radius, and hover states. Consider soft hover lift and shadow.
- **Charts/Graphs:** “Mind-blowing” but still minimal. Clean axes, readable labels, limited palette (2–4 colors). Prefer: line/area charts for trends, bar charts for comparisons. Smooth curves, subtle grid, no chartjunk. Leave space for dynamic data (month labels, counts, percentages).
- **Color:** Align with Medrotic branding where possible: primary blue **#3461ff**, dark text **#001047**, success green **#10b981**, warning **#f59e0b**, danger/alert **#ef4444**. Use neutrals (e.g. #f5f6f9, #e8eaf0) for backgrounds and borders. Keep contrast accessible.
- **Responsiveness:** Design for desktop first (e.g. 1440px); ensure layout can scale to tablet (e.g. 2-column) and mobile (stacked cards, collapsible tables) without losing structure.

---

### 1. Admin Dashboard

**Purpose:** Welcome message, system metrics, quick links to management sections, and action cards for pending work and system status.

**Required elements (keep all; only restyle):**

- **Page header**
  - Title: “Welcome, [Admin Name]!” (dynamic name)
  - Subtitle: “Overview of system metrics and quick access to management sections”
  - Logout button (icon + “Logout” text)

- **Key metrics row (4 cards, same order)**
  - Total Patients (number)
  - Total Doctors (number)
  - Total Users (number)
  - Active Appointments (number)  
  Each card: icon (patients / doctors / users / appointments), large number, short label. Use distinct accent colors per metric (e.g. blue, green, amber, red).

- **Quick Links section**
  - Section title: “Quick Links”
  - Grid of 8 link cards, each with: icon, title, “X items” count. Links:
    1. Manage Doctors  
    2. Manage Patients  
    3. User Verification  
    4. System Health  
    5. Integrations  
    6. Repository  
    7. Analytics  
    8. Notifications  

- **Action cards row (3 cards)**
  1. **Pending Verifications** — numeric value “Users awaiting verification approval”, primary button “Review Now” → `/admin/user-verification`  
  2. **System Health** — status badge “All Systems Operational” (green), short description, secondary button “View Details” → `/admin/system-health`  
  3. **Analytics & Reports** — numeric value “Total system users”, secondary button “View Analytics” → `/admin/analytics`  

Design these as distinct, scannable cards with clear CTAs. Metrics and action cards should feel “mind-blowing” in clarity and visual weight.

---

### 2. Doctor Portal Dashboard

**Purpose:** Welcome, practice metrics, quick actions (register patient, messages, uploads), assigned patients table, recent uploads list, recent patients table, and quick links sidebar.

**Required elements (keep all; only restyle):**

- **Page header**
  - Title: “Welcome, Dr. [Doctor Name]!”
  - Subtitle: “Overview of your patients and practice metrics”
  - Logout button (icon + “Logout”)

- **Key metrics row (4 cards)**
  - Total Patients  
  - Active Patients  
  - Prescriptions  
  - X-Rays  
  Same pattern: icon, number, label; distinct accent colors.

- **Quick actions (3 cards)**
  1. **Register Patient** — short description “Add a new patient to your practice”, button “Register Now” → `/doctor-portal/register-patient`  
  2. **Messages** — numeric value (e.g. unread count), “Unread messages from patients”, button “View Messages” → `/doctor-portal/secure-communication`  
  3. **Upload Documents** — “Upload prescriptions or X-rays”, two buttons: “Prescription”, “X-Ray” → respective upload routes  

- **Two-column content**
  - **Left: Assigned Patients**
    - Section title: “Assigned Patients (count)”
    - Table: columns **Name**, **CNIC**, **Phone**, **Actions** (e.g. “View” link per row)
    - Footer: “View All Patients” → `/doctor-portal/patient-management`
  - **Right: Recent Uploads**
    - Section title: “Recent Uploads”
    - List items: type badge (prescription / xray), title, “Patient ID: …”, date (short format)
    - Empty state: “No recent uploads”

- **Second row**
  - **Left (wider): Recent Patients**
    - Section title: “Recent Patients”
    - Table: **Name**, **CNIC**, **Phone**, **Last Visit**, **Actions** (View)
  - **Right (narrower): Quick Links**
    - Section title: “Quick Links”
    - Vertical list of links with icons: Patient Management, Secure Communication, Document Storage, Notifications (same routes as in app)

Tables and lists should feel clean and minimal; use subtle row hovers and clear typography. Cards and numbers should stand out.

---

### 3. Patient Portal Dashboard

**Purpose:** Welcome, health summary (vitals), quick actions (add metrics, AI chatbot, find doctor), recent activity list, and recent prescriptions list.

**Required elements (keep all; only restyle):**

- **Page header**
  - Title: “Welcome, [Patient Name]!”
  - Subtitle: “Overview of your health summary and recent activity”
  - Logout button (icon + “Logout”)

- **Health summary (4 metric cards)**
  - Blood Pressure (value + “mmHg”)  
  - Heart Rate (value + “bpm”)  
  - Temperature (value + “°F”)  
  - Weight (value + “kg”)  
  Support a loading state (skeleton) for these four cards. Icons and accent colors per metric.

- **Quick actions (3 cards)**
  1. **Add Health Metrics** — “Record your vitals and health data”, button “Add Metrics” → `/patient-portal/add-metrics`  
  2. **AI Health Chatbot** — “Ask health-related questions”, button “Chat Now” → `/patient-portal/ai-chatbot`  
  3. **Find a Doctor** — “Search for doctors by specialty”, button “Search Doctors” → `/patient-portal/doctor-search`  

- **Two-column content**
  - **Left: Recent Activity**
    - Section title: “Recent Activity”, link “View All” → `/patient-portal/view-medical-history`
    - List: each item has icon (by type), title, date (short). Empty state: “No recent activity”
  - **Right: Recent Prescriptions**
    - Section title: “Recent Prescriptions”, link “View All” → `/patient-portal/view-prescriptions`
    - List: doctor name, date, “X medications” per item. Empty state: “No prescriptions yet”

Keep health numbers prominent and readable; activity and prescriptions should feel like a clean, minimal feed.

---

### 4. Admin Analytics & Reports page

**Purpose:** KPI summary and two growth charts (Patient Growth, Doctor Growth). Same data structure as the app; only the chart visuals are designed.

**Required elements (keep all; only restyle):**

- **Page header**
  - Title: “Analytics & Reports”
  - Subtitle: “Real-time charts and graphs for patients, doctors counts, and KPIs”

- **KPI row (4 cards)**
  - Total Patients (number)  
  - Total Doctors (number)  
  - Avg Response Time (value + “ms”)  
  - System Uptime (value + “%”)  
  Icons and colors per KPI; same card style as other dashboards.

- **Charts row (2 charts)**
  1. **Patient Growth** — chart title “Patient Growth”. Design a minimal, “mind-blowing” chart area: e.g. line or bar chart with months on X-axis and count on Y-axis. Show 6–12 data points (month labels + counts). Clean grid, 2–3 colors max.  
  2. **Doctor Growth** — chart title “Doctor Growth”. Same style: months, counts, minimal and premium.  

Design chart containers so they can later be filled with real data (Chart.js or similar) without changing layout. Include axis labels, legend if needed, and optional tooltip area.

---

## Deliverables

- **Frames/screens:** One frame per screen: Admin Dashboard, Doctor Dashboard, Patient Dashboard, Admin Analytics.
- **Components:** Reusable card components for metric cards, action cards, section cards, and chart containers so the four screens feel consistent.
- **States:** Normal and hover for cards and buttons; optional loading/skeleton for Patient health metrics.
- **Specs:** Clear spacing, font sizes, and colors (use Medrotic palette above) so the design can be implemented in Angular without changing functionality.

**Important:** Do not add or remove sections, links, or data fields. All routes and labels must match the Medrotic app so the next step — placing these designs in the project folder and integrating them into Angular — does not break functionality.

---

## Next step (after Figma design)

Once the Figma designs are exported or placed in this project folder, the implementation step will:

- Map each Figma screen to the corresponding Angular dashboard/analytics component.
- Convert layout and styles to Angular templates (HTML) and SCSS (or CSS), preserving all bindings (e.g. `{{ currentUser?.name }}`, `*ngFor`, `routerLink`).
- If Figma outputs non-Angular code (e.g. React or plain HTML/CSS), translate it to Angular and keep the same structure and class names where helpful.
- Ensure responsiveness and accessibility are preserved.

Keep this document in the repo so designers and developers stay aligned on structure and functionality.
