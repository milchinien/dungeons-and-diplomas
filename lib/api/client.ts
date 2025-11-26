/**
 * Base API client with error handling
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      // Response body might not be JSON
    }
    throw new ApiError(
      `API request failed: ${response.statusText}`,
      response.status,
      errorBody
    );
  }

  return response.json();
}

export async function get<T>(url: string): Promise<T> {
  return fetchJson<T>(url);
}

export async function post<T>(url: string, body: unknown): Promise<T> {
  return fetchJson<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}
