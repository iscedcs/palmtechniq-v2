"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Clock,
  TrendingUp,
  BookOpen,
  User,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchStore } from "@/lib/store/search-store";
import { generateRandomAvatar } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "course" | "user" | "category";
  title: string;
  subtitle?: string;
  image?: string;
  rating?: number;
  students?: number;
  price?: number;
  level?: string;
  url: string;
}

const mockSearchResults: SearchResult[] = [
  {
    id: "1",
    type: "course",
    title: "Advanced React Development",
    subtitle: "by Sarah Johnson",
    image: "/placeholder.svg?height=60&width=80",
    rating: 4.8,
    students: 1247,
    price: 89.99,
    level: "Advanced",
    url: "/courses/advanced-react",
  },
  {
    id: "2",
    type: "course",
    title: "Python for Data Science",
    subtitle: "by Dr. Michael Chen",
    image: "/placeholder.svg?height=60&width=80",
    rating: 4.9,
    students: 987,
    price: 79.99,
    level: "Intermediate",
    url: "/courses/python-data-science",
  },
  {
    id: "3",
    type: "user",
    title: "Sarah Johnson",
    subtitle: "Senior React Developer & Instructor",
    image: generateRandomAvatar(),
    url: "/tutors/sarah-johnson",
  },
  {
    id: "4",
    type: "category",
    title: "Web Development",
    subtitle: "234 courses available",
    url: "/categories/web-development",
  },
];

const popularSearches = [
  "React",
  "Python",
  "Machine Learning",
  "JavaScript",
  "UI/UX Design",
  "Data Science",
  "Node.js",
  "TypeScript",
];

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    query,
    recentSearches,
    setQuery,
    addRecentSearch,
    clearRecentSearches,
  } = useSearchStore();

  const debouncedQuery = useDebounce(query, 300);

  // Handle search
  useEffect(() => {
    if (debouncedQuery.trim()) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const filteredResults = mockSearchResults.filter(
          (result) =>
            result.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            result.subtitle
              ?.toLowerCase()
              .includes(debouncedQuery.toLowerCase())
        );
        setResults(filteredResults);
        setIsLoading(false);
      }, 500);
    } else {
      setResults([]);
      setIsLoading(false);
    }
  }, [debouncedQuery]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery);
      setIsOpen(false);
      // Navigate to search results page
      window.location.href = `/search?q=₦{encodeURIComponent(searchQuery)}`;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    addRecentSearch(result.title);
    setIsOpen(false);
    window.location.href = result.url;
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "course":
        return <BookOpen className="w-4 h-4 text-neon-blue" />;
      case "user":
        return <User className="w-4 h-4 text-neon-purple" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case "Beginner":
        return "text-green-400 border-green-400";
      case "Intermediate":
        return "text-yellow-400 border-yellow-400";
      case "Advanced":
        return "text-red-400 border-red-400";
      default:
        return "text-gray-400 border-gray-400";
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          placeholder="Search courses, instructors, topics... (⌘K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-12 glass-card border-white/20 focus:border-neon-blue/50 transition-all duration-200"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 hover:bg-white/10"
            onClick={() => setQuery("")}>
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Search Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full mt-2 w-full glass-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}>
            {/* Loading State */}
            {isLoading && (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Searching...</p>
              </div>
            )}

            {/* Search Results */}
            {!isLoading && results.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                <div className="p-2">
                  <p className="text-xs text-gray-400 px-3 py-2 font-medium">
                    Search Results
                  </p>
                  {results.map((result, index) => (
                    <motion.div
                      key={result.id}
                      className="p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleResultClick(result)}>
                      <div className="flex items-center gap-3">
                        {result.type === "user" ? (
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={result.image || generateRandomAvatar()}
                            />
                            <AvatarFallback>
                              {result.title.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ) : result.type === "course" ? (
                          <Image
                            src={result.image || generateRandomAvatar()}
                            alt={result.title}
                            width={48}
                            height={32}
                            className="w-12 h-8 rounded object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center">
                            {getResultIcon(result.type)}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-white truncate">
                              {result.title}
                            </h4>
                            {result.level && (
                              <Badge
                                variant="outline"
                                className={`text-xs px-1 py-0 ₦{getLevelColor(
                                  result.level
                                )}`}>
                                {result.level}
                              </Badge>
                            )}
                          </div>
                          {result.subtitle && (
                            <p className="text-sm text-gray-400 truncate">
                              {result.subtitle}
                            </p>
                          )}
                          {result.type === "course" && (
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              {result.rating && (
                                <span className="flex items-center gap-1">
                                  ⭐ {result.rating}
                                </span>
                              )}
                              {result.students && (
                                <span>
                                  {result.students.toLocaleString()} students
                                </span>
                              )}
                              {result.price && (
                                <span className="text-neon-blue font-medium">
                                  ₦{result.price}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!isLoading && query && results.length === 0 && (
              <div className="p-6 text-center">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-2">
                  No results found for "{query}"
                </p>
                <p className="text-gray-500 text-sm">
                  Try searching for courses, instructors, or topics
                </p>
              </div>
            )}

            {/* Recent Searches & Popular */}
            {!isLoading && !query && (
              <div className="max-h-96 overflow-y-auto">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="p-2 border-b border-white/10">
                    <div className="flex items-center justify-between px-3 py-2">
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Recent Searches
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-500 hover:text-gray-400">
                        Clear
                      </Button>
                    </div>
                    {recentSearches.slice(0, 5).map((search, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors flex items-center gap-3"
                        onClick={() => handleSearch(search)}>
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300">{search}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Popular Searches */}
                <div className="p-2">
                  <p className="text-xs text-gray-400 font-medium px-3 py-2 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    Popular Searches
                  </p>
                  <div className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {popularSearches.map((search, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-white/10 transition-colors border-white/20 text-gray-300"
                          onClick={() => handleSearch(search)}>
                          {search}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-3 border-t border-white/10 bg-white/5">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Press Enter to search</span>
                <span>ESC to close</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
