/**
 * The optimization metadata generator — produces the reproducibility record for a computed
 * allocation: iterations/convergence, input/output content hashes and a stable manifest hash (RP-1).
 * Pure and deterministic; no IO.
 */
import type {
  OptimizationInput,
  OptimizationResult,
  OptimizerKey,
} from '@platform/portfolio-optimization-sdk';
import { hashFloat64, manifestHash } from './hashing';
import type { OptimizerParams, OptimizationResultMetadata } from './models';

const SDK_VERSION = '1.0.0';

/** A content hash of the estimated inputs (mean returns, covariance, signals) so universes differ. */
function inputHashFor(input: OptimizationInput): number {
  let hash = hashFloat64(input.meanReturns);
  hash ^= hashFloat64(input.covariance.data);
  hash ^= hashFloat64(input.signals);
  return hash >>> 0;
}

export function generateMetadata(
  optimizerKey: OptimizerKey,
  params: OptimizerParams,
  universeRef: string,
  input: OptimizationInput,
  result: OptimizationResult,
): OptimizationResultMetadata {
  const inputHash = inputHashFor(input);
  const outputHash = hashFloat64(result.weights);
  return {
    optimizerKey,
    params,
    universeRef,
    assetCount: input.n,
    iterations: result.iterations,
    converged: result.converged,
    inputHash,
    outputHash,
    manifestHash: manifestHash(optimizerKey, params, inputHash, outputHash),
    sdkVersion: SDK_VERSION,
  };
}
