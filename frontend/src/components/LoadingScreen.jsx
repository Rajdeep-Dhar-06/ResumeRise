import React from "react";
import "./LoadingScreen.scss";

const LoadingScreen = ({ message = "Loading your interview plan…" }) => (
  <main className="loading-screen">
    <span className="loading-screen__spinner" aria-hidden="true" />
    <p className="loading-screen__text">{message}</p>
  </main>
);

export default LoadingScreen;
