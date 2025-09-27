import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Calendar, Target, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  targetStreak: number;
  streakType: 'daily' | 'weekly' | 'monthly';
  lastActivityDate?: string;
  onStreakClick?: () => void;
  className?: string;
}

export const StreakCard = ({
  currentStreak,
  longestStreak,
  targetStreak,
  streakType,
  lastActivityDate,
  onStreakClick,
  className,
}: StreakCardProps) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const getStreakTypeLabel = () => {
    switch (streakType) {
      case 'daily': return 'Day';
      case 'weekly': return 'Week';
      case 'monthly': return 'Month';
      default: return 'Day';
    }
  };

  const getStreakColor = () => {
    if (currentStreak >= targetStreak) return 'text-green-500';
    if (currentStreak >= targetStreak * 0.7) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getStreakProgress = () => {
    return Math.min((currentStreak / targetStreak) * 100, 100);
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'w-full max-w-sm overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-lg',
        className
      )}
    >
      {/* Header Section */}
      <div className="p-6 pb-4">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className={cn("h-5 w-5", getStreakColor())} />
            <span className="text-sm font-medium text-muted-foreground">
              {streakType.charAt(0).toUpperCase() + streakType.slice(1)} Streak
            </span>
          </div>
          <motion.button
            variants={itemVariants}
            onClick={onStreakClick}
            className="rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            View Details
          </motion.button>
        </motion.div>
      </div>

      {/* Main Streak Display */}
      <div className="px-6 pb-4">
        <motion.div variants={itemVariants} className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className={cn("text-4xl font-bold", getStreakColor())}>
              {currentStreak}
            </span>
            <span className="text-lg text-muted-foreground">
              {getStreakTypeLabel()}{currentStreak !== 1 ? 's' : ''}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <motion.div
              variants={itemVariants}
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                currentStreak >= targetStreak ? "bg-green-500" : 
                currentStreak >= targetStreak * 0.7 ? "bg-yellow-500" : "bg-orange-500"
              )}
              style={{ width: `${getStreakProgress()}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${getStreakProgress()}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          
          <p className="text-sm text-muted-foreground">
            {currentStreak >= targetStreak ? '🎉 Target reached!' : 
             `${targetStreak - currentStreak} more to reach your target`}
          </p>
        </motion.div>
      </div>

      {/* Stats Section */}
      <div className="p-6 pt-0">
        <div className="grid grid-cols-2 gap-4">
          <motion.div variants={itemVariants} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-muted-foreground">Best</span>
            </div>
            <p className="text-lg font-bold">{longestStreak}</p>
            <p className="text-xs text-muted-foreground">{getStreakTypeLabel()}{longestStreak !== 1 ? 's' : ''}</p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Target</span>
            </div>
            <p className="text-lg font-bold">{targetStreak}</p>
            <p className="text-xs text-muted-foreground">{getStreakTypeLabel()}{targetStreak !== 1 ? 's' : ''}</p>
          </motion.div>
        </div>
        
        {lastActivityDate && (
          <motion.div variants={itemVariants} className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Last activity: {lastActivityDate}</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
