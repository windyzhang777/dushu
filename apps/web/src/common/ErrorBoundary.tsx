import { RotateCcw } from 'lucide-react';
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div aria-label="error-boundary" className="min-h-full flex justify-center items-center">
            <button onClick={() => window.location.reload()}>
              <RotateCcw /> Reload Page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
