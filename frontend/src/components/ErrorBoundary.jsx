import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8 animate-fade-in">
          <div className="max-w-lg w-full text-center space-y-6">
            {/* Glow backdrop */}
            <div className="relative inline-block">
              <div className="absolute -inset-4 bg-red-500/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                <AlertTriangle className="h-10 w-10 text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-display font-black tracking-widest text-white uppercase mb-2">
                System Breach Detected
              </h2>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                A component in the ELITE97 matrix has encountered an unexpected failure. 
                Your data is safe. Click below to restore the system.
              </p>
            </div>

            {/* Error details (dev only) */}
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="text-left bg-navy-950/80 border border-red-500/20 rounded-xl p-4 overflow-auto max-h-40">
                <p className="text-xs text-red-400 font-mono break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]"
            >
              <RefreshCw className="h-4 w-4" />
              Restore System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
