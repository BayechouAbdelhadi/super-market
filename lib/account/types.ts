export type AppStatus = 'active' | 'beta' | 'coming_soon';

export type AppCategory = 'loyalty' | 'shopping' | 'offers' | 'account' | 'management' | 'analytics';

export type AppIconName =
  | 'Sparkles'
  | 'ShoppingBag'
  | 'Tag'
  | 'UserCheck'
  | 'Receipt'
  | 'Clock'
  | 'Store'
  | 'BarChart3'
  | 'Users'
  | 'UserCog'
  | 'Activity'
  | 'Package'
  | 'CreditCard';

export interface AccountApp {
  id: string;
  title: string;
  description: string;
  href: string;
  iconName: AppIconName;
  badge?: string;
  status: AppStatus;
  category: AppCategory;
  accentColor?: string;
  order: number;
}
