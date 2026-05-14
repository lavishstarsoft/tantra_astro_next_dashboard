import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FileText } from 'lucide-react';

export default function TermsConditions() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-12">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-[#F6E9F0] p-3 rounded-2xl">
              <FileText className="text-[#8F3D66] h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A2230]">Terms & Conditions</h1>
          </div>
          
          <p className="text-slate-500 mb-8 italic">Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing or using the AstroTantra platform, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, you may not access the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Intellectual Property</h2>
              <p>
                The service and its original content, features, and functionality are and will remain the exclusive property of AstroTantra and its licensors. Our courses, videos, and materials are protected by copyright, trademark, and other laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. User Accounts</h2>
              <p>
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the terms, which may result in immediate termination of your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Links To Other Web Sites</h2>
              <p>
                Our service may contain links to third-party web sites or services that are not owned or controlled by AstroTantra. AstroTantra has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third-party web sites or services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">5. Limitation Of Liability</h2>
              <p>
                In no event shall AstroTantra, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">6. Governing Law</h2>
              <p>
                These terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
