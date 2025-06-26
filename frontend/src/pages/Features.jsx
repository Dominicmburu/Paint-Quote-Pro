import React from 'react';
import { 
  Brain, 
  FileText, 
  Clock, 
  Zap, 
  Users, 
  Shield, 
  Download, 
  Smartphone,
  PaintBucket,
  Calculator,
  Menu,
  X,
  CheckCircle,
  Camera,
  BarChart3,
  PieChart,
  ArrowRight,
  Upload,
  DollarSign,
  Target,
  Layers,
  Settings
} from 'lucide-react';

const Features = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const mainFeatures = [
    {
      icon: <Brain className="h-12 w-12 text-emerald-600" />,
      title: "AI Floor Plan Analysis",
      subtitle: "Revolutionary AI Technology",
      description: "Upload any floor plan and watch our AI automatically identify rooms, calculate surface areas, and provide detailed measurements with 95% accuracy. Our advanced computer vision technology can handle everything from hand-drawn sketches to complex architectural drawings.",
      benefits: [
        "Supports hand-drawn sketches and digital plans",
        "Identifies walls, doors, and windows automatically",
        "Calculates floor, wall, and ceiling areas",
        "Provides room-by-room breakdowns",
        "95% accuracy guarantee",
        "Processes plans in under 30 seconds"
      ],
      image: "ai-analysis"
    },
    {
      icon: <FileText className="h-12 w-12 text-amber-600" />,
      title: "Professional Quote Generation",
      subtitle: "Impress Every Client",
      description: "Create stunning, branded PDF quotes that impress clients and win more jobs. Customize templates with your company branding, add detailed breakdowns, and include professional terms and conditions. Your quotes will look better than your competition's.",
      benefits: [
        "Professional PDF generation with your branding",
        "Custom company logos and contact details",
        "Detailed line-item breakdowns with materials",
        "Multiple professional template options",
        "Automatic terms and conditions",
        "Email delivery with tracking"
      ],
      image: "quote-generation"
    },
    {
      icon: <Clock className="h-12 w-12 text-blue-600" />,
      title: "Time-Saving Automation",
      subtitle: "Work Smarter, Not Harder",
      description: "Reduce quote creation time from hours to minutes. Our automation handles calculations, formatting, and presentation, so you can focus on what you do best - painting. Get back to the job site faster and take on more projects.",
      benefits: [
        "5x faster quote creation process",
        "Automatic surface area calculations",
        "No manual measurements required",
        "Instant quote delivery to clients",
        "Automated follow-up reminders",
        "Mobile app for on-site quoting"
      ],
      image: "automation"
    }
  ];

  const businessFeatures = [
    {
      icon: <BarChart3 className="h-8 w-8 text-emerald-600" />,
      title: "Project Management",
      description: "Track your painting projects from quote to completion with built-in project management tools."
    },
    {
      icon: <Calculator className="h-8 w-8 text-amber-600" />,
      title: "Smart Pricing Calculator",
      description: "Built-in pricing templates for different paint types, surface preparations, and job complexities."
    },
    {
      icon: <Camera className="h-8 w-8 text-blue-600" />,
      title: "Photo Documentation",
      description: "Document your work with before/after photos that automatically attach to project files."
    },
    {
      icon: <Users className="h-8 w-8 text-emerald-600" />,
      title: "Team Collaboration",
      description: "Add team members and collaborate on projects with role-based permissions and real-time updates."
    },
    {
      icon: <Shield className="h-8 w-8 text-amber-600" />,
      title: "Secure Cloud Storage",
      description: "Your data is encrypted and backed up securely in the cloud with 99.9% uptime guarantee."
    },
    {
      icon: <Smartphone className="h-8 w-8 text-blue-600" />,
      title: "Mobile App",
      description: "Access your projects and create quotes from any device, anywhere with our native mobile apps."
    }
  ];

  const integrationFeatures = [
    {
      icon: <PaintBucket className="h-8 w-8 text-emerald-600" />,
      title: "Paint Brand Integration",
      description: "Support for all major paint brands with accurate pricing and coverage data."
    },
    {
      icon: <Download className="h-8 w-8 text-amber-600" />,
      title: "Export & Integration",
      description: "Export quotes as PDF, Excel, or integrate with your existing CRM and accounting systems."
    },
    {
      icon: <DollarSign className="h-8 w-8 text-blue-600" />,
      title: "Payment Processing",
      description: "Accept deposits and payments directly through your quotes with integrated payment processing."
    },
    {
      icon: <Target className="h-8 w-8 text-emerald-600" />,
      title: "Lead Management",
      description: "Track leads, follow up automatically, and convert more prospects into paying customers."
    },
    {
      icon: <Layers className="h-8 w-8 text-amber-600" />,
      title: "Multi-Surface Coating",
      description: "Handle complex projects with multiple surface types, primer requirements, and finish options."
    },
    {
      icon: <Settings className="h-8 w-8 text-blue-600" />,
      title: "Custom Workflows",
      description: "Set up custom approval workflows and project stages that match your business processes."
    }
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-400 pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
            Powerful Features for
            <span className="block text-emerald-700">Professional Painters</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 max-w-4xl mx-auto leading-relaxed">
            Everything you need to create accurate, professional paint quotes faster than ever before. 
            Discover the tools that are transforming how painting contractors work.
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {mainFeatures.map((feature, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } items-center gap-12`}
              >
                <div className="flex-1 space-y-6">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                      {feature.icon}
                    </div>
                    <div className="ml-6">
                      <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">
                        {feature.subtitle}
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
                        {feature.title}
                      </h2>
                    </div>
                  </div>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0" />
                        <span className="text-slate-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                    <div className="aspect-video bg-gradient-to-br from-amber-50 to-emerald-50 rounded-xl flex items-center justify-center border border-gray-100">
                      <div className="text-center">
                        {feature.icon}
                        <div className="mt-4 text-slate-600 font-medium">
                          {feature.title} Demo
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              Complete Business Management
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Beyond quoting - manage your entire painting business with our comprehensive suite of tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {businessFeatures.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 ml-4">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              Integrations & Advanced Tools
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Connect with your existing tools and unlock advanced functionality for complex projects
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {integrationFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 ml-4">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              See How It Works
            </h2>
            <p className="text-xl text-slate-600">
              From floor plan to professional quote in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: 1,
                title: "Upload Floor Plan",
                description: "Simply drag and drop your floor plan image. We support all common formats including hand-drawn sketches, PDFs, and digital plans. Our AI works with any quality image."
              },
              {
                step: 2,
                title: "AI Analysis",
                description: "Our advanced AI analyzes your floor plan, identifies all rooms, and calculates precise surface areas for floors, walls, and ceilings. Review and adjust as needed."
              },
              {
                step: 3,
                title: "Generate Quote",
                description: "Review calculations, adjust pricing, and generate a beautiful PDF quote with your company branding that's ready to send to clients. Track opens and responses."
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-3xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Why Paint Quote Pro vs Manual Quoting?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-red-700 mb-6">Manual Quoting</h3>
              <ul className="space-y-4">
                <li className="flex items-center text-red-600">
                  <X className="h-5 w-5 mr-3" />
                  <span>2-4 hours per quote</span>
                </li>
                <li className="flex items-center text-red-600">
                  <X className="h-5 w-5 mr-3" />
                  <span>Prone to measurement errors</span>
                </li>
                <li className="flex items-center text-red-600">
                  <X className="h-5 w-5 mr-3" />
                  <span>Inconsistent pricing</span>
                </li>
                <li className="flex items-center text-red-600">
                  <X className="h-5 w-5 mr-3" />
                  <span>Basic, unprofessional appearance</span>
                </li>
                <li className="flex items-center text-red-600">
                  <X className="h-5 w-5 mr-3" />
                  <span>No project tracking</span>
                </li>
              </ul>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-emerald-700 mb-6">Paint Quote Pro</h3>
              <ul className="space-y-4">
                <li className="flex items-center text-emerald-600">
                  <CheckCircle className="h-5 w-5 mr-3" />
                  <span>15-30 minutes per quote</span>
                </li>
                <li className="flex items-center text-emerald-600">
                  <CheckCircle className="h-5 w-5 mr-3" />
                  <span>95% measurement accuracy</span>
                </li>
                <li className="flex items-center text-emerald-600">
                  <CheckCircle className="h-5 w-5 mr-3" />
                  <span>Consistent, competitive pricing</span>
                </li>
                <li className="flex items-center text-emerald-600">
                  <CheckCircle className="h-5 w-5 mr-3" />
                  <span>Professional, branded quotes</span>
                </li>
                <li className="flex items-center text-emerald-600">
                  <CheckCircle className="h-5 w-5 mr-3" />
                  <span>Complete project management</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-400">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
            Ready to Experience These Features?
          </h2>
          <p className="text-xl text-slate-700 mb-8 leading-relaxed">
            Start your free trial today and see how Paint Quote Pro can transform your painting business. 
            No credit card required, cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg">
              <span>Start Free Trial</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button className="border-2 border-slate-700 text-slate-700 hover:bg-slate-700 hover:text-white px-8 py-4 rounded-xl font-bold text-lg transition-all">
              View Pricing
            </button>
          </div>
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
      </section>
    </div>
  );
};

export default Features;