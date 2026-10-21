# Praxis showcase site: brief

A 3D-heavy marketing and showcase site for **Praxis**, built from what the
product actually does (praxis-core, praxis-pba, praxis-PE). Nothing on the site
may claim a feature the repos don't have.

## Audience
1. **Hiring teams** at client companies (primary): heads of engineering,
   recruiters, talent leads.
2. Candidates, who should see a fair, modern assessment.

## One-line idea
**Hire on proof, not promises.** "Praxis" means practice, and the mark is
theory ∩ practice: an outlined square (theory, the CV) overlapping a solid
square (practice, the work), with the overlap in orange.

## Brand (from packages/ui)
- Colours: black `#000000`, white `#FFFFFF`, Fire Orange `#FF3001` (accent,
  about 20% of the interface). Neutrals `#121212` / `#1f1f1f` / `#5c5c5c` / `#9a9a9a`.
- Wordmark: "Praxis" + orange period, Inter 800, tight tracking.
- Mark (`packages/ui/src/mark.tsx`, 64 grid): outline square 3..37 (stroke 6),
  solid square 24..64, orange square 17..38.
- Mono: JetBrains Mono.

## Real product facts to show
**How it works**
- A company sets up a **campaign** for an assessment; candidates get an
  invitation with an access code, or join through an **open link**.
- **Project-based (PBA engine):** the candidate builds a real project in a cloud
  IDE (editor, terminal, live preview of their app) inside an isolated
  sandbox, with an optional AI assistant setting. The server owns the timer
  (e.g. 90 min); work saves as you type; self-check tests can be run; when time
  runs out, the work is submitted.
- **Grading:** hidden tests run in a fresh sandbox on the candidate's source
  only. Every test is evidence for a skill → a **skill profile** with bands
  (basic / intermediate / advanced), overall score, pass mark,
  recommendation (shortlist / review / reject). Infrastructure failures are
  never scored as zero.
- **Prompt engineering (PE engine):** the candidate writes a system and user
  prompt, runs them on sample inputs through real models, submits; graded on
  **hidden cases** for correctness, answer quality and **cost** against a
  reference prompt; deterministic checks first, a grader model for the rest,
  repeated runs to measure consistency.
- **14 stacks:** React + Vite, Vue + Vite, Angular, Next.js, HTML/CSS/JS,
  Node.js + Express, TypeScript + Node.js, Python, Python + FastAPI,
  Django REST, Python AI (RAG, LangChain, LangGraph), Go + Gin,
  Java + Spring Boot, .NET (C#).
- **Skill library:** frontend `fe.*` and backend `be.*` skills mean the same in
  every report, across stacks.

**Trust**
- **Integrity signals:** time away from the tab, leaving full screen, pastes,
  warnings; rules can warn or auto-submit. "Signals, not verdicts."
- **Release control:** Praxis reviews every result and releases it; only then
  does the client see it. Share links die when a result is withdrawn.
- Tenant isolation enforced by the database (row-level security); every
  sensitive action audited.

**For hiring teams**
- Report: score, skills, every test and why it passed or failed, PDF, the
  candidate's code as a zip.
- Dashboards, filters, saved views, CSV exports.
- **Integrations:** API keys, orders, signed webhooks, **Greenhouse**
  assessment partner.

## Sections (draft)
1. Hero: the mark as a monumental 3D object. "Hire on proof."
2. Noise → signal: CVs dissolve; one block of real work remains.
3. The attempt: a 3D Praxis IDE; code, preview, tests going green.
4. The grade: tests become a skill constellation; the report unfolds.
5. Engines: project-based and prompt engineering, plugging into core.
6. Trust: integrity signals, release control, audit.
7. For hiring teams: report, pipeline, Greenhouse/ATS.
8. CTA: book a demo / see a sample report.
