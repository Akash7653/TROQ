import React, { useState } from "react";
import Login from "./Login";
import Admin from "./Admin";
import Drivers from "./Drivers";
import Dashboard from "./Dashboard";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

import { Box, Toolbar } from "@mui/material";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("admin_token"));
  const [page, setPage] = useState("dashboard");

  function logout() {
    localStorage.removeItem("admin_token");
    setToken(null);
  }

  if (!token) {
    return <Login onSuccess={() => {
      localStorage.setItem("admin_token", "yes");
      setToken("yes");
    }} />;
  }

  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar */}
      <Sidebar page={page} setPage={setPage} />

      {/* Main Content */}
      <Box sx={{ flexGrow: 1 }}>
        <TopBar title={page.toUpperCase()} onLogout={logout} />
        <Toolbar />

        {page === "dashboard" && <Dashboard />}
        {page === "requests" && <Admin />}
        {page === "drivers" && <Drivers />}
        {page === "settings" && (
          <Box sx={{ padding: 3 }}>
            <h2>Settings Page</h2>
          </Box>
        )}
      </Box>
    </Box>
  );
}
