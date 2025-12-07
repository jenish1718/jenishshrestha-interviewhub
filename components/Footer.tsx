import React from "react";
import { Link } from "react-router-dom";
import { Cpu, Twitter, Linkedin, Github, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-black border-t border-zinc-900 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-zinc-900 border border-zinc-800 p-1.5">
                <Cpu className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Interview<span className="text-brand-500">Hub</span>
              </span>
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Empowering job seekers with AI-driven interview preparation. 
              Turn anxiety into confidence with real-time feedback.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Features</a></li>
              <li><a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Pricing</a></li>
              <li><a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Success Stories</a></li>
              <li><a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Enterprise</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Blog</a></li>
              <li><a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Interview Guide</a></li>
              <li><a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Help Center</a></li>
              <li><a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">API Docs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-900">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-900">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-900">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-900">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-zinc-600 text-sm">
            &copy; {new Date().getFullYear()} InterviewHub. All rights reserved.
          </p>
          <div className="flex space-x-8 mt-4 md:mt-0">
            <a href="#" className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;