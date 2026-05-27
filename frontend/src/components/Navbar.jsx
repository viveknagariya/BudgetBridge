import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { clearAuthStorage, getSessionUser } from "../utils/authStorage";

const readStoredUsername = () => {
  return getSessionUser().name;
};

const clearAuthAndRedirect = () => {
  clearAuthStorage();
  window.location.replace("/login");
};

const Navbar = () => {
  const navigate = useNavigate();
  const [username] = useState(readStoredUsername);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("expense_theme") === "dark";
  });
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const handleThemeSync = () => {
      const isDark = localStorage.getItem("expense_theme") === "dark";
      setDarkMode(isDark);
    };

    window.addEventListener("expense_theme_changed", handleThemeSync);
    return () => window.removeEventListener("expense_theme_changed", handleThemeSync);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleToggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem("expense_theme", nextMode ? "dark" : "light");
    window.dispatchEvent(new Event("expense_theme_changed"));
  };

  const handleAccountClick = () => {
    setShowAccountMenu((prev) => !prev);
  };

  const handleProfileNavigate = () => {
    setShowAccountMenu(false);
    navigate("/app/profile");
  };

  const handleSettingsNavigate = () => {
    setShowAccountMenu(false);
    navigate("/app/profile?section=settings");
  };

  const handleLogout = () => {
    setShowAccountMenu(false);
    clearAuthAndRedirect();
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-40 h-20 border-b border-slate-300 bg-white shadow-[0_2px_16px_rgba(15,23,42,0.08)]">
      <div className="flex h-full items-center justify-between gap-4 px-5 lg:px-8">
        <Link
          to="/app"
          className="flex shrink-0 items-center rounded-xl px-2 py-2 transition hover:bg-slate-50"
        >
          <div className="hidden sm:block">
            <h1 className="text-lg font-extrabold leading-5 text-slate-950">
              Expense Manager
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Smart Budget Control
            </p>
          </div>
          <div className="sm:hidden">
            <h1 className="text-base font-extrabold leading-5 text-slate-950">
              Expense Manager
            </h1>
          </div>
        </Link>

        <div className="hidden w-full max-w-md items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 md:flex">
          <Search className="shrink-0 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search transactions"
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            onClick={handleToggleDarkMode}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun size={21} /> : <Moon size={21} />}
          </button>

          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={handleAccountClick}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-white">
                <User size={18} />
              </div>

              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold leading-5 text-slate-900">
                  {username}
                </p>
                <p className="text-xs text-slate-500">Personal Account</p>
              </div>
            </button>

            {showAccountMenu && (
              <div className="absolute right-0 top-14 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-600 text-white">
                      <User size={20} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {username}
                      </h3>
                      <p className="text-xs text-slate-500">Personal Account</p>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <button
                    type="button"
                    onClick={handleProfileNavigate}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
                  >
                    <User size={17} className="text-slate-500" />
                    My Profile
                  </button>

                  <button
                    type="button"
                    onClick={handleSettingsNavigate}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
                  >
                    <Settings size={17} className="text-slate-500" />
                    Settings
                  </button>
                </div>

                <div className="border-t border-slate-100 py-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
