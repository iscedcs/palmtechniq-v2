"use client";

import { motion } from "framer-motion";
import { Search, Filter, ArrowDownUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SearchFilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  filterStatus: "all" | "active" | "inactive";
  onFilterChange: (val: "all" | "active" | "inactive") => void;
  sortBy: "progress" | "name" | "recent";
  onSortChange: (val: "progress" | "name" | "recent") => void;
  studentCounts: { total: number; active: number; completed: number };
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
  const filters: {
    label: string;
    key: "all" | "active" | "inactive";
    count: number;
  }[] = [
    { label: "All", key: "all", count: studentCounts.total },
    { label: "Active", key: "active", count: studentCounts.active },
    {
      label: "Inactive",
      key: "inactive",
      count: studentCounts.total - studentCounts.active,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* 🔍 Search Input */}
      <div className="relative w-full md:w-1/3">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search students..."
          className="pl-9 bg-white/5 border-white/10 text-white placeholder-gray-400 focus-visible:ring-neon-blue/40"
        />
      </div>

      {/* 🔘 Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filterStatus === f.key ? "default" : "outline"}
            onClick={() => onFilterChange(f.key)}
            className={`rounded-full text-sm transition-all ${
              filterStatus === f.key
                ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white border-none"
                : "border-white/10 text-gray-300 hover:bg-white/5"
            }`}>
            {f.label}
            <span className="ml-2 text-xs text-gray-400">({f.count})</span>
          </Button>
        ))}
      </div>

      {/* ⚙️ Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 border-white/10 text-gray-300 hover:bg-white/5">
            <ArrowDownUp className="w-4 h-4" />
            Sort by{" "}
            <span className="text-white ml-1 capitalize">
              {sortBy.replace("-", " ")}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-background/90 border-white/10 text-gray-300">
          <DropdownMenuItem onClick={() => onSortChange("recent")}>
            Most Recent
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("progress")}>
            Progress
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("name")}>
            Name (A–Z)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
