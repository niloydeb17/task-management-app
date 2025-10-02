'use client';

import { usePathname } from "next/navigation";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export default function ClientHeader() {
  const pathname = usePathname();
  
  // Hide header on dashboard and all dashboard-related pages
  const hideHeader = pathname.startsWith('/dashboard') || 
                    pathname.startsWith('/kanban') || 
                    pathname.startsWith('/inbox') || 
                    pathname.startsWith('/streaks') || 
                    pathname.startsWith('/tracker') || 
                    pathname.startsWith('/teams') || 
                    pathname.startsWith('/team/');

  if (hideHeader) {
    return null;
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              TaskFlow
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <SignedOut>
              <SignInButton mode="redirect">
                <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="redirect">
                <button className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}
