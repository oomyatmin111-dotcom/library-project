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

### Phase 2: Authentication, Authorization & User Profiles (In Progress)
- [ ] **JWT Authentication & Security**
  - [ ] Secure User Registration & Login with bcrypt password hashing
  - [ ] Refresh Token & Access Token rotation
  - [ ] Role-Based Access Control (RBAC) guards (`ADMIN`, `LIBRARIAN`, `MEMBER`)
- [ ] **User Profile & Personal Dashboard**
  - [ ] Reading history list & "Continue Reading" quick access
  - [ ] Active physical book loans and due dates tracking
  - [ ] User bookmarks and favorites list
  - [ ] Profile settings and password management

---

### Phase 3: Enhanced Digital Reader Experience (Upcoming)
- [ ] **Advanced Reader Capabilities**
  - [ ] Webtoon / Long-strip vertical scrolling mode
  - [ ] Double-page spread view for manga
  - [ ] Right-to-Left (RTL) reading mode support
  - [ ] Page caching and preloading for instant page flips
  - [ ] Reading brightness / dark mode / sepia tone controls
  - [ ] Zoom and pan gesture support for touch devices
- [ ] **Content Ingestion & Admin Management**
  - [ ] Bulk upload interface for comic chapters and images
  - [ ] PDF & EPUB parsing support for general ebooks
  - [ ] Cloud storage integration (S3 / Cloudinary / Supabase Storage)

---

### Phase 4: Physical Library Management Automation (Planned)
- [ ] **Circulation Desk Module**
  - [ ] Check-out / Check-in workflows for physical copies
  - [ ] Barcode / QR Code scanning integration (webcam & handheld scanner)
  - [ ] Automated due date calculation & return grace periods
- [ ] **Fines & Penalty Engine**
  - [ ] Automated daily overdue fine calculation
  - [ ] Fine payment processing and receipt generation
  - [ ] Fine waiver approvals for librarians
- [ ] **Reservation & Queue System**
  - [ ] Book reservation requests for checked-out titles
  - [ ] Automatic notification when a reserved copy becomes available

---

### Phase 5: Search, Discovery & Social Features (Future)
- [ ] **Advanced Search & Filtering**
  - [ ] Full-text search across titles, creators, authors, and descriptions
  - [ ] Multi-faceted filtering (Universe, Genre, Year, Status, Format)
- [ ] **Ratings & Reviews**
  - [ ] Community star ratings and text reviews
  - [ ] Spoiler tags and content warnings
- [ ] **Recommendations & Analytics**
  - [ ] "Readers also enjoyed" recommendation algorithm
  - [ ] Reading streak and activity statistics for members
  - [ ] Most borrowed books and popular comics analytics for librarians

---

### Phase 6: DevOps, Testing & Production Deployment (Future)
- [ ] **Automated Testing**
  - [ ] Comprehensive unit tests for NestJS services and controllers (Vitest)
  - [ ] Angular component and service testing
  - [ ] End-to-end (E2E) integration test suite
- [ ] **CI/CD Pipeline**
  - [ ] GitHub Actions for linting, testing, and build validation
  - [ ] Automated staging deployments
- [ ] **Containerization & Cloud Hosting**
  - [ ] Docker & Docker Compose setup (Backend, Frontend, MySQL)
  - [ ] Production deployment guide (VPS / Cloud Container platforms)
  - [ ] Database backup automation and monitoring

---

## Release Milestones

| Version | Milestone | Target |
|---|---|---|
| **v0.1.0** | Core Foundation & Reader Prototype | Completed [x] |
| **v0.2.0** | Authentication, RBAC & Member Dashboard | Q2 2026 |
| **v0.3.0** | Full Circulation Desk & Barcode Scanning | Q3 2026 |
| **v0.4.0** | Enhanced Reader Modes & Content Uploader | Q4 2026 |
| **v1.0.0** | Production-ready Library & Comic Platform | 2027 |

---

## Contributing & Feedback
Contributions, feature suggestions, and pull requests are warmly welcome! Please submit an issue to discuss new features or ideas.
