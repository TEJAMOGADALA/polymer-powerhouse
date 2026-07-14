export type CompanyTheme = "blue" | "purple" | "teal";

export const themeGradient: Record<CompanyTheme, string> = {
  blue: "from-blue-500 via-sky-500 to-cyan-500",
  purple: "from-fuchsia-500 via-purple-500 to-indigo-500",
  teal: "from-teal-500 via-emerald-500 to-cyan-500",
};

export const themeAccent: Record<CompanyTheme, string> = {
  blue: "text-blue-600",
  purple: "text-purple-600",
  teal: "text-teal-600",
};

export const themeRing: Record<CompanyTheme, string> = {
  blue: "ring-blue-400/40",
  purple: "ring-purple-400/40",
  teal: "ring-teal-400/40",
};
