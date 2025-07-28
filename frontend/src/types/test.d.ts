declare global {
  namespace NodeJS {
    interface Global {
      fetch: jest.Mock;
    }
  }

  interface Window {
    IntersectionObserver: {
      new (
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit
      ): IntersectionObserver;
    };
    ResizeObserver: {
      new (callback: ResizeObserverCallback): ResizeObserver;
    };
  }
}

// Mock types for Echo
export interface EchoChannel {
  listen(event: string, callback: Function): EchoChannel;
  stopListening(event: string): EchoChannel;
  subscribe(): void;
  unsubscribe(): void;
  leave(): void;
}

export interface EchoPresenceChannel extends EchoChannel {
  here(callback: Function): EchoPresenceChannel;
  joining(callback: Function): EchoPresenceChannel;
  leaving(callback: Function): EchoPresenceChannel;
}

export interface MockEchoChannel extends EchoChannel {
  listen: jest.Mock;
  stopListening: jest.Mock;
  subscribe: jest.Mock;
  unsubscribe: jest.Mock;
  leave: jest.Mock;
}

export interface MockEchoPresenceChannel extends EchoPresenceChannel {
  listen: jest.Mock;
  stopListening: jest.Mock;
  subscribe: jest.Mock;
  unsubscribe: jest.Mock;
  leave: jest.Mock;
  here: jest.Mock;
  joining: jest.Mock;
  leaving: jest.Mock;
}

export interface MockEcho {
  private: jest.Mock<MockEchoChannel>;
  join: jest.Mock<MockEchoPresenceChannel>;
  leave: jest.Mock;
}

// Mock types for Zustand store
export interface MockStore<T> extends jest.Mock {
  getState(): T;
  setState(partial: Partial<T>): void;
}

export {};