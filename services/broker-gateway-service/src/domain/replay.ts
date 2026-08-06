/**
 * Broker lifecycle replay — deterministically reconstructs a broker's status by replaying its event
 * log through the state machine and checks it against the recorded status. Pure: no IO. Powers the
 * Gateway Audit / lifecycle verification views (an integrity check on the immutable event trail).
 */
import { canTransition, type Broker, type BrokerStatus } from '@platform/broker-sdk';

export interface ReplayStep {
  readonly index: number;
  readonly type: string;
  readonly from: BrokerStatus;
  readonly to: BrokerStatus;
  readonly legal: boolean;
  readonly actor: string;
  readonly at: string;
  readonly message: string;
}

export interface ReplayResult {
  readonly brokerId: string;
  readonly reconstructedStatus: BrokerStatus;
  readonly recordedStatus: BrokerStatus;
  readonly consistent: boolean;
  readonly steps: readonly ReplayStep[];
}

export function replayBroker(broker: Broker): ReplayResult {
  const steps: ReplayStep[] = [];
  let current: BrokerStatus = 'REGISTERED';
  let index = 0;
  for (const event of broker.events) {
    const to: BrokerStatus = event.status ?? current;
    // A same-state event (heartbeat / in-place health) is trivially legal.
    const legal = to === current || canTransition(current, to);
    if (index > 0)
      steps.push({
        index,
        type: event.type,
        from: current,
        to,
        legal,
        actor: event.actor,
        at: event.at,
        message: event.message,
      });
    current = to;
    index += 1;
  }
  return {
    brokerId: broker.id,
    reconstructedStatus: current,
    recordedStatus: broker.status,
    consistent: current === broker.status && steps.every((s) => s.legal),
    steps,
  };
}
