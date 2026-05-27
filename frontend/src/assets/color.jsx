import React from "react";
import { Utensils, Home, Car, ShoppingCart, Gift, Zap, Activity, IndianRupee, Briefcase, TrendingUp, Star, MoreHorizontal, BookOpen } from "lucide-react";

export const CATEGORY_ICONS = {
  Food: <Utensils className="w-4 h-4" />,
  Housing: <Home className="w-4 h-4" />,
  Transport: <Car className="w-4 h-4" />,
  Shopping: <ShoppingCart className="w-4 h-4" />,
  Entertainment: <Gift className="w-4 h-4" />,
  Utilities: <Zap className="w-4 h-4" />,
  Healthcare: <Activity className="w-4 h-4" />,
  Education: <BookOpen className="w-4 h-4" />,
  Other: <MoreHorizontal className="w-4 h-4" />,
};

export const CATEGORY_ICONS_Inc = {
  Salary: <Briefcase className="w-4 h-4 text-emerald-500" />,
  Freelance: <IndianRupee className="w-4 h-4 text-blue-500" />,
  Investment: <TrendingUp className="w-4 h-4 text-blue-600" />,
  Bonus: <Star className="w-4 h-4 text-amber-500" />,
  Other: <MoreHorizontal className="w-4 h-4 text-slate-500" />,
};

export const INCOME_COLORS = ["#10B981", "#2563EB", "#1E40AF", "#F59E0B", "#64748B"];
export const EXPENSE_COLORS = ["#EF4444", "#F59E0B", "#2563EB", "#10B981", "#64748B"];
