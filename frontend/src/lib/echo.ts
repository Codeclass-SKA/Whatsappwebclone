import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Initialize Pusher instance for Reverb
const pusher = new Pusher(import.meta.env.VITE_REVERB_APP_KEY, {
  host: import.meta.env.VITE_REVERB_HOST,
  port: parseInt(import.meta.env.VITE_REVERB_PORT || '8080', 10),
  scheme: import.meta.env.VITE_REVERB_SCHEME || 'http',
  forceTLS: false,
  cluster: 'mt1', // Default cluster
  auth: {
    headers: {}
  }
});

// Initialize Echo instance with Reverb configuration
export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  host: import.meta.env.VITE_REVERB_HOST,
  port: parseInt(import.meta.env.VITE_REVERB_PORT || '8080', 10),
  scheme: import.meta.env.VITE_REVERB_SCHEME || 'http',
  forceTLS: false,
  client: pusher, // Use Pusher instance for Reverb
  auth: {
    headers: {}
  }
});

// Export pusher instance for debugging
export { pusher };

// Update Echo token
export const updateEchoToken = (token: string | null) => {
  if (token) {
    echo.options.auth = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    // Also update connector options if available
    if (echo.connector && echo.connector.options) {
      echo.connector.options.auth = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }
    // Update Pusher instance auth headers
    if (pusher && pusher.config) {
      pusher.config.auth = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }
  } else {
    echo.options.auth = {
      headers: {}
    };
    if (echo.connector && echo.connector.options) {
      echo.connector.options.auth = {
        headers: {}
      };
    }
    if (pusher && pusher.config) {
      pusher.config.auth = {
        headers: {}
      };
    }
  }
};

// Disconnect Echo
export const disconnectEcho = () => {
  echo.disconnect();
};

export default echo;