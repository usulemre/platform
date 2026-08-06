/** Public surface of the Research Workspace module. Route files and app wiring
 *  import from here only — never from internal layers. */
export { WorkspaceHome } from './components/workspace-home';
export { ResearchDashboard } from './components/research-dashboard';
export {
  ActiveExperiments,
  RecentDatasets,
  RecentFeatures,
  RecentPortfolios,
  RecentSignals,
  RecentStrategies,
} from './components/recent-panels';
export { Favorites } from './components/favorites';
export { Bookmarks } from './components/bookmarks';
export { ActivityFeed } from './components/activity-feed';
export { NotificationsPanel } from './components/notifications-panel';
export { WorkspacePreferences } from './components/workspace-preferences';
export { SavedViews } from './components/saved-views';
export {
  WsLoading as WorkspaceLoadingState,
  WsError as WorkspaceErrorState,
} from './components/workspace-atoms';

export { workspaceService } from './application/container';
export { WorkspaceService } from './application/workspace-service';
export type { WorkspaceRepository } from './data/repository';
