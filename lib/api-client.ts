const API_BASE = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
}

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

  try {
    const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
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
