import type { Metadata } from 'next';
import { AgentDashboard, RegisteredAgents } from '@/modules/agent';

export const metadata: Metadata = {
  title: 'AI Agents · Admin',
};

/** AI Agent Console — Dashboard + Registered Agents (Server Component). The
 *  interactive parts are Client Components that fetch through the application
 *  service. */
export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">AI Agent Console</h1>
        <p className="max-w-prose text-muted-foreground">
          Centralized management, visibility and governance for registered AI agents. Read-only —
          agents propose and narrate; they never decide, and this console administers them under AI
          Governance.
        </p>
      </div>
      <AgentDashboard />
      <RegisteredAgents />
    </div>
  );
}
