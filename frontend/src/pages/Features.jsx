import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
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
  const { t } = useTranslation();

  const mainFeatures = [
    {
      icon: <Brain className="h-12 w-12 text-[#4bb4f5]" />,
      title: t("AI Floor Plan Analysis"),
      subtitle: t("Revolutionary AI Technology"),
      description: t("Upload any floor plan and watch our AI automatically identify rooms, calculate surface areas, and provide detailed measurements with 95% accuracy. Our advanced computer vision technology can handle everything from hand-drawn sketches to complex architectural drawings."),
      benefits: [
        t("Supports hand-drawn sketches and digital plans"),
        t("Identifies walls, doors, and windows automatically"),
        t("Calculates floor, wall, and ceiling areas"),
        t("Provides room-by-room breakdowns"),
        t("95% accuracy guarantee"),
        t("Processes plans in under 30 seconds")
      ],
      image: "images/AI.jpg"
    },
    {
      icon: <FileText className="h-12 w-12 text-amber-600" />,
      title: t("Professional Quote Generation"),
      subtitle: t("Impress Every Client"),
      description: t("Create stunning, branded PDF quotes that impress clients and win more jobs. Customize templates with your company branding, add detailed breakdowns, and include professional terms and conditions. Your quotes will look better than your competition's."),
      benefits: [
        t("Professional PDF generation with your branding"),
        t("Custom company logos and contact details"),
        t("Detailed line-item breakdowns with materials"),
        t("Multiple professional template options"),
        t("Automatic terms and conditions"),
        t("Email delivery with tracking")
      ],
      image: "images/Quotation.png"
    },
    {
      icon: <Clock className="h-12 w-12 text-blue-600" />,
      title: t("Time-Saving Automation"),
      subtitle: t("Work Smarter, Not Harder"),
      description: t("Reduce quote creation time from hours to minutes. Our automation handles calculations, formatting, and presentation, so you can focus on what you do best - painting. Get back to the job site faster and take on more projects."),
      benefits: [
        t("5x faster quote creation process"),
        t("Automatic surface area calculations"),
        t("No manual measurements required"),
        t("Instant quote delivery to clients"),
        t("Automated follow-up reminders"),
        t("Mobile app for on-site quoting")
      ],
      image: "images/image.png"
    }
  ];

  const businessFeatures = [
    {
      icon: <BarChart3 className="h-8 w-8 text-[#4bb4f5]" />,
      title: t("Project Management"),
      description: t("Track your painting projects from quote to completion with built-in project management tools.")
    },
    {
      icon: <Calculator className="h-8 w-8 text-amber-600" />,
      title: t("Smart Pricing Calculator"),
      description: t("Built-in pricing templates for different paint types, surface preparations, and job complexities.")
    },
    {
      icon: <Camera className="h-8 w-8 text-blue-600" />,
      title: t("Photo Documentation"),
      description: t("Document your work with before/after photos that automatically attach to project files.")
    },
    {
      icon: <Users className="h-8 w-8 text-[#4bb4f5]" />,
      title: t("Team Collaboration"),
      description: t("Add team members and collaborate on projects with role-based permissions and real-time updates.")
    },
    {
      icon: <Shield className="h-8 w-8 text-amber-600" />,
      title: t("Secure Cloud Storage"),
      description: t("Your data is encrypted and backed up securely in the cloud with 99.9% uptime guarantee.")
    },
    {
      icon: <Smartphone className="h-8 w-8 text-blue-600" />,
      title: t("Mobile App"),
      description: t("Access your projects and create quotes from any device, anywhere with our native mobile apps.")
    }
  ];

  const integrationFeatures = [
    {
      icon: <PaintBucket className="h-8 w-8 text-[#4bb4f5]" />,
      title: t("Paint Brand Integration"),
      description: t("Support for all major paint brands with accurate pricing and coverage data.")
    },
    {
      icon: <Download className="h-8 w-8 text-amber-600" />,
      title: t("Export & Integration"),
      description: t("Export quotes as PDF, Excel, or integrate with your existing CRM and accounting systems.")
    },
    {
      icon: <DollarSign className="h-8 w-8 text-blue-600" />,
      title: t("Payment Processing"),
      description: t("Accept deposits and payments directly through your quotes with integrated payment processing.")
    },
    {
      icon: <Target className="h-8 w-8 text-[#4bb4f5]" />,
      title: t("Lead Management"),
      description: t("Track leads, follow up automatically, and convert more prospects into paying customers.")
    },
    {
      icon: <Layers className="h-8 w-8 text-amber-600" />,
      title: t("Multi-Surface Coating"),
      description: t("Handle complex projects with multiple surface types, primer requirements, and finish options.")
    },
    {
      icon: <Settings className="h-8 w-8 text-blue-600" />,
      title: t("Custom Workflows"),
      description: t("Set up custom approval workflows and project stages that match your business processes.")
    }
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#4bb4f5] via-[#4bb4f5] to-[#4bb4f5] pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
            {t('Powerful Features for')}
            <span className="block text-slate-700">{t('Professional Painters')}</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 max-w-4xl mx-auto leading-relaxed">
            {t('Everything you need to create accurate, professional paint quotes faster than ever before. Discover the tools that are transforming how painting contractors work.')}
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
                      <div className="text-sm font-semibold text-[#4bb4f5] uppercase tracking-wide">
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
                        <CheckCircle className="h-5 w-5 text-[#4bb4f5] mr-3 flex-shrink-0" />
                        <span className="text-slate-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                    <div className="aspect-video bg-gradient-to-br from-amber-50 to-emerald-50 rounded-xl flex items-center justify-center border border-gray-100">
                      <div className="text-center">
                        <div className="mt-4 text-slate-600 font-medium">
                          <img src={feature.image} alt={feature.title} />
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
              {t('Complete Business Management')}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {t('Beyond quoting - manage your entire painting business with our comprehensive suite of tools')}
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
              {t('Integrations & Advanced Tools')}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {t('Connect with your existing tools and unlock advanced functionality for complex projects')}
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
              {t('See How It Works')}
            </h2>
            <p className="text-xl text-slate-600">
              {t('From floor plan to professional quote in 3 simple steps')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: 1,
                title: t("Upload Floor Plan"),
                description: t("Simply drag and drop your floor plan image. We support all common formats including hand-drawn sketches, PDFs, and digital plans. Our AI works with any quality image.")
              },
              {
                step: 2,
                title: t("AI Analysis"),
                description: t("Our advanced AI analyzes your floor plan, identifies all rooms, and calculates precise surface areas for floors, walls, and ceilings. Review and adjust as needed.")
              },
              {
                step: 3,
                title: t("Generate Quote"),
                description: t("Review calculations, adjust pricing, and generate a beautiful PDF quote with your company branding that's ready to send to clients. Track opens and responses.")
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#4bb4f5] to-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
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
              {t('Why Flotto vs Manual Quoting?')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-red-700 mb-6">{t('Manual Quoting')}</h3>
              <ul className="space-y-4">
                <li className="flex items-center text-red-600">
                  <X className="h-5 w-5 mr-3" />
                  <span>{t('2-4 hours per quote')}</span>
                </li>
                <li className="flex items-center text-red-600">
                  <X className="h-5 w-5 mr-3" />
                  <span>{t('Prone to measurement errors')}</span>
                </li>
                <li className="flex items-center text-red-600">
                  <X className="h-5 w-5 mr-3" />
                  <span>{t('Inconsistent pricing')}</span>
                </li>
                <li className="flex items-center text-red-600">
                  <X className="h-5 w-5 mr-3" />
                  <span>{t('Basic, unprofessional appearance')}</span>
                </li>
                <li className="flex items-center text-red-600">
                  <X className="h-5 w-5 mr-3" />
                  <span>{t('No project tracking')}</span>
                </li>
              </ul>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-[#4bb4f5] mb-6">{t('Flotto')}</h3>
              <ul className="space-y-4">
                <li className="flex items-center text-[#4bb4f5]">
                  <CheckCircle className="h-5 w-5 mr-3" />
                  <span>{t('15-30 minutes per quote')}</span>
                </li>
                <li className="flex items-center text-[#4bb4f5]">
                  <CheckCircle className="h-5 w-5 mr-3" />
                  <span>{t('95% measurement accuracy')}</span>
                </li>
                <li className="flex items-center text-[#4bb4f5]">
                  <CheckCircle className="h-5 w-5 mr-3" />
                  <span>{t('Consistent, competitive pricing')}</span>
                </li>
                <li className="flex items-center text-[#4bb4f5]">
                  <CheckCircle className="h-5 w-5 mr-3" />
                  <span>{t('Professional, branded quotes')}</span>
                </li>
                <li className="flex items-center text-[#4bb4f5]">
                  <CheckCircle className="h-5 w-5 mr-3" />
                  <span>{t('Complete project management')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;