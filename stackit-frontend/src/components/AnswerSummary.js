import React, { useState } from 'react';

const AnswerSummary = ({ answer, onSummarize, compact = false }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFullSummary, setShowFullSummary] = useState(false);

  const handleSummarize = async () => {
    if (!answer?.content) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/summarize-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: answer.content,
          maxLength: compact ? 100 : 200
        })
      });

      if (!response.ok) {
        throw new Error('Failed to summarize answer');
      }

      const data = await response.json();
      setSummary(data);
      if (onSummarize) onSummarize(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadgeColor = (grade) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800'
    };
    return colors[grade] || 'bg-gray-100 text-gray-800';
  };

  const renderInsightIcon = (type) => {
    const icons = {
      definition: '📖',
      'cause-effect': '🔗',
      'best-practice': '⭐',
      instruction: '📝',
      step: '🔢'
    };
    return icons[type] || '💡';
  };

  if (compact && !summary) {
    return (
      <div className="bg-gray-50 p-3 rounded-lg border">
        <button
          onClick={handleSummarize}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
        >
          {loading ? 'Summarizing...' : '✨ Generate AI Summary'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          🤖 AI Answer Analysis
        </h3>
        {!summary && (
          <button
            onClick={handleSummarize}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Analyzing...' : 'Analyze Answer'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">⚠️ {error}</p>
        </div>
      )}

      {summary && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Compression: {Math.round(summary.compressionRatio * 100)}%
            </span>
            <span className={`flex items-center ${getConfidenceColor(summary.confidence)}`}>
              <span className="w-2 h-2 bg-current rounded-full mr-2"></span>
              Confidence: {Math.round(summary.confidence * 100)}%
            </span>
          </div>

          {/* Summary Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">📝 Summary</h4>
            <p className="text-blue-800 text-sm leading-relaxed">
              {summary.summary}
            </p>
          </div>

          {/* Key Insights */}
          {summary.keyInsights.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">💡 Key Insights</h4>
              <div className="space-y-2">
                {summary.keyInsights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-lg">{renderInsightIcon(insight.type)}</span>
                    <div className="flex-1">
                      <p className="text-yellow-800 text-sm">{insight.content}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        insight.importance === 'high' ? 'bg-red-100 text-red-700' :
                        insight.importance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {insight.importance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Items */}
          {summary.actionableItems.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">✅ Action Items</h4>
              <div className="space-y-2">
                {summary.actionableItems.map((item, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-lg">{renderInsightIcon(item.type)}</span>
                    <div className="flex-1">
                      <p className="text-green-800 text-sm">{item.content}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.priority === 'high' ? 'bg-red-100 text-red-700' :
                          item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {item.priority}
                        </span>
                        {item.order && (
                          <span className="text-xs text-gray-500">Step {item.order}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Code Snippets */}
          {summary.codeSnippets.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">💻 Code Snippets</h4>
              <div className="space-y-3">
                {summary.codeSnippets.map((snippet, index) => (
                  <div key={index} className="bg-gray-900 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 font-mono">
                        {snippet.language}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        snippet.importance === 'high' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {snippet.importance}
                      </span>
                    </div>
                    <pre className="text-green-400 text-sm overflow-x-auto">
                      <code>{snippet.content}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toggle Full Summary */}
          {!compact && (
            <button
              onClick={() => setShowFullSummary(!showFullSummary)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showFullSummary ? 'Show Less' : 'Show More Details'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AnswerSummary; 