# Phase 9.1.8 — Binance Provider Verification Report

**Scope.** Complete Contract, Integration and End-to-End verification of the Binance Provider chain:

```
Broker Gateway → Binance Provider → Common HTTP/WebSocket → Binance REST/WS API
              → Provider Mapper → Canonical Domain State → Broker Gateway Consumer
```

**Nature.** This phase adds **verification tests and an executable audit only**. No production code was
changed (no domain contract was altered to make a test pass). All venue IO is exercised through
deterministic fakes (fake HTTP transport, fake WebSocket socket) driven by an injected clock/scheduler
— no live network, no credentials, no fabricated Binance responses beyond documented schemas.

---

## 1. Tests executed / passed / failed

| Suite                                                            | File                                         | Tests   |
| ---------------------------------------------------------------- | -------------------------------------------- | ------- |
| Provider Boundary & API-Compliance Audit                         | `tests/verification/boundary-audit.test.ts`  | 8       |
| Broker Gateway Contract Verification                             | `tests/verification/broker-contract.test.ts` | 10      |
| REST Integration Verification                                    | `tests/verification/rest-chain.test.ts`      | 15      |
| WebSocket Integration Verification                               | `tests/verification/websocket-chain.test.ts` | 4       |
| Order Lifecycle & Reconciliation                                 | `tests/verification/order-lifecycle.test.ts` | 5       |
| End-to-End (Tests A–F)                                           | `tests/verification/e2e.test.ts`             | 6       |
| **Phase 9.1.8 new tests**                                        |                                              | **48**  |
| **Full Binance provider suite (incl. pre-existing 9.1.1–9.1.7)** | 30 files                                     | **239** |

- **Executed:** 239 · **Passed:** 239 · **Failed:** 0
- `tsc --noEmit`: clean · `eslint --max-warnings 0`: clean
- Dependent `services/broker-gateway-service` typecheck: unaffected (verified in 9.1.7, no provider API change here).

Reproduce: `pnpm --filter @platform/provider-binance test` (or `npx vitest run` in the package).

## 2. Coverage

Line/branch coverage tooling (`@vitest/coverage-v8`) is **not installed** in this workspace, so a numeric
line-coverage figure is deliberately **not reported** (it would be fabricated). Instead, coverage is
reported as a **capability × chain-segment matrix**, each cell backed by an executed test:

| Capability / Chain segment                     | REST | Mapper→Canonical | WS event→Canonical | Reconcile | Verified by                        |
| ---------------------------------------------- | :--: | :--------------: | :----------------: | :-------: | ---------------------------------- |
| Order submission / create                      |  ✓   |        ✓         |         —          |     —     | rest-chain, e2e-B                  |
| Order query / status                           |  ✓   |        ✓         |         ✓          |     ✓     | rest-chain, order-lifecycle        |
| Order cancel / reject / expire                 |  —   |        ✓         |         ✓          |     ✓     | order-lifecycle                    |
| Execution / fills (partial, multi, dup, stale) |  —   |        ✓         |         ✓          |     ✓     | order-lifecycle, e2e-C             |
| Balance retrieval                              |  ✓   |        ✓         |         ✓          |     ✓     | broker-contract, e2e-D             |
| Position retrieval (Futures)                   |  ✓   |        ✓         |         ✓          |     ✓     | broker-contract, e2e-E             |
| Account information / snapshot                 |  ✓   |        ✓         |         ✓          |     ✓     | e2e-D, e2e-F                       |
| Market data (book / trade / ticker / kline)    |  ✓   |        ✓         |         ✓          |     ✓     | rest-chain, websocket-chain, e2e-A |
| Order-book sequence / gap / resync             |  ✓   |        ✓         |         ✓          |     ✓     | websocket-chain, e2e-A             |
| Capability discovery                           |  ✓   |        —         |         —          |     —     | broker-contract                    |
| Health status                                  |  ✓   |        ✓         |         —          |     —     | broker-contract                    |
| Futures leverage / margin / position mode      |  ✓   |        ✓         |         ✓          |     —     | (9.1.7) futures/\*; boundary-audit |

Pre-existing unit suites (9.1.1–9.1.7, 191 tests) provide fine-grained mapper/validator/state-machine
coverage; the 48 new tests provide the **cross-layer chain** coverage this phase requires.

## 3. Contract violations

**None.** `BrokerProviderPort` is implemented for both provider ids; `queryPositions`/`queryBalances`/
`queryOrders` were asserted to return **exactly** the canonical SDK key sets (`PositionSnapshot`,
`BalanceSnapshot`, `OrderSyncRecord`) with **no** Binance field names (`origQty`, `positionAmt`,
`free`/`locked`, `cummulativeQuoteQty`) present. Capability declarations are truthful vs `supports()`
and are a subset of the canonical catalog. Health returns a canonical `BrokerHealth`.

## 4. API-compliance violations

**None found.** Only officially documented endpoints are used (36 REST path templates in
`src/constants.ts`, all under `/api/v3/*` Spot or `/fapi/v1|v2/*` Futures). Signed requests carry
`timestamp` + `recvWindow` and a real HMAC-SHA256 signature (asserted as 64-hex, placed **last**);
public reads carry neither. WebSocket stream names and user-data event discriminators match the
documented schemas; undocumented event types are ignored, never inferred.

## 5. Provider-boundary violations

**None.** The executable audit (`boundary-audit.test.ts`) proves over the real repository source:

- The only external reference to `@platform/provider-binance` is the sanctioned gateway composition
  seam (`providerFactories` in `services/broker-gateway-service/src/composition.ts`); no deep imports,
  no `BinanceProvider`/`createBinanceProvider` usage outside the package.
- No code outside the provider hard-codes a Binance host or references Binance DTO vocabulary
  (`X-MBX-APIKEY`, `listenKey`, `positionAmt`, `cummulativeQuoteQty`).
- The provider owns **no** duplicate transport (no global `fetch`/`new WebSocket`/`axios`/`node-fetch`);
  it reuses the Common HTTP Client and Common WebSocket Client exclusively.
- **No** TODO/FIXME/stub/placeholder implementation exists in `src/` (the only `placeholder` token is
  `descriptor.placeholder = false`, i.e. a truthful "this is a real adapter" declaration).
- No inline API secret is stored; all secret material is resolved by reference.

## 6. State-consistency issues

**None.** For orders, the WebSocket-reduced canonical state and the REST order query were asserted to
reconcile to the **same** terminal state. For account/position, the REST snapshot and the WS
incremental events converge; duplicate, out-of-order (stale) and terminal events do **not** corrupt or
roll back canonical state. Divergence is handled by explicit snapshot recovery, never a silent
overwrite (verified in Test F and the 9.1.6 reconciliation suite).

## 7. Resiliency issues

**None.** The retry engine is wired into the provider REST path (a transient 503 recovers to a single
canonical result after the documented number of attempts). A retried **mutating** order recovers
without producing a duplicate canonical order. HTTP 429 maps to a retryable `RATE_LIMIT`. WebSocket
reconnect (abnormal 1006 close) restores the stream and continues delivering canonical events, and
triggers account snapshot recovery. The retry/circuit-breaker/rate-limiter engines themselves are
unit-tested in their own packages (`@platform/http-client`, `@platform/rate-limiter`); this phase
verifies their **wiring** into the provider.

## 8. Secrets

Verified never to appear in a serialized error crossing the boundary (a known secret value is absent
from the error's JSON and stack). Secrets are resolved by reference through `SecretProvider` and never
stored inline or logged (enforced by the audit).

## 9. Remaining risks / limitations

1. **No line-coverage number** — `@vitest/coverage-v8` is not installed; capability-matrix coverage is
   reported instead. _Mitigation:_ add the dev dependency to enable numeric coverage in CI.
2. **Fakes, not testnet** — verification uses deterministic fakes (per the repo convention and the
   "never use production credentials" rule). Live Spot/Futures **testnet** smoke tests are a valuable
   future addition but require sandbox credentials provisioned out-of-band; they are intentionally not
   committed here.
3. **Circuit-breaker open-state** is verified as _wired_ (via retry/rate-limit paths) rather than by
   asserting a specific open-threshold through the provider, to avoid brittle threshold coupling; the
   breaker's own open/half-open behaviour is unit-tested upstream in `@platform/http-client`.
4. **Historical-data capability** is declared by the descriptor but has no dedicated REST verification
   here beyond klines; it shares the same signed REST path already verified.

## 10. Acceptance

All Phase 9.1.8 acceptance criteria are demonstrably met by executed tests: the full
Gateway → Provider → REST/WS → Binance → Mapper → Canonical chain is verified for every implemented
capability; all canonical and provider contract tests pass; critical integration, E2E, reconciliation
and recovery tests pass; no Binance type leaks through the boundary; no undocumented behaviour is
implemented; no direct venue access bypasses the provider; no critical TODO/stub remains; and all
existing quality gates pass.
