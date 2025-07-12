import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';
import VotingButtons from './VotingButtons';

const TrendingQuestions = () => {
  const { API_BASE_URL, user } = useApp();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [timeRange, setTimeRange] = useState('week');

  const domains = [
    { id: 'all', name: 'All Domains', icon: '🌐', color: 'from-blue-600 to-purple-600' },
    { id: 'web', name: 'Web Development', icon: '🌐', color: 'from-blue-500 to-cyan-500' },
    { id: 'mobile', name: 'Mobile Development', icon: '📱', color: 'from-green-500 to-emerald-500' },
    { id: 'data', name: 'Data Science', icon: '📊', color: 'from-purple-500 to-pink-500' },
    { id: 'ai', name: 'AI/ML', icon: '🤖', color: 'from-orange-500 to-red-500' },
    { id: 'backend', name: 'Backend Development', icon: '⚙️', color: 'from-gray-600 to-gray-700' },
    { id: 'devops', name: 'DevOps', icon: '🚀', color: 'from-indigo-500 to-blue-500' },
    { id: 'security', name: 'Security', icon: '🔒', color: 'from-red-500 to-pink-500' },
    { id: 'database', name: 'Database', icon: '🗃️', color: 'from-yellow-500 to-orange-500' }
  ];

  const timeRanges = [
    { id: 'day', name: 'Today', icon: '📅' },
    { id: 'week', name: 'This Week', icon: '📊' },
    { id: 'month', name: 'This Month', icon: '🗓️' },
    { id: 'year', name: 'This Year', icon: '📈' }
  ];

  useEffect(() => {
    fetchTrendingQuestions();
  }, [selectedDomain, timeRange]);

  const fetchTrendingQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDomain !== 'all') params.append('domain', selectedDomain);
      params.append('timeRange', timeRange);
      params.append('trending', 'true');
      
      const response = await fetch(`${API_BASE_URL}/questions?${params}`);
      const data = await response.json();
      
      // Calculate trending score and sort
      const trendingQuestions = data.map(question => ({
        ...question,
        // Ensure consistent data structure for answers
        answers: typeof question.answers === 'number' ? question.answers : (Array.isArray(question.answers) ? question.answers.length : 0),
        trendingScore: calculateTrendingScore(question)
      })).sort((a, b) => b.trendingScore - a.trendingScore);
      
      setQuestions(trendingQuestions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trending questions:', error);
      setLoading(false);
    }
  };

  const calculateTrendingScore = (question) => {
    const now = new Date();
    const questionDate = new Date(question.createdAt);
    const hoursSinceCreated = (now - questionDate) / (1000 * 60 * 60);
    
    // Trending score based on votes, views, answers, and recency
    const voteScore = question.votes * 10;
    const viewScore = (question.views || 0) * 1;
    const answerCount = typeof question.answers === 'number' ? question.answers : (Array.isArray(question.answers) ? question.answers.length : 0);
    const answerScore = answerCount * 15;
    const acceptedAnswerBonus = question.acceptedAnswerId ? 25 : 0;
    
    // Decay factor based on time (more recent questions get higher score)
    const decayFactor = Math.pow(0.8, hoursSinceCreated / 24); // Decay by 20% per day
    
    const baseScore = voteScore + viewScore + answerScore + acceptedAnswerBonus;
    return Math.round(baseScore * decayFactor);
  };

  const getDomainFromTags = (tags) => {
    const tagMap = {
      'web': ['javascript', 'react', 'vue', 'angular', 'html', 'css', 'nodejs', 'express', 'frontend', 'backend'],
      'mobile': ['android', 'ios', 'react-native', 'flutter', 'kotlin', 'swift', 'xamarin', 'ionic'],
      'data': ['python', 'pandas', 'numpy', 'matplotlib', 'data-analysis', 'statistics', 'sql', 'r'],
      'ai': ['machine-learning', 'deep-learning', 'tensorflow', 'pytorch', 'ai', 'nlp', 'computer-vision'],
      'backend': ['java', 'spring', 'django', 'flask', 'api', 'microservices', 'golang', 'rust'],
      'devops': ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ci-cd', 'jenkins', 'terraform'],
      'security': ['cybersecurity', 'encryption', 'authentication', 'oauth', 'security', 'penetration-testing'],
      'database': ['mysql', 'postgresql', 'mongodb', 'redis', 'database', 'sql', 'nosql']
    };

    for (const [domain, domainTags] of Object.entries(tagMap)) {
      if (tags.some(tag => domainTags.includes(tag.toLowerCase()))) {
        return domain;
      }
    }
    return 'web'; // default
  };

  const getFilteredQuestions = () => {
    if (selectedDomain === 'all') return questions;
    return questions.filter(q => getDomainFromTags(q.tags) === selectedDomain);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  const getTrendingIcon = (score) => {
    if (score > 100) return '🔥';
    if (score > 50) return '📈';
    if (score > 20) return '⭐';
    return '📊';
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-6 text-gray-600 text-lg">Discovering trending questions...</p>
      </div>
    );
  }

  const filteredQuestions = getFilteredQuestions();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              🔥 <span className="text-orange-600">Trending</span> Questions
            </h1>
            <p className="text-gray-600 text-lg">
              Discover the hottest questions across different domains, updated in real-time
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-orange-600">{filteredQuestions.length}</div>
              <div className="text-sm text-gray-600">Trending Now</div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Time Range:</span>
            <div className="flex gap-2">
              {timeRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    timeRange === range.id
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{range.icon}</span>
                  {range.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Domain Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {domains.map((domain) => {
          const domainQuestions = domain.id === 'all' ? questions : questions.filter(q => getDomainFromTags(q.tags) === domain.id);
          const isSelected = selectedDomain === domain.id;
          
          return (
            <button
              key={domain.id}
              onClick={() => setSelectedDomain(domain.id)}
              className={`p-4 rounded-xl border transition-all duration-300 text-left group ${
                isSelected
                  ? 'border-orange-300 bg-gradient-to-r ' + domain.color + ' text-white shadow-lg transform scale-105'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{domain.icon}</span>
                <span className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                  {domain.name}
                </span>
              </div>
              <div className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                {domainQuestions.length} trending
              </div>
            </button>
          );
        })}
      </div>

      {/* Trending Questions List */}
      <div className="space-y-6">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No trending questions found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              There are no trending questions in this domain for the selected time range.
            </p>
            <Link 
              to="/questions"
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300 inline-block"
            >
              Browse All Questions
            </Link>
          </div>
        ) : (
          filteredQuestions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-orange-200 transition-all duration-300 group">
              <div className="flex items-start gap-4">
                {/* Trending Rank */}
                <div className="flex-shrink-0 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-2">
                    {index + 1}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getTrendingIcon(question.trendingScore)}
                  </div>
                </div>

                {/* Voting */}
                <div className="flex-shrink-0">
                  <VotingButtons
                    itemType="question"
                    itemId={question.id}
                    initialVotes={question.votes}
                    initialUserVote={question.userVote}
                    onVoteChange={(newVotes, newUserVote) => {
                      setQuestions(questions.map(q => 
                        q.id === question.id 
                          ? { ...q, votes: newVotes, userVote: newUserVote }
                          : q
                      ));
                    }}
                    size="small"
                    showTooltip={false}
                  />
                </div>

                {/* Question Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                      Score: {question.trendingScore}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {formatDate(question.createdAt)}
                    </span>
                  </div>

                  <Link 
                    to={`/questions/${question.id}`}
                    className="block mb-3 group-hover:text-orange-600 transition-colors"
                  >
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors leading-tight">
                      {question.title}
                    </h3>
                  </Link>
                  
                  <p className="text-gray-600 mb-4 leading-relaxed line-clamp-2">
                    {question.description.substring(0, 200)}
                    {question.description.length > 200 && '...'}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {question.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 text-sm rounded-full border border-orange-200"
                      >
                        {tag}
                      </span>
                    ))}
                    {question.tags.length > 4 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                        +{question.tags.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <span className="text-blue-600 font-semibold">{question.votes}</span>
                      <span>votes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-green-600 font-semibold">{typeof question.answers === 'number' ? question.answers : (Array.isArray(question.answers) ? question.answers.length : 0)}</span>
                      <span>answers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-purple-600 font-semibold">{question.views || 0}</span>
                      <span>views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>by</span>
                      <span className="font-semibold text-gray-700">{question.username}</span>
                    </div>
                    
                    {question.acceptedAnswerId && (
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Solved</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredQuestions.length > 0 && (
        <div className="text-center mt-12 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            🎯 {filteredQuestions.length} trending questions found
          </h3>
          <p className="text-gray-600">
            {selectedDomain === 'all' ? 'Across all domains' : `In ${domains.find(d => d.id === selectedDomain)?.name}`} 
            {' '} • {timeRanges.find(t => t.id === timeRange)?.name}
          </p>
        </div>
      )}
    </div>
  );
};

export default TrendingQuestions; 