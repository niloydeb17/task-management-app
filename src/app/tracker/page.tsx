'use client';

import { ProtectedRoute } from "@/components/ProtectedRoute";
import PackageTrackerCardDemo from "@/components/PackageTrackerCardDemo";

export default function TrackerPage() {
  return (
    <ProtectedRoute>
      <PackageTrackerCardDemo />
    </ProtectedRoute>
  );
}
