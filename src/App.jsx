/* Path :- did-client-frontend/src/App.jsx */

// why :-  Root component.

import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Templates from "./pages/Templates";
import Degrees from "./pages/Degrees";
import Verification from "./pages/Verification";
import RequireAuth from "./routes/RequireAuth";

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/templates"
        element={
          <RequireAuth>
            <Templates />
          </RequireAuth>
        }
      />
      <Route
        path="/degrees"
        element={
          <RequireAuth>
            <Degrees />
          </RequireAuth>
        }
      />
      <Route
        path="/verification"
        element={
          <RequireAuth>
            <Verification />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;