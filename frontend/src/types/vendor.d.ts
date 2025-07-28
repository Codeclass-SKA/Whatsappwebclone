declare module 'laravel-echo' {
  interface EchoConfig {
    broadcaster: 'reverb';
    key: string;
    host?: string;
    port?: number;
    forceTLS?: boolean;
    auth?: {
      headers?: {
        [key: string]: string;
      };
    };
  }

  interface EchoChannel {
    listen(event: string, callback: Function): EchoChannel;
    stopListening(event: string): EchoChannel;
    subscribe(): void;
    unsubscribe(): void;
  }

  interface EchoPresenceChannel extends EchoChannel {
    here(callback: Function): EchoPresenceChannel;
    joining(callback: Function): EchoPresenceChannel;
    leaving(callback: Function): EchoPresenceChannel;
  }

  interface EchoConnector {
    options: {
      auth?: {
        headers?: {
          [key: string]: string;
        };
      };
    };
    connect(): void;
    disconnect(): void;
  }

  export default class Echo {
    constructor(options: EchoConfig);
    connector: EchoConnector;
    private: (channel: string) => EchoChannel;
    join(channel: string): EchoPresenceChannel;
    leave(channel: string): void;
    channel(channel: string): EchoChannel;
    connect(): void;
    disconnect(): void;
  }
}

// Add environment variables type definitions
interface ImportMetaEnv {
  VITE_APP_KEY: string;
  VITE_REVERB_HOST: string;
  VITE_REVERB_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}