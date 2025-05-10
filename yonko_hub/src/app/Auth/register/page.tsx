"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useRouter } from "next/navigation";

// Form validation schema
const formSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username must be less than 20 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
  gender: z.enum(["male", "female", "unspecified"], {
    required_error: "Please select your gender",
  }),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Define form schema type to use instead of 'any'
type FormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const router = useRouter();

  const baseUrl = 'http://localhost:3001';
  
  // Simple token check - if token exists, redirect to home
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      gender: "male",
      terms: false,
    },
  });

  // Form submission handler with error handling
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setRegisterError(null);
    
    try {
      await axios.post(`${baseUrl}/api/users/auth/signup`, {
        name: values.username,
        email: values.email,
        password: values.password,
        gender: values.gender
      });

      // Redirect to login on success
      router.push("/Auth/login");

    } catch (error: any) {
      // Handle error and display to user
      if (axios.isAxiosError(error) && error.response) {
        setRegisterError(error.response.data.message || "Registration failed. Please try again.");
      } else {
        setRegisterError("An error occurred during registration. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0914] text-gray-100">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
          {/* Left side - Form */}
          <div className="lg:w-1/2 bg-[#141430]/50 backdrop-blur-sm rounded-xl border border-indigo-500/20 p-6 md:p-8">
            <div className="mb-8 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Create an Account</h1>
              <p className="text-gray-400">Join our anime community and start your adventure</p>
            </div>
            
            {/* Display error message if exists */}
            {registerError && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200">
                {registerError}
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-indigo-200">Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your username" 
                          className="bg-[#0a0914]/60 border-indigo-500/30 focus:border-indigo-500 text-white" 
                          autoComplete="username"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
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
                          autoComplete="email"
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
                            placeholder="Create a password" 
                            type={showPassword ? "text" : "password"}
                            className="bg-[#0a0914]/60 border-indigo-500/30 focus:border-indigo-500 text-white pr-10" 
                            autoComplete="new-password"
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-indigo-200">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Confirm your password" 
                            type={showConfirmPassword ? "text" : "password"}
                            className="bg-[#0a0914]/60 border-indigo-500/30 focus:border-indigo-500 text-white pr-10" 
                            autoComplete="new-password"
                            {...field} 
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-300"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-indigo-200">Gender</FormLabel>
                      <FormControl>
                        <select
                          className="bg-[#0a0914]/60 border-indigo-500/30 focus:border-indigo-500 text-white w-full p-2 rounded-md"
                          {...field}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm text-gray-400">
                          I agree to the <span className="text-indigo-400 hover:underline cursor-pointer">Terms of Service</span> and <span className="text-indigo-400 hover:underline cursor-pointer">Privacy Policy</span>
                        </FormLabel>
                        <FormMessage className="text-red-400" />
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
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
                
                <div className="text-center text-gray-400 text-sm">
                  Already have an account? <Link href="/Auth/login" className="text-indigo-400 hover:underline">Sign in</Link>
                </div>
              </form>
            </Form>
          </div>

          <div className="lg:w-1/2 flex flex-col justify-center">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-indigo-300">Join Yonko Hub</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-indigo-500/20 rounded-full p-2 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Discover Anime</h3>
                    <p className="text-gray-400">Explore thousands of anime titles, from classics to the latest releases</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-indigo-500/20 rounded-full p-2 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Join the Community</h3>
                    <p className="text-gray-400">Connect with fellow anime fans, share opinions and recommendations</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-indigo-500/20 rounded-full p-2 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Track Your Watchlist</h3>
                    <p className="text-gray-400">Create personalized lists to keep track of what you&apos;ve watched and plan to watch</p>
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