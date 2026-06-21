const SEARCH_HISTORY_KEY = "godenstream_search_history";
const MAX_HISTORY = 10;

export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addSearchTerm(term: string): void {
  if (typeof window === "undefined" || !term.trim()) return;
  const history = getSearchHistory().filter(
    (t) => t.toLowerCase() !== term.toLowerCase(),
  );
  history.unshift(term.trim());
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SEARCH_HISTORY_KEY);
}

export function removeSearchTerm(term: string): void {
  if (typeof window === "undefined") return;
  const history = getSearchHistory().filter((t) => t !== term);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}
