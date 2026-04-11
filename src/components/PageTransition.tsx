import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('in');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('out');
      setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('in');
      }, 150); // Quick fade out duration
    }
  }, [location, displayLocation]);

  return (
    <div
      className={`transition-all duration-300 ease-in-out transform ${
        transitionStage === 'in'
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-4 scale-[0.98]'
      }`}
    >
      {children}
    </div>
  );
}
