import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Alohomora Caught Application Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-[#0B0B0B] text-[#F5F5F5]">
          <div className="max-w-lg w-full p-8 rounded-lg bg-[#141414] border border-[#303030] text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-4xl text-[#E50914] mb-3">error</span>
            <h2 className="text-xl font-bold text-[#F5F5F5]">System Encountered a Display Anomaly</h2>
            <p className="text-xs text-[#A0A0A0] mt-2 leading-relaxed">
              An unexpected render issue was safely contained to prevent complete application failure.
            </p>
            {this.state.error && (
              <div className="mt-4 p-3 rounded bg-[#1C1C1C] border border-[#303030] text-[11px] font-mono text-[#F5F5F5] text-left w-full overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="mt-6 px-5 py-2.5 rounded bg-[#E50914] hover:bg-[#B20710] text-[#F5F5F5] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
