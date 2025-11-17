"use client";

import { useEffect, useState } from "react";

export default function OrientationManager() {
  const [showWarning, setShowWarning] = useState(false);
  const [canUseLandscape, setCanUseLandscape] = useState(false);

  useEffect(() => {
    // Check if Screen Orientation API is available
    const hasOrientationAPI =
      typeof window !== "undefined" &&
      "orientation" in screen;

    setCanUseLandscape(hasOrientationAPI);

    // Check initial orientation
    const checkOrientation = () => {
      const isPortraitMode = window.innerHeight > window.innerWidth;
      const isMobile = window.innerWidth < 1024;

      // Show warning if mobile and in portrait mode
      setShowWarning(isPortraitMode && isMobile);
    };

    checkOrientation();

    // Listen for orientation changes
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  const requestLandscape = async () => {
    try {
      // Request fullscreen first (required for orientation lock)
      const elem = document.documentElement;

      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      }

      // Then try to lock orientation to landscape
      // TypeScript doesn't have types for this experimental API yet
      if (screen.orientation && "lock" in screen.orientation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (screen.orientation as any).lock("landscape");
        setShowWarning(false);
      }
    } catch (error) {
      console.log("Orientation lock not supported or denied:", error);
      // Fallback: CSS rotation is already active
      setShowWarning(false);
    }
  };

  // Don't show warning - CSS rotation handles it automatically
  if (!showWarning) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        color: "white",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "64px", marginBottom: "20px" }}>📱 ↻</div>
      <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>
        Landscape Mode Required
      </h2>
      <p style={{ fontSize: "16px", marginBottom: "30px", opacity: 0.8 }}>
        This game works best in landscape orientation
      </p>

      {canUseLandscape && (
        <button
          onClick={requestLandscape}
          style={{
            backgroundColor: "#4ade80",
            color: "white",
            border: "none",
            padding: "15px 30px",
            fontSize: "18px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Enable Fullscreen + Landscape
        </button>
      )}

      <p
        style={{
          fontSize: "14px",
          marginTop: "20px",
          opacity: 0.6,
          maxWidth: "300px",
        }}
      >
        {canUseLandscape
          ? "Or simply rotate your device to landscape"
          : "Please rotate your device to landscape"}
      </p>
    </div>
  );
}
