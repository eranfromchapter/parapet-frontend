export interface IntakeFormData {
  homeType: string;
  renovationScope: string[];
  budgetRange: { min: number; max: number };
  timeline: { start: string; completion: string };
  zipCode: string;
  propertyAddress?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  additionalNotes?: string;
}

export interface ReadinessReport {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress_pct?: number;
  created_at: string;
  report_json?: ReportJSON;
  intake_data?: IntakeFormData;
}

export interface ReportJSON {
  executive_summary: {
    summary: string;
    overall_risk: string;
    risk_level: 'LOW' | 'MODERATE' | 'HIGH';
  };
  scope_analysis: {
    description: string;
    complexity: string;
  };
  cost_estimate: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    breakdown: CostBreakdownItem[];
    confidence_range: string;
  };
  risk_assessment: {
    composite_score: number;
    dimensions: RiskDimension[];
  };
  regulatory: {
    permits: PermitRequirement[];
    inspections: string[];
  };
  contractor_guidance: {
    recommended_trades: string[];
    vetting_criteria: string[];
    red_flags: string[];
  };
  market_context: {
    description: string;
  };
  next_steps: string[];
  provenance: {
    pipeline_version: string;
    generated_at: string;
    models_used: string;
  };
}

export interface CostBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface RiskDimension {
  name: string;
  score: number;
  description: string;
}

export interface PermitRequirement {
  type: string;
  description: string;
  estimated_days?: number;
}

export interface ContractorVerification {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  contractor_name: string;
  composite_score?: number;
  risk_level?: string;
  decision_brief?: string;
}

export interface Estimate {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  readiness_report_id: string;
  line_items?: EstimateLineItem[];
  total?: {
    p10: number;
    p50: number;
    p90: number;
  };
}

export interface EstimateLineItem {
  item_code: string;
  description: string;
  quantity: number;
  unit: string;
  price_low: number;
  price_expected: number;
  price_high: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  room?: string;
  trade?: string;
}
