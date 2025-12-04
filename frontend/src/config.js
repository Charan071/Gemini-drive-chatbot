// API Configuration
// This allows easy switching between development and production environments

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5678';

// Usage in components:
// import { API_BASE_URL } from './config';
// fetch(`${API_BASE_URL}/api/auth/status`)
