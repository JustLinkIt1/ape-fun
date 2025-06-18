# Codex Agent Instructions

This repository contains a Solana memecoin launchpad with a Next.js frontend.
Follow these guidelines when modifying code.

## Development Guidelines
- Refer to `IMPLEMENTATION_PLAN.md` for the current phase and feature priorities.
- The frontend lives in `launch-fun-frontend/` and uses Next.js 14+, TypeScript, Tailwind CSS, TanStack Query, Zustand, Radix UI and Framer Motion.
- Focus on functional implementation first; placeholder data is acceptable while backend APIs are incomplete.
- Keep components modular and reusable and prioritize mobile responsiveness.
- Document complex logic with comments for other team members.

## Testing & Linting
- Run `npm test` from the repository root to execute the Mocha tests.
- Run `npm run lint` inside `launch-fun-frontend/` before committing frontend changes.
