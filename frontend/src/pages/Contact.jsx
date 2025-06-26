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
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Thank you for your message!</h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              We've received your message and our team will get back to you within 24 hours 
              during business days. We look forward to helping you with Paint Quote Pro!
            </p>
            <button
              onClick={() => setSent(false)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
            >
              Send Another Message
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <section className="bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-400 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
            Get in Touch with Paint Quote Pro
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 max-w-4xl mx-auto leading-relaxed mb-8">
            Have questions about revolutionizing your painting business? We're here to help you succeed. 
            Our team of painting industry experts is ready to support your journey.
          </p>
          <div className="flex items-center justify-center space-x-6 text-slate-600">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="font-medium">Expert support team</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="font-medium">24-hour response time</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="font-medium">Free consultation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Contact Options */}
      {/* <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              Choose Your Preferred Contact Method
            </h2>
            <p className="text-xl text-slate-600">
              We're here to help in whatever way works best for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
              <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-100 transition-colors">
                <Mail className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3 text-center">Email Support</h3>
              <p className="text-slate-600 mb-6 text-center">Perfect for detailed questions and technical support</p>
              <div className="text-center">
                <p className="font-bold text-slate-800 text-lg mb-2">hello@paintquotepro.com</p>
                <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  <span>Response within 24 hours</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
              <div className="w-16 h-16 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-amber-100 transition-colors">
                <Phone className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3 text-center">Phone Support</h3>
              <p className="text-slate-600 mb-6 text-center">Speak directly with our painting industry experts</p>
              <div className="text-center">
                <p className="font-bold text-slate-800 text-lg mb-2">+44 20 7123 4567</p>
                <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  <span>Mon-Fri 9am-6pm GMT</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
              <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-100 transition-colors">
                <MessageCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3 text-center">Live Chat</h3>
              <p className="text-slate-600 mb-6 text-center">Get instant answers to your questions</p>
              <div className="text-center">
                <p className="font-bold text-slate-800 text-lg mb-2">Available in app</p>
                <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  <span>Mon-Fri 9am-6pm GMT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Main Content */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="order-2 lg:order-1">
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Send us a Message</h2>
                <p className="text-slate-600 mb-8">Tell us about your painting business and how we can help you succeed</p>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                        Email Address *
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
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="Your painting company"
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-2">
                        I'm interested in *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select an option</option>
                        <option value="demo">Requesting a demo</option>
                        <option value="pricing">Learning about pricing</option>
                        <option value="features">Understanding features</option>
                        <option value="support">Technical support</option>
                        <option value="billing">Billing questions</option>
                        <option value="partnership">Partnership opportunities</option>
                        <option value="general">General inquiry</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                      Tell us about your business *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                      placeholder="Tell us about your painting business, current challenges, and how we might be able to help you grow..."
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center transform hover:scale-105 disabled:transform-none shadow-lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-3" />
                        Send Message
                      </>
                    )}
                  </button>

                  <p className="text-sm text-slate-500 text-center">
                    We'll respond within 24 hours during business days
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info & FAQ */}
            <div className="order-1 lg:order-2 space-y-12">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-8">Our Office</h2>
                
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <div className="flex items-start mb-6">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                      <MapPin className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg mb-2">Paint Quote Pro Ltd</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Innovation Street 15 - 5B<br />
                        London W1A 0AX<br />
                        United Kingdom
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg mb-2">Business Hours</h3>
                      <p className="text-slate-600 leading-relaxed">
                        <strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM GMT<br />
                        <strong>Saturday:</strong> 10:00 AM - 4:00 PM GMT<br />
                        <strong>Sunday:</strong> Closed
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-6">Frequently Asked Questions</h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start">
                      <HelpCircle className="h-5 w-5 text-emerald-600 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">How quickly can I get started?</h4>
                        <p className="text-slate-600 leading-relaxed">You can sign up and start creating professional quotes within minutes. Our simple onboarding process guides you through everything you need to know.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start">
                      <Users className="h-5 w-5 text-amber-600 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">Do you provide training and support?</h4>
                        <p className="text-slate-600 leading-relaxed">Absolutely! We offer comprehensive onboarding calls, video tutorials, and ongoing support to ensure you get the most out of Paint Quote Pro.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start">
                      <Star className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">Can I import my existing client data?</h4>
                        <p className="text-slate-600 leading-relaxed">Yes! Our support team will help you migrate your existing client and project data seamlessly so you can get up and running quickly.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-emerald-600 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2">Is there a free trial?</h4>
                        <p className="text-slate-600 leading-relaxed">Yes! Every plan comes with a 14-day free trial. No credit card required to start exploring all the features.</p>
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
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Join Hundreds of Successful Painters</h2>
            <p className="text-xl text-slate-600">See what Paint Quote Pro customers are saying</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 italic mb-4">"Paint Quote Pro has completely transformed my business. I'm creating quotes 5x faster and winning more jobs than ever before."</p>
              <p className="font-semibold text-slate-800">Sarah Mitchell</p>
              <p className="text-slate-500 text-sm">Mitchell Painting Services</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 italic mb-4">"The support team is fantastic. They helped me get set up and even imported all my existing client data. Outstanding service!"</p>
              <p className="font-semibold text-slate-800">David Thompson</p>
              <p className="text-slate-500 text-sm">Thompson Decorators</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 italic mb-4">"The AI analysis is incredibly accurate and my quotes look so professional. I've won every job I've quoted since switching!"</p>
              <p className="font-semibold text-slate-800">Lisa Rodriguez</p>
              <p className="text-slate-500 text-sm">Precision Painters</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;