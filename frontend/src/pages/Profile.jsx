import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Shield,
  LogOut,
  Moon,
  Sun,
  Save,
  Phone,
  MapPin,
} from "lucide-react";
import axios from "axios";
import { apiUrl } from "../utils/api";
import {
  clearAuthStorage,
  getSessionUser,
  storeAuthenticatedUser,
} from "../utils/authStorage";

const readStoredUser = () => {
  const user = getSessionUser();

  return {
    id: user.id,
    email: user.email || "guest@example.com",
    name: user.name || "Guest User",
  };
};

const readStoredProfile = () => {
  const user = readStoredUser();
  const profileKey = `expense_session_profile:${user.id || "guest"}`;

  try {
    const savedProfile = JSON.parse(
      sessionStorage.getItem(profileKey) || "null"
    );

    if (savedProfile) {
      return {
        name: savedProfile.name || user.name,
        email: savedProfile.email || user.email,
        phone: savedProfile.phone || "",
        location: savedProfile.location || "",
        membership: savedProfile.membership || "Premium Member",
      };
    }
  } catch {
    sessionStorage.removeItem(profileKey);
  }

  return {
    name: user.name,
    email: user.email,
    phone: "",
    location: "",
    membership: "Premium Member",
  };
};

const Profile = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("expense_theme") === "dark";
  });

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [profile, setProfile] = useState(readStoredProfile);

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

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = () => {
    if (!profile.email.trim() || !profile.name.trim()) {
      alert("Please enter Name and Email.");
      return;
    }

    sessionStorage.setItem(
      `expense_session_profile:${profile.id || getSessionUser().id || "guest"}`,
      JSON.stringify(profile),
    );

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        storeAuthenticatedUser({
          id: parsedUser.id || parsedUser._id,
          name: profile.name,
          email: profile.email,
        });
      } catch {
        localStorage.removeItem("user");
      }
    }

    alert("Profile updated successfully.");
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      alert("Please enter both old and new passwords.");
      return;
    }

    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters long.");
      return;
    }

    try {
      const res = await axios.post(apiUrl("/user/change-password"), {
        email: profile.email,
        oldPassword,
        newPassword,
      });

      if (res.data && res.data.success) {
        alert("Password updated successfully.");
        setOldPassword("");
        setNewPassword("");
      } else {
        alert(res.data?.message || "Failed to update password.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error updating password.");
    }
  };

  const handleThemeToggle = () => {
    const nextValue = !darkMode;
    setDarkMode(nextValue);

    if (nextValue) {
      localStorage.setItem("expense_theme", "dark");
      document.documentElement.classList.add("dark");
    } else {
      localStorage.setItem("expense_theme", "light");
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new Event("expense_theme_changed"));
  };

  const handleLogout = () => {
    clearAuthStorage();
    window.location.replace("/login");
  };

  return (
    <div className={`px-6 pb-10 pt-8 sm:px-8 lg:px-10 min-h-screen transition-all duration-300 ${
      darkMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"
    }`}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-slate-950"}`}>
              User Profile
            </h1>
            <p className={`mt-2 text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Manage your account details and theme preferences.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveProfile}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition-all duration-200 bg-teal-600 text-white hover:bg-teal-700 hover:shadow-md"
          >
            <Save size={18} />
            Update Profile
          </button>
        </div>

        <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
          darkMode ? "border-slate-800 bg-slate-800 text-white" : "border-slate-100 bg-white shadow-sm"
        }`}>
          <div className={`flex flex-col gap-6 p-8 sm:flex-row sm:items-center ${
            darkMode ? "bg-gradient-to-r from-slate-800 to-slate-900" : "bg-gradient-to-r from-teal-50 to-cyan-50"
          }`}>
            <div className={`flex h-24 w-24 items-center justify-center rounded-full border-4 shadow-md ${
              darkMode ? "border-slate-700 bg-slate-800" : "border-white bg-white"
            }`}>
              <User size={48} className="text-teal-600" />
            </div>

            <div>
              <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-950"}`}>
                {profile.name}
              </h2>
              <p className={`mt-1 text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                {profile.membership}
              </p>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="space-y-5">
              <div className={`rounded-2xl border p-5 transition-all duration-300 ${
                darkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-100 bg-white shadow-sm"
              }`}>
                <h3 className={`mb-5 text-lg font-bold ${darkMode ? "text-white" : "text-slate-950"}`}>
                  Profile Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className={`mb-2 block text-sm font-bold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) =>
                          handleProfileChange("name", e.target.value)
                        }
                        className={`w-full rounded-xl border px-4 py-3 pl-11 text-sm font-semibold outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50 ${
                          darkMode ? "border-slate-700 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-800"
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`mb-2 block text-sm font-bold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) =>
                          handleProfileChange("email", e.target.value)
                        }
                        className={`w-full rounded-xl border px-4 py-3 pl-11 text-sm font-semibold outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50 ${
                          darkMode ? "border-slate-700 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-800"
                        }`}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`mb-2 block text-sm font-bold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={profile.phone}
                        onChange={(e) =>
                          handleProfileChange("phone", e.target.value)
                        }
                        className={`w-full rounded-xl border px-4 py-3 pl-11 text-sm font-semibold outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50 ${
                          darkMode ? "border-slate-700 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-800"
                        }`}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`mb-2 block text-sm font-bold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={profile.location}
                        onChange={(e) =>
                          handleProfileChange("location", e.target.value)
                        }
                        className={`w-full rounded-xl border px-4 py-3 pl-11 text-sm font-semibold outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50 ${
                          darkMode ? "border-slate-700 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-800"
                        }`}
                        placeholder="Enter your location"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 hover:shadow-md"
                  >
                    <Save size={18} />
                    Update Profile
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className={`rounded-2xl border p-5 transition-all duration-300 ${
                darkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-100 bg-white shadow-sm"
              }`}>
                <h3 className={`mb-5 text-lg font-bold ${darkMode ? "text-white" : "text-slate-950"}`}>
                  Account Settings
                </h3>

                <div className="space-y-4">
                  <div className={`flex items-center justify-between rounded-xl border p-4 ${
                    darkMode ? "border-slate-700 bg-slate-800/80" : "border-slate-100 bg-slate-50"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                        <Shield size={20} />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                          Account Security
                        </p>
                        <p className={`text-xs font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          Two-Factor Auth Enabled
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between rounded-xl border p-4 ${
                    darkMode ? "border-slate-700 bg-slate-800/80" : "border-slate-100 bg-slate-50"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                        {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                          Theme Mode
                        </p>
                        <p className={`text-xs font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          {darkMode ? "Dark mode active" : "Light mode active"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleThemeToggle}
                      className={`relative h-7 w-12 rounded-full transition ${
                        darkMode ? "bg-slate-900" : "bg-teal-600"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                          darkMode ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl border p-5 transition-all duration-300 ${
                darkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-100 bg-white shadow-sm"
              }`}>
                <h3 className={`mb-5 text-lg font-bold ${darkMode ? "text-white" : "text-slate-950"}`}>
                  Update Password
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className={`mb-2 block text-sm font-bold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Old Password
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50 ${
                        darkMode ? "border-slate-700 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-800"
                      }`}
                      placeholder="Enter old password"
                    />
                  </div>

                  <div>
                    <label className={`mb-2 block text-sm font-bold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50 ${
                        darkMode ? "border-slate-700 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-800"
                      }`}
                      placeholder="Enter new password"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleChangePassword}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 hover:shadow-md"
                  >
                    Change Password
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 p-4 font-bold text-red-600 transition hover:bg-red-100"
              >
                <LogOut size={20} />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
