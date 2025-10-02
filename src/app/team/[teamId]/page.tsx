'use client';

import { use } from 'react';
import { TodoistSidebar } from "@/components/TodoistSidebar";
import { TodoistKanban } from "@/components/TodoistKanban";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { Share, Eye, Settings, Flame } from "lucide-react";
import { useState, useEffect } from "react";
import { PackageTrackerCard, PackageTrackerCardProps } from "@/components/ui/tracker-card";
import { RiveAnimation } from "@/components/ui/rive-animation";

interface TeamPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

// Poland Flag Component
const PolandFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" className="h-4 w-6 rounded-sm">
    <rect width="5" height="3" fill="#fff" />
    <rect width="5" height="1.5" y="1.5" fill="#dc143c" />
  </svg>
);

function TeamPageContent({ params }: TeamPageProps) {
  const resolvedParams = use(params);
  const [isPackageTrackerOpen, setIsPackageTrackerOpen] = useState(false);

  const user = {
    name: "User",
    email: "user@example.com",
    image: null
  };

  const userData = {
    name: "User",
    email: "user@example.com",
    teamId: resolvedParams.teamId,
    role: "member"
  };

  // Streak Card Props
  const streakProps: PackageTrackerCardProps = {
    status: 'You started a streak!',
    packageNumber: '', // Empty to hide package number
    destination: 'Monday',
    destinationFlag: (
      <div className="flex items-center gap-1">
        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
        </svg>
      </div>
    ),
    date: 'Current Streak: 1 day',
    qrCodeValue: '', // Empty to hide QR code
    packageImage: (
      <div className="flex flex-col items-center justify-center h-full">
        {/* Large lightning bolt - Rive Animation */}
        <div className="w-48 h-48 mb-2 mx-auto flex items-center justify-center">
          <RiveAnimation
            src="/streak-normal.riv"
            width={192}
            height={192}
            autoplay={true}
            loop={true}
          />
        </div>
        
        {/* Weekly streak display */}
        <div className="flex gap-2 mt-0">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
            <div key={index} className="flex flex-col items-center gap-0.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                index === 0 ? 'bg-yellow-500' : index >= 5 ? 'bg-gray-300' : 'bg-gray-400'
              }`}>
                <svg className={`w-3 h-3 ${
                  index >= 5 ? 'text-gray-500' : 'text-white'
                }`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                </svg>
              </div>
              <span className={`text-xs font-medium ${
                index === 0 ? 'text-orange-500' : 'text-gray-600'
              }`}>
                {day}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    onTrackClick: undefined, // Remove button
  };

  const handleSignOut = () => {
    // Simple redirect to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

          return (
            <div className="h-screen bg-gray-50">
              {/* Fixed Sidebar */}
              <TodoistSidebar user={userData} />
              
              {/* Fixed Header - Always visible at top of viewport */}
      <div className="fixed top-0 left-64 right-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Share className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsPackageTrackerOpen(true)}
              className="hover:bg-orange-50 hover:text-orange-600"
            >
              <Flame className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          </div>
        </div>
      </div>

              {/* Main Content Area with padding for fixed header */}
              <div className="ml-64 pt-16 h-screen">
                {/* Scrollable Kanban Board */}
                <div className="h-full overflow-x-auto transition-all duration-150">
                  <TodoistKanban teamId={resolvedParams.teamId} showLoading={false} />
                </div>
              </div>

      {/* Streak Notification Popup */}
      {isPackageTrackerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm">
            <button
              onClick={() => setIsPackageTrackerOpen(false)}
              className="absolute -top-2 -right-2 z-10 bg-white rounded-full p-1 shadow-lg hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <PackageTrackerCard {...streakProps} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamPage({ params }: TeamPageProps) {
  return <TeamPageContent params={params} />;
}
