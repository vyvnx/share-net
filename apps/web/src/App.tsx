import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { api } from "./api/client";
import { Login } from "./routes/Login";
import { Browse } from "./routes/Browse";
import { BookReader } from "./routes/BookReader";

type AuthState =
  | { status: "loading" }
  | { status: "in"; username: string }
  | { status: "out" };

export function App() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    api
      .me()
      .then((me) => setAuth({ status: "in", username: me.username }))
      .catch(() => setAuth({ status: "out" }));
  }, []);

  async function refreshMe() {
    try {
      const me = await api.me();
      setAuth({ status: "in", username: me.username });
    } catch {
      setAuth({ status: "out" });
    }
  }

  if (auth.status === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center tracking-[0.04em] text-muted">
        share-net
        <span className="ml-px text-accent [animation:blink_1.1s_steps(1)_infinite]">▮</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            auth.status === "in" ? <Navigate to="/" replace /> : <Login onLogin={refreshMe} />
          }
        />
        <Route
          path="/read"
          element={auth.status === "in" ? <BookReader /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/*"
          element={
            auth.status === "in" ? (
              <Browse username={auth.username} onLogout={() => setAuth({ status: "out" })} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
