import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';

const VotingButtons = ({ 
  itemType, // 'question' or 'answer'
  itemId, 
  initialVotes = 0, 
  initialUserVote = null, // 'up', 'down', or null
  onVoteChange = () => {}, // Callback when vote changes
  size = 'normal', // 'small', 'normal', 'large'
  className = '',
  disabled = false,
  showTooltip = true
}) => {
  const { user, API_BASE_URL } = useApp();
  const navigate = useNavigate();
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [voteAnimation, setVoteAnimation] = useState('');

  useEffect(() => {
    setVotes(initialVotes);
    setUserVote(initialUserVote);
  }, [initialVotes, initialUserVote]);

  const handleVote = async (voteType) => {
    if (!user) {
      setShowLoginPrompt(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    if (disabled || isVoting) return;

    setIsVoting(true);
    
    try {
      const endpoint = itemType === 'question' ? 
        `${API_BASE_URL}/questions/${itemId}/vote` : 
        `${API_BASE_URL}/answers/${itemId}/vote`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('stackit_token')}`
        },
        body: JSON.stringify({ voteType }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Calculate new vote count and user vote state
        let newVotes = votes;
        let newUserVote = userVote;
        
        if (voteType === 'up') {
          if (userVote === 'up') {
            // Remove upvote
            newVotes -= 1;
            newUserVote = null;
          } else if (userVote === 'down') {
            // Change from downvote to upvote
            newVotes += 2;
            newUserVote = 'up';
          } else {
            // Add upvote
            newVotes += 1;
            newUserVote = 'up';
          }
        } else if (voteType === 'down') {
          if (userVote === 'down') {
            // Remove downvote
            newVotes += 1;
            newUserVote = null;
          } else if (userVote === 'up') {
            // Change from upvote to downvote
            newVotes -= 2;
            newUserVote = 'down';
          } else {
            // Add downvote
            newVotes -= 1;
            newUserVote = 'down';
          }
        }
        
        setVotes(newVotes);
        setUserVote(newUserVote);
        onVoteChange(newVotes, newUserVote);
        
        // Add vote animation
        if (voteType === 'up') {
          setVoteAnimation('vote-upvote');
        } else {
          setVoteAnimation('vote-downvote');
        }
        
        // Clear animation after it completes
        setTimeout(() => {
          setVoteAnimation('');
        }, 600);
      } else {
        throw new Error('Failed to vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      // You could add a toast notification here
    } finally {
      setIsVoting(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          button: 'p-1',
          icon: 'w-4 h-4',
          votes: 'text-base font-semibold'
        };
      case 'large':
        return {
          button: 'p-3',
          icon: 'w-8 h-8',
          votes: 'text-2xl font-bold'
        };
      default:
        return {
          button: 'p-2',
          icon: 'w-6 h-6',
          votes: 'text-xl font-bold'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const getButtonClass = (voteType) => {
    const baseClass = `${sizeClasses.button} rounded-full vote-button btn-hover-lift btn-click-scale ${
      disabled ? 'cursor-not-allowed opacity-50' : 'hover:shadow-lg'
    }`;
    
    if (userVote === voteType) {
      return voteType === 'up' 
        ? `${baseClass} bg-green-100 text-green-600 hover:bg-green-200 success-bounce`
        : `${baseClass} bg-red-100 text-red-600 hover:bg-red-200`;
    }
    
    return `${baseClass} bg-gray-100 text-gray-600 hover:bg-gray-200 ${
      !disabled && user ? 'hover:text-blue-600 btn-hover-glow' : ''
    }`;
  };

  const getVotesClass = () => {
    let baseClass = `${sizeClasses.votes} my-2 transition-colors duration-200`;
    
    if (votes > 0) {
      baseClass += ' text-green-600';
    } else if (votes < 0) {
      baseClass += ' text-red-600';
    } else {
      baseClass += ' text-gray-700';
    }
    
    return baseClass;
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Like Button */}
      <button
        onClick={() => handleVote('up')}
        className={getButtonClass('up')}
        disabled={disabled || isVoting}
        title={showTooltip ? (userVote === 'up' ? 'Remove like' : 'Like') : ''}
      >
        <svg 
          className={`${sizeClasses.icon} ${isVoting ? 'animate-pulse' : ''}`} 
          fill={userVote === 'up' ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" 
          />
        </svg>
      </button>

      {/* Vote Count */}
      <span className={`${getVotesClass()} ${voteAnimation}`}>
        {votes > 0 && '+'}
        {votes}
      </span>

      {/* Dislike Button */}
      <button
        onClick={() => handleVote('down')}
        className={getButtonClass('down')}
        disabled={disabled || isVoting}
        title={showTooltip ? (userVote === 'down' ? 'Remove dislike' : 'Dislike') : ''}
      >
        <svg 
          className={`${sizeClasses.icon} ${isVoting ? 'animate-pulse' : ''}`} 
          fill={userVote === 'down' ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" 
          />
        </svg>
      </button>

      {/* Login Prompt */}
      {showLoginPrompt && (
        <div className="absolute z-10 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg transform -translate-x-1/2 left-1/2 bottom-full mb-2">
          Please login to vote
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}

      {/* Voting Feedback */}
      {user && !disabled && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          {userVote === 'up' && '👍 Liked'}
          {userVote === 'down' && '👎 Disliked'}
          {!userVote && 'Click to vote'}
        </div>
      )}
    </div>
  );
};

export default VotingButtons; 