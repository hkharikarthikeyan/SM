// Central API Base URL configuration for FGM-Supermarket dashboard app
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://sm-khaki-nine.vercel.app");
