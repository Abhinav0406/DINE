import React, { useRef, useEffect } from 'react';
import Lottie from 'lottie-react';
import loadingFoodAnimation from '../assets/lottie/loading-food.json';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text = 'Preparing your experience...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-24 h-24',
    lg: 'w-40 h-40'
  };

  const lottieRef = useRef<any>(null);

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(0.5);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center w-full h-full min-h-screen bg-black/30 backdrop-blur-md">
      <div className="flex flex-col items-center justify-center">
      <div className={sizeClasses[size] + ' mb-4'}>
          <Lottie lottieRef={lottieRef} animationData={loadingFoodAnimation} loop={true} />
        </div>
        {text && <p className="text-gray-100 text-lg font-medium drop-shadow-lg">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner; 