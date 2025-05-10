'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger,
    NavigationMenuLink
} from "@/components/ui/navigation-menu";
import { Button } from './ui/button';

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [token, setToken] = useState<string | null>(null);
    const [name, setName] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const router = useRouter();
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Client-side-only code
        if (typeof window !== 'undefined') {
            setToken(localStorage.getItem('token'));
            setName(localStorage.getItem('name'));
            setEmail(localStorage.getItem('email'));
            setProfilePicture(localStorage.getItem('profilePicture'));
        }

        const handleScroll = () => {
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Focus input when search is opened
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/anime/search/${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchOpen(false);
            setSearchQuery('');
        }
    };

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
        if (isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
        }
    };

    const menuItems = [
        {
            path: '/anime',
            label: 'Anime',
            icon: '🍥',
            submenu: [
                {path: '/anime', label: 'Home', icon: '🏠'},
                { path: '/anime/airing', label: 'Currently Airing', icon: '📺' },
                { path: '/anime/liked', label: 'Most Liked', icon: '🔥' },
                { path: '/anime/popular', label: 'Popular', icon: '⭐' },
                { path: '/anime/upcoming', label: 'Upcoming', icon: '📅' }
            ]
        },
        { path: '/anime/genre', label: 'Genres', icon: '🏷️' },
        { path: '/communities', label: 'Community', icon: '👥' }
    ];

    const toggleMobileMenu = () => {
        if (isSearchOpen) {
            setIsSearchOpen(false);
        }
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleSignOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('name');
        localStorage.removeItem('email');
        localStorage.removeItem('profilePicture');
        localStorage.removeItem('expiry');
        localStorage.removeItem('userId')
        localStorage.removeItem('user');
        localStorage.removeItem('watchlist');
        localStorage.removeItem('friends');
        localStorage.removeItem('Communities');
        localStorage.removeItem('CommunitiesTimestamp');
        localStorage.removeItem('messageUsers');
        localStorage.removeItem('messageUsersTimestamp');

        setToken(null);
        setName(null);
        setEmail(null);
        router.push('/');
    };

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled
            ? 'bg-[#0a0914]/90 backdrop-blur-md shadow-lg shadow-indigo-500/20'
            : 'bg-gradient-to-b from-[#0a0914] to-transparent'
            }`}>
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo and App Name */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative w-10 h-10 overflow-hidden rounded-full 
                        border-2 border-indigo-500 shadow-lg shadow-indigo-500/50 hover:rotate-6 transition-all duration-300">
                        <Image
                            src="https://i.pinimg.com/736x/d4/17/ba/d417ba6d037fe613df2697c388cb2cb9.jpg"
                            alt="Yonko Hub"
                            width={40}
                            height={40}
                            className="object-cover transform group-hover:scale-110 transition-transform duration-300"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="anime-gradient-text text-xl font-extrabold tracking-tighter">
                            YONKO HUB
                        </span>
                        <span className="text-[10px] text-indigo-300 tracking-widest opacity-75">
                            ANIME COMMUNITY
                        </span>
                    </div>
                </Link>

                {/* Mobile buttons */}
                <div className="flex md:hidden items-center gap-2">
                    {/* Search button for mobile */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="p-2 rounded-full hover:bg-indigo-600/20 text-gray-300 hover:text-white transition-all duration-300"
                        onClick={toggleSearch}
                    >
                        {isSearchOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        )}
                    </Button>

                    {/* Menu button for mobile */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="p-2 rounded-full hover:bg-indigo-600/20 text-gray-300 hover:text-white transition-all duration-300"
                        onClick={toggleMobileMenu}
                    >
                        {isMobileMenuOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </Button>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center">
                    <NavigationMenu className="relative">
                        <NavigationMenuList className="flex items-center gap-1">
                            {menuItems.map((item) =>
                                item.submenu ? (
                                    <NavigationMenuItem key={item.path} className="relative">
                                        <NavigationMenuTrigger className="px-3 py-2 rounded-lg text-indigo-100 hover:bg-indigo-600/20 
                                            hover:shadow-md hover:shadow-indigo-500/20 transition-all duration-300 data-[state=open]:bg-indigo-600/30">
                                            <span className="mr-1">{item.icon} {item.label}</span>
                                        </NavigationMenuTrigger>
                                        <NavigationMenuContent className="min-w-[220px] animate-in fade-in-50 
                                            data-[motion=from-start]:slide-in-from-left-5
                                            data-[motion=from-end]:slide-in-from-right-5
                                            data-[motion=to-start]:slide-out-to-left-5
                                            data-[motion=to-end]:slide-out-to-right-5">
                                            <ul className="p-2 bg-[#141430]/90 backdrop-blur-md
                                                rounded-xl shadow-xl shadow-indigo-500/20 overflow-hidden">
                                                {item.submenu.map((subItem) => (
                                                    <li key={subItem.path}>
                                                        <NavigationMenuLink asChild>
                                                            <Link
                                                                href={subItem.path}
                                                                className="flex items-center gap-2 p-2.5 px-3 text-sm text-indigo-100 rounded-lg
                                                                        hover:bg-indigo-600/30 hover:text-white transition-all duration-200"
                                                            >
                                                                <span className="text-base">{subItem.icon} {subItem.label}</span>
                                                            </Link>
                                                        </NavigationMenuLink>
                                                    </li>
                                                ))}
                                            </ul>
                                        </NavigationMenuContent>
                                    </NavigationMenuItem>
                                ) : (
                                    <NavigationMenuItem key={item.path}>
                                        <NavigationMenuLink asChild>
                                            <Link
                                                href={item.path}
                                                className="flex items-center gap-2 px-3 py-2 text-indigo-100 rounded-lg
                                                    hover:bg-indigo-600/20 hover:text-white hover:shadow-md hover:shadow-indigo-500/20
                                                    transition-all duration-300"
                                            >
                                                <span>{item.icon} {item.label}</span>
                                            </Link>
                                        </NavigationMenuLink>
                                    </NavigationMenuItem>
                                )
                            )}
                        </NavigationMenuList>
                    </NavigationMenu>

                    {/* Search and User Actions */}
                    <div className="ml-6 flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="p-2 rounded-full hover:bg-indigo-600/20 text-gray-300 hover:text-white
                                transition-all duration-300 hover:shadow-inner hover:shadow-indigo-500/30 relative overflow-hidden group"
                            onClick={toggleSearch}
                        >
                            <span className="relative z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <span className="absolute inset-0 rounded-full bg-indigo-500/10 scale-0 group-hover:scale-100 transition-transform duration-300"></span>
                        </Button>

                        {token ? (
                            <div className="flex items-center gap-3">
                                <Link href="/notification" className="relative">
                                    <Button
                                        variant="ghost"
                                        className="p-2 rounded-full hover:bg-indigo-600/20 text-gray-300 hover:text-white
                                        transition duration-300 hover:shadow-md hover:shadow-indigo-500/20 relative"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                                    </Button>
                                </Link>

                                <Link href="/friends" className="relative">
                                    <Button
                                        variant="ghost"
                                        className="p-2 rounded-full hover:bg-indigo-600/20 text-gray-300 hover:text-white
                                            transition duration-300 hover:shadow-md hover:shadow-indigo-500/20 relative"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </Button>
                                </Link>

                                <Link href="/chat" className="relative">
                                    <Button
                                        variant="ghost"
                                        className="p-2 rounded-full hover:bg-indigo-600/20 text-gray-300 hover:text-white
                                            transition duration-300 hover:shadow-md hover:shadow-indigo-500/20 relative"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8m-4 4h4m-4 4h4m-6 0H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2h-4l-4 4v-4z" />
                                        </svg>
                                    </Button>
                                </Link>


                                {/* User Avatar */}

                                <div className="group relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-700 p-0.5 
                                        cursor-pointer transform hover:scale-110 transition-all duration-300
                                        hover:shadow-md hover:shadow-indigo-500/40">
                                        <div className="w-full h-full rounded-full overflow-hidden">
                                            <Image
                                                src={profilePicture || 'https://i.pinimg.com/736x/9f/c5/cf/9fc5cf14dc2fdefaacf70d52a12415b3.jpg'}
                                                alt="User Avatar"
                                                width={48}
                                                height={48}
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>

                                    {/* Avatar hover menu */}
                                    <div className="absolute top-full right-0 mt-2 w-48 opacity-0 invisible 
                                        group-hover:opacity-100 group-hover:visible transition-all duration-300 transform 
                                        group-hover:translate-y-0 translate-y-2 z-50">
                                        <div className="bg-[#141430]/90 backdrop-blur-md border border-indigo-500/30 
                                            rounded-xl shadow-xl shadow-indigo-500/20 overflow-hidden p-1">
                                            <div className="py-2 px-3 border-b border-indigo-500/20">
                                                <p className="text-sm font-medium text-white"> {name} </p>
                                                <p className="text-xs text-indigo-300/70"> {email} </p>
                                            </div>
                                            <ul className="py-1">
                                                <li>
                                                    <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-100 hover:bg-indigo-600/30 rounded-md transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        Profile
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link href="/profile/edit" className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-100 hover:bg-indigo-600/30 rounded-md transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        Settings
                                                    </Link>
                                                </li>
                                            </ul>
                                            <div className="pt-1 mt-1 border-t border-indigo-500/20">
                                                <button
                                                    onClick={handleSignOut}
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 ml-2">
                                <Link href="/Auth/register">
                                    <Button
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-md 
                                         hover:from-indigo-500 hover:to-purple-500 transition-all duration-300
                                        shadow-sm shadow-indigo-500/30 hover:shadow-md hover:shadow-indigo-500/40 
                                        hover:translate-y-[-1px] font-medium text-sm border-0 relative overflow-hidden group"
                                    >
                                        <span className="relative z-10">Sign Up</span>
                                        <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                                    </Button>
                                </Link>
                                <Link href="/Auth/login">
                                    <Button
                                        variant="outline"
                                        className="border border-indigo-500/50 bg-transparent text-indigo-200 px-4 py-2 rounded-md 
                                         hover:bg-indigo-600/20 hover:text-white hover:border-indigo-400 
                                        transition-all duration-300 font-medium text-sm relative overflow-hidden group"
                                    >
                                        <span className="relative z-10">Log In</span>
                                        <span className="absolute top-0 left-0 w-0 h-full bg-indigo-500/10 group-hover:w-full transition-all duration-300"></span>
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pop-up Search Bar */}
            <div className={`${isSearchOpen ? 'block' : 'hidden'} absolute top-full left-0 w-full bg-[#0a0914]/95 backdrop-blur-md border-t border-b border-indigo-500/20 shadow-lg shadow-indigo-500/10 p-4 animate-in fade-in-50 duration-200`}>
                <form onSubmit={handleSearchSubmit}>
                    <div className="relative max-w-2xl mx-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search for anime..."
                            className="w-full pl-10 pr-12 py-3 bg-[#141430]/60 border border-indigo-500/30 rounded-lg text-white placeholder-indigo-300/60 
                                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md border-0"
                            >
                                Search
                            </Button>
                        </div>
                    </div>
                </form>
                <button
                    className="absolute top-3 right-3 p-2 text-indigo-300 hover:text-white"
                    onClick={() => setIsSearchOpen(false)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-[#0a0914]/95 backdrop-blur-md border-t border-indigo-500/10 shadow-lg shadow-indigo-500/10">
                    <div className="px-4 py-3 space-y-1">
                        {menuItems.map((item) =>
                            item.submenu ? (
                                <div key={item.path} className="mb-2">
                                    <div className="flex items-center px-3 py-2 text-indigo-100 font-medium rounded-lg">
                                        <span>{item.icon} {item.label}</span>
                                    </div>
                                    <div className="pl-5 mt-1 space-y-1">
                                        {item.submenu.map((subItem) => (
                                            <Link
                                                href={subItem.path}
                                                key={subItem.path}
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-100 rounded-lg
                                                hover:bg-indigo-600/30 hover:text-white transition-all duration-200"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <span>{subItem.icon} {subItem.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    href={item.path}
                                    key={item.path}
                                    className="flex items-center gap-2 px-3 py-2 text-indigo-100 rounded-lg
                                    hover:bg-indigo-600/30 hover:text-white transition-all duration-200"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <span>{item.icon} {item.label}</span>
                                </Link>
                            )
                        )}
                    </div>

                    {/* Mobile authentication */}
                    <div className="px-4 py-3 border-t border-indigo-500/10">
                        {!token && (
                            <div className="flex items-center gap-3 mt-3">
                                <Link href="/Auth/register" className="w-1/2">
                                    <Button
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-md 
                                        hover:from-indigo-500 hover:to-purple-500 transition-all duration-300
                                        shadow-sm shadow-indigo-500/30 font-medium text-sm border-0"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Sign Up
                                    </Button>
                                </Link>
                                <Link href="/Auth/login" className="w-1/2">
                                    <Button
                                        variant="outline"
                                        className="w-full border border-indigo-500/50 bg-transparent text-indigo-200 px-4 py-2 rounded-md 
                                        hover:bg-indigo-600/20 hover:text-white hover:border-indigo-400 
                                        transition-all duration-300 font-medium text-sm"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Log In
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {token && (
                            <div className="border-t border-indigo-500/10 pt-3 mt-3">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-700 p-0.5">
                                        <div className="w-full h-full rounded-full overflow-hidden">
                                            <Image
                                                src={profilePicture || 'https://i.pinimg.com/736x/9f/c5/cf/9fc5cf14dc2fdefaacf70d52a12415b3.jpg'}
                                                alt="User Avatar"
                                                width={32}
                                                height={32}
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white"> {name} </p>
                                        <p className="text-xs text-indigo-300/70"> {email} </p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-100 hover:bg-indigo-600/30 rounded-md transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Profile
                                    </Link>

                                    <Link href="/notification" className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-100 hover:bg-indigo-600/30 rounded-md transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9" />
                                        </svg>
                                        Notifications
                                    </Link>

                                    <Link href="/friends" className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-100 hover:bg-indigo-600/30 rounded-md transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Friends
                                    </Link>

                                    <Link href="/chat" className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-100 hover:bg-indigo-600/30 rounded-md transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8m-4 4h4m-4 4h4m-6 0H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2h-4l-4 4v-4z" />
                                        </svg>
                                        Chat
                                    </Link>

                                    <Link href="/profile/edit" className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-100 hover:bg-indigo-600/30 rounded-md transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Settings
                                    </Link>
                                    
                                    <button
                                        onClick={handleSignOut}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}