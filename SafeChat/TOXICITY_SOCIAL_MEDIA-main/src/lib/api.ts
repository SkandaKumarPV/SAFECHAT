const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

type ApiError = {
  detail?: string | { msg?: string }[];
};

function getToken() {
  return localStorage.getItem("auth_token");
}

function setToken(token: string) {
  localStorage.setItem("auth_token", token);
}

function clearToken() {
  localStorage.removeItem("auth_token");
}

async function parseError(response: Response) {
  let message = "Request failed";
  try {
    const data = (await response.json()) as ApiError;
    if (typeof data.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
      message = data.detail[0].msg;
    }
  } catch {
    message = response.statusText || message;
  }
  throw new Error(message);
}

async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string | null) {
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    await parseError(response);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export const api = {
  getToken,
  setToken,
  clearToken,
  login: async (identifier: string, password: string) => {
    const body = new URLSearchParams();
    body.set("username", identifier);
    body.set("password", password);
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      body,
    });
    if (!response.ok) {
      await parseError(response);
    }
    return (await response.json()) as { access_token: string; token_type: string };
  },
  register: async (payload: {
    username: string;
    email: string;
    password: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
  }) => {
    return apiRequest<{ id: number }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  me: async (token: string) => {
    return apiRequest<{ id: number; username: string; email: string; full_name?: string | null; avatar_url?: string | null; bio?: string | null; created_at: string }>("/auth/me", {}, token);
  },
  updateMe: async (payload: { full_name?: string | null; avatar_url?: string | null; bio?: string | null }, token: string) => {
    return apiRequest<{ id: number; username: string; email: string; full_name?: string | null; avatar_url?: string | null; bio?: string | null; created_at: string }>(
      "/users/me",
      { method: "PATCH", body: JSON.stringify(payload) },
      token,
    );
  },
  changePassword: async (payload: { current_password: string; new_password: string }, token: string) => {
    return apiRequest<{ message: string }>("/users/me/change-password", { method: "POST", body: JSON.stringify(payload) }, token);
  },
  myNotifications: async (token: string) => {
    return apiRequest<unknown[]>("/users/me/notifications", {}, token);
  },
  listPosts: async () => {
    return apiRequest<unknown[]>("/posts");
  },
  listPostsPaged: async (params: { skip?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (typeof params.skip === "number") query.set("skip", String(params.skip));
    if (typeof params.limit === "number") query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiRequest<unknown[]>(`/posts${suffix}`);
  },
  likePost: async (postId: number, token: string) => {
    return apiRequest<{ post_id: number; likes_count: number; liked: boolean }>(`/posts/${postId}/like`, { method: "POST" }, token);
  },
  unlikePost: async (postId: number, token: string) => {
    return apiRequest<{ post_id: number; likes_count: number; liked: boolean }>(`/posts/${postId}/like`, { method: "DELETE" }, token);
  },
  myLikedPosts: async (token: string) => {
    return apiRequest<{ post_ids: number[] }>("/posts/me/liked", {}, token);
  },
  createPost: async (payload: { content: string; image_url?: string | null }, token: string) => {
    return apiRequest<unknown>("/posts", { method: "POST", body: JSON.stringify(payload) }, token);
  },
  updatePost: async (postId: number, payload: { content?: string; image_url?: string | null }, token: string) => {
    return apiRequest<unknown>(`/posts/${postId}`, { method: "PATCH", body: JSON.stringify(payload) }, token);
  },
  deletePost: async (postId: number, token: string) => {
    return apiRequest<null>(`/posts/${postId}`, { method: "DELETE" }, token);
  },
  createComment: async (postId: number, content: string, token: string) => {
    return apiRequest<unknown>(
      `/comments/posts/${postId}`,
      { method: "POST", body: JSON.stringify({ content }) },
      token,
    );
  },
  listComments: async (postId: number) => {
    return apiRequest<unknown[]>(`/comments/posts/${postId}`);
  },
  deleteComment: async (commentId: number, token: string) => {
    return apiRequest<null>(`/comments/${commentId}`, { method: "DELETE" }, token);
  },
  listUsers: async () => {
    return apiRequest<unknown[]>("/users");
  },
  getUserByUsername: async (username: string) => {
    return apiRequest<{ id: number; username: string; email: string; full_name?: string | null; avatar_url?: string | null; bio?: string | null; created_at: string }>(`/users/username/${username}`);
  },
  getUserProfile: async (userId: number, token?: string | null) => {
    return apiRequest<unknown>(`/users/${userId}/profile`, {}, token ?? null);
  },
  getUser: async (userId: number) => {
    return apiRequest<unknown>(`/users/${userId}`);
  },
  followUser: async (userId: number, token: string) => {
    return apiRequest<unknown>(`/follows/${userId}`, { method: "POST" }, token);
  },
  unfollowUser: async (userId: number, token: string) => {
    return apiRequest<unknown>(`/follows/${userId}`, { method: "DELETE" }, token);
  },
  myFollowing: async (token: string) => {
    return apiRequest<unknown[]>("/follows/me/following", {}, token);
  },
  savePost: async (postId: number, token: string) => {
    return apiRequest<unknown>(`/saves/${postId}`, { method: "POST" }, token);
  },
  unsavePost: async (postId: number, token: string) => {
    return apiRequest<null>(`/saves/${postId}`, { method: "DELETE" }, token);
  },
  listSavedPosts: async (token: string) => {
    return apiRequest<unknown[]>("/saves/me", {}, token);
  },
  inbox: async (token: string) => {
    return apiRequest<unknown[]>("/messages/inbox", {}, token);
  },
  outbox: async (token: string) => {
    return apiRequest<unknown[]>("/messages/outbox", {}, token);
  },
  sendMessage: async (payload: { receiver_id: number; content: string }, token: string) => {
    return apiRequest<unknown>("/messages", { method: "POST", body: JSON.stringify(payload) }, token);
  },
};
