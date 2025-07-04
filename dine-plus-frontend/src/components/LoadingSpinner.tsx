import React from 'react';
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

  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-screen">
      <div className={sizeClasses[size] + ' mb-4'}>
        <Lottie animationData={loadingFoodAnimation} loop={true} />
      </div>
      {text && <p className="text-gray-500 text-lg font-medium">{text}</p>}
    </div>
  );
};

export default LoadingSpinner; 