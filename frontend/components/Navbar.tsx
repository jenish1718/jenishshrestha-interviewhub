import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Cpu } from "lucide-react";
import Button from "./Button";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage = location.pathname === "/signin" || location.pathname === "/signup";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
  }, [location.pathname]);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Testimonials", href: "#testimonials" },
  ];

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.querySelector(href);
        element?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-black/70 backdrop-blur-xl border-b border-white/5" : "bg-transparent border-b border-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-zinc-900 border border-zinc-800 p-1.5">
                <Cpu className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Interview<span className="text-brand-500">Hub</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {!isAuthPage && (
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-500 transition-all duration-300 group-hover:w-full"></span>
                </button>
              ))}
              {user && (
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors relative group"
                >
                  Dashboard
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-500 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              )}
              {user?.role === 'Admin' && (
                <Link
                  to="/admin"
                  className="text-sm font-bold text-brand-500 hover:text-brand-400 transition-colors relative group"
                >
                  Admin Panel
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-500 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              )}
            </div>
          )}

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                {location.pathname !== "/signin" && (
                  <Link to="/signin">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                )}
                {location.pathname !== "/signup" && (
                  <Link to="/signup">
                    <Button variant="primary" size="sm">
                      Get Started
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-sm text-zinc-500">Hi, {user.firstName}</span>
                <button
                  onClick={() => {
                    localStorage.clear();
                    setUser(null);
                    navigate("/");
                  }}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-zinc-400 hover:text-white p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black border-b border-zinc-800 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {!isAuthPage && navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className="block w-full text-left text-zinc-400 hover:text-white font-medium py-3 border-b border-zinc-900"
                >
                  {link.name}
                </button>
              ))}
              {user && (
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-left text-zinc-400 hover:text-white font-medium py-3 border-b border-zinc-900"
                >
                  Dashboard
                </Link>
              )}
              {user?.role === 'Admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-left text-brand-500 font-bold py-3 border-b border-zinc-900"
                >
                  Admin Panel
                </Link>
              )}
              <div className="pt-4 flex flex-col space-y-3">
                {!user ? (
                  <>
                    <Link to="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="secondary" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="primary" className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      localStorage.clear();
                      setUser(null);
                      setIsMobileMenuOpen(false);
                      navigate("/");
                    }}
                  >
                    Logout
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav >
  );
};

export default Navbar;