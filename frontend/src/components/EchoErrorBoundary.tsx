import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class EchoErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[EchoErrorBoundary] WebSocket/Echo error caught:', error, errorInfo);
    
    // You can log the error to an error reporting service here
    if (error.message.includes('headers') || error.message.includes('Echo') || error.message.includes('WebSocket')) {
      console.error('[EchoErrorBoundary] This appears to be a WebSocket/Echo related error');
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return this.props.fallback || (
        <div className="flex items-center justify-center h-64 bg-yellow-50 border border-yellow-200 rounded-lg m-4">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Connection Error
            </h3>
            <p className="text-sm text-yellow-700 mb-4">
              There was an issue with the WebSocket connection. Chat functionality may be limited.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EchoErrorBoundary;