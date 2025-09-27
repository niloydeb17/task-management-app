'use client';

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RiveAnimationDemo } from "@/components/ui/rive-animation";

export default function RiveDemoPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <RiveAnimationDemo />
        </div>
      </div>
    </ProtectedRoute>
  );
}
