// src/components/AuthForm.jsx
import { useState } from "react";
import { signup, login } from "../api";

export default function AuthForm({ onLogin }) {
  const [mode, setMode] = useState("login"); // or "signup"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handle = async () => {
    try {
      if (mode === "signup") {
        await signup(username, password);
        alert("User created! Now log in.");
        setMode("login");
      } else {
        const { data } = await login(username, password);
        localStorage.setItem("token", data.access_token);
        onLogin(); // parent can re-render
      }
    } catch (e) {
      alert("Error: " + e.response?.data?.detail || e.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">
        {mode === "signup" ? "Sign Up" : "Login"}
      </h2>
      <input
        className="w-full mb-2 p-2 border rounded"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className="w-full mb-4 p-2 border rounded"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={handle}
        className="w-full py-2 bg-blue-600 text-white rounded"
      >
        {mode === "signup" ? "Sign Up" : "Log In"}
      </button>
      <p className="mt-4 text-sm text-center">
        {mode === "signup"
          ? "Already have an account? "
          : "No account yet? "}
        <button
          className="text-blue-600 underline"
          onClick={() =>
            setMode(mode === "signup" ? "login" : "signup")
          }
        >
          {mode === "signup" ? "Log In" : "Sign Up"}
        </button>
      </p>
    </div>
  );
}
