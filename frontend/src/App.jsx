import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import SessionPage from './pages/SessionPage.jsx';
import { mockUser} from './data/mockData.js';
import { googleLogout } from "@react-oauth/google";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);

  const handleLogin = async (credentialResponse) => {
  const res = await fetch("http://localhost:5000/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: credentialResponse.credential,
    }),
  });

  const user = await res.json();

  setUser(user);
  setIsLoggedIn(true);

  localStorage.setItem("user", JSON.stringify(user));
};

const handleLogout = () => {
  googleLogout();

  localStorage.removeItem("user");
  setUser(null);
  setIsLoggedIn(false);
  setSessions([]);
};

  const addSession = async (session) => {
  const res = await fetch(`http://localhost:5000/sessions?user_id=${user.id}`, {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...session,
      user_id: user.id,   
    }),
  });

  const newSession = await res.json();
  setSessions(prev => [newSession, ...prev]);
};

useEffect(() => {
  const savedUser = localStorage.getItem("user");

  if (savedUser) {
    setUser(JSON.parse(savedUser));
    setIsLoggedIn(true);
  }
}, []);

useEffect(() => {
  const fetchSessions = async () => {
    if (!user?.id) return;

    const res = await fetch(
      `http://localhost:5000/sessions?user_id=${user.id}`
    );

    const data = await res.json();
    setSessions(data);
  };

  fetchSessions();
}, [user]);


  return (
    <BrowserRouter>
      <Routes>

        {/* HOME */}
        <Route
          path="/"
          element={
            <HomePage
              isLoggedIn={isLoggedIn}
              user={user}
              sessions={sessions}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onAddSession={addSession}
            />
          }
        />

        {/* SESSION PAGE (ONLY ROUTE YOU NEED) */}
        <Route
          path="/session/:id"
          element={
            <SessionPage
              isLoggedIn={isLoggedIn}
              user={user}
              sessions={sessions}
              onLogin={handleLogin}
              onAddSession={addSession}
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}