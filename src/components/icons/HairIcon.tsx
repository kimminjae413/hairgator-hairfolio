import React from 'react';

const HairIcon: React.FC = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className="w-full h-full" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    {/* Hair strands */}
    <path d="M2 14c.6.9 1.4 1.5 2.5 2.1 1.6.8 3.5.8 5.1 0 1.2-.6 2-1.2 2.5-2.1" />
    <path d="M22 14c-.6.9-1.4 1.5-2.5 2.1-1.6.8-3.5.8-5.1 0-1.2-.6-2-1.2-2.5-2.1" />
    
    {/* Top of head */}
    <path d="M16 11.9c-.8-2.2-2.3-3.9-4-3.9s-3.2 1.7-4 3.9" />
    
    {/* Center part */}
    <path d="M12 2v6" />
    
    {/* Hair flow */}
    <path d="M11.5 6.5c3 1.5 4.5 4.5 4.5 7.5" />
    <path d="M12.5 6.5c-3 1.5-4.5 4.5-4.5 7.5" />
  </svg>
);

export default HairIcon;
