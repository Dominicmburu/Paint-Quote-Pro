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
  Calculator
} from 'lucide-react';

const Features = () => {
  const mainFeatures = [
    {
      icon: <Brain className="h-12 w-12 text-teal-600" />,
      title: "AI Floor Plan Analysis",
      description: "Upload any floor plan and watch our AI automatically identify rooms, calculate surface areas, and provide detailed measurements with 95% accuracy.",
      benefits: [
        "Supports hand-drawn sketches and digital plans",
        "Identifies walls, doors, and windows automatically",
        "Calculates floor, wall, and ceiling areas",
        "Provides room-by-room breakdowns"
      ]
    },
    {
      icon: <FileText className="h-12 w-12 text-orange-500" />,
      title: "Professional Quote Generation",
      description: "Create stunning, branded PDF quotes that impress clients and win more jobs. Customize templates with your company branding and pricing.",
      benefits: [
        "Professional PDF generation",
        "Custom company branding",
        "Detailed line-item breakdowns",
        "Multiple template options"
      ]
    },
    {
      icon: <Clock className="h-12 w-12 text-blue-600" />,
      title: "Time-Saving Automation",
      description: "Reduce quote creation time from hours to minutes. Our automation handles calculations, formatting, and presentation.",
      benefits: [
        "5x faster quote creation",
        "Automatic calculations",
        "No manual measurements",
        "Instant quote delivery"
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: <Calculator className="h-8 w-8 text-teal-600" />,
      title: "Smart Pricing Calculator",
      description: "Built-in pricing templates for different paint types and job complexities."
    },
    {
      icon: <Users className="h-8 w-8 text-orange-500" />,
      title: "Team Collaboration",
      description: "Add team members and collaborate on projects with role-based permissions."
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      title: "Secure Cloud Storage",
      description: "Your data is encrypted and backed up securely in the cloud."
    },
    {
      icon: <Download className="h-8 w-8 text-yellow-500" />,
      title: "Export Options",
      description: "Export quotes as PDF, Excel, or integrate with your existing systems."
    },
    {
      icon: <Smartphone className="h-8 w-8 text-red-600" />,
      title: "Mobile Friendly",
      description: "Access your projects and create quotes from any device, anywhere."
    },
    {
      icon: <PaintBucket className="h-8 w-8 text-indigo-600" />,
      title: "Paint Brand Integration",
      description: "Support for all major paint brands with accurate pricing and coverage data."
    }
  ];

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 py-16 relative overflow-hidden" style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1562259949-e8e7689d7828?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Powerful Features for Professional Painters
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to create accurate, professional paint quotes faster than ever before.
          </p>
        </div>
      </div>

      {/* Main Features */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {mainFeatures.map((feature, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } items-center gap-12`}
              >
                <div className="flex-1">
                  <div className="flex items-center mb-6">
                    {feature.icon}
                    <h2 className="text-3xl font-bold text-slate-800 ml-4">
                      {feature.title}
                    </h2>
                  </div>
                  <p className="text-lg text-slate-600 mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mr-3" />
                        <span className="text-slate-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 text-lg">Feature Demo</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Features Grid */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Even More Features
            </h2>
            <p className="text-xl text-slate-600">
              Everything you need to run a successful painting business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => (
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
      </div>

      {/* How It Works */}
      <div className="py-20 bg-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              See How It Works
            </h2>
            <p className="text-xl text-slate-600">
              From floor plan to professional quote in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-4">Upload Floor Plan</h3>
              <p className="text-slate-600">
                Simply drag and drop your floor plan image. We support all common formats including 
                hand-drawn sketches, PDFs, and digital plans.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-4">AI Analysis</h3>
              <p className="text-slate-600">
                Our advanced AI analyzes your floor plan, identifies all rooms, and calculates 
                precise surface areas for floors, walls, and ceilings.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-4">Generate Quote</h3>
              <p className="text-slate-600">
                Review calculations, adjust pricing, and generate a beautiful PDF quote with 
                your company branding that's ready to send to clients.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Experience These Features?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Start your free trial today and see how Paint Quote Pro can transform your business
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-slate-800 bg-yellow-400 hover:bg-yellow-300 transition-colors"
            >
              Start Free Trial
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center px-8 py-4 border-2 border-teal-400 text-lg font-medium rounded-md text-teal-400 hover:bg-teal-400 hover:text-slate-800 transition-colors"
            >
              View Pricing
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;