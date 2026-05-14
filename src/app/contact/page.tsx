import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';

export default function ContactUs() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A2230] mb-4">Contact Us</h1>
            <p className="text-lg text-[#4C5A70] max-w-2xl mx-auto">
              Have questions about our courses or need technical support? We're here to help you every step of the way.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10">
              <h3 className="text-2xl font-bold text-[#1A2230] mb-8 flex items-center space-x-2">
                <MessageSquare className="text-[#8F3D66]" />
                <span>Send us a message</span>
              </h3>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#4C5A70]">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#8F3D66] focus:border-[#8F3D66] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#4C5A70]">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#8F3D66] focus:border-[#8F3D66] outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#4C5A70]">Subject</label>
                  <input 
                    type="text" 
                    placeholder="Inquiry about Astrology course"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#8F3D66] focus:border-[#8F3D66] outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#4C5A70]">Message</label>
                  <textarea 
                    rows={4}
                    placeholder="How can we help you?"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#8F3D66] focus:border-[#8F3D66] outline-none transition-all"
                  ></textarea>
                </div>
                
                <button className="w-full py-4 bg-[#8F3D66] text-white rounded-xl font-bold hover:bg-[#a64b7a] transition-all flex items-center justify-center space-x-2 shadow-lg shadow-[#F6E9F0]">
                  <span>Send Message</span>
                  <Send size={18} />
                </button>
              </form>
            </div>

            {/* Info Cards */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-start space-x-6">
                <div className="bg-[#F6E9F0] p-4 rounded-2xl text-[#8F3D66]">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#1A2230] mb-1">Email Us</h4>
                  <p className="text-[#4C5A70]">support@astrotantra.com</p>
                  <p className="text-[#8F3D66] text-sm font-medium mt-1">Response time: &lt; 24 hours</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-start space-x-6">
                <div className="bg-[#EEF2F8] p-4 rounded-2xl text-[#1A2230]">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#1A2230] mb-1">Call Us</h4>
                  <p className="text-[#4C5A70]">+91 [YOUR_PHONE_NUMBER]</p>
                  <p className="text-[#8F3D66] text-sm font-medium mt-1">Mon-Sat, 10am - 6pm</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-start space-x-6">
                <div className="bg-[#F6E9F0] p-4 rounded-2xl text-[#8F3D66]">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#1A2230] mb-1">Our Office</h4>
                  <p className="text-[#4C5A70]">
                    [YOUR_OFFICE_ADDRESS], India
                  </p>
                </div>
              </div>

              <div className="bg-[#8F3D66] p-8 rounded-3xl shadow-xl shadow-[#F6E9F0] text-white">
                <h4 className="text-xl font-bold mb-4">Razorpay Verification Info</h4>
                <p className="text-white/80 text-sm leading-relaxed mb-4">
                  For payment gateway approval, we have listed all our legal entities and contact details as per government norms. 
                </p>
                <div className="flex items-center space-x-2 text-sm font-bold bg-white/20 w-fit px-3 py-1 rounded-lg">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span>Compliance Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
