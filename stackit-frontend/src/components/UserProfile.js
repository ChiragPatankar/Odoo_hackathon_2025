import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../App';
import MedalSystem, { MedalShowcase } from './MedalSystem';

const UserProfile = () => {
  const { userId } = useParams();
  const { API_BASE_URL, user: currentUser } = useApp();
  const [user, setUser] = useState(null);
  const [userQuestions, setUserQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    skills: [],
    location: '',
    website: '',
    github: '',
    linkedin: ''
  });

  // Mock user data for demonstration
  const mockUser = {
    id: userId || currentUser?.id || 1,
    username: currentUser?.username || 'johndoe',
    email: currentUser?.email || 'john@example.com',
    avatar: currentUser?.avatar || `https://ui-avatars.com/api/?name=${currentUser?.username || 'John Doe'}&background=random`,
    isAdmin: currentUser?.isAdmin || false,
    joinDate: '2024-01-15',
    lastSeen: '2024-01-20',
    reputation: 1250,
    bio: 'Full-stack developer with 5+ years of experience in React, Node.js, and Python. Passionate about clean code and helping fellow developers.',
    location: 'San Francisco, CA',
    website: 'https://johndoe.dev',
    github: 'johndoe',
    linkedin: 'john-doe-dev',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Django', 'PostgreSQL', 'Docker', 'AWS'],
    badges: [
      { id: 1, name: 'Great Question', description: 'Asked a well-received question', icon: '🏆', color: 'gold' },
      { id: 2, name: 'Helpful Answer', description: 'Answer was accepted', icon: '✅', color: 'green' },
      { id: 3, name: 'Popular Post', description: 'Question received 10+ votes', icon: '⭐', color: 'blue' },
      { id: 4, name: 'Community Helper', description: 'Answered 5+ questions', icon: '🤝', color: 'purple' }
    ],
    stats: {
      questionsAsked: 23,
      answersGiven: 87,
      votesReceived: 342,
      bestAnswers: 45,
      daysActive: 156
    }
  };

  const mockQuestions = [
    {
      id: 1,
      title: 'How to optimize React component re-renders?',
      description: 'I\'m experiencing performance issues with my React app...',
      tags: ['react', 'performance', 'optimization'],
      votes: 15,
      answers: 3,
      views: 234,
      createdAt: '2024-01-18T10:30:00Z',
      acceptedAnswerId: 1
    },
    {
      id: 2,
      title: 'Best practices for Node.js authentication?',
      description: 'What are the current best practices for implementing authentication in Node.js?',
      tags: ['nodejs', 'authentication', 'security'],
      votes: 8,
      answers: 2,
      views: 156,
      createdAt: '2024-01-16T14:20:00Z',
      acceptedAnswerId: null
    }
  ];

  const mockAnswers = [
    {
      id: 1,
      questionId: 5,
      questionTitle: 'How to handle async operations in React?',
      content: 'You can use useEffect with async functions, but be careful about cleanup...',
      votes: 12,
      isAccepted: true,
      createdAt: '2024-01-19T09:15:00Z'
    },
    {
      id: 2,
      questionId: 8,
      questionTitle: 'PostgreSQL vs MongoDB for web apps?',
      content: 'The choice depends on your data structure and requirements...',
      votes: 8,
      isAccepted: false,
      createdAt: '2024-01-17T16:45:00Z'
    }
  ];

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Using mock data for demonstration
      setUser(mockUser);
      setUserQuestions(mockQuestions);
      setUserAnswers(mockAnswers);
      setEditForm({
        bio: mockUser.bio,
        skills: [...mockUser.skills],
        location: mockUser.location,
        website: mockUser.website,
        github: mockUser.github,
        linkedin: mockUser.linkedin
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // Update user data
      setUser({
        ...user,
        bio: editForm.bio,
        skills: editForm.skills,
        location: editForm.location,
        website: editForm.website,
        github: editForm.github,
        linkedin: editForm.linkedin
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleCancel = () => {
    setEditForm({
      bio: user.bio,
      skills: [...user.skills],
      location: user.location,
      website: user.website,
      github: user.github,
      linkedin: user.linkedin
    });
    setIsEditing(false);
  };

  const addSkill = (skill) => {
    if (skill && !editForm.skills.includes(skill)) {
      setEditForm({
        ...editForm,
        skills: [...editForm.skills, skill]
      });
    }
  };

  const removeSkill = (skillToRemove) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-6 text-gray-600 text-lg">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">User not found</h3>
        <p className="text-gray-600">The user profile you're looking for doesn't exist.</p>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === user.id;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Avatar and Basic Info */}
          <div className="flex-shrink-0 text-center lg:text-left">
            <img 
              src={user.avatar} 
              alt={user.username}
              className="w-32 h-32 rounded-full mx-auto lg:mx-0 ring-4 ring-white shadow-xl"
            />
            <div className="mt-4">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <h1 className="text-3xl font-bold text-gray-800">{user.username}</h1>
                {user.isAdmin && (
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Admin
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-3 mt-2">
                <MedalSystem userId={user.id} size="large" showProgress={true} />
              </div>
              <p className="text-gray-600 mt-1">{user.email}</p>
              <div className="flex items-center justify-center lg:justify-start gap-4 mt-3 text-sm text-gray-500">
                <span>📅 Joined {formatDate(user.joinDate)}</span>
                <span>👁️ Last seen {getTimeAgo(user.lastSeen)}</span>
              </div>
            </div>
          </div>

          {/* User Stats */}
          <div className="flex-1">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{user.reputation}</div>
                <div className="text-sm text-gray-600">Reputation</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-green-600">{user.stats.questionsAsked}</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{user.stats.answersGiven}</div>
                <div className="text-sm text-gray-600">Answers</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-orange-600">{user.stats.bestAnswers}</div>
                <div className="text-sm text-gray-600">Best Answers</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-red-600">{user.stats.votesReceived}</div>
                <div className="text-sm text-gray-600">Votes</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              {isOwnProfile && (
                <button
                  onClick={handleEdit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              )}
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap border-b border-gray-100">
          {[
            { id: 'overview', name: 'Overview', icon: '👤' },
            { id: 'questions', name: 'Questions', icon: '❓' },
            { id: 'answers', name: 'Answers', icon: '💬' },
            { id: 'medals', name: 'Medals', icon: '🏅' },
            { id: 'badges', name: 'Badges', icon: '🏆' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* About Section */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">About</h3>
                {isEditing ? (
                  <div className="space-y-4">
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                      placeholder="Tell us about yourself..."
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleSave}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                )}
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Contact & Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                        className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Location"
                      />
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                        className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Website"
                      />
                      <input
                        type="text"
                        value={editForm.github}
                        onChange={(e) => setEditForm({...editForm, github: e.target.value})}
                        className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="GitHub username"
                      />
                      <input
                        type="text"
                        value={editForm.linkedin}
                        onChange={(e) => setEditForm({...editForm, linkedin: e.target.value})}
                        className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="LinkedIn username"
                      />
                    </>
                  ) : (
                    <>
                      {user.location && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-500">📍</span>
                          <span className="text-gray-700">{user.location}</span>
                        </div>
                      )}
                      {user.website && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-500">🌐</span>
                          <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {user.website}
                          </a>
                        </div>
                      )}
                      {user.github && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-500">🐱</span>
                          <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            github.com/{user.github}
                          </a>
                        </div>
                      )}
                      {user.linkedin && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-500">💼</span>
                          <a href={`https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            linkedin.com/in/{user.linkedin}
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Skills Section */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Skills & Expertise</h3>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {editForm.skills.map((skill) => (
                        <span 
                          key={skill}
                          className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a skill..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addSkill(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill) => (
                      <span 
                        key={skill}
                        className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Questions ({userQuestions.length})</h3>
              </div>
              
              {userQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">❓</span>
                  </div>
                  <p className="text-gray-600">No questions asked yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userQuestions.map((question) => (
                    <div key={question.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Link 
                            to={`/questions/${question.id}`}
                            className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                          >
                            {question.title}
                          </Link>
                          <p className="text-gray-600 mt-2 line-clamp-2">{question.description}</p>
                          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <span className="text-blue-600 font-semibold">{question.votes}</span> votes
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-green-600 font-semibold">{question.answers}</span> answers
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-purple-600 font-semibold">{question.views}</span> views
                            </span>
                            <span>asked {getTimeAgo(question.createdAt)}</span>
                            {question.acceptedAnswerId && (
                              <span className="text-green-600 font-semibold">✓ Solved</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {question.tags.map((tag) => (
                              <span key={tag} className="bg-white text-gray-700 px-2 py-1 rounded text-xs border">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Answers Tab */}
          {activeTab === 'answers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Answers ({userAnswers.length})</h3>
              </div>
              
              {userAnswers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💬</span>
                  </div>
                  <p className="text-gray-600">No answers given yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userAnswers.map((answer) => (
                    <div key={answer.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 text-center">
                          <div className={`text-2xl font-bold ${answer.isAccepted ? 'text-green-600' : 'text-blue-600'}`}>
                            {answer.votes}
                          </div>
                          <div className="text-xs text-gray-500">votes</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Link 
                              to={`/questions/${answer.questionId}`}
                              className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                            >
                              {answer.questionTitle}
                            </Link>
                            {answer.isAccepted && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                                ✓ Accepted
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3 line-clamp-3">{answer.content}</p>
                          <div className="text-sm text-gray-500">
                            answered {getTimeAgo(answer.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Medals Tab */}
          {activeTab === 'medals' && (
            <div className="space-y-6">
              <MedalShowcase userId={user.id} />
            </div>
          )}

          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Badges & Achievements ({user.badges.length})</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.badges.map((badge) => (
                  <div key={badge.id} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl">
                        {badge.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{badge.name}</h4>
                        <p className="text-sm text-gray-600">{badge.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 