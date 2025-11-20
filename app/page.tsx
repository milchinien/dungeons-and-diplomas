"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { testSupabaseConnection } from "@/lib/supabase";
import OrientationManager from "@/components/OrientationManager";

// Dynamically import PhaserGame to avoid SSR issues
const PhaserGame = dynamic(() => import("@/components/PhaserGame"), {
  ssr: false,
  loading: () => <div>Loading game...</div>,
});

export default function Home() {
  useEffect(() => {
    // Test Supabase connection on app startup
    testSupabaseConnection();
  }, []);

  return (
    <main style={{ width: "100%", height: "100vh" }}>
      <OrientationManager />
      <PhaserGame />
    </main>
  );
}
