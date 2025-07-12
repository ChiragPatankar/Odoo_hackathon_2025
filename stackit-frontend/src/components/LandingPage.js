import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';

const LandingPage = () => {
  const { user } = useApp();

  const features = [
    {
      icon: "💡",
      title: "Ask Smart Questions",
      description: "Get detailed answers from our community of developers and experts with rich text formatting support."
    },
    {
      icon: "🎯",
      title: "Expert Answers",
      description: "Receive high-quality solutions with code examples, explanations, and best practices from experienced developers."
    },
    {
      icon: "🏆",
      title: "Reputation System",
      description: "Build your reputation by providing helpful answers and asking thoughtful questions that help the community."
    },
    {
      icon: "🔍",
      title: "Smart Search",
      description: "Find exactly what you're looking for with our powerful search and tagging system."
    },
    {
      icon: "⚡",
      title: "Real-time Voting",
      description: "Community-driven quality control through upvoting the best questions and answers."
    },
    {
      icon: "🎨",
      title: "Rich Text Editor",
      description: "Write beautiful questions and answers with markdown support, code syntax highlighting, and formatting tools."
    }
  ];

  const stats = [
    { number: "10K+", label: "Questions Answered" },
    { number: "5K+", label: "Active Developers" },
    { number: "98%", label: "Problem Solved" },
    { number: "24/7", label: "Community Support" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-28">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">S</span>
                </div>
              </div>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent leading-tight">
              Stack<span className="text-blue-600">It</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed">
              The modern Q&A platform where developers <br />
              <span className="font-semibold text-blue-600">connect, learn, and grow together</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {user ? (
                <Link 
                  to="/questions"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  Explore Questions
                </Link>
              ) : (
                <>
                  <Link 
                    to="/register"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    Get Started Free
                  </Link>
                  <Link 
                    to="/login"
                    className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-600 hover:text-white transition-all duration-300"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
              Why Choose <span className="text-blue-600">StackIt</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for developers, by developers. Experience the next generation of Q&A platforms with modern features and intuitive design.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
              How It <span className="text-purple-600">Works</span>
            </h2>
            <p className="text-xl text-gray-600">Simple steps to get the help you need</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Ask Your Question</h3>
                <p className="text-gray-600">Write a clear, detailed question with code examples and context to get the best answers.</p>
              </div>

              <div className="text-center group">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Get Expert Answers</h3>
                <p className="text-gray-600">Our community of developers will provide detailed solutions and explanations.</p>
              </div>

              <div className="text-center group">
                <div className="bg-gradient-to-r from-green-500 to-green-600 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Accept Best Solution</h3>
                <p className="text-gray-600">Mark the answer that solved your problem to help future developers with similar issues.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Join the Community?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start asking questions, sharing knowledge, and building your reputation in the developer community today.
          </p>
          
          {user ? (
            <Link 
              to="/ask"
              className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 inline-block"
            >
              Ask Your First Question
            </Link>
          ) : (
            <Link 
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 inline-block"
            >
              Join StackIt Today
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg mr-3">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <span className="text-2xl font-bold">StackIt</span>
              </div>
              <p className="text-gray-400 mb-4">
                The modern Q&A platform for developers. Built with ❤️ for the coding community.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/questions" className="hover:text-white transition-colors">Browse Questions</Link></li>
                <li><Link to="/ask" className="hover:text-white transition-colors">Ask Question</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Join Community</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 StackIt. Built for Odoo Hackathon 2025.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 