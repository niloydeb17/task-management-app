import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

import { cn } from '@/lib/utils'; // Assuming you have a utility for classnames

// Props interface for type safety and reusability
export interface PackageTrackerCardProps {
  status: string;
  packageNumber: string;
  destination: string;
  destinationFlag: React.ReactNode;
  date: string;
  qrCodeValue: string;
  packageImage: React.ReactNode;
  onTrackClick?: () => void;
  className?: string;
}

// A simple container for the package image with an animated background
const PackageImageContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="relative flex h-72 w-full items-center justify-center overflow-hidden">
    {/* Animated background to simulate a conveyor belt */}
    <div
      className={cn(
        'absolute inset-0 z-0 h-full w-full',
        'bg-[hsl(var(--muted)/0.3)]',
        'bg-[size:80px_80px]',
        'bg-gradient-to-r from-transparent via-[hsl(var(--muted)/0.3)] to-transparent',
        'animate-conveyor-belt' // This requires a custom animation
      )}
      style={{
        backgroundImage: `
          repeating-linear-gradient(45deg, transparent, transparent 25px, hsl(var(--muted)/0.2) 25px, hsl(var(--muted)/0.2) 50px),
          repeating-linear-gradient(-45deg, transparent, transparent 25px, hsl(var(--muted)/0.2) 25px, hsl(var(--muted)/0.2) 50px)
        `,
      }}
    />
    <div className="z-10">{children}</div>
  </div>
);

export const PackageTrackerCard = ({
  status,
  packageNumber,
  destination,
  destinationFlag,
  date,
  qrCodeValue,
  packageImage,
  onTrackClick,
  className,
}: PackageTrackerCardProps) => {
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
      {/* Top Section */}
      {onTrackClick && (
        <div className="p-4">
          <motion.button
            variants={itemVariants}
            onClick={onTrackClick}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-muted/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Show full tracking
          </motion.button>
        </div>
      )}

      {/* Image Section */}
      <motion.div variants={itemVariants}>
        <PackageImageContainer>{packageImage}</PackageImageContainer>
      </motion.div>

      {/* Details Section */}
      <div className="px-4 py-6 text-center">
        <motion.div variants={itemVariants} className="flex items-center justify-center gap-2">
          {destinationFlag}
          <span className="text-sm font-medium text-muted-foreground">{destination}</span>
        </motion.div>

        <motion.h2 variants={itemVariants} className="mt-2 text-3xl font-bold tracking-tight">
          {status}
        </motion.h2>

        <div className="mt-2">
          {packageNumber && (
            <motion.div variants={itemVariants} className="space-y-1 mb-4">
              <p className="text-xs text-muted-foreground">Package Number:</p>
              <p className="font-mono text-sm">{packageNumber}</p>
            </motion.div>
          )}
          
          <motion.div variants={itemVariants} className="space-y-1">
            <p className="text-xs text-muted-foreground">{date}</p>
          </motion.div>
          
          {qrCodeValue && (
            <motion.div
              variants={itemVariants}
              className="mt-4 flex justify-center"
            >
              <div className="rounded-lg border p-1">
                <QRCodeCanvas value={qrCodeValue} size={64} bgColor="transparent" fgColor="hsl(var(--foreground))" />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
