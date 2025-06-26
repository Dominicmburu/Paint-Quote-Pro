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
  Users,
  Menu,
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
  Play
} from 'lucide-react';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const features = [
    {
      icon: <Brain className="h-8 w-8 text-emerald-600" />,
      title: "AI Floor Plan Analysis",
      description: "Upload floor plans and let our AI automatically calculate surface areas and generate detailed measurements."
    },
    {
      icon: <FileText className="h-8 w-8 text-amber-600" />,
      title: "Professional Quotes",
      description: "Generate beautiful, branded PDF quotes with detailed breakdowns and professional presentation."
    },
    {
      icon: <Clock className="h-8 w-8 text-blue-600" />,
      title: "Save Hours of Time",
      description: "Reduce quote creation time from hours to minutes with automated calculations and templates."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-emerald-600" />,
      title: "Win More Jobs",
      description: "Impress clients with accurate, professional quotes delivered faster than your competition."
    }
  ];

  const capabilities = [
    {
      icon: <FileText className="h-12 w-12 text-amber-500" />,
      title: "Create quotes and estimates",
      description: "With Paint Quote Pro you can easily create your quote in your own house style. The quote is automatically sent as a PDF by e-mail to your client."
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-emerald-500" />,
      title: "Project management system",
      description: "Paint Quote Pro automatically updates your project tracking. We draw up your job schedule and profit analysis, we calculate your material costs and help you with project planning."
    },
    {
      icon: <PieChart className="h-12 w-12 text-blue-500" />,
      title: "Job tracking becomes a breeze",
      description: "Insight is gained mainly when figures are visualised, which is why you can see beautiful graphs of almost everything in Paint Quote Pro."
    }
  ];

  const mobileFeatures = [
    {
      icon: <Camera className="h-12 w-12 text-amber-500" />,
      title: "Photo documentation",
      description: "Just take a picture of your job site. You put it directly in the Paint Quote Pro app via your phone, after which documenting your work becomes a piece of cake."
    },
    {
      icon: <Clock className="h-12 w-12 text-emerald-500" />,
      title: "Hours & project time tracking",
      description: "As a painting contractor, you regularly track down hours for your projects. With Paint Quote Pro, you can easily keep track of your hours and convert them into an invoice."
    },
    {
      icon: <Smartphone className="h-12 w-12 text-blue-500" />,
      title: "Android & iPhone app",
      description: "You want to be able to do your project management anywhere, that's why it's handy that Paint Quote Pro works on any device. Download our Android or iPhone app."
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

  const detailedTestimonials = [
    {
      name: "Premium Painters Ltd",
      text: "Finally an affordable and smart solution for everything you don't really want to do.",
      generalOpinion: 4.5,
      reliability: 4.5,
      easeOfUse: 5,
      priceQuality: 5,
      support: 4,
      fullReview: "Paint Quote Pro is an ideal solution for me. As a painting contractor I can quote very quickly and keep an eye on project costs. Quotes look professional and can be sent immediately. Excellent solution!"
    }
  ];

  const stats = [
    { label: "Quotes Generated", value: "10,000+" },
    { label: "Hours Saved", value: "50,000+" },
    { label: "Happy Painters", value: "500+" },
    { label: "Jobs Won", value: "8,500+" }
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-400 pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
              Stronger painting business
              <span className="block text-emerald-700">through worry-free quoting</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-700 mb-8 max-w-4xl mx-auto leading-relaxed">
              Whether you are a painting contractor, decorator or construction professional, with the super simple AI quoting program 
              Paint Quote Pro, creating quotes and project management becomes a lot more fun and clear. Discover it yourself.
            </p>
            
            {/* <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 flex items-center space-x-2 shadow-lg">
                <span>Try it for free!</span>
              </button>
            </div> */}

            <div className="flex items-center justify-center space-x-6 text-slate-600 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Hero Demo */}
          <div className="mt-10">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-w-5xl mx-auto">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-gray-600 text-sm ml-4 font-medium">YOU SHOULD GET STARTED</span>
              </div>
              <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-4">Upload Floor Plan</h3>
                      <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-8 text-center transition-all hover:border-amber-400">
                        <FileText className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                        <p className="text-slate-600 font-medium">Drag & drop your floor plan here</p>
                        <p className="text-slate-500 text-sm mt-2">PDF, JPG, PNG supported</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-emerald-700 mb-4">Get Professional Quote</h3>
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-slate-600 font-medium">Total Floor Area:</span>
                            <span className="font-bold text-slate-800">156.5 m²</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-slate-600 font-medium">Wall Area:</span>
                            <span className="font-bold text-slate-800">324.8 m²</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-slate-600 font-medium">Ceiling Area:</span>
                            <span className="font-bold text-slate-800">156.5 m²</span>
                          </div>
                          <div className="pt-4 bg-amber-50 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-slate-800">Total Quote:</span>
                              <span className="text-3xl font-bold text-emerald-600">£4,850</span>
                            </div>
                          </div>
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

      {/* Why Choose Section */}
      {/* <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
                Why do painting contractors choose Paint Quote Pro?
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Find out how other painting contractors get started with Paint Quote Pro and be convinced.
              </p>
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Experience the benefits yourself
              </button>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-8 text-center">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="w-16 h-16 bg-slate-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white ml-1" />
                  </div>
                  <p className="text-slate-700 font-semibold">
                    "As a painter, I work about 5 hours a day on quotes. 
                    <span className="block mt-2">I'm done in 30 minutes now!"</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Red Tape Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Red tape:
            </h2>
            <h3 className="text-2xl md:text-3xl font-bold text-emerald-700 mb-6">
              Super simple AI quoting!
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-lg text-slate-600 leading-relaxed">
                Paint Quote Pro is the simple quoting program specially designed for 
                painting contractors who prefer to be busy with painting projects. Paint Quote Pro aims to make AI quoting as easy 
                as possible for you. This saves you a lot of time!
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                Paint Quote Pro is not a traditional administration program. It works much 
                easier than other quoting software. Certainly for painting contractors, but also decorators and general contractors do 
                their quoting with Paint Quote Pro. With Paint Quote Pro you do not have to 
                concern yourself with complex calculations and material pricing. 
                We do this for you.
              </p>
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Start quoting right away
              </button>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center">
                  <div className="w-64 h-64 bg-emerald-500 rounded-full flex items-center justify-center">
                    <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <div className="text-center">
                        <Calculator className="h-16 w-16 text-amber-500 mx-auto mb-2" />
                        <span className="text-2xl font-bold text-slate-800">AI</span>
                        <div className="text-sm text-slate-600 mt-1">QUOTING</div>
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
                <div className="text-3xl md:text-5xl font-bold text-amber-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-300 text-sm md:text-base font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Create Quotes Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gray-50 p-4 border-b">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Project:</span>
                        <span className="font-semibold">Kitchen Repaint</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Area:</span>
                        <span className="font-semibold">45 m²</span>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex justify-between">
                          <span className="font-bold">Total:</span>
                          <span className="font-bold text-emerald-600">£1,250</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
                Create quotes for free & easily
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                With Paint Quote Pro's AI software, creating quotes 
                and project management becomes a breeze! Find out for 
                yourself how easy the Paint Quote Pro quoting program 
                works for painting contractors and professionals.
              </p>
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Create your first quote right away
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      {/* <section className="py-20 bg-gray-50" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              The possibilities of the Paint Quote Pro program
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {capabilities.map((capability, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="flex justify-center mb-6">
                  {capability.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">
                  {capability.title}
                </h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  {capability.description}
                </p>
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold text-sm transition-colors">
                  {index === 0 ? 'Create quotes' : index === 1 ? 'Simple project management' : 'Easily track projects'}
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mobileFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="flex justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  {feature.description}
                </p>
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold text-sm transition-colors">
                  {index === 0 ? 'The Photo tool' : index === 1 ? 'Register hours' : 'Our mobile app'}
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              View all options
            </button>
          </div>
        </div>
      </section> */}

      {/* Detailed Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              These users are already fans!
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            {detailedTestimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">PP</span>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-bold text-slate-800">{testimonial.name}</h3>
                      </div>
                    </div>
                    <p className="text-lg italic text-slate-600 mb-6">
                      "{testimonial.text}"
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      {testimonial.fullReview}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-semibold text-slate-600">General opinion</span>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < Math.floor(testimonial.generalOpinion) ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-600">Reliability</span>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < Math.floor(testimonial.reliability) ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-600">Ease of use</span>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < Math.floor(testimonial.easeOfUse) ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-600">Price/quality</span>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < Math.floor(testimonial.priceQuality) ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-600">Support</span>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < Math.floor(testimonial.support) ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Read more experiences
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-slate-800 to-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Transform Your Quoting Process?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join hundreds of professional painters who have already streamlined their business 
            with Paint Quote Pro. Start your free trial today!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <button className="bg-amber-400 hover:bg-amber-500 text-slate-800 px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center space-x-2 shadow-lg">
              <span>Start Free Trial</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button className="border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-slate-800 px-8 py-4 rounded-xl font-bold text-lg transition-all">
              View Pricing
            </button>
          </div>

          <div className="flex items-center justify-center space-x-6 text-gray-400 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* <footer className="bg-slate-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Home</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Create quotes</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Quoting program</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Create estimates</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Newsletter</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Sustainability</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Paint Quote Pro Ltd</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Innovation Street 15 - 5B</li>
                <li>London W1A 0AX</li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Follow Paint Quote Pro on</h3>
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center">
                  <span className="text-slate-800 text-sm font-bold">in</span>
                </div>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">f</span>
                </div>
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">@</span>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-white font-semibold mb-2">Download the Paint Quote Pro app</h4>
                <div className="flex space-x-2">
                  <div className="bg-gray-700 rounded px-3 py-1 text-xs text-gray-300">
                    Google Play
                  </div>
                  <div className="bg-gray-700 rounded px-3 py-1 text-xs text-gray-300">
                    App Store
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm">
                The easiest quoting and project management program for painting contractors
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-gray-400 text-sm">
                <ul className="flex flex-wrap space-x-6">
                  <li><a href="#" className="hover:text-white transition-colors">Project management</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contractors & Painters</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">General terms and conditions</a></li>
                </ul>
              </div>
              <div className="text-gray-400 text-sm md:text-right">
                <ul className="flex flex-wrap md:justify-end space-x-6">
                  <li><a href="#" className="hover:text-white transition-colors">Knowledge base</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy statement</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Cookie settings</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-700 text-center">
              <p className="text-gray-400 text-sm">© Paint Quote Pro Ltd, 2025 • Working at Paint Quote Pro</p>
            </div>
          </div>
        </div>
      </footer> */}
    </div>
  );
};

export default Home;