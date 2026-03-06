"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GlobalSearch } from "@/components/search/global-search";
import { Loader, BookOpen, User, Folder } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(!!query);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResults() {
      if (!query) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          {
            method: "GET",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch results");
        }

        const data = await response.json();
        setResults(data.results || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred during search",
        );
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchResults();
  }, [query]);

  const courseResults = results.filter((r) => r.type === "course");
  const userResults = results.filter((r) => r.type === "user");
  const categoryResults = results.filter((r) => r.type === "category");

  const getResultIcon = (type: string) => {
    switch (type) {
      case "course":
        return <BookOpen className="w-5 h-5 text-neon-blue" />;
      case "user":
        return <User className="w-5 h-5 text-neon-purple" />;
      case "category":
        return <Folder className="w-5 h-5 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getLevelBadgeColor = (level?: string) => {
    switch (level) {
      case "BEGINNER":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "INTERMEDIATE":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "ADVANCED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-scree">
      {/* Header */}
      <div className="border-b border-white/10 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-xl font-bold text-white mb-6">Search Results</h1>
          <GlobalSearch />
        </div>
      </div>

      {/* Results Container */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-neon-blue" />
            <p className="ml-4 text-gray-400 text-lg">Searching...</p>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!isLoading && !error && results.length === 0 && query && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-xl mb-2">
              No results found for "{query}"
            </p>
            <p className="text-gray-500">
              Try searching with different keywords
            </p>
          </div>
        )}

        {!isLoading && !error && results.length > 0 && (
          <div>
            <p className="text-gray-400 mb-8 text-lg">
              Found {results.length} result{results.length !== 1 ? "s" : ""} for
              "{query}"
            </p>

            {/* Courses Section */}
            {courseResults.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  {getResultIcon("course")}
                  Courses ({courseResults.length})
                </h2>
                <div className="grid gap-4">
                  {courseResults.map((result) => (
                    <Link
                      key={result.id}
                      href={result.url}
                      className="group block p-4 rounded-lg border border-white/10 hover:border-neon-blue/50 bg-white/5 hover:bg-white/10 transition-all">
                      <div className="flex items-start gap-4">
                        {result.image && (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                            <Image
                              src={result.image}
                              alt={result.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white group-hover:text-neon-blue transition-colors">
                            {result.title}
                          </h3>
                          {result.subtitle && (
                            <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                              {result.subtitle}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 mt-3">
                            {result.level && (
                              <Badge
                                className={`${getLevelBadgeColor(result.level)}`}>
                                {result.level}
                              </Badge>
                            )}
                            {result.rating && (
                              <span className="text-sm text-gray-400 flex items-center gap-1">
                                ⭐ {result.rating}
                                {result.students && (
                                  <span>({result.students} students)</span>
                                )}
                              </span>
                            )}
                            {result.price && (
                              <span className="text-neon-blue font-semibold">
                                ₦{(result.price * 1000).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Users Section */}
            {userResults.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  {getResultIcon("user")}
                  Instructors & Mentors ({userResults.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userResults.map((result) => (
                    <Link
                      key={result.id}
                      href={result.url}
                      className="group block p-4 rounded-lg border border-white/10 hover:border-neon-purple/50 bg-white/5 hover:bg-white/10 transition-all">
                      <div className="flex items-start gap-4">
                        {result.image && (
                          <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-800">
                            <Image
                              src={result.image}
                              alt={result.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-white group-hover:text-neon-purple transition-colors">
                            {result.title}
                          </h3>
                          {result.subtitle && (
                            <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                              {result.subtitle}
                            </p>
                          )}
                          {result.rating && (
                            <p className="text-sm text-gray-400 mt-2">
                              ⭐ {result.rating} rating
                              {result.students && (
                                <span> • {result.students} students</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Section */}
            {categoryResults.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  {getResultIcon("category")}
                  Categories ({categoryResults.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryResults.map((result) => (
                    <Link
                      key={result.id}
                      href={result.url}
                      className="block p-4 rounded-lg border border-white/10 hover:border-yellow-500/50 bg-white/5 hover:bg-white/10 transition-all">
                      <h3 className="font-semibold text-white hover:text-yellow-400 transition-colors">
                        {result.title}
                      </h3>
                      {result.subtitle && (
                        <p className="text-gray-400 text-sm mt-2">
                          {result.subtitle}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!isLoading && !error && results.length === 0 && !query && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Start searching to see results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-8 h-8 animate-spin text-neon-blue" />
        </div>
      }>
      <SearchResultsContent />
    </Suspense>
  );
}
