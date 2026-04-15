import { getAuthHeaders } from './auth';

// Base URL for all backend API calls. Routed through the same-origin Vercel
// proxy defined in next.config.mjs (rewrite: /api/backend/* → Railway).
//
// Why: the Railway backend's CORS preflight returns HTTP 400. Chrome is lenient
// and accepts this, but Safari strictly requires 2xx and rejects the preflight,
// causing every direct cross-origin fetch to fail with "Load failed".
// Sending all client-side API calls through the same-origin proxy eliminates
// CORS entirely — the browser never issues a preflight, so the backend's
// OPTIONS handler never gets a chance to break things.
const API_BASE = "/api/backend";

interface FetchOptions extends RequestInit {
  timeout?: number;
}

export class APIError extends Error {
  constructor(public status: number, public statusText: string, public body?: unknown) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'APIError';
  }
}

async function fetchWithRetry(url: string, options: FetchOptions = {}, retries = 2): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Merge auth headers with any existing headers
  const authHeaders = getAuthHeaders();
  const existingHeaders = (fetchOptions.headers as Record<string, string>) || {};
  const mergedHeaders = { ...authHeaders, ...existingHeaders };

  try {
    const response = await fetch(url, { ...fetchOptions, headers: mergedHeaders, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new APIError(response.status, response.statusText, body);
    }
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (retries > 0 && !(error instanceof APIError && error.status < 500)) {
      await new Promise(r => setTimeout(r, 1000 * (3 - retries)));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export const api = {
  async createReadinessReport(data: Record<string, unknown>): Promise<{ id: string; status: string }> {
    const res = await fetchWithRetry(`${API_BASE}/v1/readiness-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getReadinessReport(id: string): Promise<import('./types').ReadinessReport> {
    const res = await fetchWithRetry(`${API_BASE}/v1/readiness-reports/${id}`);
    return res.json();
  },

  async listReadinessReports(): Promise<import('./types').ReadinessReport[]> {
    const res = await fetchWithRetry(`${API_BASE}/v1/readiness-reports`);
    return res.json();
  },

  async createEstimate(reportId: string): Promise<{ id: string; status: string }> {
    const res = await fetchWithRetry(`${API_BASE}/v1/estimates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readiness_report_id: reportId }),
    });
    return res.json();
  },

  async getEstimate(id: string): Promise<import('./types').Estimate> {
    const res = await fetchWithRetry(`${API_BASE}/v1/estimates/${id}`);
    return res.json();
  },

  async verifyContractor(data: Record<string, unknown>): Promise<import('./types').ContractorVerification> {
    const res = await fetchWithRetry(`${API_BASE}/v1/contractors/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getContractor(id: string): Promise<import('./types').ContractorVerification> {
    const res = await fetchWithRetry(`${API_BASE}/v1/contractors/${id}`);
    return res.json();
  },

  async submitUpgrade(data: Record<string, unknown>): Promise<{ id: string; status: string }> {
    const res = await fetchWithRetry(`${API_BASE}/v1/upgrades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async joinWaitlist(data: Record<string, unknown>): Promise<{ id: string; status: string }> {
    const res = await fetchWithRetry(`${API_BASE}/v1/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getHomeownerEstimate(specId: string): Promise<unknown> {
    const res = await fetchWithRetry(`${API_BASE}/v1/specifications/${specId}/homeowner-estimate`);
    return res.json();
  },

  async getGCBidSpec(specId: string): Promise<unknown> {
    const res = await fetchWithRetry(`${API_BASE}/v1/specifications/${specId}/gc-bid-spec`);
    return res.json();
  },

  async healthCheck(): Promise<{ status: string }> {
    const res = await fetchWithRetry(`${API_BASE}/health`);
    return res.json();
  },
};
