import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Target, Users, Sparkles } from 'lucide-react';

export default function AboutUs() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-32 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-[#F6E9F0] text-[#8F3D66] px-4 py-2 rounded-full mb-6">
              <Sparkles size={18} />
              <span className="text-sm font-bold uppercase tracking-wider">Our Story</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A2230] mb-6 leading-tight">
              Bridging Ancient Wisdom with Modern Learning
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              AstroTantra is a premier Learning Management System dedicated to spiritual growth, astrology, and ancient occult sciences. Our mission is to make authentic spiritual knowledge accessible to everyone, everywhere.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="bg-indigo-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
              <Target size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Our Mission</h3>
            <p className="text-slate-600 leading-relaxed">
              To provide a structured, authentic, and easy-to-use platform for seekers to learn and grow in their spiritual journey.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="bg-violet-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-violet-600">
              <GraduationCap size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Our Vision</h3>
            <p className="text-slate-600 leading-relaxed">
              To become the world&apos;s leading destination for occult and spiritual education, powered by technology and tradition.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="bg-emerald-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
              <Users size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Our Community</h3>
            <p className="text-slate-600 leading-relaxed">
              We host thousands of students who are passionate about learning and sharing their insights with the world.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

const GraduationCap = ({ size }: { size: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);
