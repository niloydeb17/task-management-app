import React, { useEffect, useRef } from 'react';
import { Rive, Layout, Fit, Alignment } from '@rive-app/react-canvas';

interface RiveAnimationProps {
  src: string; // URL or path to .riv file
  className?: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  loop?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const RiveAnimation: React.FC<RiveAnimationProps> = ({
  src,
  className = '',
  width = 200,
  height = 200,
  autoplay = true,
  loop = true,
  onLoad,
  onError,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const riveInstanceRef = useRef<Rive | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const riveInstance = new Rive({
        src,
        canvas: canvasRef.current,
        autoplay,
        layout: new Layout({
          fit: Fit.Cover,
          alignment: Alignment.Center,
        }),
        onLoad: () => {
          console.log('Rive animation loaded successfully');
          onLoad?.();
        },
        onLoadError: (error) => {
          console.error('Rive animation failed to load:', error);
          onError?.(error);
        },
      });

      riveInstanceRef.current = riveInstance;

      return () => {
        if (riveInstanceRef.current) {
          riveInstanceRef.current.cleanup();
        }
      };
    } catch (error) {
      console.error('Error creating Rive instance:', error);
      onError?.(error as Error);
    }
  }, [src, autoplay, onLoad, onError]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={width * 2}
      height={height * 2}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        imageRendering: 'crisp-edges'
      }}
    />
  );
};

// Example usage component
export const RiveAnimationDemo = () => {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-2xl font-bold">Rive Animation Demo</h2>
      
      {/* Example with a public Rive file */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Sample Animation</h3>
        <RiveAnimation
          src="https://cdn.rive.app/animations/vehicles.riv"
          width={300}
          height={200}
          className="border rounded"
        />
      </div>
      
      {/* Instructions */}
      <div className="text-center text-gray-600 max-w-md">
        <p className="mb-2">
          To use your own Rive animations:
        </p>
        <ol className="text-left space-y-1">
          <li>1. Create animations at <a href="https://rive.app" className="text-blue-500 underline">rive.app</a></li>
          <li>2. Export as .riv files</li>
          <li>3. Place in your public folder</li>
          <li>4. Use the src prop to reference them</li>
        </ol>
      </div>
    </div>
  );
};
