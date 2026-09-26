# SCRIPT.md
# Planning AI Master Instruction
## One-Stop Government Opportunity Finder

## 1. ROLE

You are the **Planning AI / Product Architect** for a completely new project called **One-Stop Government Opportunity Finder**.

Your job is **NOT to build the application**.

Your job is to create the complete planning package that will later be given to a second AI, the **Implementation AI**, which will actually build the application from scratch.

Create exactly these four Markdown files:

- `implementation-plan.md`
- `structure.md`
- `architecture.md`
- `prompt.md`

Also place useful **Mermaid flowcharts directly inside the Markdown files** so the Implementation AI can understand the project visually as well as textually.

At the end, the planning package should look like:

```text
/
├── implementation-plan.md
├── structure.md
├── architecture.md
└── prompt.md
```

**Do not build the actual application. Do not generate application source code.**

---

## 2. PROJECT

The product combines:

1. Government Exam Finder
2. Government Scheme Finder

The core value is:

> **Reduce the amount of searching a person has to do to discover relevant government opportunities.**

### Government Exams / Recruitments

Plan support for information such as:

- Exam/recruitment name
- Conducting body
- Department/organization
- Education eligibility
- Age eligibility
- State/Central classification
- Application start/end dates
- Exam date
- Admit-card date
- Result/status
- Application fee
- Vacancy information where officially available
- Official notification
- Official application link
- Current status
- Days left to apply
- Last verified date

### Government Schemes

Plan support for:

- Scheme name
- Department/ministry
- Who can benefit
- Eligibility
- Benefits
- Required documents
- Application process
- Deadline where applicable
- State/Central classification
- Official guidelines
- Official application link
- Last verified date

---

## 3. PRODUCT DIRECTION

This must not become merely a static information directory.

A major future capability is:

### Find What I'm Eligible For

Example:

```text
Age: 21
State: Uttarakhand
Education: Graduate
Income: ₹3–5 lakh
Occupation: Student
```

The system should eventually identify potentially relevant opportunities.

For exams:

```text
Education: Graduate
Age: 21
State: Uttarakhand
```

→ show opportunities whose known basic eligibility criteria match.

**Important:** design for this capability, but keep it separate from the MVP unless the implementation plan explicitly makes a small foundational portion necessary.

---

## 4. UPCOMING / CLOSING-SOON EXPERIENCE

Plan a dashboard containing things such as:

```text
Applications Closing Soon

SSC ______       4 days left
UPSC ______     11 days left
Uttarakhand ___ 17 days left
```

and:

```text
Upcoming Exams

Exam A    23 days
Exam B    41 days
Exam C    58 days
```

The architecture must store authoritative dates and calculate values such as `days_left` dynamically rather than permanently storing countdown numbers.

---

## 5. OFFICIAL-SOURCE TRUST MODEL

Government information can change and incorrect dates or links can harm users.

The system must distinguish:

### Official Source
Government website, official notification, official guideline, or official application portal.

### Platform Summary
The site's simplified explanation.

### Apply
The official application portal.

### Last Verified
The most recent date/time the platform checked the relevant source.

The planning documents must define a source-verification strategy.

Do not make random coaching websites authoritative. Third-party sources may help discover information, but published facts should be based on authoritative government sources.

Never design the system around fabricated or guessed government facts.

---

## 6. MVP

Plan a deliberately small MVP:

- Approximately 20–30 major exams/recruitments.
- Approximately 20–30 government schemes.

Core MVP capabilities:

- Search
- Filtering
- Exam discovery
- Scheme discovery
- Opportunity detail pages
- Deadlines
- Days-left indicators
- Upcoming opportunities
- Closing-soon opportunities
- Official links
- Official notification/guideline links
- Last verified information
- Basic administration/data management

Do not turn the first version into an enormous data platform.

---

## 7. FUTURE PHASES

Separate MVP from future development.

Suggested roadmap:

```text
Phase 1: MVP
Phase 2: Personalized Eligibility Finder
Phase 3: Notifications / Reminders
Phase 4: State-wise Expansion
Phase 5+: Advanced Data Acquisition / Automation / Additional Intelligence
```

Refine the phases if necessary, but preserve a clear boundary between what is built now and what comes later.

---

## 8. GREENFIELD REQUIREMENT

Assume:

```text
No application code exists.
No database exists.
No backend exists.
No frontend exists.
No deployment exists.
No tests exist.
```

The Implementation AI will start from zero.

Therefore the planning package must cover:

- Repository setup
- Development environment
- Technology setup
- Database setup
- Application setup
- Testing setup
- Deployment setup

---

# 9. DOCUMENT: implementation-plan.md

This document answers:

> **WHAT needs to be built, and WHEN?**

Include:

### Project overview
- Purpose
- Target users
- Core value proposition
- MVP boundaries
- Future vision

### Feature inventory
Clearly separate MVP and future features.

### Phase-by-phase implementation

Create logical phases, for example:

```text
Phase 0: Project Initialization
Phase 1: Application Foundation
Phase 2: Database and Data Model
Phase 3: Initial Government Data
Phase 4: Backend / Service Layer
Phase 5: Public Frontend
Phase 6: Search and Filtering
Phase 7: Upcoming / Closing Soon
Phase 8: Admin / Data Management
Phase 9: Testing and Quality
Phase 10: Deployment / Production
```

For every phase provide:

- Goal
- Scope
- Tasks
- Dependencies
- Expected output
- Validation criteria
- Completion criteria
- Risks

### Milestone checklists

Use Markdown checkboxes.

### MVP completion checklist

Make it comprehensive.

### Future roadmap

Explicitly identify what should not be implemented yet.

### Flowcharts

Include Mermaid diagrams for:

- Overall project lifecycle
- MVP phase progression

Example:

```mermaid
flowchart TD
    A[Project Initialization] --> B[Foundation]
    B --> C[Database]
    C --> D[Initial Data]
    D --> E[Backend]
    E --> F[Frontend]
    F --> G[Search & Filters]
    G --> H[Upcoming Dashboard]
    H --> I[Admin]
    I --> J[Testing]
    J --> K[Deployment]
```

Make the actual diagram sufficiently detailed and consistent with the final plan.

---

# 10. DOCUMENT: structure.md

This document answers:

> **WHERE does everything belong?**

Define the complete project structure, including as appropriate:

- Root files/directories
- Application routes
- Components
- API routes
- Server code
- Domain/business logic
- Database
- Validation
- Authentication
- Admin
- Tests
- Utilities
- Types
- Configuration
- Public assets
- Documentation

Provide a representative directory tree.

For important directories explain:

- Purpose
- What belongs there
- What must not belong there
- Dependency rules

Define boundaries such as:

- UI must not directly query the database.
- Database access belongs in the server/data layer.
- Business rules should not be duplicated across pages.
- Validation should occur at appropriate trust boundaries.

### Flowchart

Include a Mermaid diagram showing the relationship between major directories/layers.

Example:

```mermaid
flowchart TD
    UI[Frontend UI] --> Routes[Routes / API]
    Routes --> Services[Domain Services]
    Services --> Repositories[Repositories]
    Repositories --> DB[(PostgreSQL)]
```

The final diagram must match the architecture.

---

# 11. DOCUMENT: architecture.md

This is the deepest technical document.

It answers:

> **HOW should the system work?**

Cover:

## Architecture style

Prefer a simple modular architecture appropriate for an MVP, likely a modular monolith.

Explain why.

Avoid unnecessary:

- Microservices
- Kubernetes
- Multiple databases
- Message queues
- Distributed infrastructure

The system should be realistic for a student-built product.

## Technology stack

Evaluate and define a practical baseline such as:

- Next.js
- TypeScript
- PostgreSQL
- Prisma
- Zod
- Tailwind CSS or another suitable styling system
- Authentication solution
- Testing framework
- Deployment platform

For each major technology explain:

- Why it is used
- What problem it solves
- Whether it is required or optional
- What should not be added yet

## System components

Define responsibilities and boundaries for:

- Public frontend
- Search/filter system
- Opportunity service
- Exam domain
- Scheme domain
- Date/status engine
- Source verification
- Admin
- Authentication
- Database
- Validation
- Testing
- Deployment

## Data model

Conceptually design entities such as:

```text
Exam / Recruitment
Scheme
Organization / Department
State
Source
Verification
Category
Eligibility Criteria
Application Period
```

Do not create needless tables. Normalize where useful.

For each major entity explain:

- Purpose
- Important fields
- Relationships
- Required/optional fields
- Indexing
- Data lifecycle
- Status/archive behavior

Include a Mermaid ER diagram:

```mermaid
erDiagram
    EXAM ||--o{ SOURCE : has
    SCHEME ||--o{ SOURCE : has
    ORGANIZATION ||--o{ EXAM : conducts
```

The actual diagram must match the proposed model.

## Data/request flow

Explain:

```text
User
 ↓
Frontend
 ↓
Validated request
 ↓
API / Route
 ↓
Domain Service
 ↓
Repository
 ↓
Database
 ↓
Response
 ↓
UI
```

Also define the admin flow:

```text
Admin
 ↓
Authentication
 ↓
Authorization
 ↓
Admin form
 ↓
Validation
 ↓
Service
 ↓
Database
 ↓
Verification / audit state
```

Create Mermaid flowcharts for these.

## Search

Define:

- Searchable fields
- Filters
- Sorting
- Pagination
- Empty states
- Invalid filters
- Ranking if necessary

Prefer a simple MVP approach. Do not introduce Elasticsearch/OpenSearch without a real requirement.

## Date/status architecture

Define:

- Application open
- Closing soon
- Closed
- Exam upcoming
- Exam completed
- Result announced where applicable
- Unknown/not announced

Explain timezone handling and dynamic date calculations.

## Source verification

Define:

- Official source
- Application URL
- Notification URL
- Source type
- Last verified timestamp
- Verification state
- Review workflow
- Conflicting information
- Expired URLs
- Changed dates

## Admin architecture

Plan:

- Authentication
- Authorization
- Roles if needed
- Exam management
- Scheme management
- Source management
- Verification
- Publish/unpublish
- Archive
- Validation
- Audit considerations

Avoid unnecessary role complexity for MVP.

## Security

Cover:

- Authentication
- Authorization
- Input validation
- Server-side validation
- Secrets
- Environment variables
- SQL injection protection
- XSS/CSRF considerations where relevant
- Rate limiting where appropriate
- Admin protection
- Secure deployment
- Dependency management

## Accessibility

Cover:

- Semantic HTML
- Keyboard navigation
- Focus states
- Labels
- Form errors
- Contrast
- Screen-reader support
- Responsive design

## SEO

Cover:

- Stable URLs/slugs
- Metadata
- Sitemap
- robots.txt
- Canonical URLs
- Structured data where useful
- Avoiding misleading government affiliation

## Testing

Define:

### Unit
Date calculations, status calculations, validation, search/filter logic, future eligibility rules.

### Integration
Database operations, API/service behavior, authentication/authorization.

### End-to-end
Search, filtering, details, official links, admin workflows.

## Deployment

Plan:

- Development
- Staging if useful
- Production
- Environment variables
- Database migrations
- Backups
- Logging
- Monitoring
- Health checks
- HTTPS
- Domain
- Rollback

Keep it practical.

## Required architecture diagrams

Include Mermaid diagrams for at least:

1. High-level architecture
2. Request/data flow
3. Database ER diagram
4. Admin flow
5. Public user flow
6. Source verification flow
7. Date/status flow

---

# 12. DOCUMENT: prompt.md

This is the operating manual for the **Implementation AI**.

It answers:

> **HOW MUST THE IMPLEMENTATION AI WORK?**

Explicitly establish:

```text
implementation-plan.md = WHAT / WHEN
structure.md            = WHERE
architecture.md         = HOW
prompt.md               = HOW THE IMPLEMENTATION AI MUST WORK
```

The Implementation AI must be told to:

### Read first

```text
Read implementation-plan.md
Read structure.md
Read architecture.md
Read prompt.md
Inspect repository
```

### Work from zero

Assume greenfield unless inspection proves otherwise.

### Work phase-by-phase

Never attempt the entire application in one uncontrolled generation.

### Validate everything

A feature is not complete merely because code exists or compilation succeeds.

### Never fabricate government information

This must be a strict rule.

### Preserve source verification

### Never silently change architecture

If a major architectural change is required, stop and explain.

### Avoid over-engineering

### Maintain progress

Track:

- Current phase
- Completed
- In progress
- Blocked
- Tests
- Next task

### Use Git

### Stop after MVP

Do not automatically implement future phases.

## Prompt flowchart

Include a Mermaid diagram showing:

```text
Read documents
→ inspect repository
→ identify phase
→ plan immediate change
→ implement
→ test
→ debug if necessary
→ validate against architecture
→ update progress
→ next phase
```

Make it detailed and include a testing loop.

---

# 13. CROSS-DOCUMENT CONSISTENCY

The four files are a single planning system.

They must not contradict one another.

For example, if `architecture.md` chooses:

```text
PostgreSQL + Prisma
```

then:

- `structure.md` must include the appropriate database/Prisma locations.
- `implementation-plan.md` must contain database implementation tasks.
- `prompt.md` must tell the Implementation AI to follow that architecture.

Each document should cross-reference the others where useful.

Do not duplicate everything.

Each file must have a clear responsibility.

---

# 14. MERMAID FLOWCHART REQUIREMENT

Flowcharts are mandatory, not decorative.

At minimum:

### implementation-plan.md
- Project lifecycle
- MVP implementation phases

### structure.md
- Directory/layer relationship

### architecture.md
- System architecture
- User flow
- Admin flow
- Data flow
- ER diagram
- Source verification
- Date/status flow

### prompt.md
- Implementation AI workflow
- Testing/phase-completion loop
- Overall relationship between the four documents

All Mermaid syntax must be valid.

Every diagram must match the surrounding written specification.

---

# 15. DO NOT WRITE THE APPLICATION

Your output is exactly:

```text
implementation-plan.md
structure.md
architecture.md
prompt.md
```

Do not produce:

- Frontend source code
- Backend source code
- Database implementation
- Application files
- Production deployment

You are designing the blueprint for another AI.

---

# 16. STUDENT-FRIENDLY ENGINEERING

The eventual developer is a student building this from scratch.

Therefore:

- Prefer understandable architecture.
- Explain important decisions.
- Avoid unnecessary infrastructure.
- Avoid enterprise-level complexity.
- Keep deployment achievable.
- Keep the MVP achievable.
- Make the project impressive through usefulness, not technical bloat.

---

# 17. FINAL QUALITY AUDIT

Before finishing, inspect all four files.

### implementation-plan.md
- Is it actionable?
- Are phases ordered?
- Are MVP and future work separated?
- Are completion criteria measurable?

### structure.md
- Can the Implementation AI understand where files belong?
- Are layer boundaries clear?
- Is it consistent with architecture?

### architecture.md
- Can the Implementation AI build the system without inventing major architecture?
- Is the data model clear?
- Are security, verification, testing and deployment covered?
- Do diagrams match the text?

### prompt.md
- Does it clearly control the Implementation AI's workflow?
- Does it enforce testing?
- Does it prohibit fabricated government data?
- Does it prevent silent architectural changes?
- Does it prevent uncontrolled scope expansion?

### Flowcharts
- Valid Mermaid syntax
- Useful
- Consistent with text
- Consistent across files

---

# 18. FINAL CROSS-DOCUMENT AUDIT

Check consistency for:

```text
Technology stack
Database
Architecture
Directory structure
Routes
API design
Data model
Authentication
Admin
Search
Filtering
Dates
Verification
Testing
Deployment
MVP scope
Future phases
```

If a contradiction exists:

1. Resolve it.
2. Update all affected files.
3. Re-check the entire set.

---

# 19. FINAL OUTPUT AND STOP CONDITION

When finished, create:

```text
implementation-plan.md
structure.md
architecture.md
prompt.md
```

Do not build the website.

Do not write application code.

Do not install a complete application stack.

Do not begin implementation.

The next AI will perform the implementation.

The goal of this task is to produce a planning package that allows another AI to move from:

```text
EMPTY REPOSITORY
```

to:

```text
WORKING MVP
```

without needing the original planning conversation.

---

# 20. MASTER RELATIONSHIP FLOWCHART

Include a final Mermaid diagram in `prompt.md` showing the relationship:

```mermaid
flowchart TD
    A[Project Idea]
    --> B[Planning AI]

    B --> C[implementation-plan.md]
    B --> D[structure.md]
    B --> E[architecture.md]
    B --> F[prompt.md]

    C --> G[Implementation AI]
    D --> G
    E --> G
    F --> G

    G --> H[Inspect Empty Repository]
    H --> I[Initialize Project]
    I --> J[Implement Phase by Phase]
    J --> K[Test and Validate]
    K --> L{MVP Complete?}

    L -- No --> J
    L -- Yes --> M[Working MVP]

    M --> N[Future Phase Authorization]
    N --> O[Eligibility]
    O --> P[Notifications]
    P --> Q[State Expansion]
```

The final diagram may be expanded to accurately represent the completed planning package.

**STOP after creating and validating the four Markdown files.**
