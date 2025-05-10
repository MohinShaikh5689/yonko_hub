"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import axios from "axios";

// Form validation schema for login
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().optional(),
});

// Define form schema type
type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();

  const baseUrl = "http://localhost:3001";
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Form submission handler
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setLoginError(null);
    
    try {
      const response = await axios.post(`${baseUrl}/api/users/auth/login`, {
        email: values.email,
        password: values.password,
      });

      
      localStorage.setItem("token", response.data.user.token); // Store token in localStorage
      localStorage.setItem('name', response.data.user.name); // Store name in localStorage
      localStorage.setItem('email', response.data.user.email); // Store email in localStorage
      localStorage.setItem('profilePicture', response.data.user.profile); // Store profile picture in localStorage
      localStorage.setItem('userId', response.data.user.Id); // Store userId in localStorage
      localStorage.setItem('expiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
      // Redirect to home page or dashboard
      router.push("/");
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError(
        error.response?.data?.message || "Login failed. Please check your credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Check for existing token and redirect to home if found
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0914] text-gray-100">
      
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
          {/* Left side - Form */}
          <div className="lg:w-1/2 bg-[#141430]/50 backdrop-blur-sm rounded-xl border border-indigo-500/20 p-6 md:p-8">
            <div className="mb-8 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-gray-400">Sign in to continue your anime journey</p>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {loginError && (
                  <div className="p-3 rounded-md bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                    {loginError}
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-indigo-200">Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="your.email@example.com" 
                          type="email"
                          className="bg-[#0a0914]/60 border-indigo-500/30 focus:border-indigo-500 text-white" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-indigo-200">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Enter your password" 
                            type={showPassword ? "text" : "password"}
                            className="bg-[#0a0914]/60 border-indigo-500/30 focus:border-indigo-500 text-white pr-10" 
                            autoComplete="current-password"
                            {...field} 
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-300"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-indigo-500/30 text-indigo-600 focus:ring-indigo-500"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm text-gray-400">
                          Remember me
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                
                <div className="text-center text-gray-400 text-sm">
                  Don't have an account? <Link href="/Auth/register" className="text-indigo-400 hover:underline">Sign up</Link>
                </div>
              </form>
            </Form>
          </div>

          {/* Right side - Content */}
          <div className="lg:w-1/2 flex flex-col justify-center">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-indigo-300">Welcome to Yonko Hub</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-indigo-500/20 rounded-full p-2 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Stream Unlimited Anime</h3>
                    <p className="text-gray-400">Access thousands of episodes in HD quality, ad-free experience</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-indigo-500/20 rounded-full p-2 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Personalized Experience</h3>
                    <p className="text-gray-400">Get recommendations based on your watch history and preferences</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-indigo-500/20 rounded-full p-2 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Secure Login</h3>
                    <p className="text-gray-400">Your data is encrypted and protected with the highest security standards</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animated background elements */}
      <div className="fixed -top-40 -right-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl z-0"></div>
      <div className="fixed -bottom-60 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl z-0"></div>
      
    </div>
  );
}