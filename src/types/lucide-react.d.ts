// Ambient declarations for libraries without bundled .d.ts
declare module 'lucide-react' {
  import type { ComponentType, SVGProps } from 'react';
  type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; color?: string }>;
  const icons: Record<string, LucideIcon>;
  export default icons;

  // Exhaustive list of icons actually used in this app.
  export const AlertCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const ArrowDownRight: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const Briefcase: LucideIcon;
  export const Building2: LucideIcon;
  export const Calendar: LucideIcon;
  export const CalendarClock: LucideIcon;
  export const Camera: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const Clock: LucideIcon;
  export const DollarSign: LucideIcon;
  export const Download: LucideIcon;
  export const FileSignature: LucideIcon;
  export const Filter: LucideIcon;
  export const GripVertical: LucideIcon;
  export const Info: LucideIcon;
  export const KanbanSquare: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const Mail: LucideIcon;
  export const MapPin: LucideIcon;
  export const Menu: LucideIcon;
  export const Monitor: LucideIcon;
  export const Moon: LucideIcon;
  export const Pencil: LucideIcon;
  export const Phone: LucideIcon;
  export const Plus: LucideIcon;
  export const Receipt: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Search: LucideIcon;
  export const Settings: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Sun: LucideIcon;
  export const Tag: LucideIcon;
  export const ToggleLeft: LucideIcon;
  export const Trash2: LucideIcon;
  export const TrendingDown: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Upload: LucideIcon;
  export const Users: LucideIcon;
  export const Wallet: LucideIcon;
  export const X: LucideIcon;
}