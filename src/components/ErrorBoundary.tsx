import React from 'react';

type State = { error: Error | null };

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen puja-bg flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl card-shadow border-t-4 border-red-400 p-6 max-w-md text-center">
            <div className="text-5xl">🪔</div>
            <h2 className="font-bold text-maroon-800 text-lg mt-3">একটি সমস্যা হয়েছে</h2>
            <p className="text-sm text-stone-600 mt-2 break-words">{this.state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-maroon-700 text-amber-200 font-bold rounded-xl px-6 py-2.5"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
