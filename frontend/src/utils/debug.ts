// Debug utility untuk monitoring masalah refresh
export const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
};

export const debugAuth = (action: string, data?: any) => {
  debugLog(`Auth ${action}`, data);
};

export const debugRoute = (from: string, to: string) => {
  debugLog(`Route change: ${from} -> ${to}`);
}; 