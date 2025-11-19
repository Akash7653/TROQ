import React, { useState } from "react";
import { login } from "./api";

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login(username, password);
      onSuccess();
    } catch (err) {
      setError("Invalid username or password");
    }
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "#f0f2f5"
    }}>
      <div style={{
        width: 380,
        padding: 30,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        textAlign: "center"
      }}>

        <h2 style={{ marginBottom: 20 }}>Admin Login</h2>

        {error && (
          <div style={{
            background: "#ffe5e5",
            padding: 10,
            color: "#d9534f",
            borderRadius: 5,
            marginBottom: 15
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <input
            placeholder="Username *"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 15,
              borderRadius: 6,
              border: "1px solid #ccc"
            }}
          />

          <input
            type="password"
            placeholder="Password *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 20,
              borderRadius: 6,
              border: "1px solid #ccc"
            }}
          />

          <button
            style={{
              width: "100%",
              padding: 12,
              background: "#0d6efd",
              color: "white",
              fontWeight: "bold",
              border: "none",
              borderRadius: 6,
              cursor: "pointer"
            }}
          >
            LOGIN
          </button>

        </form>

      </div>
    </div>
  );
}
