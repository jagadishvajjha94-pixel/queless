// Empty in local dev so requests go through the Vite proxy; set to the deployed backend origin in production.
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export const SOCKET_URL = API_URL || 'http://localhost:5001';

// Demo mode serves dummy data from the browser instead of a backend. It defaults on for production builds
// that have no backend configured, and VITE_DEMO_MODE=true/false forces it either way.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE
  ? import.meta.env.VITE_DEMO_MODE === 'true'
  : import.meta.env.PROD && !API_URL;
