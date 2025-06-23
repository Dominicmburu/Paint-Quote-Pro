import React from 'react';
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
  Users
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: <Brain className="h-8 w-8 text-teal-600" />,
      title: "AI Floor Plan Analysis",
      description: "Upload floor plans and let our AI automatically calculate surface areas and generate detailed measurements."
    },
    {
      icon: <FileText className="h-8 w-8 text-orange-500" />,
      title: "Professional Quotes",
      description: "Generate beautiful, branded PDF quotes with detailed breakdowns and professional presentation."
    },
    {
      icon: <Clock className="h-8 w-8 text-blue-600" />,
      title: "Save Hours of Time",
      description: "Reduce quote creation time from hours to minutes with automated calculations and templates."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-yellow-500" />,
      title: "Win More Jobs",
      description: "Impress clients with accurate, professional quotes delivered faster than your competition."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Mitchell",
      company: "Mitchell Painting Services",
      text: "Paint Quote Pro has transformed our business. We're creating quotes 5x faster and winning more jobs than ever before.",
      rating: 5
    },
    {
      name: "David Thompson",
      company: "Thompson Decorators",
      text: "The AI analysis is incredibly accurate. It's like having a digital estimator that never makes mistakes.",
      rating: 5
    },
    {
      name: "Lisa Rodriguez",
      company: "Precision Painters",
      text: "Our clients love the professional quotes. The detailed breakdowns really help them understand the value we provide.",
      rating: 5
    }
  ];

  const stats = [
    { label: "Quotes Generated", value: "10,000+" },
    { label: "Hours Saved", value: "50,000+" },
    { label: "Happy Painters", value: "500+" },
    { label: "Jobs Won", value: "8,500+" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-500 pt-16 pb-20 relative overflow-hidden" style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-6">
              Create Professional Paint Quotes
              <span className="block text-teal-600">in Minutes, Not Hours</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-700 mb-8 max-w-3xl mx-auto">
              Upload floor plans, let AI do the analysis, and generate stunning professional quotes 
              that win more jobs. Join hundreds of painters already saving time and increasing profits.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <a
                href="/register"
                className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center space-x-2"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href="/features"
                className="border-2 border-slate-700 text-slate-700 hover:bg-slate-700 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                Watch Demo
              </a>
            </div>

            <p className="text-slate-600 text-sm">
              ✅ 14-day free trial • ✅ No credit card required • ✅ Cancel anytime
            </p>
          </div>

          {/* Hero Image/Demo */}
          <div className="mt-16 relative">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-gray-600 text-sm ml-4">Paint Quote Pro Dashboard</span>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-700 mb-4">Upload Floor Plan</h3>
                    <div className="bg-yellow-50 border-2 border-dashed border-yellow-400 rounded-lg p-8 text-center">
                      <FileText className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <p className="text-gray-600">Drag & drop your floor plan here</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-teal-600 mb-4">Get Professional Quote</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Total Floor Area:</span>
                        <span className="font-semibold">156.5 m²</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Wall Area:</span>
                        <span className="font-semibold">324.8 m²</span>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600">Ceiling Area:</span>
                        <span className="font-semibold">156.5 m²</span>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-slate-700">Total Quote:</span>
                          <span className="text-2xl font-bold text-teal-600">£4,850</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-300 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Everything You Need to Quote Like a Pro
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our powerful AI technology combined with intuitive design makes creating 
              professional paint quotes faster and easier than ever before.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-yellow-50 transition-colors">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-600">
              Three simple steps to professional quotes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-4">Upload Floor Plan</h3>
              <p className="text-slate-600">
                Simply upload your floor plan image or PDF. Our AI supports all common formats 
                and can handle hand-drawn sketches too.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-4">AI Analysis</h3>
              <p className="text-slate-600">
                Our advanced AI analyzes the floor plan, identifies rooms, calculates surface areas, 
                and provides detailed measurements automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-4">Generate Quote</h3>
              <p className="text-slate-600">
                Review the analysis, adjust pricing if needed, and generate a beautiful, 
                professional PDF quote to send to your client.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Loved by Professional Painters
            </h2>
            <p className="text-xl text-slate-600">
              See what painting professionals are saying about Paint Quote Pro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <p className="font-semibold text-slate-800">{testimonial.name}</p>
                  <p className="text-slate-500 text-sm">{testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-slate-800 to-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Quoting Process?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join hundreds of professional painters who have already streamlined their business 
            with Paint Quote Pro. Start your free trial today!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/register"
              className="bg-yellow-400 hover:bg-yellow-500 text-slate-800 px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center space-x-2"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href="/pricing"
              className="border-2 border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-slate-800 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              View Pricing
            </a>
          </div>

          <p className="text-gray-400 text-sm mt-6">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;