export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = localStorage.getItem("token");

  const makeRequest = () =>
    fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

  let response = await makeRequest();

  if (response.status !== 401) {
    return response;
  }

  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    return response;
  }

  const refreshResponse = await fetch(
    "http://127.0.0.1:8000/api/auth/token/refresh/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    }
  );

  if (!refreshResponse.ok) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");

    return response;
  }

  const refreshData = await refreshResponse.json();

  token = refreshData.access;

  localStorage.setItem("token", refreshData.access);

  return makeRequest();
}