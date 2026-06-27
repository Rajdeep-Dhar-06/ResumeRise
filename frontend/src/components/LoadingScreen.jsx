import React from "react";

const LoadingScreen = ({ message = "Loading your interview plan…" }) => (
  <main class="min-h-screen w-full flex flex-col items-center justify-center gap-4 p-12 bg-slate-950 text-slate-200">
    <span class="block w-12 h-12 rounded-full border-4 border-slate-700 border-t-indigo-500 animate-spin" aria-hidden="true"></span>

    <p class="text-base text-slate-400 tracking-wide">{message}</p>
  </main>
);

export default LoadingScreen;
