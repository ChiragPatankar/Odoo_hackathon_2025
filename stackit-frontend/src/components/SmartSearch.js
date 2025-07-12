import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';

const SmartSearch = ({ isEmbedded = false, onClose }) => {
  const { API_BASE_URL } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [queryAnalysis, setQueryAnalysis] = useState(null);
  const [searchDebounce, setSearchDebounce] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Perform AI-powered semantic search
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setQueryAnalysis(null);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/ai/smart-search?q=${encodeURIComponent(searchQuery)}&limit=10`
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setQueryAnalysis(data.queryAnalysis);
      } else {
        console.error('Search failed');
        setResults([]);
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Debounced search
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous debounce
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    // Set new debounce
    const timeout = setTimeout(() => {
      performSearch(value);
    }, 500);

    setSearchDebounce(timeout);
  };

  // Handle direct search (on enter or button click)
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    performSearch(query);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchDebounce]);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  if (isEmbedded) {
    return (
      <div className="relative">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="🤖 AI-powered search: Ask in natural language..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </form>

        {/* Search Results Dropdown */}
        {(results.length > 0 || queryAnalysis) && query.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            {queryAnalysis && (
              <div className="p-4 border-b bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🤖</span>
                  <h4 className="font-semibold text-blue-800">AI Query Analysis</h4>
                </div>
                <div className="text-sm space-y-1">
                  {queryAnalysis.questionType !== 'general' && (
                    <p className="text-blue-700">
                      <strong>Type:</strong> <span className="capitalize">{queryAnalysis.questionType}</span>
                    </p>
                  )}
                  {queryAnalysis.extractedTechnologies.length > 0 && (
                    <p className="text-blue-700">
                      <strong>Technologies:</strong> {queryAnalysis.extractedTechnologies.join(', ')}
                    </p>
                  )}
                  {queryAnalysis.keywords.length > 0 && (
                    <p className="text-blue-700">
                      <strong>Key terms:</strong> {queryAnalysis.keywords.map(k => k.term).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {results.length > 0 ? (
              <div className="p-2">
                {results.map((result, index) => (
                  <Link
                    key={result.id}
                    to={`/questions/${result.id}`}
                    className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={onClose}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 text-sm mb-1">
                          {result.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {result.description?.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {result.relevanceScore}% relevant
                          </span>
                          <span>{result.votes} votes</span>
                          <span>{result.answers} answers</span>
                          <span>{formatTimeAgo(result.createdAt)}</span>
                        </div>
                        {result.matchReasons && result.matchReasons.length > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            <strong>Why this matches:</strong> {result.matchReasons.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : query.trim() && !loading && (
              <div className="p-4 text-center text-gray-500">
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-1">Try different keywords or ask your question!</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full page search interface
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span>🔍</span> AI-Powered Smart Search
          </h1>
          <p className="text-gray-600">
            Search using natural language. Our AI understands context and finds the most relevant answers.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Ask anything: 'How to optimize React performance?' or 'JavaScript async await examples'"
              className="w-full pl-12 pr-24 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </form>

        {/* AI Query Analysis */}
        {queryAnalysis && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🤖</span>
              <h3 className="font-semibold text-blue-800">AI Query Understanding</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-700 mb-1">Question Type</h4>
                <p className="capitalize text-blue-600">{queryAnalysis.questionType}</p>
              </div>
              {queryAnalysis.extractedTechnologies.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-700 mb-1">Technologies</h4>
                  <div className="flex flex-wrap gap-1">
                    {queryAnalysis.extractedTechnologies.map((tech, index) => (
                      <span key={index} className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {queryAnalysis.keywords.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-700 mb-1">Key Terms</h4>
                  <div className="flex flex-wrap gap-1">
                    {queryAnalysis.keywords.slice(0, 5).map((keyword, index) => (
                      <span key={index} className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                        {keyword.term}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                Search Results ({results.length})
              </h2>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showAdvanced ? 'Hide' : 'Show'} relevance details
              </button>
            </div>

            {results.map((result, index) => (
              <div key={result.id} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        to={`/questions/${result.id}`}
                        className="text-xl font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                      >
                        {result.title}
                      </Link>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {result.relevanceScore}% match
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {result.description}
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <span className="text-blue-600 font-semibold">{result.votes}</span> votes
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-green-600 font-semibold">{result.answers}</span> answers
                      </span>
                      <span>asked {formatTimeAgo(result.createdAt)}</span>
                    </div>

                    {showAdvanced && result.matchReasons && result.matchReasons.length > 0 && (
                      <div className="mt-3 p-3 bg-white rounded-md border border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-2">Why this is relevant:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {result.matchReasons.map((reason, idx) => (
                            <li key={idx}>• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      {result.tags && result.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="bg-white text-gray-700 px-2 py-1 rounded text-xs border">
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

        {query.trim() && !loading && results.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤷‍♂️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              No questions match your search: "<em>{query}</em>"
            </p>
            <Link
              to="/ask"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ask this question
            </Link>
          </div>
        )}

        {!query.trim() && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">AI-Powered Search</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Our intelligent search understands natural language and finds the most relevant answers based on context and meaning.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">🎯 Smart Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Semantic understanding</li>
                  <li>• Technology detection</li>
                  <li>• Context-aware results</li>
                  <li>• Relevance scoring</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">💬 Try asking:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• "React performance optimization"</li>
                  <li>• "SQL database connection issues"</li>
                  <li>• "JavaScript async await examples"</li>
                  <li>• "Python error handling best practices"</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartSearch; 