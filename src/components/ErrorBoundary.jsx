import { Component } from 'react';
import { FiRefreshCw, FiHome } from 'react-icons/fi';

/* eslint-disable react/no-unstable-nested-components */

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = window.location.pathname;
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-6">
          <div className="card max-w-md w-full text-center p-8">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-hotpink-500/15 text-3xl mb-4">🫠</span>
            <h1 className="text-2xl font-display font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-dark-400 text-sm mb-6">
              An unexpected error crashed this screen. Your data is safe — reload to get back in.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-dark-500 bg-dark-800/60 border border-dark-700 rounded-lg px-3 py-2 mb-6 break-words">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="btn-primary flex-1 text-sm px-4 py-3 inline-flex items-center justify-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" /> Reload
              </button>
              <button
                onClick={this.handleHome}
                className="btn-outline flex-1 text-sm px-4 py-3 inline-flex items-center justify-center gap-2"
              >
                <FiHome className="w-4 h-4" /> Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;