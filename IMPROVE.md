# IMPROVE.md — Continuous Improvement Loop
## Paste this into Claude Code when you want it to stay busy doing useful work autonomously

```
Run a continuous improvement loop on this project. Work through EVERY phase below in order. Do not skip anything. Do not summarize what you "would do" — actually do it. After each phase, show me what you did and what you found.

## PHASE 1: SCAN (10 min)
Read every file in the project. Build a mental map. Then create IMPROVEMENT_REPORT.md with:

### Code Issues Found
For each issue: file, line, what's wrong, severity (critical/medium/low)
- Security vulnerabilities (hardcoded secrets, missing input validation, unprotected routes, XSS/CSRF/injection risks)
- Bugs (logic errors, off-by-one, null/undefined access, race conditions, unhandled promise rejections)
- Performance problems (unnecessary re-renders, missing caching, N+1 queries, large bundle imports, unoptimized images)
- Missing error handling (try/catch gaps, no user-facing error messages, API failures not caught)
- Type safety issues (any types, missing interfaces, loose typing)
- Dead code (unused imports, unreachable code, commented-out blocks, unused variables)
- Accessibility issues (missing alt text, no aria labels, poor contrast, no keyboard navigation)

### Missing Tests
List every function, endpoint, and component that has NO test coverage.

### Missing Features (from STATUS.md or session prompts)
List anything that was supposed to be built but isn't done or is half-done.

### Polish Gaps
- Placeholder text still in the UI ("Lorem ipsum", "TODO", "Coming soon")
- Inconsistent spacing, fonts, or colors
- Missing loading states, empty states, or error states
- Broken responsive layouts at 375px

### Suggested New Features
Based on the project type and what's already built, suggest 5-10 features that would add value. For each: name, one-line description, estimated effort (small/medium/large), impact on users (low/medium/high). Prioritize by impact/effort ratio.

Save IMPROVEMENT_REPORT.md to the project root.

## PHASE 2: FIX CRITICAL ISSUES (20 min)
Go through every CRITICAL issue from Phase 1 and fix it:
- Fix security vulnerabilities immediately
- Fix bugs that would break the user experience
- Add missing error handling on critical paths (auth, payments, data submission)
- Add input validation where missing

After each fix: run the app and verify the fix works. Show me the before/after.

## PHASE 3: ADD MISSING TESTS (20 min)
For every untested function, endpoint, and component found in Phase 1:
- Write unit tests (vitest for frontend, pytest for Python)
- Write integration tests for API endpoints
- Write edge case tests (empty input, huge input, invalid input, network failure)
- Run ALL tests
- Fix any failures
- Show final test count and pass rate

## PHASE 4: FIX MEDIUM ISSUES (15 min)
Go through every MEDIUM issue from Phase 1:
- Fix performance problems
- Replace `any` types with proper types
- Remove dead code
- Fix accessibility issues
- Add missing loading/empty/error states

After each fix: verify the app still works.

## PHASE 5: POLISH (15 min)
- Remove all placeholder text — replace with real content
- Fix any responsive layout issues at 375px, 768px, 1440px
- Ensure dark/light mode is consistent (if applicable)
- Verify all hover states, focus states, and transitions work
- Run Lighthouse audit — aim for 90+ on all four scores
- Fix anything Lighthouse flags

## PHASE 6: DOCUMENTATION (10 min)
- Update README.md with current project state
- Add/update JSDoc or docstrings on any undocumented functions
- Update ARCHITECTURE.md if the structure has changed
- Generate/update API documentation if endpoints exist
- Create or update .env.example with all required variables

## PHASE 7: SKELETON NEW FEATURES (20 min)
From the "Suggested New Features" list in Phase 1, take the top 3 highest-impact features and for each one:

1. Create a detailed spec file: /specs/FEATURE_NAME.md
   - Feature name and description
   - User story: "As a [user], I want [action] so that [benefit]"
   - Acceptance criteria (5-10 testable requirements)
   - Technical design: new files needed, database changes, API endpoints, components
   - Edge cases to handle
   - Estimated sessions needed

2. Create skeleton code:
   - Create the file structure (empty files with TODO comments explaining what goes where)
   - Create database migration/schema additions (commented out, ready to uncomment)
   - Create API route stubs with input/output types defined but logic as TODO
   - Create component shells with props interfaces defined but UI as TODO
   - Create test file stubs with test names but empty test bodies

3. The skeleton should be complete enough that a future Claude Code session can say "implement the skeleton for [FEATURE_NAME]" and have everything it needs.

## PHASE 8: FINAL REPORT
Update IMPROVEMENT_REPORT.md with:
- Total issues found: [X] critical, [X] medium, [X] low
- Issues fixed: [X] critical, [X] medium
- Tests added: [X] new tests, [X] total, [X]% pass rate
- Files modified: [X]
- Lines added/removed: [+X / -X]
- Lighthouse scores: Performance [X], Accessibility [X], Best Practices [X], SEO [X]
- New feature specs created: [list]
- Skeleton code created for: [list]
- Remaining issues for next session: [list]

Update STATUS.md with what was done this session.

This entire loop should take 90-120 minutes of autonomous work. Do not stop early. If you finish a phase quickly, be more thorough — look harder for issues, write more tests, create more detailed specs.
```

---

# HOW TO USE THIS

## Option 1: Run on One Project
Open Claude Code in a project directory, paste the prompt above. Walk away for 90 minutes. Come back to a cleaner, better-tested, more documented project with specs for new features ready to build.

## Option 2: Run on Multiple Projects in Parallel
Open 3-4 VS Code terminals, one per project. Paste the same prompt in each. All four projects get improved simultaneously while you do something else.

## Option 3: Nightly Improvement Run
At the end of each day, after your "building" sessions are done, paste this into whichever project you worked on that day. It cleans up after the build session — catches bugs, adds tests, fixes polish issues.

## Option 4: The "Keep Busy" Schedule
If you want Claude Code running continuously throughout the day:

Morning: Building sessions (session prompts from project plans)
Afternoon: Improvement loops on completed sessions
Evening: Skeleton/spec generation for tomorrow's build sessions

---

# QUICK VARIANTS

## Quick Fix Only (30 min) — when you just want bugs fixed
```
Run Phase 1 and Phase 2 only from IMPROVE.md. Scan the project, find all issues, fix everything critical and medium severity. Run tests after each fix. Show me the final report.
```

## Tests Only (30 min) — when you want better coverage
```
Run Phase 1 (scan only for missing tests) and Phase 3 from IMPROVE.md. Find every untested function, endpoint, and component. Write comprehensive tests including edge cases. Run all tests. Fix failures. Show final pass rate and coverage.
```

## Spec Only (30 min) — when you want ideas and planning
```
Run Phase 1 (scan only for suggested features) and Phase 7 from IMPROVE.md. Analyze the project, suggest 10 high-impact features, create detailed specs and skeleton code for the top 5. Save everything to /specs directory.
```

## Full Audit + Report (20 min) — when you want a status check without changes
```
Run Phase 1 only from IMPROVE.md but make it extremely thorough. Check every file, every function, every component. Generate a comprehensive IMPROVEMENT_REPORT.md but DO NOT make any changes. I want to review the report first before you fix anything.
```

## Polish Only (30 min) — before showing a client
```
Run Phase 5 only from IMPROVE.md. Go through every page, fix every visual issue, remove all placeholder text, ensure responsive layouts work, run Lighthouse, fix everything it flags. The site needs to look perfect for a client demo.
```
