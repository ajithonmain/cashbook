import { useEffect, useState } from "react";
import type { Book } from "./lib/types";
import BookList from "./components/BookList";
import BookDetail from "./components/BookDetail";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import BottomNav, { type TabKey } from "./components/BottomNav";
import Screen from "./components/ui/Screen";
import ToastHost from "./components/ui/ToastHost";
import { initSync } from "./lib/sync";

export default function App() {
  const [tab, setTab] = useState<TabKey>("books");
  const [activeBook, setActiveBook] = useState<Book | null>(null);

  useEffect(() => {
    initSync();
  }, []);

  if (activeBook) {
    return (
      <>
        <Screen key={activeBook.id}>
          <BookDetail book={activeBook} onBack={() => setActiveBook(null)} />
        </Screen>
        <ToastHost />
      </>
    );
  }

  return (
    <>
      <Screen key={tab}>
        {tab === "books" && <BookList onOpenBook={setActiveBook} />}
        {tab === "reports" && <Reports />}
        {tab === "settings" && <Settings />}
      </Screen>
      <BottomNav active={tab} onChange={setTab} />
      <ToastHost />
    </>
  );
}
