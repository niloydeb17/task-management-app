'use client';

import { ProtectedRoute } from "@/components/ProtectedRoute";
import StreakCardDemo from "@/components/StreakCardDemo";

export default function StreaksPage() {
  return (
    <ProtectedRoute>
      <StreakCardDemo />
    </ProtectedRoute>
  );
}
