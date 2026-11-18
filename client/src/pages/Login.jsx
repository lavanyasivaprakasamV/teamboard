import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Cannot reach server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back. Pick up where you left off."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="bg-red-100 text-red-700 p-3 rounded text-sm">{error}</p>
        )}

        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full border rounded p-2.5 font-normal"
          />
        </label>

        <label className="block text-sm font-medium">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full border rounded p-2.5 font-normal"
          />
        </label>

        <button
          disabled={submitting}
          className="w-full bg-blue-600 text-white rounded p-2.5 font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>

        <p className="text-sm text-center text-gray-600">
          New to TeamBoard?{" "}
          <Link to="/register" className="text-blue-600 font-medium">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
