// PhotoMax — global search context
import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface SearchContextValue {
  query: string;
  setQuery: (v: string) => void;
  lower: string;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const value = useMemo(() => ({ query, setQuery, lower: query.toLowerCase().trim() }), [query]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useGlobalSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useGlobalSearch must be used within SearchProvider');
  return ctx;
}