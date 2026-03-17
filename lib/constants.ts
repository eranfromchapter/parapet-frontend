export const HOME_TYPES = [
  { value: 'apartment', label: 'Apartment', icon: 'Building' },
  { value: 'condo', label: 'Condo', icon: 'Building2', tooltip: 'Condo boards may require additional approvals' },
  { value: 'coop', label: 'Co-op', icon: 'Landmark', tooltip: 'Co-op boards typically have stricter renovation rules' },
  { value: 'townhouse', label: 'Townhouse', icon: 'Home' },
  { value: 'single_family', label: 'Single-Family House', icon: 'Home' },
] as const;

export const SCOPE_CATEGORIES = [
  { value: 'kitchen', label: 'Kitchen', icon: 'ChefHat' },
  { value: 'bathroom', label: 'Bathroom', icon: 'Bath' },
  { value: 'full_gut', label: 'Full Gut Renovation', icon: 'Hammer' },
  { value: 'addition', label: 'Addition/Extension', icon: 'PlusSquare' },
  { value: 'electrical', label: 'Electrical', icon: 'Zap' },
  { value: 'plumbing', label: 'Plumbing', icon: 'Droplets' },
  { value: 'hvac', label: 'HVAC', icon: 'Wind' },
  { value: 'flooring', label: 'Flooring', icon: 'Grid3x3' },
  { value: 'painting', label: 'Painting', icon: 'Paintbrush' },
  { value: 'structural', label: 'Structural', icon: 'Columns3' },
  { value: 'windows_doors', label: 'Windows/Doors', icon: 'DoorOpen' },
  { value: 'roofing', label: 'Roofing', icon: 'Home' },
] as const;

export const BUDGET_TICKS = [25000, 50000, 100000, 150000, 200000, 300000, 500000];
export const BUDGET_MIN = 25000;
export const BUDGET_MAX = 500000;

export const TIMELINE_START_OPTIONS = [
  { value: 'within_1_month', label: 'Within 1 month' },
  { value: '1_3_months', label: '1–3 months' },
  { value: '3_6_months', label: '3–6 months' },
  { value: '6_12_months', label: '6–12 months' },
  { value: 'exploring', label: 'Just exploring' },
] as const;

export const TIMELINE_COMPLETION_OPTIONS = [
  { value: 'asap', label: 'ASAP' },
  { value: '3_months', label: '3 months' },
  { value: '6_months', label: '6 months' },
  { value: '9_months', label: '9 months' },
  { value: '12_months', label: '12 months' },
  { value: 'flexible', label: 'Flexible' },
] as const;

export const STEP_LABELS = [
  'Home Type',
  'Scope',
  'Budget',
  'Timeline',
  'Location',
  'Contact',
  'Review',
] as const;
