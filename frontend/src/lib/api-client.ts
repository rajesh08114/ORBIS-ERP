export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1/";

export class ApiError extends Error {
  constructor(public status: number, public message: string, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
};

export const setAuthToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
};

export const clearAuthToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
};

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, headers: customHeaders, ...customOptions } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint.slice(1) : endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const token = getAuthToken();
  const headers: HeadersInit = {
    ...(!(customOptions.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...customOptions,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(0, "Network Error: The server is unreachable or a CORS policy blocked the request.");
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        const pathname = window.location.pathname;
        if (pathname !== "/login" && pathname !== "/signup") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("orbis-auth");
          window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
        }
      }
    }

    let errorData;
    try {
      errorData = await response.json();
    } catch {
      // Not JSON
    }
    
    let errorMessage = response.statusText;
    if (errorData) {
      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (Array.isArray(errorData) && errorData.length > 0 && typeof errorData[0] === "string") {
        errorMessage = errorData[0];
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (typeof errorData === "object") {
        const values = Object.values(errorData);
        if (values.length > 0) {
          const firstVal: any = values[0];
          if (Array.isArray(firstVal) && firstVal.length > 0 && typeof firstVal[0] === "string") {
            errorMessage = firstVal[0];
          } else if (typeof firstVal === "string") {
            errorMessage = firstVal;
          }
        }
      }
    }

    throw new ApiError(
      response.status,
      errorMessage,
      errorData
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}
