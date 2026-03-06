import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SearchStore {
  query: string;
  recentSearches: string[];
  setQuery: (query: string) => void;
  addRecentSearch: (search: string) => void;
  clearRecentSearches: () => void;
}

export const useSearchStore = create<SearchStore>()(
  persist(
    (set) => ({
      query: "",
      recentSearches: [],
      setQuery: (query: string) => set({ query }),
      addRecentSearch: (search: string) =>
        set((state) => ({
          recentSearches: [
            search,
            ...state.recentSearches.filter((s) => s !== search),
          ].slice(0, 10),
        })),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: "search-store",
    },
  ),
);
