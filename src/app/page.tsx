'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { 
  Star, 
  Award,
  Video,
  Users
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/**
 * Mystical Astrology Redesign (Reference: Uploaded Image Style)
 * Theme: Deep Navy, Gold Accents, Circular Zodiac Focus.
 */

export default function LandingPage() {

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: "easeOut" } 
    }
  };

  const stagger: Variants = {
    visible: { transition: { staggerChildren: 0.15 } }
  };

  return (
    <main className="min-h-screen bg-[#0A111A] text-white font-sans selection:bg-[#E69E3D] selection:text-white overflow-x-hidden">
      <Navbar />

      {/* 🔮 Hero Section: Mastery Focus */}
      <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden bg-[#0A111A]">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[150px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="space-y-10"
            >
              <motion.div variants={fadeInUp} className="space-y-6">
                <h4 className="text-[#E69E3D] font-bold text-xl font-serif">Academy of Celestial Sciences</h4>
                <h1 className="text-5xl md:text-[84px] font-bold leading-[1.05] tracking-tight text-white">
                  Master the Art of <br />
                  Spiritual Science
                </h1>
                <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-md font-medium">
                  Become a certified practitioner with our structured Astrology LMS. Learn from masters through comprehensive video modules and live mentorship.
                </p>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Link 
                  href="/login" 
                  className="inline-block px-10 py-4 bg-[#E69E3D] text-[#0A111A] rounded-md font-black uppercase tracking-widest text-xs hover:bg-white transition-all shadow-xl shadow-[#E69E3D]/10"
                >
                  Explore Courses
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Visual */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-20 bg-[#E69E3D]/5 rounded-full blur-[120px]"></div>
                <Image 
                  src="/zodiac-chart.png" 
                  alt="Astro Mastery" 
                  width={750} 
                  height={750}
                  className="w-full h-auto drop-shadow-[0_0_80px_rgba(230,158,61,0.2)]"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 🏛️ "Know About" Section: Academy Focus */}
      <section className="py-32 relative bg-[#050B13]">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-10"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#E69E3D] font-serif italic">About the Academy</h2>
            
            <div className="space-y-8">
              <p className="text-white/70 text-lg leading-relaxed">
                AstroTantra Academy is India&apos;s leading digital platform for professional metaphysical education. We bridge the gap between ancient Vedic wisdom and modern structured learning.
              </p>
              <p className="text-white/50 text-sm leading-relaxed max-w-2xl mx-auto italic">
                Our mission is to empower seekers with authentic knowledge through high-definition video modules, interactive quizzes, and industry-recognized certification paths.
              </p>
            </div>

            <div>
              <Link 
                href="/about" 
                className="inline-block px-12 py-5 bg-[#E69E3D] text-white rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-[#d48c2c] transition-all"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>


      {/* 📚 Course Selection (Professional EdTech Component) */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <h2 className="text-3xl font-bold mb-12 text-center">Featured <span className="text-[#E69E3D]">Learning</span> Paths</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { title: "Vedic Foundations", instructor: "Dr. Arun Sharma", rating: 4.8, price: "₹4,999", image: "/vedic-thumbnail.png" },
            { title: "Prediction Mastery", instructor: "Master S. Rajan", rating: 4.9, price: "₹7,999", image: "/hero-illustration.png" },
            { title: "Vastu Science", instructor: "Ar. Priya Gupta", rating: 4.7, price: "₹5,999", image: "/vastu-thumbnail.png" },
            { title: "Hand Reading", instructor: "Smt. Kavitha", rating: 4.6, price: "₹3,499", image: "/palmistry-thumbnail.png" }
          ].map((course, i) => (
            <Link key={i} href="/login" className="group block bg-[#0A111A] border border-white/5 overflow-hidden hover:border-[#E69E3D]/50 transition-all">
              <div className="relative aspect-video">
                <Image 
                  src={course.image} 
                  alt={course.title} 
                  fill 
                  className="object-cover" 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-bold leading-tight group-hover:text-[#E69E3D] transition-colors">{course.title}</h3>
                <p className="text-xs text-white/40">{course.instructor}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-[#E69E3D] font-bold">{course.price}</span>
                  <div className="flex items-center text-amber-500">
                    <Star size={12} fill="currentColor" />
                    <span className="ml-1 text-xs font-bold text-white">{course.rating}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 🎁 Support Channel */}
      <section className="bg-[#050B13] py-20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <div className="text-[#E69E3D] flex justify-center"><Award size={40} /></div>
            <h4 className="text-xl font-bold">Lifetime Access</h4>
            <p className="text-sm text-white/40">Learn at your own pace with unlimited access.</p>
          </div>
          <div className="space-y-4">
            <div className="text-[#E69E3D] flex justify-center"><Users size={40} /></div>
            <h4 className="text-xl font-bold">Expert Mentors</h4>
            <p className="text-sm text-white/40">Taught by world-class astrology practitioners.</p>
          </div>
          <div className="space-y-4">
            <div className="text-[#E69E3D] flex justify-center"><Video size={40} /></div>
            <h4 className="text-xl font-bold">HD Video Lessons</h4>
            <p className="text-sm text-white/40">High-quality structured learning modules.</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
