import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
          <div className="bg-[#111] border border-red-500/20 p-8 rounded-2xl max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Terjadi Kesalahan</h1>
            <p className="text-neutral-400 mb-8">
              Maaf, aplikasi mengalami kendala teknis (Crash). Jangan khawatir, Anda dapat memuat ulang halaman untuk mencoba kembali.
            </p>
            {this.state.error && (
              <div className="mb-8 text-left max-h-40 overflow-y-auto bg-black/50 p-4 rounded-xl border border-red-500/20">
                <p className="text-red-500 font-mono text-[10px] break-all">{this.state.error.toString()}</p>
                <p className="text-red-500/60 font-mono text-[10px] mt-2 break-all">{this.state.errorInfo?.componentStack}</p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold py-3 px-8 rounded-full transition-all"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export { ErrorBoundary };
export default ErrorBoundary;
