import React, { useState, useEffect } from 'react';

const RecommendationsDashboard = ({ userId = 'user2' }) => {
  const [recommendations, setRecommendations] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [activeTab, setActiveTab] = useState('questions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
    fetchUserProfile();
    fetchTrendingTopics();
  }, [userId]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`/api/ai/recommendations/${userId}?limit=15`);
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/ai/user-profile/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user profile');
      const data = await response.json();
      setUserProfile(data.profile);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchTrendingTopics = async () => {
    try {
      const response = await fetch('/api/ai/trending-topics?limit=10');
      if (!response.ok) throw new Error('Failed to fetch trending topics');
      const data = await response.json();
      setTrendingTopics(data.trendingTopics);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getExpertiseColor = (level) => {
    const colors = {
      expert: 'bg-purple-100 text-purple-800',
      intermediate: 'bg-blue-100 text-blue-800',
      beginner: 'bg-green-100 text-green-800',
      new: 'bg-gray-100 text-gray-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getComplexityColor = (complexity) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[complexity] || 'bg-gray-100 text-gray-800';
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">⚠️ Error loading recommendations: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🤖 AI-Powered Recommendations
        </h1>
        <p className="text-gray-600">
          Personalized content suggestions based on your interests and activity
        </p>
      </div>

      {/* User Profile Section */}
      {userProfile && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            👤 Your Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getExpertiseColor(userProfile.expertiseLevel)}`}>
                {userProfile.expertiseLevel}
              </div>
              <p className="text-gray-600 text-sm mt-1">Expertise Level</p>
            </div>
            <div className="text-center">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getComplexityColor(userProfile.preferredComplexity)}`}>
                {userProfile.preferredComplexity}
              </div>
              <p className="text-gray-600 text-sm mt-1">Preferred Complexity</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {userProfile.activityScore}
              </div>
              <p className="text-gray-600 text-sm mt-1">Activity Score</p>
            </div>
          </div>
          
          {/* Top Technologies */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Your Top Technologies</h3>
            <div className="flex flex-wrap gap-2">
              {userProfile.topTechnologies.slice(0, 8).map((tech, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {tech.tech} ({tech.score})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['questions', 'answers', 'topics', 'users'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {recommendations && recommendations[tab] && (
                  <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {recommendations[tab].length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Questions Tab */}
          {activeTab === 'questions' && recommendations?.questions && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">📝 Recommended Questions</h3>
              {recommendations.questions.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                        {item.question.title}
                      </h4>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {item.question.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{item.question.votes} votes</span>
                        <span>{item.question.answers} answers</span>
                        <span>{formatTimeAgo(item.question.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        {item.question.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-sm font-medium text-blue-600">
                        {Math.round(item.relevanceScore * 100)}% match
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.reasons.slice(0, 2).map((reason, reasonIndex) => (
                          <div key={reasonIndex}>{reason}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Answers Tab */}
          {activeTab === 'answers' && recommendations?.answers && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">💡 Recommended Answers</h3>
              {recommendations.answers.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                        {item.question.title}
                      </h4>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-3">
                        {item.answer.content.substring(0, 200)}...
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>by {item.answer.username}</span>
                        <span>{item.answer.votes} votes</span>
                        {item.answer.isAccepted && (
                          <span className="text-green-600">✓ Accepted</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-sm font-medium text-blue-600">
                        {Math.round(item.relevanceScore * 100)}% match
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                        item.qualityGrade === 'excellent' ? 'bg-green-100 text-green-800' :
                        item.qualityGrade === 'good' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.qualityGrade}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Topics Tab */}
          {activeTab === 'topics' && recommendations?.topics && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">🏷️ Recommended Topics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.topics.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.topic}</h4>
                        <p className="text-gray-600 text-sm">{item.reason}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-600">
                          {item.popularity} questions
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round(item.relevanceScore * 100)}% match
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && recommendations?.users && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">👥 Users to Follow</h3>
              {recommendations.users.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.username}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>{item.stats.totalAnswers} answers</span>
                        <span>{item.stats.acceptanceRate}% accepted</span>
                        <span>{item.stats.avgVotes} avg votes</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        {item.stats.topTechnologies.map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-sm font-medium text-blue-600">
                        {Math.round(item.relevanceScore * 100)}% match
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Quality: {item.stats.avgQualityScore}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trending Topics Sidebar */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🔥 Trending Topics</h3>
        <div className="space-y-2">
          {trendingTopics.slice(0, 8).map((topic, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <span className="text-gray-700">{topic.topic}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{topic.count}</span>
                <span className="text-xs text-gray-400">({topic.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecommendationsDashboard; 