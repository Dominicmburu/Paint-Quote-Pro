import React from 'react';
import { FileText, Scale, AlertTriangle, Users, CreditCard, Shield } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Scale className="h-16 w-16 text-slate-800" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-4">Terms of Service</h1>
            <p className="text-lg text-slate-700">
              The terms and conditions governing your use of Flotto.
            </p>
            <p className="text-sm text-slate-600 mt-2">Last updated: January 1, 2025</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Agreement to Terms</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              These Terms of Service ("Terms") govern your use of Flotto's quoting software and related services 
              (the "Service") provided by Flotto ("we," "us," or "our").
            </p>
            <p className="text-gray-600 leading-relaxed">
              By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any 
              part of these terms, you may not access the Service.
            </p>
          </section>

          {/* Service Description */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-[#4bb4f5] mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">Service Description</h2>
            </div>
            
            <p className="text-gray-600 leading-relaxed mb-4">
              Flotto provides AI-powered quoting software designed specifically for painters and plasterers. 
              Our Service includes:
            </p>
            
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Quote and invoice generation tools</li>
              <li>AI floor plan reading and analysis</li>
              <li>Cost calculation features</li>
              <li>Digital signature capture</li>
              <li>Project management tools</li>
              <li>Photo documentation features</li>
              <li>Mobile applications for iOS and Android</li>
            </ul>
          </section>

          {/* User Accounts */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-[#4bb4f5] mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">User Accounts and Registration</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Account Creation</h3>
                <p className="text-gray-600 leading-relaxed">
                  To use certain features of the Service, you must create an account. You agree to provide accurate, 
                  current, and complete information during registration and to update such information as necessary.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Account Security</h3>
                <p className="text-gray-600 leading-relaxed">
                  You are responsible for maintaining the confidentiality of your account credentials and for all 
                  activities that occur under your account. You must immediately notify us of any unauthorized use 
                  of your account.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Account Termination</h3>
                <p className="text-gray-600 leading-relaxed">
                  We reserve the right to terminate or suspend your account at our sole discretion, without notice, 
                  for conduct that violates these Terms or is harmful to other users or our business.
                </p>
              </div>
            </div>
          </section>

          {/* Acceptable Use */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-[#4bb4f5] mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">Acceptable Use Policy</h2>
            </div>
            
            <p className="text-gray-600 leading-relaxed mb-4">You agree not to use the Service to:</p>
            
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 mb-4">
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Upload or transmit malicious code, viruses, or harmful content</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Use the Service for fraudulent or deceptive purposes</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Copy, modify, or distribute our software or content without permission</li>
              <li>Use automated tools to access the Service without our consent</li>
            </ul>
            
            <p className="text-gray-600 leading-relaxed">
              Violation of this policy may result in immediate termination of your account.
            </p>
          </section>

          {/* Payment Terms */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <CreditCard className="h-6 w-6 text-[#4bb4f5] mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">Payment Terms</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Subscription Fees</h3>
                <p className="text-gray-600 leading-relaxed">
                  Use of certain features of the Service requires payment of subscription fees. All fees are 
                  non-refundable except as required by law or as specifically stated in these Terms.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Billing and Payment</h3>
                <p className="text-gray-600 leading-relaxed">
                  Subscription fees are billed in advance on a monthly or annual basis. You authorize us to 
                  charge your chosen payment method for these fees. If payment fails, we may suspend or 
                  terminate your access to paid features.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Price Changes</h3>
                <p className="text-gray-600 leading-relaxed">
                  We reserve the right to change our pricing at any time. We will provide at least 30 days' 
                  notice of any price increases for existing subscribers.
                </p>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-[#4bb4f5] mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">Intellectual Property Rights</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Our Rights</h3>
                <p className="text-gray-600 leading-relaxed">
                  The Service and its original content, features, and functionality are owned by Flotto and are 
                  protected by international copyright, trademark, patent, trade secret, and other intellectual 
                  property laws.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Your Content</h3>
                <p className="text-gray-600 leading-relaxed">
                  You retain ownership of the content you create using our Service (quotes, invoices, project data). 
                  By using the Service, you grant us a limited license to use, store, and process your content 
                  solely to provide the Service to you.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">License to Use</h3>
                <p className="text-gray-600 leading-relaxed">
                  Subject to these Terms, we grant you a limited, non-exclusive, non-transferable license to 
                  access and use the Service for your business purposes.
                </p>
              </div>
            </div>
          </section>

          {/* Privacy and Data */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Privacy and Data Protection</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Your privacy is important to us. Our collection and use of your information is governed by our 
              Privacy Policy, which is incorporated into these Terms by reference.
            </p>
            <p className="text-gray-600 leading-relaxed">
              You are responsible for ensuring that any personal data you process through the Service complies 
              with applicable data protection laws.
            </p>
          </section>

          {/* Service Availability */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Service Availability and Maintenance</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We strive to maintain high service availability but cannot guarantee uninterrupted access. We may 
              temporarily suspend the Service for maintenance, updates, or technical issues.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We will provide reasonable notice of planned maintenance when possible.
            </p>
          </section>

          {/* Disclaimers */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Disclaimers</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>Important:</strong> The Service is provided "as is" and "as available" without warranties 
                of any kind, either express or implied.
              </p>
            </div>
            <p className="text-gray-600 leading-relaxed">
              We disclaim all warranties, including but not limited to implied warranties of merchantability, 
              fitness for a particular purpose, and non-infringement. We do not warrant that the Service will 
              be error-free, secure, or continuously available.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              To the fullest extent permitted by law, Flotto shall not be liable for any indirect, incidental, 
              special, punitive, or consequential damages arising from your use of the Service.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our total liability to you for all claims related to the Service shall not exceed the amount 
              you paid us in the 12 months preceding the claim.
            </p>
          </section>

          {/* Indemnification */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Indemnification</h2>
            <p className="text-gray-600 leading-relaxed">
              You agree to indemnify and hold harmless Flotto from any claims, damages, losses, or expenses 
              arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          {/* Termination */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Termination</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You may terminate your account at any time by contacting us or using the account deletion feature 
              in the Service. We may terminate or suspend your access immediately, without prior notice, for 
              any breach of these Terms.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Upon termination, your right to use the Service will cease, and we may delete your account and 
              data after a reasonable period.
            </p>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Governing Law and Dispute Resolution</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law principles. 
              Any disputes arising from these Terms or the Service will be resolved through binding arbitration.
            </p>
            <p className="text-gray-600 leading-relaxed">
              You waive any right to participate in class-action lawsuits or class-wide arbitration.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of material changes 
              by posting the updated Terms on our website. Your continued use of the Service after changes 
              constitutes acceptance of the new Terms.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Contact Information</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="space-y-2">
                <p className="text-gray-600"><strong>Email:</strong> legal@flotto.com</p>
                <p className="text-gray-600"><strong>Address:</strong> 123 Business Ave, Suite 100, Business City, BC 12345</p>
                <p className="text-gray-600"><strong>Phone:</strong> +1 (555) 123-4567</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfService;