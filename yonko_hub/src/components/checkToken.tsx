'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // Change this import to next/navigation

export const CheckToken = () => {
    const router = useRouter();
    
    useEffect(() => {
        // This code runs only on the client side
        const token = localStorage.getItem('token');
        if (!token) {
            console.log("Token not found, redirecting to login page");
            router.push('/Auth/login');
        }
        
        // Also check if token is expired
        const expiry = localStorage.getItem('expiry');
        if (token && expiry) {
            const expiryDate = parseInt(expiry);
            if (Date.now() > expiryDate) {
                console.log("Token expired, redirecting to login page");
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                localStorage.removeItem('expiry');
                localStorage.removeItem('email');
                localStorage.removeItem('name');
                localStorage.removeItem('profilePicture');
                router.push('/Auth/login');
            }
        }
    }, []); // Empty dependency array means this runs once on component mount
    
    return null; // This component doesn't render anything
}