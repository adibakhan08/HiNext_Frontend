import axios from "axios";
import { API_ENDPOINTS } from "./endpoints";

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (isFormData) {
    if (typeof config.headers?.delete === "function") {
      config.headers.delete("Content-Type");
      config.headers.delete("content-type");
    } else if (config.headers) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
  }
  
  const loginUrls = [
    API_ENDPOINTS.AUTH.ADMIN_LOGIN,
    API_ENDPOINTS.AUTH.STUDENT_LOGIN,
  ];
  const isLoginRequest =
    config.skipAuth || loginUrls.some((url) => config.url?.includes(url));

  if (isLoginRequest) {
    if (typeof config.headers?.delete === "function") {
      config.headers.delete("Authorization");
    } else if (config.headers) {
      delete config.headers.Authorization;
      delete config.headers.authorization;
    }
    return config;
  }

  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh if the 401 came from login, logout, or refresh endpoints
    const authBypassUrls = [
      API_ENDPOINTS.AUTH.LOGOUT,
      API_ENDPOINTS.AUTH.REFRESH,
      API_ENDPOINTS.AUTH.ADMIN_LOGIN,
      API_ENDPOINTS.AUTH.STUDENT_LOGIN,
    ];

    if (authBypassUrls.some((url) => originalRequest?.url?.includes(url))) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${axiosClient.defaults.baseURL}${API_ENDPOINTS.AUTH.REFRESH}`,
            { refresh: refreshToken },
          );
          const newAccessToken = data.tokens?.access || data.access;
          localStorage.setItem("access_token", newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosClient(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);
