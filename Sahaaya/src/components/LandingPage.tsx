import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { 
  Heart, 
  Users, 
  Building2, 
  Shield,
  ArrowRight,
  Star,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LandingPageProps {
  setCurrentPage: (page: string) => void;
  setUserRole: (role: 'individual' | 'ngo') => void;
  isAuthenticated: boolean;
  userRole?: 'individual' | 'ngo' | null;
}

export function LandingPage({ setCurrentPage, setUserRole, isAuthenticated, userRole }: LandingPageProps) {
  const handleQuickAction = (action: 'request' | 'offer' | 'campaign' | 'browse') => {
    if (action === 'request') {
      setCurrentPage('request-help');
    } else if (action === 'offer') {
      setCurrentPage('matching');
    } else if (action === 'campaign') {
      setCurrentPage('create-campaign');
    } else if (action === 'browse') {
      setCurrentPage('matching');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Single Mother",
      content: "Sahaaya helped me get educational support for my children when I lost my job. The community response was overwhelming and heartwarming.",
      rating: 5,
      location: "Mumbai, Maharashtra"
    },
    {
      name: "Rajesh Kumar",
      role: "Local Volunteer",
      content: "Being able to directly help families in my neighborhood through this platform gives me immense satisfaction. The process is simple and transparent.",
      rating: 5,
      location: "Delhi, NCR"
    },
    {
      name: "Helping Hands NGO",
      role: "Non-Profit Organization",
      content: "Sahaaya has revolutionized how we coordinate relief efforts. We can now track and manage multiple requests efficiently.",
      rating: 5,
      location: "Bangalore, Karnataka"
    }
  ];

  const stats = [
    { number: "50,000+", label: "People Helped" },
    { number: "25,000+", label: "Active Volunteers" },
    { number: "500+", label: "Partner NGOs" },
    { number: "100+", label: "Cities Covered" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative py-20 px-4 sm:px-6 lg:px-8" 
        style={{ 
          background: 'linear-gradient(135deg, #f9fefa 0%, #f0f7f2 50%, #e8f5f0 100%)',
          boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.6), inset 0 -1px 2px rgba(65, 105, 94, 0.05)'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div 
            className="grid lg:grid-cols-2 gap-12 items-center p-8 rounded-3xl"
            style={{
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.8), rgba(249, 254, 250, 0.9))',
              boxShadow: '0 20px 40px rgba(65, 105, 94, 0.1), 0 8px 16px rgba(65, 105, 94, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 
                  className="text-4xl md:text-6xl" 
                  style={{ 
                    color: '#033b4a',
                    textShadow: '0 2px 4px rgba(3, 59, 74, 0.1)'
                  }}
                >
                  {!isAuthenticated ? (
                    <>
                      Connecting Hearts,
                      <br />
                      <span style={{ 
                        color: '#41695e',
                        background: 'linear-gradient(135deg, #41695e, #5a7e71)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>Building Hope</span>
                    </>
                  ) : userRole === 'individual' ? (
                    <>
                      Your Community
                      <br />
                      <span style={{ 
                        color: '#41695e',
                        background: 'linear-gradient(135deg, #41695e, #5a7e71)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>Support Network</span>
                    </>
                  ) : userRole === 'ngo' ? (
                    <>
                      Amplify Your
                      <br />
                      <span style={{ 
                        color: '#41695e',
                        background: 'linear-gradient(135deg, #41695e, #5a7e71)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>NGO Impact</span>
                    </>
                  ) : (
                    <>
                      Welcome to
                      <br />
                      <span style={{ 
                        color: '#41695e',
                        background: 'linear-gradient(135deg, #41695e, #5a7e71)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>Sahaaya</span>
                    </>
                  )}
                </h1>
                <p className="text-lg md:text-xl text-gray-600 max-w-lg" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                  {!isAuthenticated ? (
                    "Sahaaya bridges the gap between those who need help and those ready to help. Join our community-driven platform for transparent, efficient assistance."
                  ) : userRole === 'individual' ? (
                    "Request help when you need it, or offer assistance to others in your community. Your individual actions create meaningful impact."
                  ) : userRole === 'ngo' ? (
                    "Manage your campaigns, reach more donors, and track your social impact through our comprehensive NGO platform."
                  ) : (
                    "Sahaaya bridges the gap between those who need help and those ready to help. Join our community-driven platform for transparent, efficient assistance."
                  )}
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {!isAuthenticated ? (
                  <>
                    <Button 
                      size="lg" 
                      className="flex items-center justify-center space-x-2 px-8 py-4 rounded-xl transform transition-all duration-200 hover:scale-105 active:scale-95"
                      style={{ 
                        background: 'linear-gradient(135deg, #41695e 0%, #4f7965 50%, #5a856f 100%)',
                        boxShadow: '0 8px 16px rgba(65, 105, 94, 0.3), 0 4px 8px rgba(65, 105, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      onClick={() => setCurrentPage('role-selection')}
                    >
                      <Users className="h-5 w-5" />
                      <span>Join Sahaaya</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="flex items-center justify-center space-x-2 px-8 py-4 rounded-xl border-2 transform transition-all duration-200 hover:scale-105 active:scale-95 bg-white/80 backdrop-blur-sm"
                      style={{ 
                        borderColor: '#41695e', 
                        color: '#41695e',
                        boxShadow: '0 8px 16px rgba(65, 105, 94, 0.15), 0 4px 8px rgba(65, 105, 94, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(249, 254, 250, 0.8))'
                      }}
                      onClick={() => setCurrentPage('login')}
                    >
                      <Heart className="h-5 w-5" />
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                ) : userRole === 'individual' ? (
                  <>
                    <Button 
                      size="lg" 
                      className="flex items-center justify-center space-x-2 px-8 py-4 rounded-xl transform transition-all duration-200 hover:scale-105 active:scale-95"
                      style={{ 
                        background: 'linear-gradient(135deg, #41695e 0%, #4f7965 50%, #5a856f 100%)',
                        boxShadow: '0 8px 16px rgba(65, 105, 94, 0.3), 0 4px 8px rgba(65, 105, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      onClick={() => handleQuickAction('request')}
                    >
                      <Users className="h-5 w-5" />
                      <span>Request Help</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="flex items-center justify-center space-x-2 px-8 py-4 rounded-xl border-2 transform transition-all duration-200 hover:scale-105 active:scale-95 bg-white/80 backdrop-blur-sm"
                      style={{ 
                        borderColor: '#41695e', 
                        color: '#41695e',
                        boxShadow: '0 8px 16px rgba(65, 105, 94, 0.15), 0 4px 8px rgba(65, 105, 94, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(249, 254, 250, 0.8))'
                      }}
                      onClick={() => handleQuickAction('offer')}
                    >
                      <Heart className="h-5 w-5" />
                      <span>Offer Help</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                ) : userRole === 'ngo' ? (
                  <>
                    <Button 
                      size="lg" 
                      className="flex items-center justify-center space-x-2 px-8 py-4 rounded-xl transform transition-all duration-200 hover:scale-105 active:scale-95"
                      style={{ 
                        background: 'linear-gradient(135deg, #41695e 0%, #4f7965 50%, #5a856f 100%)',
                        boxShadow: '0 8px 16px rgba(65, 105, 94, 0.3), 0 4px 8px rgba(65, 105, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      onClick={() => handleQuickAction('campaign')}
                    >
                      <Building2 className="h-5 w-5" />
                      <span>Create Campaign</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="flex items-center justify-center space-x-2 px-8 py-4 rounded-xl border-2 transform transition-all duration-200 hover:scale-105 active:scale-95 bg-white/80 backdrop-blur-sm"
                      style={{ 
                        borderColor: '#41695e', 
                        color: '#41695e',
                        boxShadow: '0 8px 16px rgba(65, 105, 94, 0.15), 0 4px 8px rgba(65, 105, 94, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(249, 254, 250, 0.8))'
                      }}
                      onClick={() => handleQuickAction('browse')}
                    >
                      <Shield className="h-5 w-5" />
                      <span>Manage Campaigns</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="lg" 
                      className="flex items-center justify-center space-x-2 px-8 py-4 rounded-xl transform transition-all duration-200 hover:scale-105 active:scale-95"
                      style={{ 
                        background: 'linear-gradient(135deg, #41695e 0%, #4f7965 50%, #5a856f 100%)',
                        boxShadow: '0 8px 16px rgba(65, 105, 94, 0.3), 0 4px 8px rgba(65, 105, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      onClick={() => setCurrentPage('dashboard')}
                    >
                      <Users className="h-5 w-5" />
                      <span>Go to Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="relative">
              <div 
                className="relative rounded-3xl overflow-hidden"
                style={{
                  boxShadow: '0 25px 50px rgba(65, 105, 94, 0.25), 0 12px 24px rgba(65, 105, 94, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  transform: 'perspective(1000px) rotateY(-5deg) rotateX(2deg)',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateY(-5deg) rotateX(2deg)';
                }}
              >
                <div 
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(65, 105, 94, 0.05) 100%)',
                    zIndex: 1
                  }}
                />
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1697665387559-253e7a645e96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWxwaW5nJTIwaGFuZHMlMjBjb21tdW5pdHklMjBzdXBwb3J0fGVufDF8fHx8MTc1NjgyMDc2OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt={
                    userRole === 'individual' 
                      ? "Individual community support network"
                      : userRole === 'ngo' 
                      ? "NGO community outreach and impact"
                      : "Community helping hands"
                  }
                  className="w-full h-[500px] object-cover rounded-3xl relative z-0"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        className="py-16 px-4 sm:px-6 lg:px-8" 
        style={{ 
          background: 'linear-gradient(145deg, #ffffff 0%, #fdfdfd 50%, #f8fbf9 100%)',
          boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.6)'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center space-y-2 p-6 rounded-2xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-2"
                style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(249, 254, 250, 0.8))',
                  boxShadow: '0 12px 24px rgba(65, 105, 94, 0.1), 0 6px 12px rgba(65, 105, 94, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <h3 
                  className="text-3xl md:text-4xl" 
                  style={{ 
                    color: '#41695e',
                    textShadow: '0 2px 4px rgba(65, 105, 94, 0.1)',
                    background: 'linear-gradient(135deg, #41695e, #5a7e71)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {stat.number}
                </h3>
                <p className="text-gray-600" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section 
        className="py-16 px-4 sm:px-6 lg:px-8" 
        style={{ 
          background: 'linear-gradient(135deg, #f9fefa 0%, #f0f7f2 50%, #e8f5f0 100%)',
          boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.6), inset 0 -1px 2px rgba(65, 105, 94, 0.05)'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 
              className="text-3xl md:text-4xl" 
              style={{ 
                color: '#033b4a',
                textShadow: '0 2px 4px rgba(3, 59, 74, 0.1)'
              }}
            >
              How Sahaaya Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
              Simple, transparent, and effective - connecting help seekers with helpers in just a few steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Submit Request",
                description: "Share your need with proof and location details. Our platform ensures authenticity and transparency."
              },
              {
                step: "2", 
                title: "Get Matched",
                description: "Our system connects you with nearby volunteers, donors, NGOs, or government programs based on your requirements."
              },
              {
                step: "3",
                title: "Receive Help",
                description: "Track your request status, communicate with helpers, and receive assistance in a coordinated manner."
              }
            ].map((item, index) => (
              <Card 
                key={index} 
                className="text-center p-8 border-0 transform transition-all duration-300 hover:scale-105 hover:-translate-y-3"
                style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(249, 254, 250, 0.9))',
                  boxShadow: '0 15px 30px rgba(65, 105, 94, 0.12), 0 8px 16px rgba(65, 105, 94, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                  borderRadius: '20px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <CardContent className="space-y-4">
                  <div 
                    className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white text-xl transform transition-all duration-300 hover:scale-110"
                    style={{ 
                      background: 'linear-gradient(135deg, #41695e 0%, #4f7965 50%, #5a856f 100%)',
                      boxShadow: '0 8px 16px rgba(65, 105, 94, 0.3), 0 4px 8px rgba(65, 105, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {item.step}
                  </div>
                  <h3 
                    className="text-xl" 
                    style={{ 
                      color: '#033b4a',
                      textShadow: '0 1px 2px rgba(3, 59, 74, 0.1)'
                    }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-gray-600" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section 
        className="py-16 px-4 sm:px-6 lg:px-8" 
        style={{ 
          background: 'linear-gradient(145deg, #ffffff 0%, #fdfdfd 50%, #f8fbf9 100%)',
          boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.6)'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 
              className="text-3xl md:text-4xl" 
              style={{ 
                color: '#033b4a',
                textShadow: '0 2px 4px rgba(3, 59, 74, 0.1)'
              }}
            >
              Stories of Impact
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
              Real stories from real people whose lives have been touched by our community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className="p-6 border-0 transform transition-all duration-300 hover:scale-105 hover:-translate-y-2"
                style={{
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(249, 254, 250, 0.9))',
                  boxShadow: '0 12px 24px rgba(65, 105, 94, 0.1), 0 6px 12px rgba(65, 105, 94, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                  borderRadius: '20px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <CardContent className="space-y-4">
                  <div className="flex space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star 
                        key={i} 
                        className="h-4 w-4 fill-current transform transition-all duration-200 hover:scale-125" 
                        style={{ 
                          color: '#41695e',
                          filter: 'drop-shadow(0 1px 2px rgba(65, 105, 94, 0.3))'
                        }} 
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 italic" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                    "{testimonial.content}"
                  </p>
                  <div className="space-y-1">
                    <p 
                      style={{ 
                        color: '#033b4a',
                        textShadow: '0 1px 2px rgba(3, 59, 74, 0.1)'
                      }}
                    >
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{testimonial.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-16 px-4 sm:px-6 lg:px-8" 
        style={{ 
          background: 'linear-gradient(135deg, #033b4a 0%, #2c5660 50%, #41695e 100%)',
          boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 
            className="text-3xl md:text-4xl text-white"
            style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}
          >
            Ready to Make a Difference?
          </h2>
          <p 
            className="text-lg text-gray-200 max-w-2xl mx-auto"
            style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}
          >
            Join thousands of people who are already making their communities stronger. 
            Whether you need help or want to help others, every action counts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <Button 
                  size="lg" 
                  className="px-8 py-4 rounded-xl transform transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ 
                    background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                    color: '#033b4a',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                  }}
                  onClick={() => setCurrentPage('role-selection')}
                >
                  Join Our Community
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-4 rounded-xl border-2 text-white transform transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ 
                    borderColor: 'white',
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onClick={() => setCurrentPage('login')}
                >
                  Sign In Now
                </Button>
              </>
            ) : userRole === 'individual' ? (
              <>
                <Button 
                  size="lg" 
                  className="px-8 py-4 rounded-xl transform transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ 
                    background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                    color: '#033b4a',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                  }}
                  onClick={() => handleQuickAction('request')}
                >
                  Get Started as Help Seeker
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-4 rounded-xl border-2 text-white transform transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ 
                    borderColor: 'white',
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onClick={() => handleQuickAction('offer')}
                >
                  Become a Helper
                </Button>
              </>
            ) : userRole === 'ngo' ? (
              <>
                <Button 
                  size="lg" 
                  className="px-8 py-4 rounded-xl transform transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ 
                    background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                    color: '#033b4a',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                  }}
                  onClick={() => handleQuickAction('campaign')}
                >
                  Launch Your Campaign
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-4 rounded-xl border-2 text-white transform transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ 
                    borderColor: 'white',
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onClick={() => setCurrentPage('dashboard')}
                >
                  NGO Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  className="px-8 py-4 rounded-xl transform transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ 
                    background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                    color: '#033b4a',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                  }}
                  onClick={() => setCurrentPage('dashboard')}
                >
                  Go to Dashboard
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="py-12 px-4 sm:px-6 lg:px-8" 
        style={{ 
          background: 'linear-gradient(145deg, #f5f5f5 0%, #f0f0f0 50%, #e8e8e8 100%)',
          boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.8), inset 0 -1px 2px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center" 
                  style={{ 
                    background: 'linear-gradient(135deg, #41695e 0%, #4f7965 50%, #5a856f 100%)',
                    boxShadow: '0 4px 8px rgba(65, 105, 94, 0.3), 0 2px 4px rgba(65, 105, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span 
                  className="text-xl" 
                  style={{ 
                    color: '#033b4a',
                    textShadow: '0 1px 2px rgba(3, 59, 74, 0.1)'
                  }}
                >
                  Sahaaya
                </span>
              </div>
              <p className="text-gray-600" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                Building bridges between communities, fostering hope, and creating lasting impact together.
              </p>
            </div>

            <div className="space-y-4">
              <h4 
                style={{ 
                  color: '#033b4a',
                  textShadow: '0 1px 2px rgba(3, 59, 74, 0.1)'
                }}
              >
                Platform
              </h4>
              <div className="space-y-2 text-gray-600">
                <p className="cursor-pointer hover:text-gray-800 transition-colors duration-200">How it Works</p>
                <p className="cursor-pointer hover:text-gray-800 transition-colors duration-200">Safety Guidelines</p>
                <p className="cursor-pointer hover:text-gray-800 transition-colors duration-200">Community Rules</p>
                <p className="cursor-pointer hover:text-gray-800 transition-colors duration-200">Success Stories</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 
                style={{ 
                  color: '#033b4a',
                  textShadow: '0 1px 2px rgba(3, 59, 74, 0.1)'
                }}
              >
                Support
              </h4>
              <div className="space-y-2 text-gray-600">
                <p className="cursor-pointer hover:text-gray-800 transition-colors duration-200">Help Center</p>
                <p className="cursor-pointer hover:text-gray-800 transition-colors duration-200">Contact Us</p>
                <p className="cursor-pointer hover:text-gray-800 transition-colors duration-200">Report Issue</p>
                <p className="cursor-pointer hover:text-gray-800 transition-colors duration-200">Feedback</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 
                style={{ 
                  color: '#033b4a',
                  textShadow: '0 1px 2px rgba(3, 59, 74, 0.1)'
                }}
              >
                Contact
              </h4>
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+91 1800-SAHAAYA</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>support@sahaaya.org</span>
                </div>
              </div>
            </div>
          </div>

          <div 
            className="border-t mt-8 pt-8 text-center text-gray-600" 
            style={{ 
              borderColor: 'rgba(0, 0, 0, 0.1)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          >
            <p>&copy; 2024 Sahaaya. All rights reserved. Built with ❤️ for communities.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}