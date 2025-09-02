import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowRight,
  Zap,
  Brain,
  FileText,
  Clock,
  CheckCircle,
  Star,
  TrendingUp,
  Shield,
  Users,
  Menu,
  Search,
  X,
  Smartphone,
  Calculator,
  PieChart,
  Download,
  Upload,
  Camera,
  Palette,
  DollarSign,
  BarChart3,
  Play,
  Lightbulb,
  Layers,
  Target,
  Wifi,
  Monitor,
  Car
} from 'lucide-react';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const handleTryForFree = () => {
    if (loading) {
      return;
    }

    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleExperienceBenefits = () => {
    if (loading) return;

    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleStartQuoting = () => {
    if (loading) return;

    if (isAuthenticated) {
      navigate('/quotes');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#4bb4f5] via-[#4bb4f5] to-[#4bb4f5] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Character */}
            <div className="order-2 lg:order-1 flex justify-center lg:justify-start relative">
              <div className="relative">
                {/* Main character placeholder - replace with your image */}
                <div className="rounded-lg flex items-center justify-center">
                  {/* <span className="text-gray-600">CHARACTER IMAGE PLACEHOLDER</span> */}
                  <img src="./images/hero.png" alt="hero image" />
                </div>
              </div>
            </div>

            {/* Right side - Content */}
            <div className="order-1 lg:order-2">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 leading-tight">
                Quotes That Took Hours
                <span className="block">Now Done in Minutes</span>
              </h1>
              <p className="text-lg text-slate-700 mb-8 leading-relaxed">
                Meet the ultimate quoting tool for painters and plasterers. With built-in AI to read floor plans,
                calculate costs, and capture digital signatures, Flotto helps you win jobs faster—without
                sacrificing your evenings.
              </p>

              <button className="mybtn"
                onClick={handleTryForFree}
                disabled={loading}>
                {loading ? 'Loading...' : isAuthenticated ? 'Go to Dashboard' : 'Try it for free!'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
                Why do painters and plasterers choose Flotto?
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Find out how other contractors get started with Flotto and be convinced.
              </p>
              <button
                onClick={handleExperienceBenefits}
                disabled={loading}
                className="mybtn"
              >
                {loading ? 'Loading...' : isAuthenticated ? 'Go to Dashboard' : 'Experience the benefits yourself'}
              </button>

            </div>
            <div className="relative">
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="relative overflow-hidden rounded-xl">
                    <img
                      src="./images/image2.png"
                      alt="Red tape"
                      className="w-full max-w-lg h-auto transform hover:scale-105 transition-transform duration-500 ease-in-out filter"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300"></div>
                  </div>

                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#4bb4f5] rounded-full animate-bounce"></div>
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full animate-pulse"></div>
                  <div className="absolute top-1/2 -right-6 w-4 h-4 bg-blue-400 rounded-full opacity-70"></div>
                  <div className="absolute bottom-4 left-4 bg-yellow-400 text-slate-800 px-4 py-2 rounded-lg font-bold text-sm">
                    "As a painter, I work about 5 hours a day on quotes. I'm done in 30 minutes now!"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-500 mb-2">Red tape:</h2>
                <h3 className="text-3xl font-bold text-slate-900 mb-6">Super simple AI quoting!</h3>
              </div>

              <p className="text-lg text-slate-600 leading-relaxed">
                Flotto is the ultimate quoting tool built for painters and plasterers who'd rather be
                working than paperwork-ing. With Flotto, creating detailed, professional quotes becomes
                fast, easy, and even enjoyable.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                Flotto isn't just another generic quoting platform. It's built specifically for the trades—simple
                where it should be, smart where it matters. Whether you're a one-person operation or a growing team,
                Flotto helps you handle quoting without hassle.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                Generate accurate quotes using our AI-powered floor plan reader and cost calculator. Add woodwork,
                walls, ceilings, and more in seconds. Your customer can sign digitally—no printing, scanning,
                or back-and-forth emails.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                Use Flotto on your laptop, tablet, or right from your phone while you're still on-site.
                By the time you leave the client's house, the quote is already in their inbox.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="relative group">
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src="./images/image1.png"
                    alt="Red tape"
                    className="w-full max-w-lg h-auto transform hover:scale-105 transition-transform duration-500 ease-in-out filter"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300"></div>
                </div>

                <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#4bb4f5] rounded-full animate-bounce"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full animate-pulse"></div>
                <div className="absolute top-1/2 -right-6 w-4 h-4 bg-blue-400 rounded-full opacity-70"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Create Invoices Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-12 flex items-center justify-center bg-gradient-to-br from-yellow-300 to-yellow-400">
                {/* Laptop illustration placeholder */}
                <div className="relative">
                  <div className="w-80 h-48 bg-slate-800 rounded-lg p-2">
                    <div className="w-full h-full bg-white rounded flex items-center justify-center">
                      <img src="./images/image.png" alt="Invoice illustration" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-12">
                <h3 className="text-3xl font-bold text-slate-800 mb-6">
                  Create invoices for free and easily
                </h3>
                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                  With Flotto's accounting software, creating invoices and managing your online bookkeeping is a breeze!
                  Discover for yourself how easy Flotto's accounting software is for freelancers, entrepreneurs, and freelancers.
                </p>
                <button
                  onClick={() => {
                    if (loading) return;
                    if (isAuthenticated) {
                      navigate('/dashboard');
                    } else {
                      navigate('/login');
                    }
                  }}
                  disabled={loading}
                  className="mybtn"
                >
                  {loading ? 'Loading...' : isAuthenticated ? 'Create Invoice' : 'Create your first invoice now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              The possibilities of the Flotto program
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-yellow-400 rounded-lg flex items-center justify-center">
                  <FileText className="h-8 w-8 text-slate-800" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                Quotes & Invoices
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Send professional quotes your clients can sign digitally with ease. Generate and send invoices
                instantly, complete with secure payment links for fast and simple transactions.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                  <Monitor className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                AI Floor Plan Reader
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Upload a floor plan and let our AI do the rest. It automatically calculates wall and ceiling
                dimensions in seconds—no measuring or manual input required.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-[#4bb4f5] rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                Cost Calculator
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Easily build accurate quotes with our intuitive calculator. Select interior and exterior
                surfaces, woodwork types, and preparation steps—we handle the rest.
              </p>
            </div>
          </div>

          {/* Second row of features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-[#4bb4f5] rounded-lg flex items-center justify-center">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                Photo documentation
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Just take a picture of your job site. You put it directly in the Flotto app via your phone,
                after which documenting your work becomes a piece of cake.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                  <Car className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                Hours & project time tracking
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                As a painting contractor, you regularly track down hours for your projects. With Flotto,
                you can easily keep track of your hours and convert them into an invoice.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                Android & iPhone app
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                You want to be able to do your project management anywhere, that's why it's handy that
                Flotto works on any device. Download our Android or iPhone app.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link to="/features">
              <button className="mybtn">
                View all options
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              These users are already fans!
            </h2>
          </div>

          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">PP</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-slate-800">Premium Painters Ltd</h3>
                    </div>
                  </div>
                  <p className="text-lg italic text-slate-600 mb-6">
                    "Finally an affordable and smart solution for everything you don't really want to do."
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    Flotto is an ideal solution for me. As a painting contractor I can quote very quickly and
                    keep an eye on project costs. Quotes look professional and can be sent immediately.
                    Excellent solution!
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-semibold text-slate-600">General judgment</span>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-600">Reliability</span>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < 5 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-600">Ease of use</span>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-600">Price/quality</span>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link to="/testimonials">
              <button className="mybtn">
                Read more experiences
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;