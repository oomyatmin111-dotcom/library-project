# Project Roadmap — Library & Digital Comic Reader Platform

An all-in-one modern platform combining physical library management (books, borrowing, fines, inventory) with an immersive digital comic, manga, and ebook reading experience.

---

## Architecture & Tech Stack

- **Frontend:** Angular 19+ (Standalone Components, Modern Reactive Signals, Responsive UI)
- **Backend:** NestJS 11+ (TypeScript, Modular Architecture, REST APIs)
- **Database:** MySQL 8.0+ (Relational schema for library management & comic reader)
- **Tools & Setup:** Python 3 (DB initialization & seed scripts), Git

---

## Development Phases

### Phase 1: Foundation & Core System (Completed [x])
- [x] **Database Design & Architecture**
  - [x] Schema for physical library (Users, Roles, Authors, Publishers, Books, Copies, Borrowings, Fines, Reservations)
  - [x] Schema for digital comics (Universes, Comics, Categories, Issues, Issue Pages, Reading Progress, Reading History)
  - [x] Python database migration & sample seed scripts (`schema.sql`, `seed.sql`, `setup_comics_db.py`)
- [x] **Backend API (NestJS)**
  - [x] Comic Catalog & Universe APIs
  - [x] Issue & Page navigation endpoints
  - [x] Reading Progress & History tracking endpoints
  - [x] Admin management endpoints
  - [x] Project environment & configuration setup
- [x] **Frontend Core (Angular)**
  - [x] Landing Page with hero showcase and categories
  - [x] Comic Library & catalog browser with filters
  - [x] Comic Details page (Issues list, metadata, reading status)
  - [x] Immersive Comic Reader UI (single page, multi-page, fullscreen)
  - [x] Admin dashboard skeleton
- [x] **Repository Governance**
  - [x] Clean `.gitignore` configuration for NestJS, Angular, Python & environment secrets
  - [x] Sanitized Git commit history and remote sync

---

### Phase 2: Authentication, Authorization & User Profiles (Completed [x])
- [x] **JWT Authentication & Security**
  - [x] Secure User Registration & Login with bcrypt password hashing
  - [x] Refresh Token & Access Token rotation
  - [x] Role-Based Access Control (RBAC) guards (`ADMIN`, `LIBRARIAN`, `MEMBER`)
- [x] **User Profile & Personal Dashboard**
  - [x] Reading history list & "Continue Reading" quick access
  - [x] Active physical book loans and due dates tracking
  - [x] User bookmarks and favorites list
  - [x] Profile settings and password management

---

### Phase 3: Enhanced Digital Reader Experience (Completed [x])
- [x] **Advanced Reader Capabilities**
  - [x] Webtoon / Long-strip vertical scrolling mode
  - [x] Double-page spread view for manga
  - [x] Right-to-Left (RTL) reading mode support
  - [x] Page caching and preloading for instant page flips
  - [x] Reading brightness / dark mode / sepia tone controls
  - [x] Zoom and keyboard navigation controls
- [x] **Content Ingestion & Admin Management**
  - [x] Bulk upload interface for comic chapters and images
  - [x] Ingestion batch transaction API endpoint (`POST /issues/bulk`)
  - [x] Live thumbnail sequence preview and chapter creator

---

### Phase 4: Physical Library Management Automation (Completed [x])
- [x] **Circulation Desk Module**
  - [x] Check-out / Check-in workflows for physical copies
  - [x] Barcode scanning simulation and rapid input terminals
  - [x] Automated due date calculation & return grace periods
- [x] **Fines & Penalty Engine**
  - [x] Automated daily overdue fine calculation ($0.50/day)
  - [x] Fine payment processing and receipt status tracking
  - [x] Fine waiver approvals for librarians with audit notes
- [x] **Reservation & Queue System**
  - [x] Book reservation requests and queue for checked-out titles
  - [x] Automatic fulfillment and copy reservation when returned

---

### Phase 5: Search, Discovery & Social Features (Completed [x])
- [x] **Advanced Search & Filtering**
  - [x] Full-text search across titles, creators, authors, and descriptions
  - [x] Multi-faceted filtering (Universe, Genre, Year, Status, Format)
  - [x] Instant search debouncing and sort options (views, newest, title)
- [x] **Ratings & Reviews**
  - [x] Community star ratings (1-5 stars) and text reviews
  - [x] Rating breakdown and distribution bars
  - [x] Spoiler tags with interactive blur-to-reveal shield
- [x] **Recommendations & Analytics**
  - [x] "Readers also enjoyed" recommendation algorithm
  - [x] Dynamic suggestions based on universe and reading overlap

---

### Phase 6: DevOps, Testing & Production Deployment (Completed [x])
- [x] **Automated Testing**
  - [x] Comprehensive unit tests for NestJS services and controllers (Vitest)
  - [x] CirculationService test suite (loan limits, fine calculation, checkin flow)
  - [x] Production build verification for Angular and NestJS
- [x] **CI/CD Pipeline**
  - [x] GitHub Actions automated workflow for testing and build verification (`.github/workflows/ci.yml`)
- [x] **Containerization & Cloud Hosting**
  - [x] Multi-stage Dockerfile for NestJS backend
  - [x] Multi-stage Dockerfile for Angular frontend with Nginx reverse proxy
  - [x] Production `docker-compose.yml` orchestrating MySQL 8, Backend, and Frontend

---

### Phase 7: Advanced Digital Reader 2.0, Interactive Annotations & Offline PWA (Completed [x])
- [x] **Interactive Reader Annotations & Page Bookmarks**
  - [x] Backend `annotations` entity, repository, and REST API (`/api/annotations`)
  - [x] In-reader "Bookmark Page & Note" dialog with customizable color pins
  - [x] Interactive Bookmarks Drawer for jumping straight to tagged comic panels
  - [x] Margin sticky note pins rendered directly on active comic pages
- [x] **Offline Download & Cache Engine**
  - [x] Client-side `IndexedDB` storage service (`ComicReaderOfflineDB`)
  - [x] "Download Offline" one-click action to save full chapters locally
  - [x] Seamless fallback to offline cache when network connection is absent
- [x] **Reading Streaks & Gamification Badges**
  - [x] Reading activity and streak tracking (`🔥 5 Days Active Streak`)
  - [x] Member profile achievement badges gallery (First Read, Streak Master, Scholar, etc.)

---

### Phase 8: In-App Notifications Center, Analytics Dashboard & Multi-Language Support (Completed [x])
- [x] **In-App Notification Center**
  - [x] Backend `notifications` module and automated loan due date alerts
  - [x] Reactive bell icon in navbar with dynamic unread count badge
  - [x] Notification dropdown with read/unread indicators, direct routing links, and mark all read
- [x] **Executive Analytics Dashboard & CSV Export**
  - [x] Real-time executive KPIs in Admin Portal (loan velocity, fine collections vs waivers)
  - [x] Top 5 most borrowed physical books & most read digital comics
  - [x] One-click circulation report export in standard CSV format (`/api/admin/circulation/export-csv`)
- [x] **Bilingual Localization (i18n)**
  - [x] English & Myanmar (မြန်မာဘာသာ) translation dictionary and reactive translation service
  - [x] Persistent language toggle switch (`EN` / `မြန်မာ`) in the top navigation bar

---

## Release Milestones

| Version | Milestone | Target |
|---|---|---|
| **v0.1.0** | Core Foundation & Reader Prototype | Completed [x] |
| **v0.2.0** | Authentication, RBAC & Member Dashboard | Completed [x] |
| **v0.3.0** | Full Circulation Desk & Barcode Scanning | Completed [x] |
| **v0.4.0** | Enhanced Reader Modes & Content Uploader | Completed [x] |
| **v1.0.0** | Production-ready Library & Comic Platform | Completed [x] |
| **v1.1.0** | Offline Reader, Annotations, Notifications & Analytics | Completed [x] |

---

## Contributing & Feedback
Contributions, feature suggestions, and pull requests are warmly welcome! Please submit an issue to discuss new features or ideas.

