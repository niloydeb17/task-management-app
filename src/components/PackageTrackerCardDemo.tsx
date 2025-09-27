import React from 'react';
import { PackageTrackerCard, PackageTrackerCardProps } from '@/components/ui/tracker-card';

const PolandFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" className="h-4 w-6 rounded-sm">
    <rect width="5" height="3" fill="#fff" />
    <rect width="5" height="1.5" y="1.5" fill="#dc143c" />
  </svg>
);

const PackageTrackerCardDemo = () => {
  const trackingUrl = 'https://21st.dev/track/49029880150810129411';

  const cardProps: PackageTrackerCardProps = {
    status: 'Out for Delivery',
    packageNumber: '49029880150810129411',
    destination: 'Poland',
    destinationFlag: <PolandFlag />,
    date: 'Poland - 01/06/25',
    qrCodeValue: trackingUrl,
    packageImage: (
      <img
        src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&crop=center"
        width={200}
        height={200}
        className="drop-shadow-lg rounded-lg"
        alt="Package"
      />
    ),
    onTrackClick: () => alert('Tracking details button clicked!'),
  };

  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center bg-background p-4">
      <PackageTrackerCard {...cardProps} />
    </div>
  );
};

export default PackageTrackerCardDemo;
