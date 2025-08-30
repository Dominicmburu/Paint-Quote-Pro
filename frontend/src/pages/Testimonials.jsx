import React from 'react';
import { Star, Quote, Users, TrendingUp, Clock, CheckCircle, Award, MapPin } from 'lucide-react';

const TestimonialsPage = () => {
  const testimonials = [
    {
      id: 1,
      name: "Mike Thompson",
      company: "Premium Painters Ltd",
      location: "Manchester, UK",
      category: "painter",
      avatar: "MT",
      rating: 5,
      title: "Finally an affordable and smart solution",
      quote: "Flotto is an ideal solution for me. As a painting contractor I can quote very quickly and keep an eye on project costs. Quotes look professional and can be sent immediately. Excellent solution!",
      highlights: ["Fast quoting", "Professional appearance", "Cost tracking"],
      timeUsing: "8 months"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      company: "Johnson Plastering Co.",
      location: "Birmingham, UK",
      category: "plasterer",
      avatar: "SJ",
      rating: 5,
      title: "Game changer for my plastering business",
      quote: "I used to spend 3-4 hours every evening working on quotes. With Flotto's AI floor plan reader, I'm done in 20 minutes! The accuracy is incredible and my clients love the professional presentation.",
      highlights: ["AI floor plan reader", "Time savings", "Professional quotes"],
      timeUsing: "1 year"
    },
    {
      id: 3,
      name: "James Wilson",
      company: "Wilson & Sons Decorators",
      location: "London, UK",
      category: "painter",
      avatar: "JW",
      rating: 4,
      title: "Streamlined our entire quoting process",
      quote: "We're a team of 8 painters and Flotto has revolutionized how we handle quotes. The digital signatures mean we close deals faster, and the mobile app lets us quote on-site. Brilliant!",
      highlights: ["Team collaboration", "Digital signatures", "Mobile accessibility"],
      timeUsing: "6 months"
    },
    {
      id: 4,
      name: "Emma Roberts",
      company: "Roberts Renovations",
      location: "Leeds, UK",
      category: "painter",
      avatar: "ER",
      rating: 5,
      title: "My clients are impressed every time",
      quote: "The professional appearance of Flotto quotes has helped me win more jobs. Clients can see exactly what they're paying for, and the photo documentation feature keeps everything organized.",
      highlights: ["Professional presentation", "Detailed breakdowns", "Photo documentation"],
      timeUsing: "10 months"
    },
    {
      id: 5,
      name: "David Chen",
      company: "Chen Plastering Services",
      location: "Bristol, UK",
      category: "plasterer",
      avatar: "DC",
      rating: 5,
      title: "The AI is incredibly accurate",
      quote: "I was skeptical about AI reading floor plans, but Flotto's accuracy is amazing. It saves me hours of measuring and calculating. The cost calculator handles all the complex pricing automatically.",
      highlights: ["AI accuracy", "Automated calculations", "Time efficiency"],
      timeUsing: "4 months"
    }
  ];

  const stats = [
    { icon: Users, label: "Happy Customers", value: "2,500+", color: "text-[#4bb4f5]" },
    { icon: Star, label: "Average Rating", value: "4.8/5", color: "text-yellow-500" },
    { icon: Clock, label: "Time Saved Daily", value: "3.5 hrs", color: "text-blue-500" },
    { icon: TrendingUp, label: "Quote Win Rate", value: "+65%", color: "text-purple-500" }
  ];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Quote className="h-16 w-16 text-slate-800" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              What Our Customers Say
            </h1>
            <p className="text-xl text-slate-700 max-w-3xl mx-auto mb-8">
              Discover why thousands of painters and plasterers trust Flotto to streamline their quoting process 
              and grow their businesses.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex flex-col items-center">
                    <stat.icon className={`h-8 w-8 ${stat.color} mb-3`} />
                    <div className="text-2xl font-bold text-slate-800 mb-1">{stat.value}</div>
                    <div className="text-sm text-slate-600 text-center">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-sm">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{testimonial.name}</h3>
                    <p className="text-sm text-slate-600">{testimonial.company}</p>
                    <div className="flex items-center mt-1">
                      <MapPin className="h-3 w-3 text-slate-400 mr-1" />
                      <span className="text-xs text-slate-500">{testimonial.location}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center mb-1">
                    {renderStars(testimonial.rating)}
                  </div>
                  <span className="text-xs text-slate-500">{testimonial.timeUsing}</span>
                </div>
              </div>

              {/* Quote */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-800 mb-3">{testimonial.title}</h4>
                <p className="text-slate-600 leading-relaxed italic">"{testimonial.quote}"</p>
              </div>

              {/* Highlights */}
              <div className="flex flex-wrap gap-2">
                {testimonial.highlights.map((highlight, index) => (
                  <span 
                    key={index}
                    className="bg-emerald-50 text-[#4bb4f5] text-xs px-3 py-1 rounded-full border border-emerald-200"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Featured Review */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-12">
          <div className="text-center mb-8">
            <Award className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Featured Success Story</h2>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex items-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#4bb4f5] to-emerald-400 rounded-full flex items-center justify-center mr-6">
                    <span className="text-white font-bold text-2xl">MW</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Mark Williams</h3>
                    <p className="text-lg text-slate-600">Williams Painting & Decorating</p>
                    <div className="flex items-center mt-2">
                      <MapPin className="h-4 w-4 text-slate-400 mr-2" />
                      <span className="text-slate-500">Cardiff, Wales</span>
                      <span className="mx-2 text-slate-300">•</span>
                      <span className="text-slate-500">Using Flotto for 2 years</span>
                    </div>
                  </div>
                </div>
                
                <blockquote className="text-xl text-slate-700 leading-relaxed mb-6">
                  "Flotto transformed my one-man painting business into a professional operation. In two years, 
                  I've grown from solo work to a team of 5 painters. The time I save on quotes now goes into 
                  actual painting work. My revenue has increased by 150% and my stress levels have dropped 
                  dramatically. I can't imagine running my business without Flotto now."
                </blockquote>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-[#4bb4f5] mb-1">150%</div>
                    <div className="text-sm text-slate-600">Revenue Increase</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">5 hrs</div>
                    <div className="text-sm text-slate-600">Daily Time Saved</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center mb-3">
                    <Star className="h-5 w-5 text-yellow-400 fill-current mr-2" />
                    <span className="font-semibold text-slate-800">Overall Rating</span>
                  </div>
                  <div className="flex items-center mb-2">
                    {renderStars(5)}
                    <span className="ml-2 text-slate-600">5.0/5</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Key Benefits Experienced:</h4>
                  <div className="space-y-2">
                    {[
                      "Faster quote creation",
                      "Professional presentation", 
                      "Better client communication",
                      "Accurate cost calculations",
                      "Mobile accessibility",
                      "Digital signatures"
                    ].map((benefit, index) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-[#4bb4f5] mr-2" />
                        <span className="text-slate-600 text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsPage;