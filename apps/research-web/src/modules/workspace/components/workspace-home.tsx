'use client';

import { ResearchDashboard } from './research-dashboard';
import {
  ActiveExperiments,
  RecentDatasets,
  RecentFeatures,
  RecentPortfolios,
  RecentSignals,
  RecentStrategies,
} from './recent-panels';
import { Favorites } from './favorites';
import { Bookmarks } from './bookmarks';
import { ActivityFeed } from './activity-feed';
import { NotificationsPanel } from './notifications-panel';
import { SavedViews } from './saved-views';

/** Workspace Home — the researcher's productivity landing page. Composes the
 *  dashboard and every workspace panel into one read-only, cross-module surface. */
export function WorkspaceHome() {
  return (
    <div className="space-y-6">
      <ResearchDashboard />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ActiveExperiments />
          <div className="grid gap-4 sm:grid-cols-2">
            <RecentDatasets />
            <RecentFeatures />
            <RecentSignals />
            <RecentStrategies />
          </div>
          <RecentPortfolios />
        </div>

        <div className="space-y-4">
          <Favorites />
          <Bookmarks />
          <SavedViews />
          <NotificationsPanel />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
