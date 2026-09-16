'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Phone, 
  Mail
} from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* 📞 Top Contact Bar (Reference Style) */}
      <div className="bg-[#050B13] text-white/70 py-2 border-b border-white/5 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Phone size={12} className="text-[#E69E3D]" />
              <span>Talk To Our Astrologer: (91) 1800-124-105</span>
            </div>
            <div className="flex items-center space-x-2 border-l border-white/10 pl-6">
              <Mail size={12} className="text-[#E69E3D]" />
              <span>Support@Gmail.Com</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            {/* Social Icons or other info could go here */}
          </div>
        </div>
      </div>

      {/* 🧭 Main Navigation (Reference Style) */}
      <nav 
        className={`transition-all duration-300 ${
          isScrolled ? 'bg-[#0A111A]/95 backdrop-blur-md shadow-2xl py-3' : 'bg-[#0A111A]/80 py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative w-10 h-10">
                  <Image 
                    src="/logo.png" 
                    alt="AstroTantra Logo" 
                    fill 
                    className="object-contain"
                  />
                </div>
                <span className="text-2xl font-black tracking-tighter text-white">
                  Astro<span className="text-[#E69E3D]">Tantra</span>
                </span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-12">
              {['Home', 'About Us', 'Contact Us'].map((item) => (
                <Link 
                  key={item} 
                  href={item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '-')}`}
                  className="text-[12px] font-bold uppercase tracking-[0.2em] text-white/80 hover:text-[#E69E3D] transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>

            {/* Play Store Link */}
            <div className="hidden lg:flex items-center space-x-4 border-l border-white/10 pl-8 ml-4">
               <Link 
                href="https://play.google.com/store/apps/details?id=com.astrotantra" 
                target="_blank"
                className="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 transition-all group"
               >
                  <Image 
                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                    alt="Get it on Google Play" 
                    width={110} 
                    height={35}
                    className="group-hover:scale-105 transition-transform"
                  />
               </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white p-2"
              >
                {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden absolute top-full left-0 right-0 bg-[#0A111A] border-t border-white/5 shadow-2xl p-6"
            >
              <div className="space-y-4">
                {['Home', 'About Us', 'Contact Us'].map((item) => (
                  <Link 
                    key={item}
                    href="#" 
                    className="block text-sm font-bold text-white/70 hover:text-[#E69E3D] py-2 uppercase tracking-widest"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </Link>
                ))}
                <Link 
                  href="https://play.google.com/store/apps/details?id=com.astrotantra" 
                  target="_blank"
                  className="block text-center bg-white/5 border border-white/10 text-white py-4 rounded-lg font-black uppercase tracking-widest text-xs"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Download Our App
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
