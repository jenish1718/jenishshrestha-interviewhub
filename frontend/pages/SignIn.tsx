import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Shield, User } from "lucide-react";
import Button from "../components/Button";

const API_URL = "https://jenishshrestha-interviewhub-production.up.railway.app/api";

type LoginRole = "candidate" | "admin";

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState<LoginRole>("candidate");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Use different API endpoints based on selected role
      const endpoint =
        role === "admin"
          ? `${API_URL}/admin/auth/login`
          : `${API_URL}/auth/login`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        if (role === "admin") {
          // Store admin tokens separately
          localStorage.setItem("adminToken", data.accessToken);
          localStorage.setItem("adminRefreshToken", data.refreshToken);
          localStorage.setItem("adminUser", JSON.stringify(data.admin));
          navigate("/admin");
        } else {
          // Store candidate tokens
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          localStorage.setItem("user", JSON.stringify(data.user));

          if (data.user.role === "Admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        }
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset error when switching roles
  const switchRole = (newRole: LoginRole) => {
    setRole(newRole);
    setError("");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  // Dynamic theming based on role
  const isAdmin = role === "admin";
  const accentColor = isAdmin ? "red" : "brand";
  const ringClass = isAdmin
    ? "focus:ring-red-500 focus:border-red-500"
    : "focus:ring-brand-500 focus:border-brand-500";
  const iconActiveClass = isAdmin
    ? "group-focus-within:text-red-400"
    : "group-focus-within:text-brand-500";

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, 45, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -top-1/4 -right-1/4 w-[800px] h-[800px] ${isAdmin ? "bg-red-500/10" : "bg-brand-500/10"
            } blur-[120px] rounded-full mix-blend-screen transition-colors duration-700`}
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -30, 0],
            y: [0, 30, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className={`absolute top-1/2 -left-1/4 w-[600px] h-[600px] ${isAdmin ? "bg-orange-500/10" : "bg-accent-purple/10"
            } blur-[120px] rounded-full mix-blend-screen transition-colors duration-700`}
        />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Role-based Icon */}
          <div className="flex justify-center mb-4">
            <motion.div
              key={role}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${isAdmin
                  ? "bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/20"
                  : "bg-gradient-to-br from-brand-500/20 to-blue-500/20 border-brand-500/20"
                }`}
            >
              {isAdmin ? (
                <Shield className="w-7 h-7 text-red-400" />
              ) : (
                <User className="w-7 h-7 text-brand-400" />
              )}
            </motion.div>
          </div>

          <h2 className="text-center text-3xl font-bold tracking-tight text-white">
            {isAdmin ? "Admin Portal" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-500">
            {isAdmin
              ? "Sign in to manage InterviewHub"
              : "Sign in to continue your interview prep"}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-8 bg-zinc-950/50 backdrop-blur-sm py-8 px-4 border border-white/10 sm:px-10 relative overflow-hidden shadow-2xl shadow-black/50 rounded-xl"
        >
          {/* Decorative top border line */}
          <div
            className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent ${isAdmin ? "via-red-500/50" : "via-brand-500/50"
              } to-transparent transition-colors duration-500`}
          />

          {/* Role Toggle Tabs */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex rounded-lg bg-zinc-900/80 border border-zinc-800 p-1">
              <button
                type="button"
                onClick={() => switchRole("candidate")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-300 ${!isAdmin
                    ? "bg-brand-500/20 text-brand-400 border border-brand-500/30 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                  }`}
              >
                <User className="w-4 h-4" />
                Candidate
              </button>
              <button
                type="button"
                onClick={() => switchRole("admin")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-300 ${isAdmin
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                  }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <motion.div variants={itemVariants}>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-300"
              >
                Email address
              </label>
              <div className="mt-2 relative shadow-sm group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail
                    className={`h-5 w-5 text-zinc-600 ${iconActiveClass} transition-colors`}
                  />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className={`block w-full pl-10 pr-3 py-3 border border-zinc-800 bg-black/50 text-white placeholder-zinc-600 rounded-lg focus:outline-none focus:ring-1 ${ringClass} sm:text-sm transition-all`}
                  placeholder={
                    isAdmin ? "admin@interviewhub.com" : "you@example.com"
                  }
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-300"
              >
                Password
              </label>
              <div className="mt-2 relative shadow-sm group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock
                    className={`h-5 w-5 text-zinc-600 ${iconActiveClass} transition-colors`}
                  />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className={`block w-full pl-10 pr-3 py-3 border border-zinc-800 bg-black/50 text-white placeholder-zinc-600 rounded-lg focus:outline-none focus:ring-1 ${ringClass} sm:text-sm transition-all`}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                />
              </div>
            </motion.div>

            {/* Remember me & Forgot password â€” only for candidates */}
            {!isAdmin && (
              <motion.div
                variants={itemVariants}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-zinc-700 rounded bg-zinc-900/50"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-zinc-400 hover:text-zinc-300 cursor-pointer transition-colors"
                  >
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-brand-500 hover:text-brand-400 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              {isAdmin ? (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Sign In as Admin
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : (
                <Button
                  type="submit"
                  variant="glow"
                  className="w-full flex justify-center"
                  icon={isLoading ? Loader2 : ArrowRight}
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              )}
            </motion.div>
          </form>

          {/* Register link â€” only for candidates */}
          {!isAdmin && (
            <motion.div
              variants={itemVariants}
              className="mt-8 pt-6 border-t border-zinc-800 text-center"
            >
              <p className="text-zinc-500 text-sm">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-brand-500 hover:text-brand-400 font-medium transition-colors hover:underline underline-offset-4"
                >
                  Register now
                </Link>
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SignIn;
