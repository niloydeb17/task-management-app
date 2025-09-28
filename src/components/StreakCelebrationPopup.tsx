"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { RiveAnimation } from '@/components/ui/rive-animation';

interface StreakCelebrationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  completedTasks: number;
}

export const StreakCelebrationPopup: React.FC<StreakCelebrationPopupProps> = ({
  isOpen,
  onClose,
  currentStreak,
  completedTasks
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const getCurrentDayIndex = () => {
    return new Date().getDay();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 bg-white rounded-full p-1 shadow-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>

            {/* Content */}
            <div className="p-6 text-center">
              {/* Flame Icon */}
              <div className="mb-4 flex justify-center">
                <div className="w-24 h-24">
                  <RiveAnimation
                    src="/streak-normal.riv"
                    width={96}
                    height={96}
                    autoplay={true}
                    loop={true}
                  />
                </div>
              </div>

              {/* Weekly Streak Display */}
              <div className="mb-4">
                <div className="flex justify-center gap-2 mb-2">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                    const isActive = index === getCurrentDayIndex();
                    const isWeekend = index >= 5;
                    
                    return (
                      <div key={index} className="flex flex-col items-center gap-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isActive 
                            ? 'bg-yellow-500' 
                            : isWeekend 
                              ? 'bg-gray-300' 
                              : 'bg-gray-400'
                        }`}>
                          <Zap className={`w-3 h-3 ${
                            isActive ? 'text-white' : isWeekend ? 'text-gray-500' : 'text-white'
                          }`} />
                        </div>
                        <span className={`text-xs font-medium ${
                          isActive ? 'text-orange-500' : 'text-gray-600'
                        }`}>
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Day Label */}
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-3">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>{getCurrentDay()}</span>
                </div>
              </div>

              {/* Celebration Text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="space-y-2"
              >
                <h2 className="text-xl font-bold text-gray-900">
                  You started a streak!
                </h2>
                <p className="text-sm text-gray-600">
                  Completed {completedTasks} tasks today
                </p>
                <p className="text-sm font-medium text-orange-500">
                  Current Streak: {currentStreak} day{currentStreak !== 1 ? 's' : ''}
                </p>
              </motion.div>

              {/* Sparkle Effects */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                    style={{
                      left: `${20 + (i * 15)}%`,
                      top: `${30 + (i % 2) * 20}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
