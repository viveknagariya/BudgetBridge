import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { WalletCards } from "lucide-react";

import Layout from "./components/Layout";
import axios from "axios";
import { apiUrl } from "./utils/api";
import {
  protectLocalUserPrivacy,
  storeAuthenticatedUser,
} from "./utils/authStorage";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Income = lazy(() => import("./pages/Income"));
const Expense = lazy(() => import("./pages/Expense"));
const Profile = lazy(() => import("./pages/Profile"));
const StatementAnalyzer = lazy(() => import("./pages/StatementAnalyzer"));

const isAuthenticated = () => {
  if (typeof window === "undefined") return false;

  return Boolean(
    localStorage.getItem("token") &&
      sessionStorage.getItem("hasLoggedInThisSession")
  );
};

const resetExpiredSession = () => {
  if (typeof window === "undefined") return;

  if (!sessionStorage.getItem("hasLoggedInThisSession")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } else {
    protectLocalUserPrivacy();
  }
};

resetExpiredSession();

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-slate-500">
    Loading...
  </div>
);

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [pathname, search]);

  return null;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      alert("Please enter both Email and Password.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(apiUrl("/user/login"), {
        email: email.trim(),
        password: password.trim(),
      });

      if (res.data && res.data.success) {
        localStorage.setItem("token", res.data.token);
        storeAuthenticatedUser(res.data.user);
        sessionStorage.setItem("hasLoggedInThisSession", "true");
        navigate("/app", { replace: true });
      } else {
        setError(res.data?.message || "Invalid credentials");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Please enter all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(apiUrl("/user/register"), {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      });

      if (res.data && res.data.success) {
        alert("Registration successful! Please login with your email and password.");
        setIsRegister(false);
        setName("");
        setPassword("");
      } else {
        setError(res.data?.message || "Registration failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md">
            <WalletCards className="text-teal-700" size={34} />
          </div>

          <h1 className="mt-4 text-2xl font-extrabold text-white">
            Expense Manager
          </h1>

          <p className="mt-2 text-sm font-medium text-teal-50">
            {isRegister ? "Create a New Account" : "Smart Budget Control"}
          </p>
        </div>

        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-5 p-6">
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {isRegister && (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-teal-700 hover:shadow-md disabled:opacity-70"
          >
            {loading ? (isRegister ? "Creating..." : "Signing in...") : (isRegister ? "Register" : "Login to Dashboard")}
          </button>

          <p className="text-center text-xs font-medium text-slate-500">
            {isRegister ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="font-bold text-teal-600 hover:underline"
            >
              {isRegister ? "Login here" : "Register here"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("expense_theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="income" element={<Income />} />
            <Route path="expense" element={<Expense />} />
            <Route path="profile" element={<Profile />} />
            <Route path="statement-analyzer" element={<StatementAnalyzer />} />
          </Route>

          <Route
            path="/login"
            element={
              isAuthenticated() ? <Navigate to="/app" replace /> : <LoginPage />
            }
          />

          <Route
            path="/"
            element={
              isAuthenticated() ? (
                <Navigate to="/app" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="*"
            element={
              isAuthenticated() ? (
                <Navigate to="/app" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
