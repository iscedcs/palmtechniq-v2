"use client";

import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardHeader, CardTitle } from "@/components/ui/card";

interface SearchFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  studentCounts: {
    total: number;
    active: number;
    completed: number;
  };
}

export function SearchFilterBar({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
  sortBy,
  onSortChange,
  studentCounts,
}: SearchFilterBarProps) {
  return (
    <>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-2xl font-bold text-white">
            Student Directory
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 glass-card border-white/20 bg-white/5"
              />
            </div>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </CardHeader>

      <div className="px-6 py-4 border-b border-white/10">
        {/* Tabs */}
        <Tabs
          value={filterStatus}
          onValueChange={onFilterChange}
          className="mb-6">
          <TabsList className="glass-card border-white/10 p-1">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-neon-blue/20">
              All Students ({studentCounts.total})
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="data-[state=active]:bg-neon-blue/20">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2" />
              Active ({studentCounts.active})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-neon-blue/20">
              Completed ({studentCounts.completed})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Sort Options */}
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Sort by:</span>
          {[
            { label: "Most Recent", value: "recent" },
            { label: "Progress", value: "progress" },
            { label: "Name", value: "name" },
          ].map((option) => (
            <Button
              key={option.value}
              variant={sortBy === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onSortChange(option.value)}
              className={`${
                sortBy === option.value
                  ? "bg-gradient-to-r from-neon-blue to-neon-purple"
                  : "border-white/20 text-white hover:bg-white/10 bg-transparent"
              }`}>
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}
