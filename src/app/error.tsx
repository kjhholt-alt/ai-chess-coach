'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console
    console.error('[Page Error]', error);

    // Optional: Send to monitoring service
    const errorLog = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };
    console.log('[Error logged]:', errorLog);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg border border-red-500/20 rounded-lg p-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-300 mb-4">
              An unexpected error occurred while loading this page.
            </p>

            <div className="bg-black/40 border border-red-500/20 rounded p-4 mb-4 overflow-x-auto">
              <p className="text-sm font-mono text-red-400 mb-2">
                {error.message || 'Unknown error'}
              </p>
              {process.env.NODE_ENV === 'development' && error.stack && (
                <pre className="text-xs text-gray-400 whitespace-pre-wrap break-words mt-2">
                  {error.stack}
                </pre>
              )}
              {error.digest && (
                <p className="text-xs text-gray-600 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <a
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
