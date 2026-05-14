import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GraduationCap, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#120A1C] pt-32 pb-12 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8F3D66]/5 blur-[120px] rounded-full"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 mb-24">
          {/* Brand Vision */}
          <div className="lg:col-span-4 space-y-8">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative w-12 h-12 overflow-hidden">
                <Image 
                  src="/logo.png" 
                  alt="AstroTantra Logo" 
                  fill 
                  className="object-contain"
                />
              </div>
              <span className="text-3xl font-black tracking-tighter text-white">
                Astro<span className="text-[#E85A8A]">Tantra</span>
              </span>
            </Link>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              The world's leading destination for authentic spiritual education and metaphysical mastery.
            </p>
            <div className="flex items-center space-x-4">
              {['FB', 'IG', 'TW', 'YT'].map((s) => (
                <div key={s} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#8F3D66] transition-all cursor-pointer font-bold text-[10px]">
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Academy Navigation */}
          <div className="lg:col-span-2 space-y-8">
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-[#E85A8A]">Academy</h4>
            <ul className="space-y-4 text-slate-400">
              <li><Link href="/about" className="hover:text-white transition-colors">Our Story</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Legal Compliance */}
          <div className="lg:col-span-3 space-y-8">
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-[#E85A8A]">Compliance</h4>
            <ul className="space-y-4 text-slate-400">
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Shipping Info</Link></li>
            </ul>
          </div>

          {/* Support Channel */}
          <div className="lg:col-span-3 space-y-8">
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-[#E85A8A]">Get in Touch</h4>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8F3D66]">
                  <Mail size={20} />
                </div>
                <span className="text-slate-300 font-medium">support@astrotantra.com</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8F3D66]">
                  <Phone size={20} />
                </div>
                <span className="text-slate-300 font-medium">+91 [YOUR_PHONE_NUMBER]</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-slate-500 text-sm font-medium">
            &copy; {new Date().getFullYear()} AstroTantra Global Academy. All rights reserved.
          </div>
          <div className="flex items-center space-x-8 opacity-60">
            <span className="text-xs font-bold tracking-widest uppercase">Verified by Razorpay</span>
            <div className="flex items-center space-x-2 grayscale">
              <div className="w-8 h-5 bg-slate-700 rounded-sm"></div>
              <div className="w-8 h-5 bg-slate-700 rounded-sm"></div>
              <div className="w-8 h-5 bg-slate-700 rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
