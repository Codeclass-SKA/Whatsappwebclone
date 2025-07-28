// Environment variables utility for browser and test environments
export const getEnvVar = (key: string, fallback: string = ''): string => {
  // For browser environment, try to get from window object
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    return (window as any).__ENV__[key] || fallback;
  }
  
  // For test environment, try to get from process.env
  if (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process.env) {
    return (globalThis as any).process.env[key] || fallback;
  }
  
  // Fallback
  return fallback;
};

// Common environment variables
export const API_URL = getEnvVar('VITE_API_URL', 'http://localhost:8000/api'); 