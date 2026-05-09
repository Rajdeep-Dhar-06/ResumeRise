import React from "react";
import "./LoadingSpinner.scss";

const LoadingSpinner = ({ fullscreen = false, message = "Loading..." }) => {
  if (fullscreen) {
    return (
      <main className="loading-screen">
        <div className="spinner"></div>
        <h1>{message}</h1>
      </main>
    );
  }

  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingSpinner;
