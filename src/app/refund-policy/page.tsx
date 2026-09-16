import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { RefreshCcw } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-12">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-[#F6E9F0] p-3 rounded-2xl">
              <RefreshCcw className="text-[#8F3D66] h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A2230]">Cancellation & Refund Policy</h1>
          </div>
          
          <p className="text-slate-500 mb-8 italic">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Digital Products Policy</h2>
              <p>
                AstroTantra provides digital educational content (LMS). Due to the nature of digital products, once a course is accessed or downloaded, we generally do not offer refunds. However, we are committed to your satisfaction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Cancellation Policy</h2>
              <p>
                You can cancel your subscription or account at any time. If you cancel, you will continue to have access to the service through the end of your current billing period. We do not provide refunds or credits for any partial membership periods or unused courses.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. Refund Eligibility</h2>
              <p>
                Refunds may be granted under the following exceptional circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Double payment for the same course/service due to a technical glitch.</li>
                <li>The course content is significantly different from what was advertised.</li>
                <li>Proven technical issues on our end that prevent access to the content for more than 48 hours.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Refund Process</h2>
              <p>
                To request a refund, please email <strong>support@astrotantra.com</strong> with your order details and the reason for the request. If approved, the refund will be processed to the original payment method within <strong>7-10 business days</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">5. Modifications</h2>
              <p>
                AstroTantra reserves the right to modify this policy at any time. Changes will be effective immediately upon posting on the website.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
