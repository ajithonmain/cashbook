import { useEffect, useState } from "react";
import type { Book } from "./lib/types";
import BookList from "./components/BookList";
import BookDetail from "./components/BookDetail";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import BottomNav, { type TabKey } from "./components/BottomNav";
import Screen from "./components/ui/Screen";
import ToastHost from "./components/ui/ToastHost";
import { useAuth } from "./lib/auth";
import { LOCAL_SCOPE, setScope } from "./lib/db";
import { initSync } from "./lib/sync";

export default function App() {
  const auth = useAuth();
  const scope = auth?.user.id ?? LOCAL_SCOPE;
  // Idempotent and must happen before any child reads IndexedDB, so it runs during render.
  setScope(scope);

  const [tab, setTab] = useState<TabKey>("books");
  const [activeBook, setActiveBook] = useState<Book | null>(null);

  useEffect(() => {
    initSync();
  }, []);

  // A different account means a different database: leave any open book.
  useEffect(() => {
    setActiveBook(null);
  }, [scope]);

  if (activeBook) {
    return (
      <>
        <Screen key={`${scope}:${activeBook.id}`}>
          <BookDetail book={activeBook} onBack={() => setActiveBook(null)} />
        </Screen>
        <ToastHost />
      </>
    );
  }

  return (
    <>
      <Screen key={`${scope}:${tab}`}>
        {tab === "books" && <BookList onOpenBook={setActiveBook} />}
        {tab === "reports" && <Reports />}
        {tab === "settings" && <Settings />}
      </Screen>
      <BottomNav active={tab} onChange={setTab} />
      <ToastHost />
    </>
  );
}
