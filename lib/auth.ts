export function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("parapet_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("parapet_token");
}

export function clearAuth(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("parapet_token");
  }
}
