import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  ArrowUp,
  ArrowDown,
  User,
  Menu,
  X,
  Wallet,
  LogOut,
} from "lucide-react";
import { clearAuthStorage } from "../utils/authStorage";

const MotionListItem = motion.li;

const MENU_ITEMS = [
  { text: "Dashboard", path: "/app", icon: <Home size={20} /> },
  { text: "Income", path: "/app/income", icon: <ArrowUp size={20} /> },
  { text: "Expenses", path: "/app/expense", icon: <ArrowDown size={20} /> },
  { text: "Profile", path: "/app/profile", icon: <User size={20} /> },
];

const Sidebar = ({ isCollapsed, setCollapsed }) => {
  const { pathname } = useLocation();
  const [activeHover, setActiveHover] = useState(null);

  const handleLogout = (event) => {
    event.preventDefault();
    event.stopPropagation();

    clearAuthStorage();

    window.location.href = "/login";
  };

  return (
    <aside
      className={`fixed bottom-0 left-0 top-20 z-30 hidden flex-col border-r border-slate-300 bg-white shadow-[4px_0_18px_rgba(15,23,42,0.06)] transition-all duration-300 lg:flex ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div
        className={`flex items-center border-b border-slate-200 bg-slate-50/80 px-4 py-5 dark:border-neutral-800 dark:bg-black ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
              <Wallet size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold leading-5 text-slate-900 dark:text-white">
                Expense Manager
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                Money Manager
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!isCollapsed)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 shadow-sm transition-all duration-200 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
          title={isCollapsed ? "Open sidebar" : "Close sidebar"}
        >
          {isCollapsed ? <Menu size={22} /> : <X size={21} />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-5">
        <ul className="space-y-2">
          {MENU_ITEMS.map(({ text, path, icon }) => {
            const isActive =
              pathname === path ||
              (path !== "/app" && pathname.startsWith(path));

            return (
              <MotionListItem
                key={text}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={path}
                  className={`group relative flex items-center rounded-xl py-3 font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-teal-50 text-teal-700 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-teal-700"
                  } ${isCollapsed ? "justify-center px-0" : "gap-3 px-4"}`}
                  onMouseEnter={() => setActiveHover(text)}
                  onMouseLeave={() => setActiveHover(null)}
                  title={isCollapsed ? text : ""}
                >
                  {isActive && (
                    <span className="absolute left-0 h-7 w-1 rounded-r-full bg-teal-600"></span>
                  )}

                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                      isActive
                        ? "bg-teal-100 text-teal-700"
                        : "text-slate-500 group-hover:bg-white group-hover:text-teal-700"
                    }`}
                  >
                    {icon}
                  </span>

                  {!isCollapsed && (
                    <span className="ml-1 text-sm font-semibold">{text}</span>
                  )}

                  {activeHover === text && !isActive && !isCollapsed && (
                    <span className="absolute right-4 h-2 w-2 rounded-full bg-teal-400"></span>
                  )}

                  {isCollapsed && activeHover === text && (
                    <span className="absolute left-16 z-50 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-lg">
                      {text}
                    </span>
                  )}
                </Link>
              </MotionListItem>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-200 bg-white p-4">
        <button
          type="button"
          onClick={handleLogout}
          className={`relative z-50 flex w-full cursor-pointer items-center rounded-xl bg-red-50 py-3 text-sm font-bold text-red-600 transition-all duration-200 hover:bg-red-100 active:scale-95 ${
            isCollapsed ? "justify-center px-0" : "justify-center gap-2 px-4"
          }`}
          title="Logout"
        >
          <LogOut size={19} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
