import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import Button from "../components/Button";

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Registration logic
    console.log("Registering", formData);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Modern Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         {/* Subtle Grid */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] opacity-50"></div>
         
         {/* Drifting Gradient Orbs */}
         <motion.div 
            animate={{ 
                scale: [1, 1.25, 1],
                opacity: [0.2, 0.4, 0.2],
                rotate: [0, -45, 0]
            }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-brand-500/10 blur-[120px] rounded-full mix-blend-screen"
         />
         <motion.div 
            animate={{ 
                scale: [1, 1.1, 1],
                x: [0, 40, 0],
                y: [0, -40, 0],
                opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent-purple/10 blur-[120px] rounded-full mix-blend-screen"
         />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-500">
            Join InterviewHub and master your preparation
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-8 bg-zinc-950/50 backdrop-blur-sm py-8 px-4 border border-white/10 sm:px-10 relative overflow-hidden shadow-2xl shadow-black/50"
        >
          {/* Decorative top border line */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

          <form className="space-y-6" onSubmit={handleSubmit}>
            <motion.div variants={itemVariants}>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
                Full Name
              </label>
              <div className="mt-2 relative rounded-none shadow-sm group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-500">
                  <User className="h-5 w-5 text-zinc-600 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 bg-black/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-all"
                  placeholder="John Doe"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Email address
              </label>
              <div className="mt-2 relative rounded-none shadow-sm group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-500">
                  <Mail className="h-5 w-5 text-zinc-600 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 bg-black/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Password
              </label>
              <div className="mt-2 relative rounded-none shadow-sm group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-500">
                  <Lock className="h-5 w-5 text-zinc-600 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-800 bg-black/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-zinc-700 rounded-none bg-zinc-900/50"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-zinc-400">
                I agree to the <a href="#" className="text-brand-500 hover:text-brand-400">Terms</a> and <a href="#" className="text-brand-500 hover:text-brand-400">Privacy Policy</a>
              </label>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button type="submit" variant="glow" className="w-full flex justify-center" icon={ArrowRight}>
                Create Account
              </Button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-zinc-800 text-center">
            <p className="text-zinc-500 text-sm">
              Already have an account?{" "}
              <Link to="/signin" className="text-brand-500 hover:text-brand-400 font-medium transition-colors hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUp;