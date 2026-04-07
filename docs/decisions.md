# Decision Log

| Date | Decision |
|---|---|
| 2026-04-07 | No backend, no auth, no database — fully client-side. Simplest possible deployment, no Railway provisioning needed beyond Next.js. |
| 2026-04-07 | Stack: Next.js 15, Recharts, TailwindCSS v4, @base-ui/react for Slider + Tabs primitives |
| 2026-04-07 | All simulation values in real (inflation-adjusted) terms — avoids confusion between nominal and real return inputs |
| 2026-04-07 | Log-normal return sampling via Box-Muller — standard approach for Monte Carlo portfolio simulation |
| 2026-04-07 | Fan chart uses Recharts "erase" technique (overlapping Areas) — Recharts has no native band/area-between support |
| 2026-04-07 | withdrawalMode toggle (fixed £ vs. % rate) — withdrawal rate is calculated once at retirement age, not re-calculated each year |
