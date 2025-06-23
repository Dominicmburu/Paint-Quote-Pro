import React from 'react';
import { Users, Target, Award, ArrowRight } from 'lucide-react';

const About = () => {
  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      bio: "Former painting contractor with 15 years of experience in the industry.",
      image: "https://i.pinimg.com/736x/b7/97/a0/b797a0b5290bc94d8312d91953c9d555.jpg"
    },
    {
      name: "Mike Chen",
      role: "CTO",
      bio: "AI expert with background in computer vision and machine learning.",
      image: "https://i.pinimg.com/736x/25/18/aa/2518aadb3518f6d5c4448a34c5c8ecdc.jpg"
    },
    {
      name: "Emma Rodriguez",
      role: "Head of Product",
      bio: "UX specialist focused on creating intuitive tools for tradespeople.",
      image: "https://i.pinimg.com/736x/31/4f/66/314f664ff072c17757f786528a59a399.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 py-16 relative overflow-hidden" style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2126&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-6">
            About Paint Quote Pro
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We're on a mission to revolutionize how painting professionals create quotes and grow their businesses.
          </p>
        </div>
      </div>

      {/* Story */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Our Story</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Paint Quote Pro was born from frustration. Our founder, Sarah, spent countless hours creating quotes 
              for her painting business, often losing jobs to competitors who could deliver quotes faster. 
              She knew there had to be a better way.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed mt-6">
              Combining her industry expertise with cutting-edge AI technology, we've created a solution that 
              helps painting professionals work smarter, not harder. Today, hundreds of painters use Paint Quote Pro 
              to save time and win more jobs.
            </p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Our Values</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Users className="h-16 w-16 text-teal-500 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Customer First</h3>
              <p className="text-slate-600">
                Every feature we build is designed with our customers' success in mind. 
                Your feedback drives our product development.
              </p>
            </div>

            <div className="text-center">
              <Target className="h-16 w-16 text-orange-500 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Innovation</h3>
              <p className="text-slate-600">
                We leverage the latest AI technology to solve real problems faced by 
                painting professionals every day.
              </p>
            </div>

            <div className="text-center">
              <Award className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Excellence</h3>
              <p className="text-slate-600">
                We're committed to delivering a product that exceeds expectations and 
                helps our customers achieve their business goals.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Meet Our Team</h2>
            <p className="text-xl text-slate-600">
              The people behind Paint Quote Pro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-semibold text-slate-800">{member.name}</h3>
                <p className="text-teal-600 font-medium mb-3">{member.role}</p>
                <p className="text-slate-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-teal-500 to-slate-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Thousands of painters trust Paint Quote Pro to grow their business
          </p>
          <a
            href="/register"
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-slate-800 bg-yellow-400 hover:bg-yellow-300 transition-colors"
          >
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;