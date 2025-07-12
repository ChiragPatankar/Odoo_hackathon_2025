import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import VotingButtons from './VotingButtons';
import MedalSystem from './MedalSystem';

const QuestionDetail = () => {
  const { id } = useParams();
  const { user, API_BASE_URL } = useApp();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState('');

  useEffect(() => {
    fetchQuestion();
  }, [id]);

  const fetchQuestion = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/${id}`);
      if (response.ok) {
        const data = await response.json();
        // Ensure answers is always an array for consistency
        if (data.answers && !Array.isArray(data.answers)) {
          data.answers = [];
        }
        setQuestion(data);
        setLoading(false);
        return;
      }
      
      // Fallback to mock data if API fails
      const mockQuestion = {
        id: parseInt(id) || 1,
        title: 'How to optimize React component performance?',
        description: 'I have a React application with performance issues. Components are re-rendering too frequently and causing lag. What are the best practices to optimize React component performance?',
        tags: ['react', 'performance', 'optimization', 'javascript'],
        votes: 15,
        userVote: null,
        userId: 1,
        username: 'john_doe',
        createdAt: '2024-01-18T10:30:00Z',
        answers: [
          {
            id: 1,
            questionId: parseInt(id) || 1,
            content: 'There are several ways to optimize React component performance:\n\n1. **Use React.memo()** for functional components\n2. **Implement useMemo() and useCallback()** for expensive calculations\n3. **Avoid inline functions** in JSX props\n4. **Use proper key props** in lists\n5. **Split components** to reduce re-render scope\n\nHere\'s an example:\n```javascript\nconst MyComponent = React.memo(({ data }) => {\n  const expensiveValue = useMemo(() => {\n    return data.filter(item => item.active).length;\n  }, [data]);\n  \n  return <div>{expensiveValue}</div>;\n});\n```',
            votes: 8,
            userVote: null,
            isAccepted: true,
            userId: 2,
            username: 'react_expert',
            createdAt: '2024-01-18T14:20:00Z'
          },
          {
            id: 2,
            questionId: parseInt(id) || 1,
            content: 'Another important optimization is to use **React DevTools Profiler** to identify performance bottlenecks.\n\nYou can also consider:\n- Using `React.PureComponent` for class components\n- Implementing `shouldComponentUpdate()` lifecycle method\n- Using `React.lazy()` for code splitting\n- Optimizing state structure to minimize re-renders',
            votes: 3,
            userVote: null,
            isAccepted: false,
            userId: 3,
            username: 'dev_mentor',
            createdAt: '2024-01-18T16:45:00Z'
          }
        ]
      };
      
      setQuestion(mockQuestion);
      setLoading(false);
    } catch (error) {
      setError('Failed to load question');
      setLoading(false);
    }
  };



  const handleAcceptAnswer = async (answerId) => {
    if (!user || user.id !== question.userId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/answers/${answerId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId: question.id }),
      });

      if (response.ok) {
        await fetchQuestion(); // Refresh question data
      }
    } catch (error) {
      console.error('Error accepting answer:', error);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (!answerContent.trim()) {
      setAnswerError('Answer content is required');
      return;
    }

    if (answerContent.length < 20) {
      setAnswerError('Answer must be at least 20 characters');
      return;
    }

    setSubmittingAnswer(true);
    setAnswerError('');

    try {
      const response = await fetch(`${API_BASE_URL}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: question.id,
          content: answerContent.trim(),
          userId: user.id,
          username: user.username
        }),
      });

      if (response.ok) {
        setAnswerContent('');
        await fetchQuestion(); // Refresh question data
      } else {
        setAnswerError('Failed to submit answer. Please try again.');
      }
    } catch (error) {
      setAnswerError('Network error. Please try again.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const formatDate = (dateString) => {
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

  const formatContent = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-lg overflow-x-auto"><code>$1</code></pre>');
  };

  const insertFormatting = (type) => {
    const textarea = document.getElementById('answerContent');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    
    switch (type) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        break;
      case 'code':
        formattedText = `\`${selectedText || 'code'}\``;
        break;
      case 'codeblock':
        formattedText = `\n\`\`\`\n${selectedText || 'code block'}\n\`\`\`\n`;
        break;
      case 'link':
        formattedText = `[${selectedText || 'link text'}](URL)`;
        break;
      case 'list':
        formattedText = `\n- ${selectedText || 'list item'}\n`;
        break;
      default:
        return;
    }
    
    const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    setAnswerContent(newValue);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading question...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Question Not Found</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600">
        <button onClick={() => navigate('/')} className="hover:text-blue-600 transition-colors">
          Home
        </button>
        <span className="mx-2">›</span>
        <span>Question</span>
      </nav>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{question.title}</h1>
          
          <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
            <span>Asked {formatDate(question.createdAt)}</span>
            <span>by {question.username}</span>
            <span>{Array.isArray(question.answers) ? question.answers.length : question.answers || 0} answers</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {question.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-6">
            {/* Voting */}
            <VotingButtons
              itemType="question"
              itemId={question.id}
              initialVotes={question.votes}
              initialUserVote={question.userVote}
              onVoteChange={(newVotes, newUserVote) => {
                setQuestion({
                  ...question,
                  votes: newVotes,
                  userVote: newUserVote
                });
              }}
              size="large"
            />

            {/* Question Content */}
            <div className="flex-1">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formatContent(question.description || '') }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {Array.isArray(question.answers) ? question.answers.length : question.answers || 0} Answer{(Array.isArray(question.answers) ? question.answers.length : question.answers || 0) !== 1 ? 's' : ''}
          </h2>
        </div>

        <div className="divide-y">
          {!Array.isArray(question.answers) || question.answers.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              <p>No answers yet. Be the first to answer!</p>
            </div>
          ) : (
            question.answers.map((answer, index) => (
                <div key={answer.id || index} className="p-6">
                  <div className="flex gap-6">
                    {/* Voting and Accept Answer */}
                    <div className="flex flex-col items-center">
                      <VotingButtons
                        itemType="answer"
                        itemId={answer.id}
                        initialVotes={answer.votes}
                        initialUserVote={answer.userVote}
                        onVoteChange={(newVotes, newUserVote) => {
                          setQuestion({
                            ...question,
                            answers: Array.isArray(question.answers) ? question.answers.map(a => 
                              a.id === answer.id 
                                ? { ...a, votes: newVotes, userVote: newUserVote }
                                : a
                            ) : question.answers
                          });
                        }}
                        size="normal"
                      />
                      
                      {/* Accept Answer */}
                      {user && user.id === question.userId && (
                        <button
                          onClick={() => handleAcceptAnswer(answer.id)}
                          className={`p-2 rounded-full transition-colors mt-4 ${
                            answer.isAccepted 
                              ? 'bg-green-100 text-green-600' 
                              : 'hover:bg-gray-100 text-gray-600'
                          }`}
                          title={answer.isAccepted ? 'Accepted answer' : 'Accept this answer'}
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Answer Content */}
                    <div className="flex-1">
                      {answer.isAccepted && (
                        <div className="flex items-center gap-2 text-green-600 text-sm mb-3">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold">Accepted Answer</span>
                        </div>
                      )}
                      
                      <div 
                        className="prose prose-sm max-w-none mb-4"
                        dangerouslySetInnerHTML={{ __html: formatContent(answer.content || '') }}
                      />
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-3">
                          <span>answered {formatDate(answer.createdAt)} by {answer.username || 'Anonymous'}</span>
                          {answer.userId && (
                            <MedalSystem userId={answer.userId} size="small" showProgress={false} />
                          )}
                        </div>
                      </div>
                    </div>
                                      </div>
                  </div>
                ))
            )}
          </div>
      </div>

      {/* Answer Form */}
      {user ? (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Your Answer</h3>
          </div>
          
          <form onSubmit={handleSubmitAnswer} className="p-6">
            {/* Rich Text Toolbar */}
            <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => insertFormatting('bold')}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('italic')}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('code')}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors font-mono"
                title="Inline Code"
              >
                {'</>'}
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('codeblock')}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                title="Code Block"
              >
                {'{ }'}
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('link')}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                title="Link"
              >
                🔗
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('list')}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                title="List"
              >
                • List
              </button>
            </div>

            <textarea
              id="answerContent"
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border-l border-r border-b border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Write your answer here. Use Markdown for formatting."
            />
            
            {answerError && (
              <p className="mt-2 text-sm text-red-600">{answerError}</p>
            )}
            
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={submittingAnswer}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingAnswer ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Post Answer'
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">Please log in to post an answer.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Log In
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionDetail; 