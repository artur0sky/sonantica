import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
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
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center text-center">
          <h1 className="text-2xl text-red-500 font-bold mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-300 mb-4">
            An unexpected error occurred in the application.
          </p>
          <div className="bg-gray-900 p-4 rounded text-left overflow-auto max-w-full w-full max-h-[50vh] text-xs font-mono border border-gray-700">
            <p className="text-red-400 font-bold mb-2">
              {this.state.error?.toString()}
            </p>
            <pre className="text-gray-500">
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              window.location.href = "/";
            }}
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Reload Application
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="mt-4 px-6 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-lg transition-colors text-sm"
          >
            Clear Data & Reset
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
