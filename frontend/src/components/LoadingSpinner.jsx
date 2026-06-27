import React from "react";

const LoadingSpinner = ({ fullscreen = false, message = "Loading..." }) => {
  if (fullscreen) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center gap-8 bg-slate-950">
        <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-indigo-500" />
        <h1 className="text-white text-2xl font-semibold">{message}</h1>
      </main>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-10 h-10 rounded-full border-4 border-slate-700 border-t-indigo-500" />
    </div>
  );
};

export default LoadingSpinner;
