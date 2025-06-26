import React, { useState } from 'react';
import { 
  Users, 
  Target, 
  Award, 
  ArrowRight, 
  Menu, 
  X,
  CheckCircle,
  Heart,
  Lightbulb,
  Shield,
  Zap,
  Building
} from 'lucide-react';

const About = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      bio: "Former painting contractor with 15 years of experience in the industry. Sarah built Paint Quote Pro from her own frustrations with manual quoting.",
      image: "https://i.pinimg.com/736x/b7/97/a0/b797a0b5290bc94d8312d91953c9d555.jpg"
    },
    {
      name: "Mike Chen",
      role: "CTO & Co-Founder",
      bio: "AI expert with background in computer vision and machine learning. Mike leads our technical innovation and product development.",
      image: "https://i.pinimg.com/736x/25/18/aa/2518aadb3518f6d5c4448a34c5c8ecdc.jpg"
    },
    {
      name: "Emma Rodriguez",
      role: "Head of Product",
      bio: "UX specialist focused on creating intuitive tools for tradespeople. Emma ensures Paint Quote Pro is easy to use for every painter.",
      image: "https://i.pinimg.com/736x/31/4f/66/314f664ff072c17757f786528a59a399.jpg"
    }
  ];

  const values = [
    {
      icon: <Heart className="h-12 w-12 text-emerald-600" />,
      title: "Customer First",
      description: "Every feature we build is designed with our customers' success in mind. Your feedback drives our product development and shapes our roadmap."
    },
    {
      icon: <Lightbulb className="h-12 w-12 text-amber-600" />,
      title: "Innovation",
      description: "We leverage the latest AI technology to solve real problems faced by painting professionals every day. We're always pushing boundaries."
    },
    {
      icon: <Shield className="h-12 w-12 text-blue-600" />,
      title: "Reliability",
      description: "We're committed to delivering a product that exceeds expectations and helps our customers achieve their business goals consistently."
    }
  ];

  const stats = [
    { number: "500+", label: "Happy Painters" },
    { number: "10,000+", label: "Quotes Generated" },
    { number: "50,000+", label: "Hours Saved" },
    { number: "95%", label: "Customer Satisfaction" }
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
            About Paint Quote Pro
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 max-w-4xl mx-auto leading-relaxed">
            We're on a mission to revolutionize how painting professionals create quotes and grow their businesses. 
            Discover the story behind the platform that's transforming the industry.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-amber-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300 text-sm md:text-base font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-8">Our Story</h2>
              <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                <p>
                  Paint Quote Pro was born from real frustration. Our founder, Sarah Johnson, was a successful painting contractor 
                  who spent countless hours creating quotes for her business. Despite her expertise, she often lost jobs to 
                  competitors who could deliver quotes faster.
                </p>
                <p>
                  <strong className="text-slate-800">"I knew my work was excellent, but I was losing jobs because my quotes took too long,"</strong> 
                  Sarah recalls. "There had to be a better way."
                </p>
                <p>
                  Combining her deep industry expertise with cutting-edge AI technology, Sarah partnered with tech expert Mike Chen 
                  to create a solution that helps painting professionals work smarter, not harder.
                </p>
                <p>
                  Today, hundreds of painters across the UK use Paint Quote Pro to save time, create more professional quotes, 
                  and win more jobs. We're proud to be the trusted partner helping painters grow their businesses.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">Founded in 2022</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Started by painting professionals, for painting professionals. We understand your challenges because we've lived them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">Our Values</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              These principles guide everything we do and every decision we make
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="flex justify-center mb-6">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    {value.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">{value.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-8">Our Mission</h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-2xl text-slate-700 leading-relaxed mb-8 font-medium">
                "To empower every painting professional with the tools they need to create better quotes faster, 
                win more jobs, and build successful businesses."
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Speed</h3>
                  <p className="text-slate-600">Create quotes 5x faster than traditional methods</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Accuracy</h3>
                  <p className="text-slate-600">95% measurement accuracy with AI technology</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Quality</h3>
                  <p className="text-slate-600">Professional quotes that win more business</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">Meet Our Team</h2>
            <p className="text-xl text-slate-600">
              The passionate people behind Paint Quote Pro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-100">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-6 object-cover border-4 border-white shadow-lg"
                />
                <h3 className="text-xl font-bold text-slate-800 mb-2">{member.name}</h3>
                <p className="text-emerald-600 font-semibold mb-4">{member.role}</p>
                <p className="text-slate-600 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why We're Different */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">Why We're Different</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              We're not just another software company - we're painters who built a solution for painters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Built by Industry Experts</h3>
                  <p className="text-slate-600 leading-relaxed">Our founders have decades of combined experience in the painting industry. We understand your challenges because we've faced them ourselves.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Customer-Driven Development</h3>
                  <p className="text-slate-600 leading-relaxed">Every feature is requested and tested by real painting contractors. We don't build features in isolation - we build what you actually need.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Continuous Innovation</h3>
                  <p className="text-slate-600 leading-relaxed">We're constantly improving our AI technology and adding new features. Your subscription includes all updates and new capabilities.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">What Our Customers Say</h3>
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-slate-600 italic mb-4">"Finally, software built by people who actually understand painting. Paint Quote Pro has transformed how I run my business."</p>
                  <p className="font-semibold text-slate-800">- David Thompson, Thompson Decorators</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-slate-600 italic mb-4">"The AI is incredibly accurate, and the quotes look so professional. I've won every job I've quoted since switching."</p>
                  <p className="font-semibold text-slate-800">- Lisa Rodriguez, Precision Painters</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;