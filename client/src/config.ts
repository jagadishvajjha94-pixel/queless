// Empty in local dev so requests go through the Vite proxy; set to the deployed backend origin in production.
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export const SOCKET_URL = API_URL || 'http://localhost:5001';
