import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo, _: any) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen w-full bg-[#1A0A06] text-[#FDE8DC] p-8 text-center">
          <div className="max-w-md p-8 bg-[#431407] border border-[#E25D30]/30 rounded-2xl shadow-2xl">
            <h1 className="text-2xl font-bold text-[#E25D30] mb-4">System Critical Error</h1>
            <p className="text-[#B38A7C] mb-6">
              An unexpected error occurred in the 3D diagnostic engine. 
              The visualizer has been suspended to prevent system instability.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#E25D30] text-[#FDE8DC] font-bold rounded-lg hover:bg-[#FB923C] transition-colors"
            >
              Reset System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
