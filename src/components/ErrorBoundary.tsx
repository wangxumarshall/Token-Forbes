import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || 'An unknown error occurred';
      let isStorageError = false;
      let isOfflineError = false;
      let isPermissionError = false;

      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error) {
          errorMessage = parsed.error;
          isStorageError = true;
          if (errorMessage.includes('client is offline')) {
            isOfflineError = true;
          }
          if (errorMessage.includes('Missing or insufficient permissions')) {
            isPermissionError = true;
          }
        }
      } catch (e) {
        // Not JSON
        if (errorMessage.includes('client is offline')) {
            isOfflineError = true;
        }
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-black">
          <div className="bg-[#111] border border-red-500/30 rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-6 text-red-500">
              <AlertTriangle className="w-10 h-10" />
              <h2 className="text-2xl font-bold">Something went wrong</h2>
            </div>
            
            <div className="bg-black/50 rounded-xl p-4 mb-6 border border-white/5">
              <p className="text-gray-300 font-mono text-sm break-words">
                {errorMessage}
              </p>
            </div>

            {isOfflineError && (
              <div className="space-y-4 text-gray-300">
                <p className="font-bold text-white">🔥 Data Storage Not Reachable</p>
                <p>The app could not reach its configured storage backend, or your network blocked the request.</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Check that your storage credentials are configured for the deployment.</li>
                  <li>Verify the relevant project service is enabled.</li>
                  <li>Reload the page after the storage backend is healthy.</li>
                </ol>
                <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8952b] transition-colors">
                  Reload Page
                </button>
              </div>
            )}

            {isPermissionError && (
              <div className="space-y-4 text-gray-300">
                <p className="font-bold text-white">🔒 Permission Denied</p>
                <p>Your data storage rules are blocking this request.</p>
                <p>Please update the deployment's storage permissions to allow this operation.</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8952b] transition-colors">
                  Reload Page
                </button>
              </div>
            )}

            {!isOfflineError && !isPermissionError && !isStorageError && (
              <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-colors">
                Reload Page
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
