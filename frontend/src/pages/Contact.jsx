import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Menu,
  X,
  CheckCircle,
  Clock,
  MessageCircle,
  ArrowRight,
  HelpCircle,
  Users,
  Star
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const Contact = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async () => {
    setLoading(true);

    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-[#4bb4f5]" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">{t('Thank you for your message!')}</h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              {t("We've received your message and our team will get back to you within 24 hours during business days. We look forward to helping you with Paint Quote Pro!")}
            </p>
            <button
              onClick={() => setSent(false)}
              className="mybtn"
            >
              {t('Send Another Message')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <section className="bg-gradient-to-br from-[#4bb4f5] via-[#4bb4f5] to-[#4bb4f5] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
            {t('Get in Touch with Paint Quote Pro')}
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 max-w-4xl mx-auto leading-relaxed mb-8">
            {t("Have questions about revolutionizing your painting business? We're here to help you succeed. Our team of painting industry experts is ready to support your journey.")}
          </p>
          <div className="flex items-center justify-center space-x-6 text-slate-600">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-slate-700" />
              <span className="font-medium">{t('Expert support team')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-slate-700" />
              <span className="font-medium">{t('24-hour response time')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-slate-700" />
              <span className="font-medium">{t('Free consultation')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="order-2 lg:order-1">
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">{t('Send us a Message')}</h2>
                <p className="text-slate-600 mb-8">{t("Tell us about your painting business and how we can help you succeed")}</p>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                        {t('Full Name *')}
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder={t("Enter your full name")}
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                        {t('Email Address *')}
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company" className="block text-sm font-semibold text-slate-700 mb-2">
                        {t('Company Name')}
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder={t("Your painting company")}
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-2">
                        {t("I'm interested in *")}
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      >
                        <option value="">{t("Select an option")}</option>
                        <option value="demo">{t("Requesting a demo")}</option>
                        <option value="pricing">{t("Learning about pricing")}</option>
                        <option value="features">{t("Understanding features")}</option>
                        <option value="support">{t("Technical support")}</option>
                        <option value="billing">{t("Billing questions")}</option>
                        <option value="partnership">{t("Partnership opportunities")}</option>
                        <option value="general">{t("General inquiry")}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                      {t('Tell us about your business *')}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                      placeholder={t("Tell us about your painting business, current challenges, and how we might be able to help you grow...")}
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-[#4bb4f5] hover:bg-[#4bb4f5] disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center transform hover:scale-105 disabled:transform-none shadow-lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        {t('Sending Message...')}
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-3" />
                        {t('Send Message')}
                      </>
                    )}
                  </button>

                  <p className="text-sm text-slate-500 text-center">
                    {t("We'll respond within 24 hours during business days")}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info & FAQ */}
            <div className="order-1 lg:order-2 space-y-12">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-8">{t('Our Office')}</h2>

                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <div className="flex items-start mb-6">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                      <MapPin className="h-6 w-6 text-[#4bb4f5]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg mb-2">{t('Paint Quote Pro Ltd')}</h3>
                      <p className="text-slate-600 leading-relaxed">
                        {t('Innovation Street 15 - 5B')}<br />
                        {t('London W1A 0AX')}<br />
                        {t('United Kingdom')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg mb-2">{t('Business Hours')}</h3>
                      <p className="text-slate-600 leading-relaxed">
                        <strong>{t('Monday - Friday:')}</strong> {t('9:00 AM - 6:00 PM GMT')}<br />
                        <strong>{t('Saturday:')}</strong> {t('10:00 AM - 4:00 PM GMT')}<br />
                        <strong>{t('Sunday:')}</strong> {t('Closed')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-6">{t('Frequently Asked Questions')}</h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start">
                      <HelpCircle className="h-5 w-5 text-[#4bb4f5] mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">{t('How quickly can I get started?')}</h4>
                        <p className="text-slate-600 leading-relaxed">{t("You can sign up and start creating professional quotes within minutes. Our simple onboarding process guides you through everything you need to know.")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start">
                      <Users className="h-5 w-5 text-amber-600 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">{t('Do you provide training and support?')}</h4>
                        <p className="text-slate-600 leading-relaxed">{t("Absolutely! We offer comprehensive onboarding calls, video tutorials, and ongoing support to ensure you get the most out of Paint Quote Pro.")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start">
                      <Star className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">{t('Can I import my existing client data?')}</h4>
                        <p className="text-slate-600 leading-relaxed">{t("Yes! Our support team will help you migrate your existing client and project data seamlessly so you can get up and running quickly.")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#4bb4f5] mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">{t('Is there a free trial?')}</h4>
                        <p className="text-slate-600 leading-relaxed">{t("Yes! Every plan comes with a 14-day free trial. No credit card required to start exploring all the features.")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">{t('Join Hundreds of Successful Painters')}</h2>
            <p className="text-xl text-slate-600">{t('See what Paint Quote Pro customers are saying')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 italic mb-4">{t('"Paint Quote Pro has completely transformed my business. I\'m creating quotes 5x faster and winning more jobs than ever before."')}</p>
              <p className="font-semibold text-slate-800">{t('Sarah Mitchell')}</p>
              <p className="text-slate-500 text-sm">{t('Mitchell Painting Services')}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 italic mb-4">{t('"The support team is fantastic. They helped me get set up and even imported all my existing client data. Outstanding service!"')}</p>
              <p className="font-semibold text-slate-800">{t('David Thompson')}</p>
              <p className="text-slate-500 text-sm">{t('Thompson Decorators')}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 italic mb-4">{t('"The AI analysis is incredibly accurate and my quotes look so professional. I\'ve won every job I\'ve quoted since switching!"')}</p>
              <p className="font-semibold text-slate-800">{t('Lisa Rodriguez')}</p>
              <p className="text-slate-500 text-sm">{t('Precision Painters')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;