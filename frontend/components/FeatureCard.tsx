import React, { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Feature } from "../types";
import { ArrowUpRight } from "lucide-react";

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

// Custom animations for each feature type
const FeatureVisual: React.FC<{ id: string }> = ({ id }) => {
  switch (id) {
    case "skill-extraction":
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="w-16 h-20 border border-zinc-700 bg-zinc-900/50 rounded-sm flex flex-col p-2 space-y-2 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ width: "100%", backgroundColor: "#27272a" }} // zinc-800
                whileHover={{ 
                  width: i === 2 ? "100%" : "60%",
                  backgroundColor: i === 2 ? "#0ea5e9" : "#27272a" 
                }}
                transition={{ duration: 0.4 }}
                className="h-2 rounded-full"
              />
            ))}
            {/* Scanning line */}
            <motion.div
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 w-full h-[1px] bg-brand-400 shadow-[0_0_10px_#38bdf8]"
            />
          </div>
        </div>
      );
    case "personalized-questions":
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-6 w-8 h-6 bg-brand-500 rounded-lg rounded-bl-none flex items-center justify-center"
            >
              <span className="text-white text-xs font-bold">?</span>
            </motion.div>
            <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
               <div className="w-6 h-6 border-2 border-zinc-500 rounded-full" />
            </div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="absolute -bottom-2 -left-4 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-[10px] text-zinc-300 whitespace-nowrap"
            >
              Tell me about...
            </motion.div>
          </div>
        </div>
      );
    case "webcam-analysis":
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="w-20 h-16 border-2 border-zinc-700 rounded-md relative overflow-hidden bg-zinc-900/50">
             {/* Face placeholder */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-zinc-800 rounded-full" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-brand-500/30 rounded-full" />
             
             {/* Crosshair corners */}
             <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-brand-500" />
             <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-brand-500" />
             <div className="absolute bottom-1 left-1 w-2 h-2 border-l border-b border-brand-500" />
             <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-brand-500" />

             {/* Scan effect */}
             <motion.div 
                className="absolute inset-0 bg-brand-500/10"
                animate={{ clipPath: ["inset(0 0 100% 0)", "inset(0 0 0 0)", "inset(100% 0 0 0)"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
             />
          </div>
        </div>
      );
    case "real-time-feedback":
      return (
        <div className="relative w-full h-full flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="w-2 bg-brand-500 rounded-full"
              animate={{ 
                height: ["20%", "60%", "30%", "80%", "20%"],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: i * 0.1
              }}
            />
          ))}
        </div>
      );
    case "performance-reports":
      return (
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <div className="w-full h-full flex items-end gap-1 border-l border-b border-zinc-700 p-1">
            <motion.div 
              initial={{ height: "20%" }} 
              whileHover={{ height: "40%" }} 
              className="flex-1 bg-zinc-800 rounded-t-sm" 
            />
            <motion.div 
              initial={{ height: "40%" }} 
              whileHover={{ height: "60%" }} 
              className="flex-1 bg-zinc-700 rounded-t-sm" 
            />
            <motion.div 
              initial={{ height: "30%" }} 
              whileHover={{ height: "80%" }} 
              className="flex-1 bg-brand-600 rounded-t-sm" 
            />
            <motion.div 
              initial={{ height: "60%" }} 
              whileHover={{ height: "95%" }} 
              className="flex-1 bg-brand-500 rounded-t-sm" 
            />
          </div>
        </div>
      );
    case "interview-success":
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative">
             {/* Target Rings */}
             <div className="w-16 h-16 border border-zinc-800 rounded-full flex items-center justify-center">
                <div className="w-10 h-10 border border-zinc-700 rounded-full flex items-center justify-center">
                   <div className="w-4 h-4 bg-zinc-800 rounded-full" />
                </div>
             </div>
             {/* Arrow */}
             <motion.div
               initial={{ x: -20, y: 20, opacity: 0 }}
               whileInView={{ x: 0, y: 0, opacity: 1 }}
               transition={{ duration: 0.5, delay: 0.2 }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
             >
               <ArrowUpRight className="w-8 h-8 text-brand-500 stroke-[3px]" />
             </motion.div>
          </div>
        </div>
      );
    default:
      return null;
  }
};

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`group relative bg-zinc-950 border border-white/5 overflow-hidden flex flex-col ${feature.className || ""}`}
    >
      {/* Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(14, 165, 233, 0.08),
              transparent 80%
            )
          `,
        }}
      />
      
      {/* Visual Animation Area */}
      <div className="h-48 bg-zinc-900/20 border-b border-white/5 relative overflow-hidden group-hover:bg-zinc-900/30 transition-colors duration-500">
         <div className="absolute inset-0 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity duration-300 scale-90 group-hover:scale-100 transition-transform duration-500">
           <FeatureVisual id={feature.id} />
         </div>
      </div>

      {/* Content Container */}
      <div className="relative p-8 flex flex-col flex-grow z-10">
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
          <ArrowUpRight className="text-white h-5 w-5" />
        </div>
        
        <h3 className="text-xl font-bold text-zinc-100 mb-3 group-hover:text-white transition-colors flex items-center">
           <feature.icon className="w-5 h-5 mr-3 text-brand-500" />
           {feature.title}
        </h3>
        
        <p className="text-zinc-500 leading-relaxed group-hover:text-zinc-300 transition-colors mt-auto text-sm">
          {feature.description}
        </p>
      </div>

      {/* Decorative animated border line on hover */}
      <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-gradient-to-r from-transparent via-brand-500 to-transparent group-hover:w-full transition-all duration-700 ease-in-out opacity-0 group-hover:opacity-100" />
    </motion.div>
  );
};

export default FeatureCard;