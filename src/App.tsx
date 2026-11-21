import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Book } from "./lib/types";
import BookList from "./components/BookList";
import BookDetail from "./components/BookDetail";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import BottomNav, { type TabKey } from "./components/BottomNav";
import ToastHost from "./components/ui/ToastHost";
import UpdateBanner from "./components/ui/UpdateBanner";
import { useAuth } from "./lib/auth";
import { LOCAL_SCOPE, setScope } from "./lib/db";
import { initSync } from "./lib/sync";

const TABS: TabKey[] = ["books", "reports", "settings"];
const BOOK_EXIT_MS = 300;

export default function App() {
  const auth = useAuth();
  const scope = auth?.user.id ?? LOCAL_SCOPE;
  // Idempotent and must happen before any child reads IndexedDB, so it runs during render.
  setScope(scope);

  const [tab, setTab] = useState<TabKey>("books");
  const [book, setBook] = useState<Book | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const scrollByTab = useRef<Record<TabKey, number>>({ books: 0, reports: 0, settings: 0 });
  const exitTimer = useRef<number>();

  useEffect(() => {
    initSync();
  }, []);

  const closeBook = useCallback(() => {
    setBookOpen(false);
    window.clearTimeout(exitTimer.current);
    exitTimer.current = window.setTimeout(() => setBook(null), BOOK_EXIT_MS);
  }, []);

  function openBook(next: Book) {
    window.clearTimeout(exitTimer.current);
    setBook(next);
    setBookOpen(true);
    // One history entry per open book, so the Android back gesture and the browser Back button close it.
    history.pushState({ cb: "book" }, "");
  }

  const goBack = useCallback(() => {
    if (history.state?.cb === "book") history.back();
    else closeBook();
  }, [closeBook]);

  useEffect(() => {
    const onPop = () => {
      if (history.state?.cb !== "book") closeBook();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [closeBook]);

  // A different account means a different database: leave any open book.
  useEffect(() => {
    window.clearTimeout(exitTimer.current);
    setBook(null);
    setBookOpen(false);
  }, [scope]);

  function changeTab(next: TabKey) {
    if (next === tab) return;
    scrollByTab.current[tab] = window.scrollY;
    setTab(next);
  }

  // Tabs stay mounted (hidden), so switching never reloads data or resets state; only scroll needs restoring.
  useLayoutEffect(() => {
    window.scrollTo(0, scrollByTab.current[tab]);
  }, [tab]);

  return (
    <>
      {TABS.map((key) => (
        <div key={`${scope}:${key}`} hidden={tab !== key} className={tab === key ? "tab-pane" : undefined}>
          {key === "books" ? <BookList onOpenBook={openBook} /> : key === "reports" ? <Reports /> : <Settings />}
        </div>
      ))}

      <BottomNav active={tab} onChange={changeTab} />

      {book && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-bg shadow-sheet will-change-transform"
          style={
            bookOpen
              ? { animation: "push-in 340ms var(--ease-out)" }
              : { transform: "translateX(100%)", transition: `transform ${BOOK_EXIT_MS - 20}ms var(--ease-in)` }
          }
        >
          <BookDetail key={`${scope}:${book.id}`} book={book} onBack={goBack} />
        </div>
      )}

      <ToastHost />
      <UpdateBanner />
    </>
  );
}
