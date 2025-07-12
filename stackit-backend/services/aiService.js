const natural = require('natural');
const compromise = require('compromise');
const stringSimilarity = require('string-similarity');
const { removeStopwords, eng } = require('stopword');

// Initialize NLP components
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const TfIdf = natural.TfIdf;

class AIService {
  constructor() {
    this.tfidf = new TfIdf();
    this.questionVectors = new Map();
    this.questionTexts = new Map();
  }

  // Preprocess text for NLP analysis
  preprocessText(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Convert to lowercase and remove special characters
    let processed = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    
    // Tokenize
    let tokens = tokenizer.tokenize(processed) || [];
    
    // Remove stopwords
    tokens = removeStopwords(tokens, eng);
    
    // Stem words
    tokens = tokens.map(token => stemmer.stem(token));
    
    // Remove empty tokens and duplicates
    tokens = [...new Set(tokens.filter(token => token && token.length > 2))];
    
    return tokens.join(' ');
  }

  // Extract key features from question content
  extractQuestionFeatures(title, description) {
    const combinedText = `${title || ''} ${description || ''}`.trim();
    
    if (!combinedText) return null;

    // Use compromise for NLP analysis
    const doc = compromise(combinedText);
    
    // Extract important features
    const features = {
      // Core text processing
      originalText: combinedText,
      processedText: this.preprocessText(combinedText),
      
      // Linguistic features
      keywords: this.extractKeywords(combinedText),
      entities: doc.people().out('array').concat(doc.places().out('array')),
      topics: doc.topics().out('array'),
      technologies: this.extractTechnologies(combinedText),
      
      // Question characteristics
      questionType: this.classifyQuestionType(title || ''),
      sentiment: this.analyzeSentiment(combinedText),
      complexity: this.assessComplexity(combinedText),
      
      // Metadata
      wordCount: doc.wordCount(),
      sentences: doc.sentences().length
    };

    return features;
  }

  // Extract keywords using TF-IDF
  extractKeywords(text, maxKeywords = 10) {
    const processed = this.preprocessText(text);
    if (!processed) return [];

    // Add to TF-IDF temporarily for keyword extraction
    const tempTfIdf = new TfIdf();
    tempTfIdf.addDocument(processed);
    
    const keywords = [];
    tempTfIdf.listTerms(0).slice(0, maxKeywords).forEach(item => {
      if (item.term.length > 2) {
        keywords.push({
          term: item.term,
          score: item.tfidf
        });
      }
    });

    return keywords;
  }

  // Extract technology-related terms
  extractTechnologies(text) {
    const techTerms = [
      // Programming languages
      'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue',
      'typescript', 'php', 'ruby', 'go', 'rust', 'kotlin', 'swift',
      
      // Frameworks & Libraries
      'express', 'django', 'flask', 'spring', 'laravel', 'rails',
      'nextjs', 'nuxt', 'svelte', 'ember',
      
      // Databases
      'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'firebase',
      
      // Cloud & DevOps
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins',
      
      // Tools & Concepts
      'git', 'api', 'rest', 'graphql', 'microservices', 'authentication',
      'security', 'performance', 'optimization', 'testing', 'debugging'
    ];

    const lowerText = text.toLowerCase();
    const foundTech = techTerms.filter(tech => 
      lowerText.includes(tech) || lowerText.includes(tech + 'js')
    );

    return [...new Set(foundTech)];
  }

  // Classify question type
  classifyQuestionType(title) {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('how to') || lowerTitle.includes('how do')) {
      return 'how-to';
    } else if (lowerTitle.includes('what is') || lowerTitle.includes('what are')) {
      return 'definition';
    } else if (lowerTitle.includes('why') || lowerTitle.includes('when')) {
      return 'conceptual';
    } else if (lowerTitle.includes('error') || lowerTitle.includes('problem') || lowerTitle.includes('issue')) {
      return 'troubleshooting';
    } else if (lowerTitle.includes('best') || lowerTitle.includes('better') || lowerTitle.includes('vs')) {
      return 'comparison';
    } else if (lowerTitle.includes('tutorial') || lowerTitle.includes('example')) {
      return 'tutorial';
    }
    
    return 'general';
  }

  // Basic sentiment analysis
  analyzeSentiment(text) {
    const analyzer = new natural.SentimentAnalyzer('English', 
      natural.PorterStemmer, 'afinn');
    const tokens = tokenizer.tokenize(text.toLowerCase());
    const score = analyzer.getSentiment(tokens);
    
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  }

  // Assess content complexity
  assessComplexity(text) {
    const doc = compromise(text);
    const wordCount = doc.wordCount();
    const sentenceCount = doc.sentences().length;
    const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);
    
    // Simple complexity scoring
    if (avgWordsPerSentence > 20 && wordCount > 100) return 'high';
    if (avgWordsPerSentence > 12 && wordCount > 50) return 'medium';
    return 'low';
  }

  // Calculate semantic similarity between questions
  calculateSimilarity(features1, features2) {
    if (!features1 || !features2) return 0;

    let totalScore = 0;
    let weights = 0;

    // Text similarity using string comparison
    const textSim = stringSimilarity.compareTwoStrings(
      features1.processedText, 
      features2.processedText
    );
    totalScore += textSim * 0.4;
    weights += 0.4;

    // Keyword overlap
    const keywords1 = features1.keywords.map(k => k.term);
    const keywords2 = features2.keywords.map(k => k.term);
    const keywordSim = this.calculateArraySimilarity(keywords1, keywords2);
    totalScore += keywordSim * 0.3;
    weights += 0.3;

    // Technology overlap
    const techSim = this.calculateArraySimilarity(features1.technologies, features2.technologies);
    totalScore += techSim * 0.2;
    weights += 0.2;

    // Question type similarity
    const typeSim = features1.questionType === features2.questionType ? 1 : 0;
    totalScore += typeSim * 0.1;
    weights += 0.1;

    return weights > 0 ? totalScore / weights : 0;
  }

  // Calculate similarity between arrays
  calculateArraySimilarity(arr1, arr2) {
    if (!arr1.length && !arr2.length) return 1;
    if (!arr1.length || !arr2.length) return 0;

    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  // Find similar questions
  findSimilarQuestions(newQuestionFeatures, existingQuestions, threshold = 0.6, maxResults = 5) {
    if (!newQuestionFeatures || !existingQuestions.length) {
      return [];
    }

    const similarities = [];

    for (const question of existingQuestions) {
      const questionFeatures = this.extractQuestionFeatures(question.title, question.description);
      
      if (questionFeatures) {
        const similarity = this.calculateSimilarity(newQuestionFeatures, questionFeatures);
        
        if (similarity >= threshold) {
          similarities.push({
            question,
            similarity,
            reasons: this.getSimilarityReasons(newQuestionFeatures, questionFeatures, similarity)
          });
        }
      }
    }

    // Sort by similarity and return top results
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  }

  // Get reasons for similarity
  getSimilarityReasons(features1, features2, overallSimilarity) {
    const reasons = [];

    // Check text similarity
    const textSim = stringSimilarity.compareTwoStrings(features1.processedText, features2.processedText);
    if (textSim > 0.5) {
      reasons.push(`Similar wording (${Math.round(textSim * 100)}% match)`);
    }

    // Check keyword overlap
    const keywords1 = features1.keywords.map(k => k.term);
    const keywords2 = features2.keywords.map(k => k.term);
    const commonKeywords = keywords1.filter(k => keywords2.includes(k));
    if (commonKeywords.length > 0) {
      reasons.push(`Common keywords: ${commonKeywords.slice(0, 3).join(', ')}`);
    }

    // Check technology overlap
    const commonTech = features1.technologies.filter(t => features2.technologies.includes(t));
    if (commonTech.length > 0) {
      reasons.push(`Same technologies: ${commonTech.slice(0, 3).join(', ')}`);
    }

    // Check question type
    if (features1.questionType === features2.questionType && features1.questionType !== 'general') {
      reasons.push(`Same question type: ${features1.questionType}`);
    }

    return reasons;
  }

  // Auto-suggest tags based on content
  suggestTags(features, existingTags = [], maxTags = 5) {
    const suggestions = new Set();

    // Add technology tags
    features.technologies.forEach(tech => suggestions.add(tech));

    // Add top keywords as potential tags
    features.keywords.slice(0, 3).forEach(keyword => {
      if (keyword.score > 0.5) {
        suggestions.add(keyword.term);
      }
    });

    // Add question type as tag
    if (features.questionType !== 'general') {
      suggestions.add(features.questionType);
    }

    // Filter to only include existing tags or commonly used ones
    const commonTags = [
      'beginner', 'advanced', 'tutorial', 'example', 'best-practices',
      'performance', 'security', 'debugging', 'error', 'configuration'
    ];

    const filteredSuggestions = [...suggestions].filter(tag => 
      existingTags.includes(tag) || commonTags.includes(tag)
    );

    return filteredSuggestions.slice(0, maxTags);
  }

  // Detect potentially toxic content
  detectToxicity(text) {
    const toxicWords = [
      'stupid', 'dumb', 'idiot', 'moron', 'retard', 'noob',
      'suck', 'terrible', 'awful', 'garbage', 'trash'
    ];

    const lowerText = text.toLowerCase();
    const foundToxic = toxicWords.filter(word => lowerText.includes(word));
    
    return {
      isToxic: foundToxic.length > 0,
      confidence: foundToxic.length / toxicWords.length,
      detectedWords: foundToxic,
      severity: foundToxic.length > 2 ? 'high' : foundToxic.length > 0 ? 'medium' : 'low'
    };
  }

  // Detect spam content
  detectSpam(text, title = '') {
    const combinedText = `${title} ${text}`.toLowerCase();
    
    const spamIndicators = [
      // Pattern-based detection
      /(.)\1{4,}/, // Repeated characters
      /(https?:\/\/[^\s]+)/gi, // Multiple URLs
      /\b(buy|sale|discount|offer|free|win|prize)\b/gi, // Commercial terms
      /\b(click here|visit now|act now)\b/gi, // Action phrases
    ];

    let spamScore = 0;
    const foundIndicators = [];

    spamIndicators.forEach((pattern, index) => {
      const matches = combinedText.match(pattern);
      if (matches) {
        spamScore += matches.length * 0.2;
        foundIndicators.push(`Pattern ${index + 1}: ${matches.length} matches`);
      }
    });

    // Check for excessive capitalization
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.3) {
      spamScore += 0.3;
      foundIndicators.push('Excessive capitalization');
    }

    return {
      isSpam: spamScore > 0.5,
      confidence: Math.min(spamScore, 1),
      indicators: foundIndicators,
      severity: spamScore > 0.8 ? 'high' : spamScore > 0.5 ? 'medium' : 'low'
    };
  }

  // Quality scoring for answers
  scoreAnswerQuality(content) {
    if (!content || content.length < 10) {
      return { score: 0, factors: ['Content too short'] };
    }

    let score = 0;
    const factors = [];

    // Length factor (good answers are typically substantial)
    if (content.length > 100) {
      score += 0.2;
      factors.push('Substantial length');
    }

    // Code examples
    if (content.includes('```') || content.includes('`')) {
      score += 0.3;
      factors.push('Contains code examples');
    }

    // Structured content (lists, headers)
    if (content.includes('##') || content.includes('- ') || content.includes('1. ')) {
      score += 0.2;
      factors.push('Well-structured content');
    }

    // Technical depth
    const doc = compromise(content);
    const techTermCount = this.extractTechnologies(content).length;
    if (techTermCount > 2) {
      score += 0.2;
      factors.push('Technical depth');
    }

    // Explanatory content
    const explanatoryWords = ['because', 'therefore', 'however', 'example', 'specifically'];
    const explanatoryCount = explanatoryWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    
    if (explanatoryCount > 1) {
      score += 0.1;
      factors.push('Explanatory content');
    }

    return {
      score: Math.min(score, 1),
      factors,
      grade: score > 0.8 ? 'excellent' : score > 0.6 ? 'good' : score > 0.4 ? 'fair' : 'poor'
    };
  }

  // AI Answer Summarization and Key Insights Extraction
  summarizeAnswer(content, maxLength = 200) {
    if (!content || content.length < 50) {
      return {
        summary: content,
        keyInsights: [],
        actionableItems: [],
        codeSnippets: [],
        confidence: 0.3
      };
    }

    const doc = compromise(content);
    
    // Extract sentences and rank them by importance
    const sentences = doc.sentences().out('array');
    const rankedSentences = this.rankSentencesByImportance(sentences, content);
    
    // Generate summary
    const summary = this.generateSummary(rankedSentences, maxLength);
    
    // Extract key insights
    const keyInsights = this.extractKeyInsights(content, sentences);
    
    // Extract actionable items
    const actionableItems = this.extractActionableItems(content);
    
    // Extract code snippets
    const codeSnippets = this.extractCodeSnippets(content);
    
    // Calculate confidence based on content quality
    const confidence = this.calculateSummaryConfidence(content, sentences.length);

    return {
      summary,
      keyInsights,
      actionableItems,
      codeSnippets,
      confidence,
      originalLength: content.length,
      compressionRatio: summary.length / content.length
    };
  }

  // Rank sentences by importance for summarization
  rankSentencesByImportance(sentences, fullContent) {
    const keywords = this.extractKeywords(fullContent, 15);
    const keywordTerms = keywords.map(k => k.term);
    
    const rankedSentences = sentences.map(sentence => {
      let score = 0;
      const lowerSentence = sentence.toLowerCase();
      
      // Score based on keyword presence
      keywordTerms.forEach(keyword => {
        if (lowerSentence.includes(keyword)) {
          score += 2;
        }
      });
      
      // Boost score for sentences with technical terms
      const techTerms = this.extractTechnologies(sentence);
      score += techTerms.length * 1.5;
      
      // Boost score for sentences with code references
      if (sentence.includes('```') || sentence.includes('`')) {
        score += 3;
      }
      
      // Boost score for imperative sentences (instructions)
      if (lowerSentence.match(/^(use|try|make|set|add|install|run|execute|create)/)) {
        score += 2;
      }
      
      // Boost score for explanatory sentences
      if (lowerSentence.includes('because') || lowerSentence.includes('therefore') || 
          lowerSentence.includes('however') || lowerSentence.includes('example')) {
        score += 1.5;
      }
      
      // Penalize very short or very long sentences
      if (sentence.length < 30 || sentence.length > 200) {
        score -= 1;
      }
      
      return {
        sentence,
        score,
        length: sentence.length
      };
    });
    
    return rankedSentences.sort((a, b) => b.score - a.score);
  }

  // Generate summary from ranked sentences
  generateSummary(rankedSentences, maxLength) {
    let summary = '';
    let currentLength = 0;
    
    for (const item of rankedSentences) {
      if (currentLength + item.length <= maxLength) {
        summary += (summary ? ' ' : '') + item.sentence;
        currentLength += item.length;
      } else {
        break;
      }
    }
    
    // If summary is too short, add more sentences
    if (summary.length < maxLength * 0.6 && rankedSentences.length > 0) {
      for (const item of rankedSentences) {
        if (!summary.includes(item.sentence) && summary.length + item.length <= maxLength * 1.2) {
          summary += ' ' + item.sentence;
        }
      }
    }
    
    return summary.trim();
  }

  // Extract key insights from content
  extractKeyInsights(content, sentences) {
    const insights = [];
    
    // Look for definition patterns
    const definitionPatterns = [
      /(.+) is (.+)/gi,
      /(.+) refers to (.+)/gi,
      /(.+) means (.+)/gi
    ];
    
    definitionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.slice(0, 2).forEach(match => {
          insights.push({
            type: 'definition',
            content: match.trim(),
            importance: 'high'
          });
        });
      }
    });
    
    // Look for cause-effect relationships
    const causalPatterns = [
      /because (.+)/gi,
      /therefore (.+)/gi,
      /as a result (.+)/gi,
      /this causes (.+)/gi
    ];
    
    causalPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.slice(0, 2).forEach(match => {
          insights.push({
            type: 'cause-effect',
            content: match.trim(),
            importance: 'medium'
          });
        });
      }
    });
    
    // Look for best practices
    const bestPracticePatterns = [
      /best practice (.+)/gi,
      /recommended (.+)/gi,
      /should (.+)/gi,
      /avoid (.+)/gi
    ];
    
    bestPracticePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.slice(0, 2).forEach(match => {
          insights.push({
            type: 'best-practice',
            content: match.trim(),
            importance: 'high'
          });
        });
      }
    });
    
    return insights.slice(0, 5); // Limit to top 5 insights
  }

  // Extract actionable items from content
  extractActionableItems(content) {
    const actionableItems = [];
    
    // Look for imperative sentences (commands/instructions)
    const imperativePatterns = [
      /^(install|run|execute|create|add|set|configure|update|delete|remove) (.+)/gmi,
      /^(use|try|make|ensure|remember|check|verify|test) (.+)/gmi,
      /^(first|then|next|finally|lastly) (.+)/gmi
    ];
    
    imperativePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          actionableItems.push({
            type: 'instruction',
            content: match.trim(),
            priority: 'medium'
          });
        });
      }
    });
    
    // Look for numbered steps
    const stepPattern = /^\d+\.\s*(.+)/gm;
    const stepMatches = content.match(stepPattern);
    if (stepMatches) {
      stepMatches.forEach((match, index) => {
        actionableItems.push({
          type: 'step',
          content: match.trim(),
          priority: 'high',
          order: index + 1
        });
      });
    }
    
    return actionableItems.slice(0, 8); // Limit to top 8 actionable items
  }

  // Extract code snippets from content
  extractCodeSnippets(content) {
    const codeSnippets = [];
    
    // Extract code blocks
    const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockPattern.exec(content)) !== null) {
      codeSnippets.push({
        type: 'code-block',
        language: match[1] || 'unknown',
        content: match[2].trim(),
        importance: 'high'
      });
    }
    
    // Extract inline code
    const inlineCodePattern = /`([^`]+)`/g;
    while ((match = inlineCodePattern.exec(content)) !== null) {
      codeSnippets.push({
        type: 'inline-code',
        language: 'unknown',
        content: match[1].trim(),
        importance: 'medium'
      });
    }
    
    return codeSnippets.slice(0, 10); // Limit to top 10 code snippets
  }

  // Calculate confidence score for summary
  calculateSummaryConfidence(content, sentenceCount) {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence for longer content
    if (content.length > 500) confidence += 0.2;
    
    // Boost confidence for structured content
    if (content.includes('```') || content.includes('1. ') || content.includes('- ')) {
      confidence += 0.2;
    }
    
    // Boost confidence for technical content
    const techTerms = this.extractTechnologies(content);
    if (techTerms.length > 2) confidence += 0.15;
    
    // Boost confidence for explanatory content
    const explanatoryWords = ['because', 'therefore', 'however', 'example', 'specifically'];
    const explanatoryCount = explanatoryWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    if (explanatoryCount > 1) confidence += 0.1;
    
    // Penalize very short content
    if (content.length < 100) confidence -= 0.3;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  // AI Recommendation Engine
  generatePersonalizedRecommendations(userId, userActivity, allQuestions, allAnswers, maxRecommendations = 10) {
    const recommendations = {
      questions: [],
      answers: [],
      topics: [],
      users: []
    };

    // Analyze user interests from their activity
    const userInterests = this.analyzeUserInterests(userId, userActivity);
    
    // Content-based filtering for questions
    const questionRecommendations = this.recommendQuestionsByContent(
      userInterests, 
      allQuestions, 
      userId,
      Math.ceil(maxRecommendations * 0.6)
    );

    // Quality-based answer recommendations
    const answerRecommendations = this.recommendHighQualityAnswers(
      userInterests,
      allAnswers,
      allQuestions,
      userId,
      Math.ceil(maxRecommendations * 0.4)
    );

    // Topic recommendations
    const topicRecommendations = this.recommendTopics(userInterests, allQuestions);

    // User recommendations (experts to follow)
    const userRecommendations = this.recommendUsers(userInterests, allAnswers, userId);

    return {
      questions: questionRecommendations,
      answers: answerRecommendations,
      topics: topicRecommendations,
      users: userRecommendations,
      userProfile: {
        interests: userInterests,
        expertiseLevel: this.assessUserExpertise(userActivity),
        preferredTopics: userInterests.topTechnologies.slice(0, 5)
      }
    };
  }

  // Analyze user interests from their activity
  analyzeUserInterests(userId, userActivity) {
    const interests = {
      technologies: {},
      questionTypes: {},
      topics: {},
      topTechnologies: [],
      preferredComplexity: 'medium',
      activityScore: 0
    };

    // Analyze from questions asked
    userActivity.questions?.forEach(question => {
      const features = this.extractQuestionFeatures(question.title, question.description);
      if (features) {
        // Count technologies
        features.technologies.forEach(tech => {
          interests.technologies[tech] = (interests.technologies[tech] || 0) + 2;
        });

        // Count question types
        interests.questionTypes[features.questionType] = 
          (interests.questionTypes[features.questionType] || 0) + 1;

        // Count topics from keywords
        features.keywords.forEach(keyword => {
          interests.topics[keyword.term] = (interests.topics[keyword.term] || 0) + keyword.score;
        });

        interests.activityScore += 3;
      }
    });

    // Analyze from answers given
    userActivity.answers?.forEach(answer => {
      const features = this.extractQuestionFeatures('', answer.content);
      if (features) {
        features.technologies.forEach(tech => {
          interests.technologies[tech] = (interests.technologies[tech] || 0) + 1.5;
        });

        features.keywords.forEach(keyword => {
          interests.topics[keyword.term] = (interests.topics[keyword.term] || 0) + keyword.score * 0.8;
        });

        interests.activityScore += 2;
      }
    });

    // Sort technologies by interest level
    interests.topTechnologies = Object.entries(interests.technologies)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tech, score]) => ({ tech, score }));

    // Determine preferred complexity based on activity
    const totalQuestions = userActivity.questions?.length || 0;
    const totalAnswers = userActivity.answers?.length || 0;
    if (totalQuestions > 10 || totalAnswers > 15) {
      interests.preferredComplexity = 'high';
    } else if (totalQuestions > 5 || totalAnswers > 8) {
      interests.preferredComplexity = 'medium';
    } else {
      interests.preferredComplexity = 'low';
    }

    return interests;
  }

  // Recommend questions based on content similarity
  recommendQuestionsByContent(userInterests, allQuestions, userId, maxRecommendations) {
    const recommendations = [];

    for (const question of allQuestions) {
      // Skip user's own questions
      if (question.userId === userId) continue;

      const features = this.extractQuestionFeatures(question.title, question.description);
      if (!features) continue;

      let relevanceScore = 0;

      // Score based on technology matches
      features.technologies.forEach(tech => {
        const interest = userInterests.technologies[tech] || 0;
        relevanceScore += interest * 0.3;
      });

      // Score based on question type preference
      const questionTypeScore = userInterests.questionTypes[features.questionType] || 0;
      relevanceScore += questionTypeScore * 0.2;

      // Score based on complexity preference
      const complexityMatch = features.complexity === userInterests.preferredComplexity;
      if (complexityMatch) relevanceScore += 0.2;

      // Score based on topic keywords
      features.keywords.forEach(keyword => {
        const interest = userInterests.topics[keyword.term] || 0;
        relevanceScore += interest * 0.15;
      });

      // Boost score for unanswered questions
      if (question.answers === 0) relevanceScore += 0.1;

      // Boost score for recent questions
      const daysSinceCreated = (Date.now() - new Date(question.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 7) relevanceScore += 0.05;

      if (relevanceScore > 0.3) {
        recommendations.push({
          question,
          relevanceScore,
          reasons: this.getRecommendationReasons(features, userInterests)
        });
      }
    }

    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxRecommendations);
  }

  // Recommend high-quality answers
  recommendHighQualityAnswers(userInterests, allAnswers, allQuestions, userId, maxRecommendations) {
    const recommendations = [];

    for (const answer of allAnswers) {
      // Skip user's own answers
      if (answer.userId === userId) continue;

      const question = allQuestions.find(q => q.id === answer.questionId);
      if (!question) continue;

      const answerFeatures = this.extractQuestionFeatures('', answer.content);
      const questionFeatures = this.extractQuestionFeatures(question.title, question.description);
      
      if (!answerFeatures || !questionFeatures) continue;

      let relevanceScore = 0;

      // Score based on answer quality
      const qualityScore = this.scoreAnswerQuality(answer.content);
      relevanceScore += qualityScore.score * 0.4;

      // Score based on technology matches
      answerFeatures.technologies.forEach(tech => {
        const interest = userInterests.technologies[tech] || 0;
        relevanceScore += interest * 0.2;
      });

      // Score based on question relevance
      questionFeatures.technologies.forEach(tech => {
        const interest = userInterests.technologies[tech] || 0;
        relevanceScore += interest * 0.15;
      });

      // Boost accepted answers
      if (answer.isAccepted) relevanceScore += 0.1;

      // Boost highly voted answers
      if (answer.votes > 5) relevanceScore += 0.05;

      if (relevanceScore > 0.4) {
        recommendations.push({
          answer,
          question,
          relevanceScore,
          qualityGrade: qualityScore.grade,
          reasons: this.getAnswerRecommendationReasons(answerFeatures, questionFeatures, userInterests)
        });
      }
    }

    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxRecommendations);
  }

  // Recommend topics to explore
  recommendTopics(userInterests, allQuestions) {
    const topicScores = {};

    // Analyze all questions to find trending topics
    allQuestions.forEach(question => {
      const features = this.extractQuestionFeatures(question.title, question.description);
      if (features) {
        features.technologies.forEach(tech => {
          topicScores[tech] = (topicScores[tech] || 0) + 1;
        });
      }
    });

    // Find topics related to user interests but not fully explored
    const recommendations = [];
    const userTechs = Object.keys(userInterests.technologies);

    Object.entries(topicScores).forEach(([topic, popularity]) => {
      const userInterest = userInterests.technologies[topic] || 0;
      
      // Recommend topics that are:
      // 1. Popular but user hasn't explored much
      // 2. Related to user's interests
      if (popularity > 2 && userInterest < 3) {
        const relatedScore = userTechs.some(tech => 
          topic.includes(tech) || tech.includes(topic)
        ) ? 0.3 : 0;

        recommendations.push({
          topic,
          popularity,
          userInterest,
          relevanceScore: (popularity * 0.1) + relatedScore,
          reason: relatedScore > 0 ? `Related to ${userTechs.join(', ')}` : 'Trending topic'
        });
      }
    });

    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8);
  }

  // Recommend users to follow (experts)
  recommendUsers(userInterests, allAnswers, currentUserId) {
    const userScores = {};

    // Analyze answer quality and expertise by user
    allAnswers.forEach(answer => {
      if (answer.userId === currentUserId) return;

      const features = this.extractQuestionFeatures('', answer.content);
      if (!features) return;

      if (!userScores[answer.userId]) {
        userScores[answer.userId] = {
          username: answer.username,
          totalAnswers: 0,
          totalVotes: 0,
          acceptedAnswers: 0,
          technologies: {},
          avgQualityScore: 0,
          qualityScores: []
        };
      }

      const user = userScores[answer.userId];
      user.totalAnswers++;
      user.totalVotes += answer.votes;
      if (answer.isAccepted) user.acceptedAnswers++;

      // Track technologies
      features.technologies.forEach(tech => {
        user.technologies[tech] = (user.technologies[tech] || 0) + 1;
      });

      // Track quality
      const qualityScore = this.scoreAnswerQuality(answer.content);
      user.qualityScores.push(qualityScore.score);
    });

    // Calculate recommendations
    const recommendations = [];
    Object.entries(userScores).forEach(([userId, user]) => {
      if (user.totalAnswers < 3) return; // Skip users with few answers

      user.avgQualityScore = user.qualityScores.reduce((a, b) => a + b, 0) / user.qualityScores.length;
      
      let relevanceScore = 0;

      // Score based on answer quality
      relevanceScore += user.avgQualityScore * 0.3;

      // Score based on acceptance rate
      const acceptanceRate = user.acceptedAnswers / user.totalAnswers;
      relevanceScore += acceptanceRate * 0.2;

      // Score based on shared interests
      const sharedTech = Object.keys(user.technologies).filter(tech => 
        userInterests.technologies[tech] > 0
      ).length;
      relevanceScore += sharedTech * 0.1;

      // Score based on vote average
      const avgVotes = user.totalVotes / user.totalAnswers;
      relevanceScore += Math.min(avgVotes * 0.05, 0.2);

      if (relevanceScore > 0.3) {
        recommendations.push({
          userId,
          username: user.username,
          relevanceScore,
          stats: {
            totalAnswers: user.totalAnswers,
            acceptanceRate: Math.round(acceptanceRate * 100),
            avgQualityScore: Math.round(user.avgQualityScore * 100),
            avgVotes: Math.round(avgVotes * 10) / 10,
            topTechnologies: Object.entries(user.technologies)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3)
              .map(([tech]) => tech)
          }
        });
      }
    });

    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  }

  // Get recommendation reasons
  getRecommendationReasons(features, userInterests) {
    const reasons = [];

    // Technology matches
    const matchedTechs = features.technologies.filter(tech => 
      userInterests.technologies[tech] > 0
    );
    if (matchedTechs.length > 0) {
      reasons.push(`Matches your interest in ${matchedTechs.slice(0, 2).join(', ')}`);
    }

    // Question type match
    if (userInterests.questionTypes[features.questionType] > 0) {
      reasons.push(`${features.questionType} questions interest you`);
    }

    // Complexity match
    if (features.complexity === userInterests.preferredComplexity) {
      reasons.push(`Matches your preferred complexity level`);
    }

    return reasons;
  }

  // Get answer recommendation reasons
  getAnswerRecommendationReasons(answerFeatures, questionFeatures, userInterests) {
    const reasons = [];

    // Technology matches
    const matchedTechs = [...answerFeatures.technologies, ...questionFeatures.technologies]
      .filter(tech => userInterests.technologies[tech] > 0);
    
    if (matchedTechs.length > 0) {
      reasons.push(`Covers ${[...new Set(matchedTechs)].slice(0, 2).join(', ')}`);
    }

    // Quality indicators
    if (answerFeatures.technologies.length > 2) {
      reasons.push('Technical depth');
    }

    return reasons;
  }

  // Assess user expertise level
  assessUserExpertise(userActivity) {
    const totalQuestions = userActivity.questions?.length || 0;
    const totalAnswers = userActivity.answers?.length || 0;
    const totalVotes = userActivity.answers?.reduce((sum, answer) => sum + answer.votes, 0) || 0;
    const acceptedAnswers = userActivity.answers?.filter(answer => answer.isAccepted).length || 0;

    const expertiseScore = (totalAnswers * 2) + (totalVotes * 0.5) + (acceptedAnswers * 3) + (totalQuestions * 0.5);

    if (expertiseScore > 50) return 'expert';
    if (expertiseScore > 20) return 'intermediate';
    if (expertiseScore > 5) return 'beginner';
    return 'new';
  }

  // AI Smart Flagging System
  intelligentContentFlagging(content, title = '', author = '', context = {}) {
    const flags = [];
    let overallRiskScore = 0;
    const flagReasons = [];

    // Enhanced toxicity detection
    const toxicityResult = this.detectToxicity(content);
    if (toxicityResult.isToxic) {
      const flag = {
        type: 'toxicity',
        severity: toxicityResult.severity,
        confidence: toxicityResult.confidence,
        details: toxicityResult.detectedWords,
        suggestedAction: toxicityResult.severity === 'high' ? 'remove' : 'review',
        priority: toxicityResult.severity === 'high' ? 'urgent' : 'medium'
      };
      flags.push(flag);
      overallRiskScore += toxicityResult.confidence * 0.8;
      flagReasons.push(`Toxic content detected: ${toxicityResult.detectedWords.join(', ')}`);
    }

    // Enhanced spam detection
    const spamResult = this.detectSpam(content, title);
    if (spamResult.isSpam) {
      const flag = {
        type: 'spam',
        severity: spamResult.severity,
        confidence: spamResult.confidence,
        details: spamResult.indicators,
        suggestedAction: spamResult.severity === 'high' ? 'remove' : 'review',
        priority: spamResult.severity === 'high' ? 'urgent' : 'low'
      };
      flags.push(flag);
      overallRiskScore += spamResult.confidence * 0.6;
      flagReasons.push(`Spam indicators found: ${spamResult.indicators.join(', ')}`);
    }

    // Quality-based flagging
    const qualityResult = this.flagLowQualityContent(content, title);
    if (qualityResult.shouldFlag) {
      flags.push(qualityResult.flag);
      overallRiskScore += qualityResult.flag.confidence * 0.4;
      flagReasons.push(`Low quality content: ${qualityResult.flag.details.join(', ')}`);
    }

    // Plagiarism detection
    const plagiarismResult = this.detectPotentialPlagiarism(content);
    if (plagiarismResult.suspicious) {
      flags.push(plagiarismResult.flag);
      overallRiskScore += plagiarismResult.flag.confidence * 0.7;
      flagReasons.push(`Potential plagiarism detected`);
    }

    // Off-topic detection
    const offTopicResult = this.detectOffTopicContent(content, title, context);
    if (offTopicResult.isOffTopic) {
      flags.push(offTopicResult.flag);
      overallRiskScore += offTopicResult.flag.confidence * 0.3;
      flagReasons.push(`Off-topic content detected`);
    }

    // Sockpuppet detection
    const sockpuppetResult = this.detectSockpuppetActivity(author, content, context);
    if (sockpuppetResult.suspicious) {
      flags.push(sockpuppetResult.flag);
      overallRiskScore += sockpuppetResult.flag.confidence * 0.5;
      flagReasons.push(`Suspicious user activity pattern`);
    }

    // Determine overall recommendation
    const recommendation = this.getModeratorRecommendation(flags, overallRiskScore);

    return {
      flags,
      overallRiskScore: Math.min(overallRiskScore, 1),
      flagReasons,
      recommendation,
      requiresReview: flags.length > 0 || overallRiskScore > 0.3,
      priority: this.calculateFlagPriority(flags),
      suggestedActions: this.getSuggestedActions(flags, overallRiskScore)
    };
  }

  // Flag low-quality content
  flagLowQualityContent(content, title = '') {
    const issues = [];
    let confidenceScore = 0;

    // Check for very short content
    if (content.length < 20) {
      issues.push('Content too short');
      confidenceScore += 0.4;
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.5) {
      issues.push('Excessive capitalization');
      confidenceScore += 0.3;
    }

    // Check for lack of punctuation
    const punctuationCount = (content.match(/[.,!?;:]/g) || []).length;
    if (punctuationCount === 0 && content.length > 50) {
      issues.push('No punctuation');
      confidenceScore += 0.2;
    }

    // Check for repetitive patterns
    const repetitivePattern = /(.{3,})\1{3,}/g;
    if (repetitivePattern.test(content)) {
      issues.push('Repetitive content');
      confidenceScore += 0.3;
    }

    // Check for gibberish (high consonant-to-vowel ratio)
    const consonants = (content.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
    const vowels = (content.match(/[aeiou]/gi) || []).length;
    if (consonants > vowels * 3 && content.length > 20) {
      issues.push('Potential gibberish');
      confidenceScore += 0.4;
    }

    const shouldFlag = issues.length > 1 || confidenceScore > 0.5;

    return {
      shouldFlag,
      flag: shouldFlag ? {
        type: 'quality',
        severity: confidenceScore > 0.7 ? 'high' : 'medium',
        confidence: confidenceScore,
        details: issues,
        suggestedAction: 'review',
        priority: 'low'
      } : null
    };
  }

  // Detect potential plagiarism
  detectPotentialPlagiarism(content) {
    const suspiciousPatterns = [
      // Copy-paste indicators
      /copied? from/i,
      /source:? http/i,
      /originally posted/i,
      /credit:? /i,
      
      // Formatting inconsistencies
      /[""'']/g, // Smart quotes mixed with regular quotes
      /\u00A0/g, // Non-breaking spaces
    ];

    let suspicionScore = 0;
    const indicators = [];

    suspiciousPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        suspicionScore += 0.2;
        indicators.push(`Pattern ${index + 1} detected`);
      }
    });

    // Check for sudden style changes
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 3) {
      const avgWordsPerSentence = sentences.map(s => s.split(' ').length);
      const variance = this.calculateVariance(avgWordsPerSentence);
      if (variance > 50) {
        suspicionScore += 0.3;
        indicators.push('Inconsistent writing style');
      }
    }

    const suspicious = suspicionScore > 0.3;

    return {
      suspicious,
      flag: suspicious ? {
        type: 'plagiarism',
        severity: suspicionScore > 0.6 ? 'high' : 'medium',
        confidence: suspicionScore,
        details: indicators,
        suggestedAction: 'review',
        priority: 'medium'
      } : null
    };
  }

  // Detect off-topic content
  detectOffTopicContent(content, title, context) {
    if (!context.expectedTopics || context.expectedTopics.length === 0) {
      return { isOffTopic: false };
    }

    const contentFeatures = this.extractQuestionFeatures(title, content);
    if (!contentFeatures) {
      return { isOffTopic: false };
    }

    const contentTopics = [
      ...contentFeatures.technologies,
      ...contentFeatures.keywords.map(k => k.term)
    ];

    const topicOverlap = contentTopics.filter(topic => 
      context.expectedTopics.some(expected => 
        expected.toLowerCase().includes(topic.toLowerCase()) ||
        topic.toLowerCase().includes(expected.toLowerCase())
      )
    );

    const relevanceScore = topicOverlap.length / Math.max(contentTopics.length, 1);
    const isOffTopic = relevanceScore < 0.2 && contentTopics.length > 3;

    return {
      isOffTopic,
      flag: isOffTopic ? {
        type: 'off-topic',
        severity: 'medium',
        confidence: 1 - relevanceScore,
        details: [`Low topic relevance: ${Math.round(relevanceScore * 100)}%`],
        suggestedAction: 'review',
        priority: 'low'
      } : null
    };
  }

  // Detect sockpuppet activity
  detectSockpuppetActivity(author, content, context) {
    if (!context.userHistory) {
      return { suspicious: false };
    }

    const suspiciousIndicators = [];
    let suspicionScore = 0;

    // Check for immediate self-answering
    if (context.userHistory.recentActivity) {
      const recentQuestions = context.userHistory.recentActivity.questions || [];
      const recentAnswers = context.userHistory.recentActivity.answers || [];
      
      const selfAnswers = recentAnswers.filter(answer => 
        recentQuestions.some(q => q.id === answer.questionId)
      );

      if (selfAnswers.length > 0) {
        suspicionScore += 0.3;
        suspiciousIndicators.push('Self-answering pattern detected');
      }
    }

    // Check for new account with sophisticated knowledge
    if (context.userHistory.accountAge && context.userHistory.accountAge < 7) {
      const qualityScore = this.scoreAnswerQuality(content);
      if (qualityScore.score > 0.8) {
        suspicionScore += 0.2;
        suspiciousIndicators.push('New account with expert-level content');
      }
    }

    // Check for unusual voting patterns
    if (context.userHistory.votingPattern) {
      const { upvotes, downvotes } = context.userHistory.votingPattern;
      const ratio = upvotes / Math.max(downvotes, 1);
      if (ratio > 10 || ratio < 0.1) {
        suspicionScore += 0.2;
        suspiciousIndicators.push('Unusual voting pattern');
      }
    }

    const suspicious = suspicionScore > 0.4;

    return {
      suspicious,
      flag: suspicious ? {
        type: 'sockpuppet',
        severity: suspicionScore > 0.6 ? 'high' : 'medium',
        confidence: suspicionScore,
        details: suspiciousIndicators,
        suggestedAction: 'investigate',
        priority: 'high'
      } : null
    };
  }

  // Get moderator recommendation
  getModeratorRecommendation(flags, overallRiskScore) {
    const highSeverityFlags = flags.filter(f => f.severity === 'high');
    const urgentFlags = flags.filter(f => f.priority === 'urgent');

    if (urgentFlags.length > 0) {
      return {
        action: 'immediate_review',
        reason: 'Urgent flags detected',
        timeframe: 'immediate'
      };
    }

    if (highSeverityFlags.length > 0) {
      return {
        action: 'priority_review',
        reason: 'High severity flags present',
        timeframe: 'within_hour'
      };
    }

    if (overallRiskScore > 0.7) {
      return {
        action: 'review',
        reason: 'High overall risk score',
        timeframe: 'within_day'
      };
    }

    if (flags.length > 0) {
      return {
        action: 'queue_review',
        reason: 'Multiple flags detected',
        timeframe: 'within_week'
      };
    }

    return {
      action: 'no_action',
      reason: 'No significant flags detected',
      timeframe: 'none'
    };
  }

  // Calculate flag priority
  calculateFlagPriority(flags) {
    const priorities = flags.map(f => f.priority);
    
    if (priorities.includes('urgent')) return 'urgent';
    if (priorities.includes('high')) return 'high';
    if (priorities.includes('medium')) return 'medium';
    return 'low';
  }

  // Get suggested actions
  getSuggestedActions(flags, overallRiskScore) {
    const actions = [];

    flags.forEach(flag => {
      switch (flag.type) {
        case 'toxicity':
          actions.push(flag.severity === 'high' ? 'Remove content immediately' : 'Edit/warn user');
          break;
        case 'spam':
          actions.push('Check user post history');
          actions.push('Consider temporary restrictions');
          break;
        case 'quality':
          actions.push('Request content improvement');
          actions.push('Provide writing guidelines');
          break;
        case 'plagiarism':
          actions.push('Verify original source');
          actions.push('Request proper attribution');
          break;
        case 'off-topic':
          actions.push('Suggest appropriate community');
          actions.push('Add relevant tags');
          break;
        case 'sockpuppet':
          actions.push('Investigate user accounts');
          actions.push('Check IP/device fingerprints');
          break;
      }
    });

    return [...new Set(actions)];
  }

  // Calculate variance helper function
  calculateVariance(numbers) {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  // Batch content analysis
  batchAnalyzeContent(contentItems) {
    return contentItems.map(item => ({
      id: item.id,
      flagging: this.intelligentContentFlagging(
        item.content,
        item.title,
        item.author,
        item.context
      ),
      timestamp: new Date().toISOString()
    }));
  }

  // Generate flagging insights
  generateFlaggingInsights(flaggingHistory) {
    const insights = {
      totalFlags: flaggingHistory.length,
      flagTypes: {},
      trends: {},
      accuracyMetrics: {}
    };

    // Count flag types
    flaggingHistory.forEach(item => {
      item.flagging.flags.forEach(flag => {
        insights.flagTypes[flag.type] = (insights.flagTypes[flag.type] || 0) + 1;
      });
    });

    // Calculate accuracy if feedback is available
    const itemsWithFeedback = flaggingHistory.filter(item => item.moderatorFeedback);
    if (itemsWithFeedback.length > 0) {
      const correctFlags = itemsWithFeedback.filter(item => 
        item.moderatorFeedback.action !== 'no_action'
      ).length;
      insights.accuracyMetrics.precision = correctFlags / itemsWithFeedback.length;
    }

    return insights;
  }

  // AI Topic Extraction and Clustering
  extractTopicsFromContent(contentItems, options = {}) {
    const {
      minTopicFrequency = 2,
      maxTopics = 50,
      clusterSimilarTopics = true,
      timeBasedAnalysis = false
    } = options;

    const topicFrequency = {};
    const topicClusters = {};
    const topicRelationships = {};
    const temporalTopics = {};

    // Extract topics from all content
    contentItems.forEach(item => {
      const features = this.extractQuestionFeatures(item.title || '', item.content || '');
      if (!features) return;

      const itemTopics = [
        ...features.technologies,
        ...features.keywords.map(k => k.term),
        ...features.topics
      ];

      const timeKey = timeBasedAnalysis ? this.getTimeKey(item.createdAt) : 'all';
      if (!temporalTopics[timeKey]) {
        temporalTopics[timeKey] = {};
      }

      itemTopics.forEach(topic => {
        if (topic && topic.length > 2) {
          // Global frequency
          topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
          
          // Temporal frequency
          temporalTopics[timeKey][topic] = (temporalTopics[timeKey][topic] || 0) + 1;
          
          // Topic relationships (co-occurrence)
          itemTopics.forEach(otherTopic => {
            if (topic !== otherTopic && otherTopic.length > 2) {
              const key = [topic, otherTopic].sort().join('|');
              topicRelationships[key] = (topicRelationships[key] || 0) + 1;
            }
          });
        }
      });
    });

    // Filter topics by frequency
    const filteredTopics = Object.entries(topicFrequency)
      .filter(([topic, freq]) => freq >= minTopicFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxTopics);

    // Cluster similar topics
    const clusters = clusterSimilarTopics ? 
      this.clusterSimilarTopics(filteredTopics.map(([topic]) => topic)) : 
      null;

    // Generate topic hierarchy
    const hierarchy = this.generateTopicHierarchy(filteredTopics);

    // Calculate topic trends
    const trends = this.analyzeTopicTrends(temporalTopics);

    return {
      topics: filteredTopics.map(([topic, frequency]) => ({
        topic,
        frequency,
        percentage: Math.round((frequency / contentItems.length) * 100),
        cluster: clusters ? this.findTopicCluster(topic, clusters) : null,
        category: this.categorizeTopicType(topic),
        trends: trends[topic] || null
      })),
      clusters: clusters || {},
      hierarchy,
      relationships: this.buildTopicRelationshipNetwork(topicRelationships),
      temporalAnalysis: temporalTopics,
      insights: this.generateTopicInsights(filteredTopics, trends, clusters)
    };
  }

  // Cluster similar topics using string similarity
  clusterSimilarTopics(topics, similarityThreshold = 0.7) {
    const clusters = {};
    const processed = new Set();
    let clusterIndex = 0;

    topics.forEach(topic => {
      if (processed.has(topic)) return;

      const clusterName = `cluster_${clusterIndex++}`;
      clusters[clusterName] = {
        name: this.generateClusterName([topic]),
        topics: [topic],
        representative: topic
      };

      processed.add(topic);

      // Find similar topics
      topics.forEach(otherTopic => {
        if (processed.has(otherTopic) || topic === otherTopic) return;

        const similarity = stringSimilarity.compareTwoStrings(topic, otherTopic);
        if (similarity >= similarityThreshold) {
          clusters[clusterName].topics.push(otherTopic);
          processed.add(otherTopic);
        }
      });

      // Update cluster name based on all topics
      if (clusters[clusterName].topics.length > 1) {
        clusters[clusterName].name = this.generateClusterName(clusters[clusterName].topics);
      }
    });

    return clusters;
  }

  // Generate cluster name from topics
  generateClusterName(topics) {
    if (topics.length === 1) return topics[0];
    
    // Find common words or patterns
    const commonWords = this.findCommonWords(topics);
    if (commonWords.length > 0) {
      return commonWords.join(' ');
    }
    
    // Use the most representative topic
    return topics.sort((a, b) => b.length - a.length)[0];
  }

  // Find common words across topics
  findCommonWords(topics) {
    const wordSets = topics.map(topic => 
      new Set(topic.toLowerCase().split(/[\s-_\.]/))
    );
    
    if (wordSets.length === 0) return [];
    
    let commonWords = wordSets[0];
    wordSets.slice(1).forEach(wordSet => {
      commonWords = new Set([...commonWords].filter(word => wordSet.has(word)));
    });
    
    return Array.from(commonWords).filter(word => word.length > 2);
  }

  // Generate topic hierarchy
  generateTopicHierarchy(topicFrequencies) {
    const hierarchy = {
      root: {
        name: 'All Topics',
        children: {},
        frequency: topicFrequencies.reduce((sum, [, freq]) => sum + freq, 0)
      }
    };

    topicFrequencies.forEach(([topic, frequency]) => {
      const category = this.categorizeTopicType(topic);
      
      if (!hierarchy.root.children[category]) {
        hierarchy.root.children[category] = {
          name: category,
          children: {},
          frequency: 0
        };
      }
      
      hierarchy.root.children[category].children[topic] = {
        name: topic,
        frequency,
        isLeaf: true
      };
      
      hierarchy.root.children[category].frequency += frequency;
    });

    return hierarchy;
  }

  // Categorize topic type
  categorizeTopicType(topic) {
    const categories = {
      'Programming Languages': ['javascript', 'python', 'java', 'react', 'node', 'typescript', 'php', 'ruby', 'go', 'rust'],
      'Frameworks & Libraries': ['express', 'django', 'flask', 'spring', 'laravel', 'rails', 'angular', 'vue', 'nextjs'],
      'Databases': ['mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'firebase', 'database'],
      'Cloud & DevOps': ['aws', 'azure', 'docker', 'kubernetes', 'jenkins', 'cloud', 'deployment'],
      'Web Development': ['html', 'css', 'frontend', 'backend', 'api', 'rest', 'graphql'],
      'Data Science': ['machine learning', 'ai', 'data', 'algorithm', 'analytics', 'model'],
      'Security': ['security', 'authentication', 'authorization', 'encryption', 'vulnerability'],
      'Performance': ['performance', 'optimization', 'speed', 'memory', 'scalability'],
      'Testing': ['testing', 'unit test', 'integration', 'debugging', 'quality'],
      'General': ['programming', 'development', 'coding', 'software', 'application']
    };

    const lowerTopic = topic.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerTopic.includes(keyword) || keyword.includes(lowerTopic))) {
        return category;
      }
    }
    
    return 'Other';
  }

  // Analyze topic trends over time
  analyzeTopicTrends(temporalTopics) {
    const trends = {};
    const timeKeys = Object.keys(temporalTopics).sort();
    
    if (timeKeys.length < 2) return trends;

    Object.keys(temporalTopics[timeKeys[0]] || {}).forEach(topic => {
      const frequencies = timeKeys.map(timeKey => temporalTopics[timeKey][topic] || 0);
      
      if (frequencies.some(freq => freq > 0)) {
        trends[topic] = {
          frequencies,
          trend: this.calculateTrend(frequencies),
          volatility: this.calculateVolatility(frequencies),
          peak: Math.max(...frequencies),
          latest: frequencies[frequencies.length - 1] || 0
        };
      }
    });

    return trends;
  }

  // Calculate trend direction
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const middle = values[Math.floor(values.length / 2)];
    
    if (last > first * 1.5) return 'rising';
    if (last < first * 0.5) return 'declining';
    if (Math.abs(last - first) / first < 0.2) return 'stable';
    
    return 'fluctuating';
  }

  // Calculate volatility
  calculateVolatility(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }

  // Build topic relationship network
  buildTopicRelationshipNetwork(topicRelationships) {
    const network = {
      nodes: {},
      edges: []
    };

    // Process relationships
    Object.entries(topicRelationships).forEach(([key, strength]) => {
      const [topic1, topic2] = key.split('|');
      
      // Add nodes
      if (!network.nodes[topic1]) {
        network.nodes[topic1] = {
          id: topic1,
          label: topic1,
          connections: 0,
          strength: 0
        };
      }
      
      if (!network.nodes[topic2]) {
        network.nodes[topic2] = {
          id: topic2,
          label: topic2,
          connections: 0,
          strength: 0
        };
      }

      // Add edge
      network.edges.push({
        from: topic1,
        to: topic2,
        weight: strength,
        label: `${strength} co-occurrences`
      });

      // Update node statistics
      network.nodes[topic1].connections++;
      network.nodes[topic1].strength += strength;
      network.nodes[topic2].connections++;
      network.nodes[topic2].strength += strength;
    });

    // Sort edges by weight
    network.edges.sort((a, b) => b.weight - a.weight);

    return network;
  }

  // Generate topic insights
  generateTopicInsights(topicFrequencies, trends, clusters) {
    const insights = [];

    // Most popular topics
    const topTopics = topicFrequencies.slice(0, 5).map(([topic]) => topic);
    insights.push(`Most discussed topics: ${topTopics.join(', ')}`);

    // Trending topics
    if (trends) {
      const risingTopics = Object.entries(trends)
        .filter(([, trend]) => trend.trend === 'rising')
        .sort(([,a], [,b]) => b.latest - a.latest)
        .slice(0, 3)
        .map(([topic]) => topic);
      
      if (risingTopics.length > 0) {
        insights.push(`Rising topics: ${risingTopics.join(', ')}`);
      }
    }

    // Cluster analysis
    if (clusters) {
      const clusterCount = Object.keys(clusters).length;
      const avgClusterSize = Object.values(clusters).reduce((sum, cluster) => sum + cluster.topics.length, 0) / clusterCount;
      insights.push(`Found ${clusterCount} topic clusters with average size ${Math.round(avgClusterSize)}`);
    }

    // Topic diversity
    const categories = [...new Set(topicFrequencies.map(([topic]) => this.categorizeTopicType(topic)))];
    insights.push(`Topic diversity: ${categories.length} categories covered`);

    return insights;
  }

  // Find which cluster a topic belongs to
  findTopicCluster(topic, clusters) {
    for (const [clusterName, cluster] of Object.entries(clusters)) {
      if (cluster.topics.includes(topic)) {
        return clusterName;
      }
    }
    return null;
  }

  // Get time key for temporal analysis
  getTimeKey(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  // Topic-based content organization
  organizeContentByTopics(contentItems, extractedTopics) {
    const organization = {};
    
    extractedTopics.topics.forEach(({ topic }) => {
      organization[topic] = {
        topic,
        content: [],
        totalItems: 0,
        avgQuality: 0
      };
    });

    contentItems.forEach(item => {
      const features = this.extractQuestionFeatures(item.title || '', item.content || '');
      if (!features) return;

      const itemTopics = [
        ...features.technologies,
        ...features.keywords.map(k => k.term),
        ...features.topics
      ];

      itemTopics.forEach(topic => {
        if (organization[topic]) {
          organization[topic].content.push(item);
          organization[topic].totalItems++;
          
          // Calculate quality if it's an answer
          if (item.content && item.content.length > 50) {
            const quality = this.scoreAnswerQuality(item.content);
            organization[topic].avgQuality = (organization[topic].avgQuality || 0) + quality.score;
          }
        }
      });
    });

    // Calculate average quality
    Object.values(organization).forEach(topicData => {
      if (topicData.totalItems > 0) {
        topicData.avgQuality = topicData.avgQuality / topicData.totalItems;
      }
    });

    return organization;
  }

  // Topic recommendation for new content
  recommendTopicsForContent(title, content, existingTopics) {
    const features = this.extractQuestionFeatures(title, content);
    if (!features) return [];

    const contentTopics = [
      ...features.technologies,
      ...features.keywords.map(k => k.term)
    ];

    // Find similar existing topics
    const recommendations = [];
    
    existingTopics.forEach(({ topic, frequency }) => {
      contentTopics.forEach(contentTopic => {
        const similarity = stringSimilarity.compareTwoStrings(topic, contentTopic);
        if (similarity > 0.6) {
          recommendations.push({
            topic,
            similarity,
            frequency,
            reason: `Similar to "${contentTopic}" (${Math.round(similarity * 100)}% match)`
          });
        }
      });
    });

    // Sort by similarity and frequency
    return recommendations
      .sort((a, b) => (b.similarity * 0.7 + b.frequency * 0.3) - (a.similarity * 0.7 + a.frequency * 0.3))
      .slice(0, 10);
  }

  // AI Duplicate Question Merger
  detectDuplicateQuestions(questions, options = {}) {
    const {
      similarityThreshold = 0.8,
      maxCandidates = 5,
      considerAnswers = true,
      strictMode = false
    } = options;

    const duplicateGroups = [];
    const processed = new Set();
    const duplicatePairs = [];

    // Find potential duplicates
    for (let i = 0; i < questions.length; i++) {
      if (processed.has(questions[i].id)) continue;

      const baseQuestion = questions[i];
      const baseFeatures = this.extractQuestionFeatures(baseQuestion.title, baseQuestion.description);
      
      if (!baseFeatures) continue;

      const candidates = [];
      
      for (let j = i + 1; j < questions.length; j++) {
        if (processed.has(questions[j].id)) continue;

        const candidateQuestion = questions[j];
        const candidateFeatures = this.extractQuestionFeatures(candidateQuestion.title, candidateQuestion.description);
        
        if (!candidateFeatures) continue;

        const similarity = this.calculateDuplicateSimilarity(baseFeatures, candidateFeatures, strictMode);
        
        if (similarity >= similarityThreshold) {
          candidates.push({
            question: candidateQuestion,
            similarity,
            features: candidateFeatures,
            reasons: this.getDuplicateReasons(baseFeatures, candidateFeatures, similarity)
          });
        }
      }

      if (candidates.length > 0) {
        // Sort by similarity
        candidates.sort((a, b) => b.similarity - a.similarity);
        
        const group = {
          primary: baseQuestion,
          primaryFeatures: baseFeatures,
          duplicates: candidates.slice(0, maxCandidates),
          confidence: this.calculateGroupConfidence(baseFeatures, candidates),
          mergeStrategy: this.suggestMergeStrategy(baseQuestion, candidates, considerAnswers)
        };

        duplicateGroups.push(group);
        
        // Mark all questions in this group as processed
        processed.add(baseQuestion.id);
        candidates.forEach(candidate => processed.add(candidate.question.id));

        // Add pairs for detailed analysis
        candidates.forEach(candidate => {
          duplicatePairs.push({
            question1: baseQuestion,
            question2: candidate.question,
            similarity: candidate.similarity,
            reasons: candidate.reasons,
            mergeRecommendation: this.getMergeRecommendation(baseQuestion, candidate.question, candidate.similarity)
          });
        });
      }
    }

    return {
      duplicateGroups,
      duplicatePairs,
      summary: {
        totalQuestions: questions.length,
        duplicateGroups: duplicateGroups.length,
        totalDuplicates: duplicatePairs.length,
        avgGroupSize: duplicateGroups.reduce((sum, group) => sum + group.duplicates.length + 1, 0) / Math.max(duplicateGroups.length, 1)
      }
    };
  }

  // Calculate similarity specifically for duplicate detection
  calculateDuplicateSimilarity(features1, features2, strictMode = false) {
    let similarity = 0;
    let weights = 0;

    // Title similarity (most important for duplicates)
    const titleSim = stringSimilarity.compareTwoStrings(
      features1.originalText.split(' ').slice(0, 10).join(' '),
      features2.originalText.split(' ').slice(0, 10).join(' ')
    );
    similarity += titleSim * 0.5;
    weights += 0.5;

    // Content similarity
    const contentSim = stringSimilarity.compareTwoStrings(
      features1.processedText,
      features2.processedText
    );
    similarity += contentSim * 0.3;
    weights += 0.3;

    // Technology overlap (high weight for duplicates)
    const techSim = this.calculateArraySimilarity(features1.technologies, features2.technologies);
    similarity += techSim * 0.15;
    weights += 0.15;

    // Question type must match for strict duplicates
    if (strictMode && features1.questionType !== features2.questionType) {
      return 0;
    }

    const typeSim = features1.questionType === features2.questionType ? 1 : 0;
    similarity += typeSim * 0.05;
    weights += 0.05;

    return weights > 0 ? similarity / weights : 0;
  }

  // Get reasons why questions are considered duplicates
  getDuplicateReasons(features1, features2, similarity) {
    const reasons = [];

    // Title similarity
    const titleSim = stringSimilarity.compareTwoStrings(
      features1.originalText.split(' ').slice(0, 10).join(' '),
      features2.originalText.split(' ').slice(0, 10).join(' ')
    );
    if (titleSim > 0.7) {
      reasons.push(`Very similar titles (${Math.round(titleSim * 100)}% match)`);
    }

    // Technology overlap
    const commonTech = features1.technologies.filter(tech => features2.technologies.includes(tech));
    if (commonTech.length > 0) {
      reasons.push(`Same technologies: ${commonTech.join(', ')}`);
    }

    // Keywords overlap
    const keywords1 = features1.keywords.map(k => k.term);
    const keywords2 = features2.keywords.map(k => k.term);
    const commonKeywords = keywords1.filter(k => keywords2.includes(k));
    if (commonKeywords.length > 2) {
      reasons.push(`Common keywords: ${commonKeywords.slice(0, 3).join(', ')}`);
    }

    // Same question type
    if (features1.questionType === features2.questionType && features1.questionType !== 'general') {
      reasons.push(`Same question type: ${features1.questionType}`);
    }

    // Content patterns
    const contentSim = stringSimilarity.compareTwoStrings(features1.processedText, features2.processedText);
    if (contentSim > 0.6) {
      reasons.push(`Similar content structure (${Math.round(contentSim * 100)}% match)`);
    }

    return reasons;
  }

  // Calculate confidence for duplicate group
  calculateGroupConfidence(primaryFeatures, candidates) {
    if (candidates.length === 0) return 0;

    const avgSimilarity = candidates.reduce((sum, candidate) => sum + candidate.similarity, 0) / candidates.length;
    const consistencyScore = this.calculateGroupConsistency(primaryFeatures, candidates);
    
    return (avgSimilarity * 0.7 + consistencyScore * 0.3);
  }

  // Calculate how consistent duplicates are with each other
  calculateGroupConsistency(primaryFeatures, candidates) {
    if (candidates.length < 2) return 1;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const sim = this.calculateDuplicateSimilarity(
          candidates[i].features,
          candidates[j].features
        );
        totalSimilarity += sim;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 1;
  }

  // Suggest merge strategy for duplicate group
  suggestMergeStrategy(primaryQuestion, candidates, considerAnswers = true) {
    const strategies = [];

    // Determine primary question (most votes, answers, or recent)
    let bestQuestion = primaryQuestion;
    let bestScore = this.calculateQuestionScore(primaryQuestion);

    candidates.forEach(candidate => {
      const score = this.calculateQuestionScore(candidate.question);
      if (score > bestScore) {
        bestQuestion = candidate.question;
        bestScore = score;
      }
    });

    // Content merge strategy
    if (primaryQuestion.description.length > 100 && candidates.some(c => c.question.description.length > 100)) {
      strategies.push({
        type: 'content_merge',
        description: 'Merge question descriptions to preserve all information',
        primary: bestQuestion.id,
        action: 'combine_descriptions'
      });
    } else {
      strategies.push({
        type: 'simple_merge',
        description: 'Keep the best question and redirect others',
        primary: bestQuestion.id,
        action: 'redirect_to_primary'
      });
    }

    // Answer consolidation strategy
    if (considerAnswers) {
      strategies.push({
        type: 'answer_consolidation',
        description: 'Move all answers to the primary question',
        primary: bestQuestion.id,
        action: 'consolidate_answers'
      });
    }

    // Tag merge strategy
    const allTags = new Set([
      ...primaryQuestion.tags,
      ...candidates.flatMap(c => c.question.tags)
    ]);
    
    if (allTags.size > primaryQuestion.tags.length) {
      strategies.push({
        type: 'tag_merge',
        description: 'Combine tags from all duplicate questions',
        primary: bestQuestion.id,
        action: 'merge_tags',
        newTags: Array.from(allTags)
      });
    }

    return {
      recommended: strategies[0],
      alternatives: strategies.slice(1),
      primaryQuestion: bestQuestion,
      preserveMetadata: true
    };
  }

  // Calculate score for question to determine best candidate
  calculateQuestionScore(question) {
    let score = 0;
    
    // Votes weight
    score += question.votes * 10;
    
    // Answer count weight
    score += question.answers * 5;
    
    // Has accepted answer
    if (question.acceptedAnswerId) {
      score += 20;
    }
    
    // Question length (more detailed questions preferred)
    if (question.description && question.description.length > 100) {
      score += 10;
    }
    
    // Recency bonus (newer questions get slight bonus)
    const daysSinceCreated = (Date.now() - new Date(question.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 30) {
      score += 5;
    }
    
    return score;
  }

  // Get merge recommendation for a specific pair
  getMergeRecommendation(question1, question2, similarity) {
    const score1 = this.calculateQuestionScore(question1);
    const score2 = this.calculateQuestionScore(question2);
    
    const primary = score1 >= score2 ? question1 : question2;
    const secondary = score1 >= score2 ? question2 : question1;
    
    let recommendation = 'review';
    let confidence = 'medium';
    
    if (similarity > 0.9) {
      recommendation = 'auto_merge';
      confidence = 'high';
    } else if (similarity > 0.85) {
      recommendation = 'merge';
      confidence = 'high';
    } else if (similarity > 0.75) {
      recommendation = 'review';
      confidence = 'medium';
    } else {
      recommendation = 'no_action';
      confidence = 'low';
    }
    
    return {
      action: recommendation,
      confidence,
      primary: primary.id,
      secondary: secondary.id,
      reasoning: this.getMergeReasoning(question1, question2, similarity, recommendation)
    };
  }

  // Get reasoning for merge recommendation
  getMergeReasoning(question1, question2, similarity, recommendation) {
    const reasons = [];
    
    if (similarity > 0.9) {
      reasons.push('Questions are nearly identical');
    }
    
    if (question1.votes > question2.votes * 2) {
      reasons.push('Question 1 has significantly more votes');
    } else if (question2.votes > question1.votes * 2) {
      reasons.push('Question 2 has significantly more votes');
    }
    
    if (question1.answers > question2.answers) {
      reasons.push('Question 1 has more answers');
    } else if (question2.answers > question1.answers) {
      reasons.push('Question 2 has more answers');
    }
    
    if (question1.acceptedAnswerId && !question2.acceptedAnswerId) {
      reasons.push('Question 1 has an accepted answer');
    } else if (question2.acceptedAnswerId && !question1.acceptedAnswerId) {
      reasons.push('Question 2 has an accepted answer');
    }
    
    return reasons;
  }

  // Generate merge execution plan
  generateMergeExecutionPlan(duplicateGroup) {
    const plan = {
      steps: [],
      estimatedTime: 0,
      risks: [],
      requiredPermissions: ['merge_questions'],
      backupRequired: true
    };

    const primary = duplicateGroup.mergeStrategy.primaryQuestion;
    const duplicates = duplicateGroup.duplicates.map(d => d.question);

    // Step 1: Backup original questions
    plan.steps.push({
      order: 1,
      action: 'backup_questions',
      description: 'Create backup of all questions before merge',
      questions: [primary, ...duplicates],
      estimatedTime: 30
    });

    // Step 2: Merge content if needed
    if (duplicateGroup.mergeStrategy.recommended.type === 'content_merge') {
      plan.steps.push({
        order: 2,
        action: 'merge_content',
        description: 'Combine question descriptions while preserving unique information',
        primary: primary.id,
        sources: duplicates.map(d => d.id),
        estimatedTime: 300
      });
    }

    // Step 3: Consolidate answers
    plan.steps.push({
      order: 3,
      action: 'move_answers',
      description: 'Move all answers to the primary question',
      primary: primary.id,
      sources: duplicates.map(d => d.id),
      estimatedTime: 60
    });

    // Step 4: Merge tags
    plan.steps.push({
      order: 4,
      action: 'merge_tags',
      description: 'Combine tags from all duplicate questions',
      primary: primary.id,
      newTags: duplicateGroup.mergeStrategy.recommended.newTags || [],
      estimatedTime: 30
    });

    // Step 5: Create redirects
    plan.steps.push({
      order: 5,
      action: 'create_redirects',
      description: 'Create redirects from duplicate questions to primary',
      primary: primary.id,
      sources: duplicates.map(d => d.id),
      estimatedTime: 60
    });

    // Step 6: Update search indexes
    plan.steps.push({
      order: 6,
      action: 'update_search_index',
      description: 'Update search indexes to reflect merged content',
      affectedQuestions: [primary.id, ...duplicates.map(d => d.id)],
      estimatedTime: 120
    });

    plan.estimatedTime = plan.steps.reduce((sum, step) => sum + step.estimatedTime, 0);

    // Risk assessment
    if (duplicates.some(d => d.answers > 5)) {
      plan.risks.push('High-activity questions being merged - may affect user experience');
    }

    if (duplicateGroup.confidence < 0.8) {
      plan.risks.push('Lower confidence in duplicate detection - manual review recommended');
    }

    return plan;
  }

  // Batch duplicate detection
  batchDetectDuplicates(questions, batchSize = 100) {
    const results = [];
    const totalBatches = Math.ceil(questions.length / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const batch = questions.slice(i * batchSize, (i + 1) * batchSize);
      const batchResults = this.detectDuplicateQuestions(batch);
      
      results.push({
        batchIndex: i,
        batchSize: batch.length,
        duplicateGroups: batchResults.duplicateGroups,
        duplicatePairs: batchResults.duplicatePairs
      });
    }

    // Combine results
    const allGroups = results.flatMap(r => r.duplicateGroups);
    const allPairs = results.flatMap(r => r.duplicatePairs);

    return {
      batches: results,
      summary: {
        totalQuestions: questions.length,
        totalBatches,
        duplicateGroups: allGroups.length,
        duplicatePairs: allPairs.length,
        processingTime: Date.now()
      },
      combinedResults: {
        duplicateGroups: allGroups,
        duplicatePairs: allPairs
      }
    };
  }

  // Validate merge feasibility
  validateMergeEligibility(question1, question2) {
    const issues = [];
    const warnings = [];

    // Check for conflicting information
    if (question1.tags.length > 0 && question2.tags.length > 0) {
      const commonTags = question1.tags.filter(tag => question2.tags.includes(tag));
      if (commonTags.length === 0) {
        warnings.push('No common tags - questions may not be true duplicates');
      }
    }

    // Check for very different vote counts
    const voteRatio = Math.max(question1.votes, question2.votes) / Math.max(Math.min(question1.votes, question2.votes), 1);
    if (voteRatio > 5) {
      warnings.push('Significant difference in vote counts - may indicate different quality levels');
    }

    // Check for accepted answers on both
    if (question1.acceptedAnswerId && question2.acceptedAnswerId) {
      warnings.push('Both questions have accepted answers - manual review recommended');
    }

    // Check for recent activity
    const daysSinceActivity1 = (Date.now() - new Date(question1.updatedAt || question1.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const daysSinceActivity2 = (Date.now() - new Date(question2.updatedAt || question2.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceActivity1 < 7 || daysSinceActivity2 < 7) {
      warnings.push('Recent activity detected - users may be actively engaged');
    }

    return {
      eligible: issues.length === 0,
      issues,
      warnings,
      confidence: issues.length === 0 ? (warnings.length === 0 ? 'high' : 'medium') : 'low'
    };
  }

  // AI Engagement Insights and Analytics
  analyzeContentEngagement(questions, answers, options = {}) {
    const {
      timeframe = 'all',
      minEngagementScore = 0.1,
      includeTrends = true,
      analyzePatterns = true
    } = options;

    const engagementMetrics = {
      overview: {},
      topContent: {},
      patterns: {},
      trends: {},
      insights: [],
      recommendations: []
    };

    // Filter content by timeframe
    const { filteredQuestions, filteredAnswers } = this.filterContentByTimeframe(questions, answers, timeframe);

    // Calculate engagement scores for questions
    const questionEngagement = this.calculateQuestionEngagement(filteredQuestions, filteredAnswers);
    
    // Calculate engagement scores for answers
    const answerEngagement = this.calculateAnswerEngagement(filteredAnswers);

    // Analyze engagement patterns
    if (analyzePatterns) {
      engagementMetrics.patterns = this.analyzeEngagementPatterns(questionEngagement, answerEngagement);
    }

    // Analyze trends over time
    if (includeTrends) {
      engagementMetrics.trends = this.analyzeEngagementTrends(filteredQuestions, filteredAnswers);
    }

    // Generate insights
    engagementMetrics.insights = this.generateEngagementInsights(questionEngagement, answerEngagement, engagementMetrics.patterns);

    // Generate recommendations
    engagementMetrics.recommendations = this.generateEngagementRecommendations(engagementMetrics.insights, engagementMetrics.patterns);

    // Overview statistics
    engagementMetrics.overview = {
      totalQuestions: filteredQuestions.length,
      totalAnswers: filteredAnswers.length,
      avgQuestionEngagement: questionEngagement.reduce((sum, q) => sum + q.engagementScore, 0) / questionEngagement.length,
      avgAnswerEngagement: answerEngagement.reduce((sum, a) => sum + a.engagementScore, 0) / answerEngagement.length,
      highEngagementContent: questionEngagement.filter(q => q.engagementScore > 0.7).length + answerEngagement.filter(a => a.engagementScore > 0.7).length,
      lowEngagementContent: questionEngagement.filter(q => q.engagementScore < 0.3).length + answerEngagement.filter(a => a.engagementScore < 0.3).length
    };

    // Top performing content
    engagementMetrics.topContent = {
      questions: questionEngagement.sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 10),
      answers: answerEngagement.sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 10)
    };

    return engagementMetrics;
  }

  // Filter content by timeframe
  filterContentByTimeframe(questions, answers, timeframe) {
    if (timeframe === 'all') {
      return { filteredQuestions: questions, filteredAnswers: answers };
    }

    const now = new Date();
    const cutoffDate = new Date();

    switch (timeframe) {
      case 'day':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return { filteredQuestions: questions, filteredAnswers: answers };
    }

    const filteredQuestions = questions.filter(q => new Date(q.createdAt) >= cutoffDate);
    const filteredAnswers = answers.filter(a => new Date(a.createdAt) >= cutoffDate);

    return { filteredQuestions, filteredAnswers };
  }

  // Calculate engagement score for questions
  calculateQuestionEngagement(questions, answers) {
    return questions.map(question => {
      const questionAnswers = answers.filter(a => a.questionId === question.id);
      
      let engagementScore = 0;
      const factors = [];

      // Vote-based engagement
      if (question.votes > 0) {
        engagementScore += Math.min(question.votes * 0.1, 0.3);
        factors.push(`${question.votes} votes`);
      }

      // Answer-based engagement
      if (questionAnswers.length > 0) {
        engagementScore += Math.min(questionAnswers.length * 0.15, 0.4);
        factors.push(`${questionAnswers.length} answers`);
      }

      // Accepted answer bonus
      if (question.acceptedAnswerId) {
        engagementScore += 0.2;
        factors.push('has accepted answer');
      }

      // Answer quality engagement
      if (questionAnswers.length > 0) {
        const avgAnswerQuality = questionAnswers.reduce((sum, answer) => {
          const qualityScore = this.scoreAnswerQuality(answer.content);
          return sum + qualityScore.score;
        }, 0) / questionAnswers.length;
        
        engagementScore += avgAnswerQuality * 0.3;
        factors.push(`avg answer quality: ${Math.round(avgAnswerQuality * 100)}%`);
      }

      // Recency factor
      const daysSinceCreated = (Date.now() - new Date(question.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 30) {
        engagementScore += 0.1;
        factors.push('recent activity');
      }

      // Content quality factor
      const contentFeatures = this.extractQuestionFeatures(question.title, question.description);
      if (contentFeatures) {
        if (contentFeatures.complexity === 'high') {
          engagementScore += 0.1;
          factors.push('detailed question');
        }
        if (contentFeatures.technologies.length > 2) {
          engagementScore += 0.1;
          factors.push('multiple technologies');
        }
      }

      return {
        id: question.id,
        title: question.title,
        engagementScore: Math.min(engagementScore, 1),
        factors,
        metrics: {
          votes: question.votes,
          answers: questionAnswers.length,
          hasAcceptedAnswer: !!question.acceptedAnswerId,
          avgAnswerQuality: questionAnswers.length > 0 ? 
            questionAnswers.reduce((sum, a) => sum + this.scoreAnswerQuality(a.content).score, 0) / questionAnswers.length : 0
        }
      };
    });
  }

  // Calculate engagement score for answers
  calculateAnswerEngagement(answers) {
    return answers.map(answer => {
      let engagementScore = 0;
      const factors = [];

      // Vote-based engagement
      if (answer.votes > 0) {
        engagementScore += Math.min(answer.votes * 0.15, 0.4);
        factors.push(`${answer.votes} votes`);
      }

      // Accepted answer bonus
      if (answer.isAccepted) {
        engagementScore += 0.3;
        factors.push('accepted answer');
      }

      // Answer quality score
      const qualityScore = this.scoreAnswerQuality(answer.content);
      engagementScore += qualityScore.score * 0.4;
      factors.push(`quality: ${qualityScore.grade}`);

      // Content length factor
      if (answer.content.length > 500) {
        engagementScore += 0.1;
        factors.push('comprehensive answer');
      }

      // Code presence factor
      if (answer.content.includes('```') || answer.content.includes('`')) {
        engagementScore += 0.1;
        factors.push('includes code');
      }

      return {
        id: answer.id,
        engagementScore: Math.min(engagementScore, 1),
        factors,
        metrics: {
          votes: answer.votes,
          isAccepted: answer.isAccepted,
          qualityScore: qualityScore.score,
          qualityGrade: qualityScore.grade,
          contentLength: answer.content.length
        }
      };
    });
  }

  // Analyze engagement patterns
  analyzeEngagementPatterns(questionEngagement, answerEngagement) {
    const patterns = {};

    // Question patterns
    patterns.questionPatterns = {
      highEngagementFactors: this.findCommonFactors(questionEngagement.filter(q => q.engagementScore > 0.7)),
      lowEngagementFactors: this.findCommonFactors(questionEngagement.filter(q => q.engagementScore < 0.3)),
      optimalQuestionLength: this.analyzeOptimalLength(questionEngagement),
      bestTags: this.analyzeBestTags(questionEngagement)
    };

    // Answer patterns
    patterns.answerPatterns = {
      highEngagementFactors: this.findCommonFactors(answerEngagement.filter(a => a.engagementScore > 0.7)),
      lowEngagementFactors: this.findCommonFactors(answerEngagement.filter(a => a.engagementScore < 0.3)),
      optimalAnswerLength: this.analyzeOptimalLength(answerEngagement),
      acceptancePatterns: this.analyzeAcceptancePatterns(answerEngagement)
    };

    // Overall patterns
    patterns.overallPatterns = {
      engagementDistribution: this.analyzeEngagementDistribution(questionEngagement, answerEngagement),
      timePatterns: this.analyzeTimePatterns(questionEngagement, answerEngagement),
      contentTypePatterns: this.analyzeContentTypePatterns(questionEngagement, answerEngagement)
    };

    return patterns;
  }

  // Find common factors in high/low engagement content
  findCommonFactors(contentArray) {
    const factorCount = {};
    
    contentArray.forEach(content => {
      content.factors.forEach(factor => {
        factorCount[factor] = (factorCount[factor] || 0) + 1;
      });
    });

    return Object.entries(factorCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([factor, count]) => ({
        factor,
        frequency: count,
        percentage: Math.round((count / contentArray.length) * 100)
      }));
  }

  // Analyze optimal content length
  analyzeOptimalLength(engagementData) {
    const lengthBuckets = {
      'short': { min: 0, max: 100, scores: [] },
      'medium': { min: 100, max: 500, scores: [] },
      'long': { min: 500, max: 1000, scores: [] },
      'very_long': { min: 1000, max: Infinity, scores: [] }
    };

    engagementData.forEach(item => {
      const length = item.metrics.contentLength || 0;
      
      Object.entries(lengthBuckets).forEach(([bucket, config]) => {
        if (length >= config.min && length < config.max) {
          config.scores.push(item.engagementScore);
        }
      });
    });

    const results = {};
    Object.entries(lengthBuckets).forEach(([bucket, config]) => {
      if (config.scores.length > 0) {
        results[bucket] = {
          count: config.scores.length,
          avgEngagement: config.scores.reduce((sum, score) => sum + score, 0) / config.scores.length,
          range: `${config.min}-${config.max === Infinity ? '∞' : config.max} chars`
        };
      }
    });

    return results;
  }

  // Analyze engagement trends over time
  analyzeEngagementTrends(questions, answers) {
    const trends = {};
    
    // Group by month
    const monthlyEngagement = {};
    
    questions.forEach(question => {
      const month = new Date(question.createdAt).toISOString().slice(0, 7);
      if (!monthlyEngagement[month]) {
        monthlyEngagement[month] = { questions: [], answers: [] };
      }
      monthlyEngagement[month].questions.push(question);
    });

    answers.forEach(answer => {
      const month = new Date(answer.createdAt).toISOString().slice(0, 7);
      if (!monthlyEngagement[month]) {
        monthlyEngagement[month] = { questions: [], answers: [] };
      }
      monthlyEngagement[month].answers.push(answer);
    });

    // Calculate monthly engagement scores
    trends.monthlyTrends = Object.entries(monthlyEngagement)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const questionEngagement = this.calculateQuestionEngagement(data.questions, data.answers);
        const answerEngagement = this.calculateAnswerEngagement(data.answers);
        
        return {
          month,
          avgQuestionEngagement: questionEngagement.length > 0 ? 
            questionEngagement.reduce((sum, q) => sum + q.engagementScore, 0) / questionEngagement.length : 0,
          avgAnswerEngagement: answerEngagement.length > 0 ? 
            answerEngagement.reduce((sum, a) => sum + a.engagementScore, 0) / answerEngagement.length : 0,
          totalContent: data.questions.length + data.answers.length,
          questionCount: data.questions.length,
          answerCount: data.answers.length
        };
      });

    // Calculate trend direction
    const recentMonths = trends.monthlyTrends.slice(-3);
    const earlierMonths = trends.monthlyTrends.slice(-6, -3);
    
    if (recentMonths.length > 0 && earlierMonths.length > 0) {
      const recentAvg = recentMonths.reduce((sum, m) => sum + m.avgQuestionEngagement, 0) / recentMonths.length;
      const earlierAvg = earlierMonths.reduce((sum, m) => sum + m.avgQuestionEngagement, 0) / earlierMonths.length;
      
      trends.trendDirection = recentAvg > earlierAvg * 1.1 ? 'rising' : 
                            recentAvg < earlierAvg * 0.9 ? 'declining' : 'stable';
    }

    return trends;
  }

  // Generate engagement insights
  generateEngagementInsights(questionEngagement, answerEngagement, patterns) {
    const insights = [];

    // Top performing content insights
    const topQuestion = questionEngagement.sort((a, b) => b.engagementScore - a.engagementScore)[0];
    const topAnswer = answerEngagement.sort((a, b) => b.engagementScore - a.engagementScore)[0];
    
    if (topQuestion) {
      insights.push({
        type: 'top_performer',
        category: 'question',
        content: `Highest engaging question: "${topQuestion.title}" with ${Math.round(topQuestion.engagementScore * 100)}% engagement`,
        factors: topQuestion.factors
      });
    }

    if (topAnswer) {
      insights.push({
        type: 'top_performer',
        category: 'answer',
        content: `Highest engaging answer with ${Math.round(topAnswer.engagementScore * 100)}% engagement`,
        factors: topAnswer.factors
      });
    }

    // Pattern insights
    if (patterns.questionPatterns.highEngagementFactors.length > 0) {
      const topFactor = patterns.questionPatterns.highEngagementFactors[0];
      insights.push({
        type: 'pattern',
        category: 'question',
        content: `Questions with "${topFactor.factor}" have ${topFactor.percentage}% higher engagement`,
        recommendation: `Focus on ${topFactor.factor} for better engagement`
      });
    }

    if (patterns.answerPatterns.highEngagementFactors.length > 0) {
      const topFactor = patterns.answerPatterns.highEngagementFactors[0];
      insights.push({
        type: 'pattern',
        category: 'answer',
        content: `Answers with "${topFactor.factor}" have ${topFactor.percentage}% higher engagement`,
        recommendation: `Encourage ${topFactor.factor} in answers`
      });
    }

    // Engagement distribution insights
    const highEngagementQuestions = questionEngagement.filter(q => q.engagementScore > 0.7).length;
    const lowEngagementQuestions = questionEngagement.filter(q => q.engagementScore < 0.3).length;
    
    insights.push({
      type: 'distribution',
      category: 'overall',
      content: `${Math.round((highEngagementQuestions / questionEngagement.length) * 100)}% of questions have high engagement`,
      context: `${lowEngagementQuestions} questions need attention`
    });

    return insights;
  }

  // Generate engagement recommendations
  generateEngagementRecommendations(insights, patterns) {
    const recommendations = [];

    // Content creation recommendations
    if (patterns.questionPatterns.highEngagementFactors.length > 0) {
      recommendations.push({
        type: 'content_creation',
        priority: 'high',
        title: 'Optimize Question Format',
        description: 'Encourage questions that include detailed descriptions and multiple technologies',
        actions: [
          'Provide question templates with sections for problem description, expected behavior, and code examples',
          'Suggest relevant tags during question creation',
          'Highlight successful question patterns in guidelines'
        ]
      });
    }

    if (patterns.answerPatterns.highEngagementFactors.length > 0) {
      recommendations.push({
        type: 'content_creation',
        priority: 'high',
        title: 'Improve Answer Quality',
        description: 'Promote answer characteristics that drive higher engagement',
        actions: [
          'Encourage code examples in answers',
          'Reward comprehensive answers with explanation',
          'Provide answer quality feedback to users'
        ]
      });
    }

    // Community engagement recommendations
    recommendations.push({
      type: 'community_engagement',
      priority: 'medium',
      title: 'Boost Low-Engagement Content',
      description: 'Identify and improve content with low engagement',
      actions: [
        'Highlight unanswered questions in feeds',
        'Implement bounty system for difficult questions',
        'Notify experts about questions in their domains'
      ]
    });

    // Platform improvements
    recommendations.push({
      type: 'platform_improvement',
      priority: 'medium',
      title: 'Enhance Discovery',
      description: 'Help users find and engage with relevant content',
      actions: [
        'Improve search algorithm to surface engaging content',
        'Implement content recommendation system',
        'Add engagement metrics to content sorting'
      ]
    });

    return recommendations;
  }

  // Additional analysis methods
  analyzeBestTags(questionEngagement) {
    // This would analyze which tags correlate with high engagement
    return { analysis: 'Tag analysis would require tag data in engagement objects' };
  }

  analyzeAcceptancePatterns(answerEngagement) {
    const accepted = answerEngagement.filter(a => a.metrics.isAccepted);
    const notAccepted = answerEngagement.filter(a => !a.metrics.isAccepted);

    return {
      acceptedAnswers: {
        count: accepted.length,
        avgEngagement: accepted.reduce((sum, a) => sum + a.engagementScore, 0) / Math.max(accepted.length, 1),
        avgQuality: accepted.reduce((sum, a) => sum + a.metrics.qualityScore, 0) / Math.max(accepted.length, 1)
      },
      nonAcceptedAnswers: {
        count: notAccepted.length,
        avgEngagement: notAccepted.reduce((sum, a) => sum + a.engagementScore, 0) / Math.max(notAccepted.length, 1),
        avgQuality: notAccepted.reduce((sum, a) => sum + a.metrics.qualityScore, 0) / Math.max(notAccepted.length, 1)
      }
    };
  }

  analyzeEngagementDistribution(questionEngagement, answerEngagement) {
    const allEngagement = [...questionEngagement, ...answerEngagement];
    const distribution = {
      high: allEngagement.filter(item => item.engagementScore >= 0.7).length,
      medium: allEngagement.filter(item => item.engagementScore >= 0.4 && item.engagementScore < 0.7).length,
      low: allEngagement.filter(item => item.engagementScore < 0.4).length
    };

    return {
      ...distribution,
      percentages: {
        high: Math.round((distribution.high / allEngagement.length) * 100),
        medium: Math.round((distribution.medium / allEngagement.length) * 100),
        low: Math.round((distribution.low / allEngagement.length) * 100)
      }
    };
  }

  analyzeTimePatterns(questionEngagement, answerEngagement) {
    // This would analyze engagement patterns by time of day, day of week, etc.
    return { analysis: 'Time pattern analysis would require timestamp analysis' };
  }

  analyzeContentTypePatterns(questionEngagement, answerEngagement) {
    // This would analyze engagement by content type (how-to, troubleshooting, etc.)
    return { analysis: 'Content type pattern analysis would require content classification' };
  }

  // Generate engagement report
  generateEngagementReport(engagementData) {
    return {
      executiveSummary: {
        totalContent: engagementData.overview.totalQuestions + engagementData.overview.totalAnswers,
        avgEngagement: (engagementData.overview.avgQuestionEngagement + engagementData.overview.avgAnswerEngagement) / 2,
        topInsights: engagementData.insights.slice(0, 3)
      },
      detailedAnalysis: engagementData,
      actionItems: engagementData.recommendations.filter(r => r.priority === 'high'),
      nextSteps: [
        'Implement top priority recommendations',
        'Monitor engagement metrics weekly',
        'A/B test new engagement strategies',
        'Gather user feedback on content quality'
      ]
    };
  }

  // AI Writing Assistant
  analyzeWritingQuality(content, contentType = 'question', title = '') {
    const analysis = {
      overallScore: 0,
      issues: [],
      suggestions: [],
      strengths: [],
      metrics: {},
      readabilityScore: 0,
      completenessScore: 0,
      clarityScore: 0
    };

    if (!content || content.length < 10) {
      analysis.issues.push('Content is too short to provide meaningful help');
      return analysis;
    }

    // Basic metrics
    analysis.metrics = this.calculateWritingMetrics(content);
    
    // Analyze different aspects
    analysis.readabilityScore = this.analyzeReadability(content);
    analysis.completenessScore = this.analyzeCompleteness(content, contentType, title);
    analysis.clarityScore = this.analyzeClarity(content);
    
    // Overall score calculation
    analysis.overallScore = (analysis.readabilityScore + analysis.completenessScore + analysis.clarityScore) / 3;
    
    // Generate specific feedback
    analysis.issues = this.identifyWritingIssues(content, analysis.metrics, contentType);
    analysis.suggestions = this.generateWritingSuggestions(content, analysis.metrics, contentType, analysis);
    analysis.strengths = this.identifyWritingStrengths(content, analysis.metrics, analysis);

    return analysis;
  }

  // Calculate basic writing metrics
  calculateWritingMetrics(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    return {
      characterCount: content.length,
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      avgWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
      avgSentencesPerParagraph: paragraphs.length > 0 ? sentences.length / paragraphs.length : 0,
      hasCodeBlocks: content.includes('```'),
      hasInlineCode: content.includes('`'),
      hasLists: content.includes('- ') || content.includes('* ') || /^\d+\.\s/m.test(content),
      hasHeadings: content.includes('##'),
      questionMarks: (content.match(/\?/g) || []).length,
      exclamationMarks: (content.match(/!/g) || []).length
    };
  }

  // Analyze readability
  analyzeReadability(content) {
    const metrics = this.calculateWritingMetrics(content);
    let score = 0.5; // Base score

    // Sentence length scoring
    if (metrics.avgWordsPerSentence >= 15 && metrics.avgWordsPerSentence <= 25) {
      score += 0.2;
    } else if (metrics.avgWordsPerSentence > 30) {
      score -= 0.2;
    }

    // Paragraph structure scoring
    if (metrics.paragraphCount > 1 && metrics.avgSentencesPerParagraph >= 2 && metrics.avgSentencesPerParagraph <= 5) {
      score += 0.15;
    }

    // Use of formatting
    if (metrics.hasLists || metrics.hasHeadings) {
      score += 0.1;
    }

    // Code formatting
    if (metrics.hasCodeBlocks || metrics.hasInlineCode) {
      score += 0.05;
    }

    return Math.max(0, Math.min(1, score));
  }

  // Analyze completeness
  analyzeCompleteness(content, contentType, title = '') {
    let score = 0.3; // Base score
    const lowerContent = content.toLowerCase();

    if (contentType === 'question') {
      // Check for problem description
      if (lowerContent.includes('problem') || lowerContent.includes('issue') || lowerContent.includes('error')) {
        score += 0.2;
      }

      // Check for expected behavior
      if (lowerContent.includes('expect') || lowerContent.includes('should') || lowerContent.includes('want')) {
        score += 0.15;
      }

      // Check for context
      if (lowerContent.includes('using') || lowerContent.includes('with') || lowerContent.includes('when')) {
        score += 0.1;
      }

      // Check for attempts made
      if (lowerContent.includes('tried') || lowerContent.includes('attempt') || lowerContent.includes('tested')) {
        score += 0.15;
      }

      // Check for code examples
      if (content.includes('```') || content.includes('`')) {
        score += 0.1;
      }
    } else if (contentType === 'answer') {
      // Check for explanation
      if (lowerContent.includes('because') || lowerContent.includes('reason') || lowerContent.includes('this is')) {
        score += 0.2;
      }

      // Check for step-by-step approach
      if (content.includes('1.') || content.includes('first') || content.includes('then') || content.includes('finally')) {
        score += 0.15;
      }

      // Check for code examples
      if (content.includes('```')) {
        score += 0.2;
      }

      // Check for alternatives or caveats
      if (lowerContent.includes('alternative') || lowerContent.includes('however') || lowerContent.includes('note that')) {
        score += 0.1;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  // Analyze clarity
  analyzeClarity(content) {
    let score = 0.5; // Base score
    const lowerContent = content.toLowerCase();

    // Check for clarity indicators
    const clarityPhrases = ['for example', 'such as', 'specifically', 'in other words', 'that is'];
    const clarityCount = clarityPhrases.filter(phrase => lowerContent.includes(phrase)).length;
    score += clarityCount * 0.1;

    // Check for vague language
    const vagueWords = ['something', 'somehow', 'maybe', 'probably', 'might be', 'could be'];
    const vagueCount = vagueWords.filter(word => lowerContent.includes(word)).length;
    score -= vagueCount * 0.05;

    // Check for specific technical terms
    const techTerms = this.extractTechnologies(content);
    if (techTerms.length > 0) {
      score += 0.1;
    }

    // Check for proper grammar patterns
    if (this.hasGoodGrammarPatterns(content)) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  // Identify writing issues
  identifyWritingIssues(content, metrics, contentType) {
    const issues = [];

    // Length issues
    if (metrics.wordCount < 20) {
      issues.push({
        type: 'length',
        severity: 'high',
        message: 'Content is too short. Consider adding more details.',
        suggestion: 'Aim for at least 50 words to provide adequate context.'
      });
    }

    // Sentence structure issues
    if (metrics.avgWordsPerSentence > 30) {
      issues.push({
        type: 'readability',
        severity: 'medium',
        message: 'Sentences are too long and may be hard to read.',
        suggestion: 'Try breaking long sentences into shorter ones.'
      });
    }

    if (metrics.avgWordsPerSentence < 8) {
      issues.push({
        type: 'readability',
        severity: 'low',
        message: 'Sentences might be too short and choppy.',
        suggestion: 'Consider combining some short sentences for better flow.'
      });
    }

    // Paragraph structure issues
    if (metrics.wordCount > 100 && metrics.paragraphCount === 1) {
      issues.push({
        type: 'structure',
        severity: 'medium',
        message: 'Consider breaking content into multiple paragraphs.',
        suggestion: 'Use paragraphs to organize different ideas or steps.'
      });
    }

    // Content-specific issues
    if (contentType === 'question') {
      if (!metrics.questionMarks && !content.toLowerCase().includes('how') && !content.toLowerCase().includes('what') && !content.toLowerCase().includes('why')) {
        issues.push({
          type: 'content',
          severity: 'medium',
          message: 'This doesn\'t appear to contain a clear question.',
          suggestion: 'Make sure to include a specific question you want answered.'
        });
      }

      if (!metrics.hasCodeBlocks && !metrics.hasInlineCode && content.toLowerCase().includes('error')) {
        issues.push({
          type: 'content',
          severity: 'medium',
          message: 'Error-related questions should include code examples.',
          suggestion: 'Add the code that\'s causing the problem using code blocks (```).'
        });
      }
    }

    // Grammar and style issues
    if (content.includes('  ')) {
      issues.push({
        type: 'formatting',
        severity: 'low',
        message: 'Multiple consecutive spaces found.',
        suggestion: 'Use single spaces between words.'
      });
    }

    if (this.hasExcessivePunctuation(content)) {
      issues.push({
        type: 'style',
        severity: 'low',
        message: 'Excessive punctuation detected.',
        suggestion: 'Use punctuation sparingly for better readability.'
      });
    }

    return issues;
  }

  // Generate writing suggestions
  generateWritingSuggestions(content, metrics, contentType, analysis) {
    const suggestions = [];

    // Improvement suggestions based on score
    if (analysis.completenessScore < 0.6) {
      if (contentType === 'question') {
        suggestions.push({
          type: 'improvement',
          priority: 'high',
          title: 'Add More Context',
          description: 'Your question could benefit from more details',
          actions: [
            'Describe what you\'re trying to achieve',
            'Explain what you\'ve already tried',
            'Include relevant code examples',
            'Specify your environment (browser, OS, versions)'
          ]
        });
      } else {
        suggestions.push({
          type: 'improvement',
          priority: 'high',
          title: 'Provide More Complete Answer',
          description: 'Your answer could be more comprehensive',
          actions: [
            'Explain the reasoning behind your solution',
            'Include code examples',
            'Add step-by-step instructions',
            'Mention potential limitations or alternatives'
          ]
        });
      }
    }

    if (analysis.clarityScore < 0.6) {
      suggestions.push({
        type: 'improvement',
        priority: 'medium',
        title: 'Improve Clarity',
        description: 'Make your content clearer and easier to understand',
        actions: [
          'Use specific technical terms instead of vague language',
          'Add examples to illustrate your points',
          'Break complex ideas into simpler parts',
          'Use proper formatting for code and important terms'
        ]
      });
    }

    if (analysis.readabilityScore < 0.6) {
      suggestions.push({
        type: 'improvement',
        priority: 'medium',
        title: 'Enhance Readability',
        description: 'Make your content easier to read',
        actions: [
          'Break long sentences into shorter ones',
          'Use bullet points or numbered lists',
          'Add paragraph breaks for better organization',
          'Use headings to structure your content'
        ]
      });
    }

    // Format suggestions
    if (!metrics.hasCodeBlocks && this.shouldHaveCode(content)) {
      suggestions.push({
        type: 'formatting',
        priority: 'medium',
        title: 'Add Code Formatting',
        description: 'Use proper code formatting for better readability',
        actions: [
          'Wrap code snippets in triple backticks (```)',
          'Use inline code formatting with single backticks (`)',
          'Specify the programming language for syntax highlighting'
        ]
      });
    }

    if (!metrics.hasLists && this.shouldHaveList(content)) {
      suggestions.push({
        type: 'formatting',
        priority: 'low',
        title: 'Consider Using Lists',
        description: 'Lists can make information easier to scan',
        actions: [
          'Use bullet points for unordered items',
          'Use numbered lists for sequential steps',
          'Break down complex information into list items'
        ]
      });
    }

    return suggestions;
  }

  // Identify writing strengths
  identifyWritingStrengths(content, metrics, analysis) {
    const strengths = [];

    if (analysis.overallScore >= 0.8) {
      strengths.push('Excellent overall writing quality');
    }

    if (metrics.hasCodeBlocks) {
      strengths.push('Good use of code formatting');
    }

    if (metrics.hasLists) {
      strengths.push('Well-organized with lists');
    }

    if (metrics.paragraphCount > 1 && metrics.avgSentencesPerParagraph >= 2) {
      strengths.push('Good paragraph structure');
    }

    if (analysis.clarityScore >= 0.7) {
      strengths.push('Clear and specific language');
    }

    if (analysis.completenessScore >= 0.7) {
      strengths.push('Comprehensive content');
    }

    if (metrics.avgWordsPerSentence >= 15 && metrics.avgWordsPerSentence <= 25) {
      strengths.push('Good sentence length');
    }

    return strengths;
  }

  // Helper methods
  hasGoodGrammarPatterns(content) {
    // Simple grammar pattern checks
    const goodPatterns = [
      /\b(the|a|an)\s+\w+/g, // Articles
      /\b(is|are|was|were)\s+\w+/g, // Proper verb usage
      /\b(and|but|or|so)\s+/g // Conjunctions
    ];

    return goodPatterns.some(pattern => pattern.test(content));
  }

  hasExcessivePunctuation(content) {
    const punctuationCount = (content.match(/[!?]{2,}/g) || []).length;
    return punctuationCount > 0;
  }

  shouldHaveCode(content) {
    const codeIndicators = ['function', 'variable', 'error', 'syntax', 'compile', 'debug', 'code', 'script'];
    const lowerContent = content.toLowerCase();
    return codeIndicators.some(indicator => lowerContent.includes(indicator));
  }

  shouldHaveList(content) {
    const listIndicators = ['first', 'second', 'third', 'steps', 'process', 'how to'];
    const lowerContent = content.toLowerCase();
    return listIndicators.some(indicator => lowerContent.includes(indicator));
  }

  // Generate writing templates
  generateWritingTemplates(contentType, topic = '') {
    const templates = {};

    if (contentType === 'question') {
      templates.basic = {
        title: 'Basic Question Template',
        structure: [
          '## Problem Description',
          'Clearly describe what you\'re trying to achieve and what\'s going wrong.',
          '',
          '## What I\'ve Tried',
          'List the approaches you\'ve already attempted.',
          '',
          '## Code Example',
          '```language',
          '// Your relevant code here',
          '```',
          '',
          '## Expected vs Actual Behavior',
          'Describe what you expected to happen and what actually happened.',
          '',
          '## Environment',
          '- Operating System: ',
          '- Browser/Version: ',
          '- Framework/Library versions: '
        ].join('\n')
      };

      templates.debugging = {
        title: 'Debugging Question Template',
        structure: [
          '## Error Description',
          'Describe the error or unexpected behavior you\'re encountering.',
          '',
          '## Error Message',
          '```',
          'Paste the exact error message here',
          '```',
          '',
          '## Relevant Code',
          '```language',
          '// The code that produces the error',
          '```',
          '',
          '## Steps to Reproduce',
          '1. Step one',
          '2. Step two',
          '3. Step three',
          '',
          '## What I Expected',
          'Describe the expected behavior.',
          '',
          '## Additional Context',
          'Any other relevant information, dependencies, or environment details.'
        ].join('\n')
      };

      templates.howTo = {
        title: 'How-To Question Template',
        structure: [
          '## Goal',
          'What are you trying to accomplish?',
          '',
          '## Current Approach',
          'Describe your current approach or what you\'ve researched.',
          '',
          '## Specific Requirements',
          '- Requirement 1',
          '- Requirement 2',
          '- Requirement 3',
          '',
          '## Constraints',
          'Any limitations or constraints to consider.',
          '',
          '## Example or Reference',
          'If you have an example or reference of what you\'re looking for, include it here.'
        ].join('\n')
      };
    } else if (contentType === 'answer') {
      templates.comprehensive = {
        title: 'Comprehensive Answer Template',
        structure: [
          '## Solution Overview',
          'Brief explanation of the approach.',
          '',
          '## Step-by-Step Implementation',
          '1. **First step**: Explanation',
          '   ```language',
          '   // Code for first step',
          '   ```',
          '',
          '2. **Second step**: Explanation',
          '   ```language',
          '   // Code for second step',
          '   ```',
          '',
          '## Complete Example',
          '```language',
          '// Full working example',
          '```',
          '',
          '## Explanation',
          'Detailed explanation of how and why this works.',
          '',
          '## Alternative Approaches',
          'Other ways to solve this problem.',
          '',
          '## Important Notes',
          '- Note about limitations',
          '- Performance considerations',
          '- Best practices'
        ].join('\n')
      };

      templates.quick = {
        title: 'Quick Answer Template',
        structure: [
          '## Solution',
          'Direct answer to the question.',
          '',
          '```language',
          '// Working code example',
          '```',
          '',
          '## Explanation',
          'Brief explanation of how this solves the problem.',
          '',
          '## Additional Resources',
          '- [Relevant documentation](link)',
          '- [Related tutorial](link)'
        ].join('\n')
      };
    }

    return templates;
  }

  // Real-time writing assistance
  provideRealTimeAssistance(content, contentType, cursorPosition = 0) {
    const assistance = {
      suggestions: [],
      autocompletions: [],
      warnings: [],
      encouragement: []
    };

    // Get current context around cursor
    const beforeCursor = content.substring(0, cursorPosition);
    const afterCursor = content.substring(cursorPosition);
    const currentLine = beforeCursor.split('\n').pop();

    // Suggest code formatting
    if (this.shouldSuggestCodeFormat(currentLine)) {
      assistance.suggestions.push({
        type: 'formatting',
        message: 'Consider using code formatting',
        action: 'Wrap in backticks (`) for inline code or triple backticks (```) for code blocks'
      });
    }

    // Suggest list formatting
    if (this.shouldSuggestList(beforeCursor, currentLine)) {
      assistance.suggestions.push({
        type: 'formatting',
        message: 'This looks like it could be a list',
        action: 'Use bullet points (-) or numbers (1.) for better organization'
      });
    }

    // Progress encouragement
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > 0 && wordCount % 25 === 0) {
      assistance.encouragement.push(`Great progress! You've written ${wordCount} words.`);
    }

    // Content quality warnings
    if (wordCount > 50) {
      const analysis = this.analyzeWritingQuality(content, contentType);
      if (analysis.issues.filter(issue => issue.severity === 'high').length > 0) {
        assistance.warnings.push('Consider addressing the content issues before posting');
      }
    }

    return assistance;
  }

  // Helper methods for real-time assistance
  shouldSuggestCodeFormat(currentLine) {
    const codeIndicators = ['function', 'var', 'let', 'const', 'class', 'def', 'import', 'require'];
    return codeIndicators.some(indicator => currentLine.includes(indicator)) && !currentLine.includes('`');
  }

  shouldSuggestList(beforeCursor, currentLine) {
    const listPatterns = [
      /first.*then/i,
      /step.*step/i,
      /\d+\.\s.*\n.*\d+\./i
    ];
    return listPatterns.some(pattern => pattern.test(beforeCursor)) && !currentLine.startsWith('-') && !currentLine.match(/^\d+\./);
  }

  // Generate improvement recommendations
  generateImprovementPlan(content, contentType, targetAudience = 'general') {
    const analysis = this.analyzeWritingQuality(content, contentType);
    const plan = {
      currentScore: Math.round(analysis.overallScore * 100),
      targetScore: Math.min(100, Math.round(analysis.overallScore * 100) + 20),
      timeEstimate: '5-10 minutes',
      steps: [],
      priority: 'medium'
    };

    // Generate specific improvement steps
    if (analysis.completenessScore < 0.7) {
      plan.steps.push({
        order: 1,
        action: 'Add more context and details',
        description: 'Expand on the key points to make your content more comprehensive',
        estimatedImpact: '+15 points',
        difficulty: 'easy'
      });
    }

    if (analysis.clarityScore < 0.7) {
      plan.steps.push({
        order: 2,
        action: 'Improve clarity and specificity',
        description: 'Use more specific language and add examples',
        estimatedImpact: '+10 points',
        difficulty: 'medium'
      });
    }

    if (analysis.readabilityScore < 0.7) {
      plan.steps.push({
        order: 3,
        action: 'Enhance formatting and structure',
        description: 'Add proper formatting, lists, and paragraph breaks',
        estimatedImpact: '+8 points',
        difficulty: 'easy'
      });
    }

    // Adjust for target audience
    if (targetAudience === 'beginner') {
      plan.steps.unshift({
        order: 0,
        action: 'Add beginner-friendly explanations',
        description: 'Include basic concepts and terminology explanations',
        estimatedImpact: '+5 points',
        difficulty: 'easy'
      });
    }

    return plan;
  }
}

module.exports = new AIService(); 