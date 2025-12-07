import React, { useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, CheckCircle2, Star, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import FeatureCard from "../components/FeatureCard";
import { FEATURES, STEPS, TESTIMONIALS } from "../constants";

const LandingPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse position for interactive background
  const mouseX = useSpring(0, { stiffness: 50, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const { left, top } = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - left);
        mouseY.set(e.clientY - top);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div ref={containerRef} className="bg-black min-h-screen selection:bg-brand-500/30 selection:text-brand-200 relative overflow-x-hidden">
      
      {/* Background System */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         {/* Static Grid */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)]"></div>
         
         {/* Moving "Shooting Stars" on Grid Lines - Horizontal */}
         <div className="absolute top-[20%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent w-32 animate-beam opacity-0" style={{ animationDelay: '2s', top: '15%' }}></div>
         <div className="absolute top-[45%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent w-48 animate-beam opacity-0" style={{ animationDelay: '5s', top: '45%' }}></div>
         <div className="absolute top-[70%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent w-64 animate-beam opacity-0" style={{ animationDelay: '1s', top: '70%' }}></div>

         {/* Interactive Glow following mouse */}
         <motion.div 
            className="absolute bg-brand-500/5 rounded-full blur-[100px]"
            style={{
                width: 600,
                height: 600,
                left: mouseX,
                top: mouseY,
                x: "-50%",
                y: "-50%"
            }}
         />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden border-b border-white/5 z-10">
        
        {/* Ambient Top Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
           <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-brand-500/10 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" />
           <div className="absolute top-[0%] right-[10%] w-[500px] h-[500px] bg-accent-purple/10 blur-[100px] rounded-full mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center px-4 py-1.5 mb-8 border border-white/10 bg-white/5 backdrop-blur-sm text-zinc-300 text-xs font-bold tracking-widest uppercase rounded-full hover:bg-white/10 transition-colors cursor-default"
            >
              <span className="w-2 h-2 bg-brand-500 mr-3 animate-pulse rounded-full shadow-[0_0_10px_#0ea5e9]" />
              AI-Powered Interview Prep
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[1.1] mb-8"
            >
              Transform Emails Into <br />
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 z-10 relative">
                  Interview Success
                </span>
                {/* Underline decoration */}
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-brand-500 rounded-full blur-[2px] opacity-50"></span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-xl md:text-2xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Master your next interview with real-time AI feedback. 
              Join candidates achieving <span className="text-white font-semibold border-b border-brand-500/50">95% success rates</span>.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              <Link to="/signup" className="w-full sm:w-auto">
                <Button variant="glow" size="lg" icon={ArrowRight} className="w-full">
                  Start Practicing
                </Button>
              </Link>
              <Button variant="outline" size="lg" icon={PlayCircle} className="w-full sm:w-auto group">
                Watch Demo
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section (Bento Grid) */}
      <section id="features" className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Arsenal for your <span className="text-brand-500">Career</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Our AI analyzes every aspect of your interview performance, from technical accuracy to non-verbal cues.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.id} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 relative border-t border-white/5 overflow-hidden z-10 bg-black">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-brand-900/10 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              From Job Description to <span className="text-brand-500">Offer Letter</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Four simple steps to master your interview preparation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
             {/* Animated Connector (Desktop) */}
             <div className="hidden md:block absolute top-12 left-0 w-full">
                {/* Background Line */}
                <div className="h-[2px] w-full bg-zinc-900" />
                {/* Animated Beam */}
                <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50 animate-beam" />
             </div>

            {STEPS.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="relative bg-black md:bg-transparent pt-8 md:pt-0 group"
              >
                <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-8 relative z-10 transition-all duration-300 group-hover:border-brand-500 group-hover:shadow-[0_0_30px_rgba(14,165,233,0.2)] rounded-xl group-hover:-translate-y-2">
                  <step.icon className="h-10 w-10 text-zinc-500 group-hover:text-brand-400 transition-colors duration-300" />
                  
                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-zinc-950 border border-zinc-800 text-white flex items-center justify-center text-sm font-bold group-hover:border-brand-500 group-hover:bg-brand-600 transition-all duration-300 shadow-lg">
                    {step.id}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white text-center mb-4 group-hover:text-brand-400 transition-colors">
                  {step.title}
                </h3>
                <p className="text-zinc-500 text-center text-sm leading-relaxed group-hover:text-zinc-400 transition-colors">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32 bg-zinc-950/30 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Success Stories
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-zinc-900/50 p-8 border border-white/5 hover:border-brand-500/20 transition-all duration-300 hover:bg-zinc-900 relative group"
              >
                {/* Quote Icon Background */}
                <div className="absolute top-4 right-4 text-zinc-800/50 group-hover:text-brand-900/20 transition-colors">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
                    </svg>
                </div>

                <div className="flex items-center space-x-1 mb-8 relative z-10">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-brand-500 fill-brand-500" />
                  ))}
                </div>
                <p className="text-zinc-300 mb-8 text-lg leading-relaxed font-light relative z-10">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center relative z-10">
                  <div className="h-10 w-10 bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white font-bold text-lg mr-4 rounded-sm shadow-lg shadow-brand-500/20">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm group-hover:text-brand-400 transition-colors">{testimonial.name}</h4>
                    <p className="text-zinc-500 text-xs uppercase tracking-wide mt-1">{testimonial.role} at {testimonial.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden bg-black border-t border-white/5 z-10">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.1),transparent_70%)]" />
         
         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
           <h2 className="text-5xl md:text-6xl font-black text-white mb-8 tracking-tighter">
             Ready to Ace Your Interview?
           </h2>
           <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
             Start your free trial today. No credit card required.
           </p>
           <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
             <Link to="/signup" className="w-full sm:w-auto">
               <Button variant="glow" size="lg" className="w-full">
                 Get Started Free
               </Button>
             </Link>
             <Link to="/signin" className="w-full sm:w-auto">
               <Button variant="secondary" size="lg" className="w-full">
                 Sign In
               </Button>
             </Link>
           </div>
           <div className="mt-10 flex items-center justify-center space-x-8 text-sm text-zinc-500">
             <span className="flex items-center hover:text-brand-400 transition-colors"><CheckCircle2 className="h-4 w-4 mr-2 text-brand-500" /> No credit card required</span>
             <span className="flex items-center hover:text-brand-400 transition-colors"><CheckCircle2 className="h-4 w-4 mr-2 text-brand-500" /> Cancel anytime</span>
           </div>
         </div>
      </section>
    </div>
  );
};

export default LandingPage;