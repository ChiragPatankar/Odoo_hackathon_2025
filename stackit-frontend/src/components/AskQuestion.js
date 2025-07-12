import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';

const AskQuestion = () => {
  const { user, API_BASE_URL } = useApp();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // AI-powered features state
  const [aiAnalysis, setAiAnalysis] = useState({
    similarQuestions: [],
    suggestedTags: [],
    contentAnalysis: null,
    moderation: null,
    loading: false
  });
  const [showSimilarQuestions, setShowSimilarQuestions] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [analysisDebounce, setAnalysisDebounce] = useState(null);

  // AI-powered content analysis
  const analyzeContent = useCallback(async (title, description) => {
    if (!title.trim() && !description.trim()) {
      setAiAnalysis(prev => ({
        ...prev,
        similarQuestions: [],
        suggestedTags: [],
        contentAnalysis: null,
        moderation: null
      }));
      return;
    }

    setAiAnalysis(prev => ({ ...prev, loading: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/ai/similar-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnalysis(prev => ({
          ...prev,
          similarQuestions: data.similarQuestions || [],
          suggestedTags: data.suggestedTags || [],
          contentAnalysis: data.contentAnalysis,
          moderation: data.moderation,
          loading: false
        }));

        // Show similar questions if found
        if (data.similarQuestions && data.similarQuestions.length > 0) {
          setShowSimilarQuestions(true);
        }

        // Show content moderation warning if needed
        if (data.moderation && (!data.moderation.approved)) {
          setErrors(prev => ({
            ...prev,
            moderation: data.moderation.toxicity.isToxic 
              ? 'Content contains inappropriate language' 
              : 'Content may be spam or low quality'
          }));
        } else {
          setErrors(prev => ({ ...prev, moderation: '' }));
        }
      }
    } catch (error) {
      console.error('Error analyzing content:', error);
    } finally {
      setAiAnalysis(prev => ({ ...prev, loading: false }));
    }
  }, [API_BASE_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Debounced AI analysis for title and description
    if (name === 'title' || name === 'description') {
      if (analysisDebounce) {
        clearTimeout(analysisDebounce);
      }
      
      const timeout = setTimeout(() => {
        const newTitle = name === 'title' ? value : formData.title;
        const newDescription = name === 'description' ? value : formData.description;
        analyzeContent(newTitle, newDescription);
      }, 1000); // Wait 1 second after user stops typing
      
      setAnalysisDebounce(timeout);
    }
  };

  // Auto-suggest tags when content is analyzed
  useEffect(() => {
    if (aiAnalysis.suggestedTags.length > 0 && !formData.tags.trim()) {
      setShowTagSuggestions(true);
    }
  }, [aiAnalysis.suggestedTags, formData.tags]);

  const applySuggestedTag = (tag) => {
    const currentTags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(', ');
      setFormData(prev => ({ ...prev, tags: newTags }));
    }
    setShowTagSuggestions(false);
  };

  const dismissSimilarQuestions = () => {
    setShowSimilarQuestions(false);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    
    if (!formData.tags.trim()) {
      newErrors.tags = 'At least one tag is required';
    } else {
      const tagList = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      if (tagList.length === 0) {
        newErrors.tags = 'At least one tag is required';
      } else if (tagList.length > 5) {
        newErrors.tags = 'Maximum 5 tags allowed';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const tagList = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const response = await fetch(`${API_BASE_URL}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          tags: tagList,
          userId: user.id,
          username: user.username
        }),
      });

      if (response.ok) {
        const question = await response.json();
        navigate(`/questions/${question.id}`);
      } else {
        setErrors({ submit: 'Failed to create question. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const insertFormatting = (type) => {
    const textarea = document.getElementById('description');
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
    setFormData(prev => ({
      ...prev,
      description: newValue
    }));
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Ask a Question</h1>
          <p className="text-gray-600">Get help from the community by asking a clear, detailed question.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="What's your programming question? Be specific."
              maxLength={200}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-gray-500">
                {formData.title.length}/200 characters
              </p>
              {aiAnalysis.loading && (
                <div className="flex items-center text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                  🤖 AI analyzing...
                </div>
              )}
              {aiAnalysis.contentAnalysis && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">
                    Type: <span className="font-medium text-blue-600">{aiAnalysis.contentAnalysis.questionType}</span>
                  </span>
                  {aiAnalysis.contentAnalysis.technologies.length > 0 && (
                    <span className="text-gray-500">
                      | Tech: <span className="font-medium text-green-600">{aiAnalysis.contentAnalysis.technologies.slice(0, 2).join(', ')}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI-Powered Similar Questions Alert */}
          {showSimilarQuestions && aiAnalysis.similarQuestions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 animate-slide-down">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🤖</span>
                    <h3 className="font-semibold text-yellow-800">AI Found Similar Questions</h3>
                    <button
                      onClick={dismissSimilarQuestions}
                      className="ml-auto text-yellow-600 hover:text-yellow-800 p-1"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    These questions might already have the answer you're looking for:
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {aiAnalysis.similarQuestions.map((item, index) => (
                      <div key={index} className="bg-white rounded-md p-3 border border-yellow-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 text-sm mb-1">
                              {item.question.title}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2">
                              {item.question.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                {item.similarity}% match
                              </span>
                              <span>{item.question.votes} votes</span>
                              <span>{item.question.answers} answers</span>
                            </div>
                            {item.reasons && item.reasons.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-blue-600 font-medium">
                                  Match reasons: {item.reasons.join(', ')}
                                </p>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => navigate(`/questions/${item.question.id}`)}
                            className="ml-3 text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            View →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Moderation Warning */}
          {errors.moderation && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-shake">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <h4 className="font-semibold text-red-800">Content Moderation Alert</h4>
                  <p className="text-sm text-red-600">{errors.moderation}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            
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
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={12}
              className={`w-full px-4 py-3 border-l border-r border-b rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe your problem in detail. Include what you've tried, what you expected to happen, and what actually happened. You can use Markdown formatting."
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            <p className="mt-1 text-sm text-gray-500">
              {formData.description.length} characters. Use Markdown for formatting.
            </p>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.tags ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="javascript, react, html, css, python (separate with commas)"
            />
            {errors.tags && <p className="mt-1 text-sm text-red-600">{errors.tags}</p>}
            <p className="mt-1 text-sm text-gray-500">
              Add up to 5 tags separated by commas. Tags help others find your question.
            </p>

            {/* AI-Powered Tag Suggestions */}
            {showTagSuggestions && aiAnalysis.suggestedTags.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🏷️</span>
                  <h4 className="font-medium text-blue-800">AI Suggested Tags</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.suggestedTags.map((tag, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => applySuggestedTag(tag)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowTagSuggestions(false)}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                >
                  Dismiss suggestions
                </button>
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Posting...
                </div>
              ) : (
                'Post Question'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* AI-Powered Tips & Analytics */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <span>💡</span> Tips for asking a good question:
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Be specific and clear in your title</li>
            <li>• Include relevant code examples</li>
            <li>• Explain what you've already tried</li>
            <li>• Use AI-suggested tags for better discoverability</li>
            <li>• Review similar questions found by our AI</li>
            <li>• Be respectful and follow community guidelines</li>
          </ul>
        </div>
        
        {aiAnalysis.contentAnalysis && (
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
              <span>🤖</span> AI Content Analysis:
            </h3>
            <div className="text-sm text-green-700 space-y-2">
              <div className="flex justify-between">
                <span>Question Type:</span>
                <span className="font-medium capitalize">{aiAnalysis.contentAnalysis.questionType}</span>
              </div>
              <div className="flex justify-between">
                <span>Complexity:</span>
                <span className="font-medium capitalize">{aiAnalysis.contentAnalysis.complexity}</span>
              </div>
              <div className="flex justify-between">
                <span>Word Count:</span>
                <span className="font-medium">{aiAnalysis.contentAnalysis.wordCount}</span>
              </div>
              {aiAnalysis.contentAnalysis.technologies.length > 0 && (
                <div>
                  <span>Detected Technologies:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {aiAnalysis.contentAnalysis.technologies.map((tech, index) => (
                      <span key={index} className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AskQuestion; 