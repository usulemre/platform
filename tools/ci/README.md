# tools/ci — Governance CI Gates (technology-independent)

> **Phase 0 scaffolding placeholder.** Describes the gates; does not bind a specific CI vendor.

The CI governance gates a change MUST pass before merge (Implementation Roadmap Part E/F):

- **Contract / Architecture** — architectural home + ADR/Patch reference; conforms to Architecture V2 (RB-25 · ADR, ARB).
- **Coding / Review** — SRP, coupling, dependency direction; independent review (RB-20, RB-22; CR-1..4).
- **Testing** — required tests incl. golden-set for decision engines (RB-21).
- **Documentation** — governing docs cited; references resolve (RB-23).
- **Security** — secret-scan clean; deps scanned; no secrets in repo (RB-27 · SEC, CODE-29).
- **AI Review** — if AI-touched: AIGOV limits, provenance, isolation (RB-15).
- **Reproducibility** — reproducible from manifest (RB-05, P1-02).

Hard gates (no compensation): Deterministic, Statistical, Reproducibility (IMP-26). A failed or
skipped required gate blocks merge and is fail-closed (IMP-E-1, CR-4).
