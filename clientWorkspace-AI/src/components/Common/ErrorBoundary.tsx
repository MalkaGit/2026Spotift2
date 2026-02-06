import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="layout-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>
            {this.state.error.message}
          </p>
          <Button onClick={this.handleRetry}>Try again</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
