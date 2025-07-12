import React, { useState, useEffect } from 'react';
import { useApp } from '../App';

const MedalSystem = ({ userId, size = 'normal', showProgress = true, showTooltip = true, className = '' }) => {
  const { API_BASE_URL } = useApp();
  const [medalData, setMedalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [levelUp, setLevelUp] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchMedalData();
    }
  }, [userId]);

  const fetchMedalData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/${userId}/medal`);
      if (response.ok) {
        const data = await response.json();
        
        // Check if user has achieved a new medal level
        const previousMedal = medalData?.current?.name;
        const currentMedal = data?.current?.name;
        
        if (previousMedal && currentMedal && previousMedal !== currentMedal) {
          setLevelUp(true);
          setTimeout(() => setLevelUp(false), 2000);
        }
        
        setMedalData(data);
      } else {
        setError('Failed to fetch medal data');
      }
    } catch (error) {
      setError('Error fetching medal data');
      console.error('Error fetching medal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'w-6 h-6',
          icon: 'text-sm',
          text: 'text-xs',
          badge: 'px-1 py-0.5 text-xs'
        };
      case 'large':
        return {
          container: 'w-16 h-16',
          icon: 'text-3xl',
          text: 'text-sm',
          badge: 'px-3 py-1 text-sm'
        };
      case 'extra-large':
        return {
          container: 'w-24 h-24',
          icon: 'text-5xl',
          text: 'text-base',
          badge: 'px-4 py-2 text-base'
        };
      default: // normal
        return {
          container: 'w-10 h-10',
          icon: 'text-lg',
          text: 'text-sm',
          badge: 'px-2 py-1 text-xs'
        };
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'from-green-400 to-blue-500';
      case 'intermediate':
        return 'from-yellow-400 to-orange-500';
      case 'advanced':
        return 'from-red-400 to-pink-500';
      case 'expert':
        return 'from-purple-400 to-indigo-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getLevelBadgeColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      case 'expert':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${getSizeClasses().container} ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (error || !medalData) {
    return (
      <div className={`flex items-center justify-center ${getSizeClasses().container} ${className}`}>
        <span className="text-gray-400">?</span>
      </div>
    );
  }

  const sizeClasses = getSizeClasses();
  const { current, next, progress, stats } = medalData;

  return (
    <div className={`relative ${className}`}>
      {/* Medal Display */}
      <div 
        className={`
          ${sizeClasses.container} 
          rounded-full 
          bg-gradient-to-br ${getLevelColor(current.level)} 
          flex items-center justify-center 
          shadow-lg 
          cursor-pointer 
          transition-all duration-300 
          hover:scale-110 
          hover:shadow-xl
          medal-glow
          ${levelUp ? 'level-up' : ''}
        `}
        onClick={() => setShowDetails(!showDetails)}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
        style={{ backgroundColor: current.color }}
      >
        <span className={`${sizeClasses.icon} filter drop-shadow-sm`}>
          {current.icon}
        </span>
      </div>

      {/* Medal Name Badge */}
      {size !== 'small' && (
        <div className={`
          absolute -bottom-2 left-1/2 transform -translate-x-1/2 
          ${getLevelBadgeColor(current.level)} 
          ${sizeClasses.badge}
          rounded-full 
          font-semibold 
          whitespace-nowrap 
          shadow-sm
          animate-fade-in
        `}>
          {current.name}
        </div>
      )}

      {/* Progress Bar */}
      {showProgress && next && size !== 'small' && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-24">
                     <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
             <div 
               className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-1000 ease-out progress-fill"
               style={{ width: `${progress}%`, '--progress-width': `${progress}%` }}
             ></div>
           </div>
          <div className="text-xs text-gray-600 text-center mt-1">
            {progress}% to {next.name}
          </div>
        </div>
      )}

      {/* Tooltip/Details */}
      {showTooltip && showDetails && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 animate-scale-in">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-64">
            <div className="flex items-center gap-3 mb-3">
              <div className={`
                w-8 h-8 
                rounded-full 
                bg-gradient-to-br ${getLevelColor(current.level)} 
                flex items-center justify-center
              `}>
                <span className="text-lg">{current.icon}</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{current.name}</h3>
                <p className="text-xs text-gray-600 capitalize">{current.level}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{current.description}</p>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Votes:</span>
                <span className="font-semibold text-blue-600">{stats.totalVotesReceived}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Answers:</span>
                <span className="font-semibold text-green-600">{stats.totalAnswers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Accepted:</span>
                <span className="font-semibold text-purple-600">{stats.acceptedAnswers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Questions:</span>
                <span className="font-semibold text-orange-600">{stats.totalQuestions}</span>
              </div>
            </div>
            
            {next && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-700">Next: {next.name}</span>
                  <span className="text-lg">{next.icon}</span>
                </div>
                                 <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                   <div 
                     className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-1000 ease-out progress-fill"
                     style={{ width: `${progress}%`, '--progress-width': `${progress}%` }}
                   ></div>
                 </div>
                <p className="text-xs text-gray-600 mt-1">
                  {next.minVotes - stats.totalVotesReceived} more votes needed
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Medal Showcase Component
export const MedalShowcase = ({ userId, className = '' }) => {
  const { API_BASE_URL } = useApp();
  const [allMedals, setAllMedals] = useState([]);
  const [userMedal, setUserMedal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedalsAndUserData();
  }, [userId]);

  const fetchMedalsAndUserData = async () => {
    try {
      setLoading(true);
      const [medalsResponse, userMedalResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/medals`),
        userId ? fetch(`${API_BASE_URL}/users/${userId}/medal`) : Promise.resolve(null)
      ]);

      if (medalsResponse.ok) {
        const medalsData = await medalsResponse.json();
        setAllMedals(medalsData);
      }

      if (userMedalResponse && userMedalResponse.ok) {
        const userMedalData = await userMedalResponse.json();
        setUserMedal(userMedalData);
      }
    } catch (error) {
      console.error('Error fetching medals data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-bold text-gray-800 mb-4">Medal System</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allMedals.map((medal, index) => {
          const isUnlocked = userMedal && userMedal.stats.totalVotesReceived >= medal.minVotes;
          const isCurrent = userMedal && userMedal.current.name === medal.name;
          
          return (
                         <div 
               key={index}
               className={`
                 relative p-4 rounded-lg border-2 transition-all duration-300
                 ${isCurrent 
                   ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                   : isUnlocked 
                     ? 'border-green-200 bg-green-50 hover:border-green-300' 
                     : 'border-gray-200 bg-gray-50 opacity-60'
                 }
                 hover:shadow-md
                 medal-stagger
               `}
               style={{ '--stagger-delay': index }}
             >
              <div className="flex flex-col items-center text-center">
                                 <div className={`
                   w-12 h-12 rounded-full flex items-center justify-center mb-2
                   ${isUnlocked ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gray-300'}
                   ${isCurrent ? 'ring-2 ring-blue-400 animate-pulse' : ''}
                   medal-hover
                 `}>
                  <span className={`text-2xl ${isUnlocked ? '' : 'grayscale'}`}>
                    {medal.icon}
                  </span>
                </div>
                
                <h4 className="font-semibold text-sm text-gray-800 mb-1">{medal.name}</h4>
                <p className="text-xs text-gray-600 capitalize mb-2">{medal.level}</p>
                <p className="text-xs text-gray-500 text-center mb-2">{medal.description}</p>
                
                <div className="text-xs text-gray-600">
                  {medal.minVotes === 0 ? 'Starting medal' : `${medal.minVotes}+ votes`}
                </div>
                
                {isCurrent && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    ✓
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {userMedal && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-4">
            <MedalSystem userId={userId} size="large" showProgress={false} showTooltip={false} />
            <div className="flex-1">
              <h4 className="font-bold text-gray-800">Your Current Medal</h4>
              <p className="text-sm text-gray-600 mb-2">{userMedal.current.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-blue-600 font-semibold">
                  {userMedal.stats.totalVotesReceived} total votes
                </span>
                {userMedal.next && (
                  <span className="text-purple-600">
                    {userMedal.next.minVotes - userMedal.stats.totalVotesReceived} votes to {userMedal.next.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedalSystem; 