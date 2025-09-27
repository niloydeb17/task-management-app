import React from 'react';
import { StreakCard, StreakCardProps } from '@/components/ui/streak-card';

const StreakCardDemo = () => {
  const streakProps: StreakCardProps = {
    currentStreak: 7,
    longestStreak: 15,
    targetStreak: 10,
    streakType: 'daily',
    lastActivityDate: 'Today',
    onStreakClick: () => alert('Streak details clicked!'),
  };

  const weeklyStreakProps: StreakCardProps = {
    currentStreak: 3,
    longestStreak: 8,
    targetStreak: 5,
    streakType: 'weekly',
    lastActivityDate: 'This week',
    onStreakClick: () => alert('Weekly streak details clicked!'),
  };

  const monthlyStreakProps: StreakCardProps = {
    currentStreak: 2,
    longestStreak: 4,
    targetStreak: 3,
    streakType: 'monthly',
    lastActivityDate: 'This month',
    onStreakClick: () => alert('Monthly streak details clicked!'),
  };

  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        <StreakCard {...streakProps} />
        <StreakCard {...weeklyStreakProps} />
        <StreakCard {...monthlyStreakProps} />
      </div>
    </div>
  );
};

export default StreakCardDemo;
