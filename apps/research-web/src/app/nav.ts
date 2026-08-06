import {
  Activity,
  BarChart3,
  Boxes,
  Briefcase,
  Calculator,
  Database,
  FlaskConical,
  Gauge,
  Home,
  Layers,
  LayoutDashboard,
  LineChart,
  Library,
  Microscope,
  PieChart,
  PlayCircle,
  Radio,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  Target,
  UserRound,
  Waypoints,
} from 'lucide-react';
import type { NavGroup } from '@platform/shell';

/**
 * Application navigation config. Feature modules extend this array (and register
 * command-palette entries) WITHOUT modifying the shell. Feature/Experiment/
 * Portfolio entries are intentionally absent until their modules land.
 */
export const appNav: NavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { id: 'workspace', label: 'Workspace', href: '/workspace', icon: Home },
      { id: 'research', label: 'Research', href: '/research', icon: Microscope },
      { id: 'datasets', label: 'Datasets', href: '/datasets', icon: Database },
      { id: 'experiments', label: 'Experiments', href: '/experiments', icon: FlaskConical },
      { id: 'features', label: 'Features', href: '/features', icon: Boxes },
      { id: 'feature-store', label: 'Feature store', href: '/feature-store', icon: Library },
      { id: 'signals', label: 'Signals', href: '/signals', icon: Radio },
      { id: 'signal-engine', label: 'Signal engine', href: '/signal-engine', icon: Activity },
      { id: 'strategies', label: 'Strategies', href: '/strategies', icon: Layers },
      { id: 'backtesting', label: 'Backtesting', href: '/backtesting', icon: LineChart },
      { id: 'portfolios', label: 'Portfolios', href: '/portfolios', icon: Briefcase },
      {
        id: 'portfolio-construction',
        label: 'Portfolio construction',
        href: '/portfolio-construction',
        icon: PieChart,
      },
      { id: 'risk', label: 'Risk', href: '/risk', icon: ShieldAlert },
      { id: 'risk-engine', label: 'Risk engine', href: '/risk-engine', icon: ShieldCheck },
      { id: 'execution', label: 'Execution', href: '/execution', icon: PlayCircle },
      {
        id: 'execution-simulator',
        label: 'Execution simulator',
        href: '/execution-simulator',
        icon: Gauge,
      },
      { id: 'live-trading', label: 'Live trading', href: '/live-trading', icon: Rocket },
      {
        id: 'performance-analytics',
        label: 'Performance analytics',
        href: '/performance-analytics',
        icon: BarChart3,
      },
      {
        id: 'feature-calculation',
        label: 'Feature calculation',
        href: '/feature-calculation',
        icon: Calculator,
      },
      {
        id: 'signal-calculation',
        label: 'Signal calculation',
        href: '/signal-calculation',
        icon: Waypoints,
      },
      {
        id: 'portfolio-optimization',
        label: 'Portfolio optimization',
        href: '/portfolio-optimization',
        icon: Target,
      },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [{ id: 'profile', label: 'Profile', href: '/profile', icon: UserRound }],
  },
];
