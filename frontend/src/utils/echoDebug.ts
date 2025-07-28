import { echo, pusher } from '../lib/echo';

// Debug utility to inspect Echo structure
export const debugEchoStructure = () => {
  console.log('=== Echo Debug Information ===');
  console.log('Echo instance:', echo);
  console.log('Echo options:', echo.options);
  
  if (echo.options) {
    console.log('Echo options.auth:', echo.options.auth);
    if (echo.options.auth) {
      console.log('Echo options.auth.headers:', echo.options.auth.headers);
    }
  }
  
  // Check Pusher instance
  console.log('Pusher instance:', pusher);
  if (pusher && pusher.config) {
    console.log('Pusher config:', pusher.config);
    console.log('Pusher config.auth:', pusher.config.auth);
  }
  
  // Check for alternative structures
  if (echo.connector) {
    console.log('Echo connector:', echo.connector);
    console.log('Echo connector options:', echo.connector.options);
    console.log('Echo connector channels:', echo.connector.channels);
    
    // Check for Reverb-specific properties
    if ((echo.connector as any).reverb) {
      console.log('Echo connector.reverb:', (echo.connector as any).reverb);
    }
    
    // Check for Pusher properties
    if ((echo.connector as any).pusher) {
      console.log('Echo connector.pusher:', (echo.connector as any).pusher);
    }
  }
  
  console.log('=== End Echo Debug ===');
};

// Call this function to debug
if (typeof window !== 'undefined') {
  (window as any).debugEcho = debugEchoStructure;
}