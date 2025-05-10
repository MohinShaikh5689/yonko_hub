'use client'

import { useEffect } from "react";

export default function TokenExpiryChecker() {
  useEffect(() => {
    // Function to check if stored tokens are expired
    const checkTokenExpiry = () => {
      if (typeof window !== 'undefined') {
        const expiry = localStorage.getItem('expiry');
        const token = localStorage.getItem('token');
        
        // If there's a token and expiry date
        if (token && expiry) {

          const expiryDate = parseInt(expiry);
          
          // If current time is past the expiry date
          if (Date.now() > expiryDate) {
            console.log("Token expired, removing credentials");
            // Clear authentication data
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('expiry');
            localStorage.removeItem('email');
            localStorage.removeItem('name');
            localStorage.removeItem('profilePicture');
          }
        }
      }
    };
    
    // Check immediately on mount
    checkTokenExpiry();
    
    // Also check periodically (every hour)
    const interval = setInterval(checkTokenExpiry, 60 * 60 * 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  // This component doesn't render anything
  return null;
}