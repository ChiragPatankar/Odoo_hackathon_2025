const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const aiService = require('./services/aiService');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');
const ANSWERS_FILE = path.join(DATA_DIR, 'answers.json');

// Initialize data directory and files
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Initialize data files if they don't exist
const initializeDataFiles = () => {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([
      {
        id: 'user1',
        username: 'admin',
        email: 'admin@stackit.com',
        password: 'admin123',
        isAdmin: true,
        avatar: 'https://via.placeholder.com/40/007bff/ffffff?text=A',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user2',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        isAdmin: false,
        avatar: 'https://via.placeholder.com/40/28a745/ffffff?text=J',
        createdAt: new Date().toISOString()
      }
    ], null, 2));
  }
  
  if (!fs.existsSync(QUESTIONS_FILE)) {
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify([
      {
        id: 'q1',
        title: 'How to connect to SQL Server database?',
        description: 'I need help connecting to SQL Server database using Node.js. What are the best practices?',
        tags: ['SQL', 'Database', 'Node.js'],
        userId: 'user2',
        username: 'johndoe',
        votes: 5,
        answers: 2,
        acceptedAnswerId: null,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'q2',
        title: 'React hooks vs class components',
        description: 'When should I use React hooks versus class components? What are the performance implications?',
        tags: ['React', 'JavaScript', 'Hooks'],
        userId: 'user1',
        username: 'admin',
        votes: 3,
        answers: 1,
        acceptedAnswerId: null,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString()
      }
    ], null, 2));
  }
  
  if (!fs.existsSync(ANSWERS_FILE)) {
    fs.writeFileSync(ANSWERS_FILE, JSON.stringify([
      {
        id: 'a1',
        questionId: 'q1',
        content: 'You can use the `mssql` package for Node.js. Here\'s a simple example:\n\n```javascript\nconst sql = require(\'mssql\');\n\nconst config = {\n  user: \'your_username\',\n  password: \'your_password\',\n  server: \'your_server\',\n  database: \'your_database\'\n};\n\nsql.connect(config)\n  .then(pool => {\n    return pool.request().query(\'SELECT * FROM users\');\n  })\n  .then(result => {\n    console.log(result);\n  });\n```\n\nMake sure to handle errors and use connection pooling for better performance.',
        userId: 'user1',
        username: 'admin',
        votes: 8,
        isAccepted: false,
        createdAt: new Date(Date.now() - 82800000).toISOString()
      },
      {
        id: 'a2',
        questionId: 'q1',
        content: 'Another approach is to use TypeORM which provides better type safety:\n\n```typescript\nimport { createConnection } from \'typeorm\';\n\nconst connection = await createConnection({\n  type: \'mssql\',\n  host: \'localhost\',\n  port: 1433,\n  username: \'your_username\',\n  password: \'your_password\',\n  database: \'your_database\',\n  entities: [User, Question]\n});\n```',
        userId: 'user2',
        username: 'johndoe',
        votes: 3,
        isAccepted: false,
        createdAt: new Date(Date.now() - 79200000).toISOString()
      }
    ], null, 2));
  }
};

// Helper functions
const readDataFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeDataFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Initialize data files
initializeDataFiles();

// Routes

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const users = readDataFile(USERS_FILE);
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        avatar: user.avatar
      },
      token: `token_${user.id}`
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  const users = readDataFile(USERS_FILE);
  
  // Check if user already exists
  const existingUser = users.find(u => u.email === email || u.username === username);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }
  
  const newUser = {
    id: uuidv4(),
    username,
    email,
    password,
    isAdmin: false,
    avatar: `https://via.placeholder.com/40/007bff/ffffff?text=${username.charAt(0).toUpperCase()}`,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  writeDataFile(USERS_FILE, users);
  
  res.json({
    success: true,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
      avatar: newUser.avatar
    },
    token: `token_${newUser.id}`
  });
});

// Question routes
app.get('/api/questions', (req, res) => {
  const questions = readDataFile(QUESTIONS_FILE);
  const { search, tag, filter } = req.query;
  
  let filteredQuestions = questions;
  
  // Search filter
  if (search) {
    filteredQuestions = filteredQuestions.filter(q => 
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Tag filter
  if (tag) {
    filteredQuestions = filteredQuestions.filter(q => 
      q.tags.includes(tag)
    );
  }
  
  // Sort filter
  if (filter === 'newest') {
    filteredQuestions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (filter === 'unanswered') {
    filteredQuestions = filteredQuestions.filter(q => q.answers === 0);
  } else if (filter === 'score') {
    filteredQuestions.sort((a, b) => b.votes - a.votes);
  }
  
  res.json(filteredQuestions);
});

app.get('/api/questions/:id', (req, res) => {
  const questions = readDataFile(QUESTIONS_FILE);
  const question = questions.find(q => q.id === req.params.id);
  
  if (!question) {
    return res.status(404).json({ message: 'Question not found' });
  }
  
  // Get answers for this question
  const answers = readDataFile(ANSWERS_FILE);
  const questionAnswers = answers.filter(a => a.questionId === req.params.id);
  
  res.json({
    ...question,
    answers: questionAnswers
  });
});

app.post('/api/questions', (req, res) => {
  const { title, description, tags, userId, username } = req.body;
  const questions = readDataFile(QUESTIONS_FILE);
  
  const newQuestion = {
    id: uuidv4(),
    title,
    description,
    tags: tags || [],
    userId,
    username,
    votes: 0,
    answers: 0,
    acceptedAnswerId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  questions.push(newQuestion);
  writeDataFile(QUESTIONS_FILE, questions);
  
  res.json(newQuestion);
});

app.put('/api/questions/:id/vote', (req, res) => {
  const { voteType } = req.body; // 'up' or 'down'
  const questions = readDataFile(QUESTIONS_FILE);
  
  const questionIndex = questions.findIndex(q => q.id === req.params.id);
  if (questionIndex === -1) {
    return res.status(404).json({ message: 'Question not found' });
  }
  
  questions[questionIndex].votes += voteType === 'up' ? 1 : -1;
  writeDataFile(QUESTIONS_FILE, questions);
  
  res.json(questions[questionIndex]);
});

// Answer routes
app.post('/api/answers', (req, res) => {
  const { questionId, content, userId, username } = req.body;
  const answers = readDataFile(ANSWERS_FILE);
  const questions = readDataFile(QUESTIONS_FILE);
  
  const newAnswer = {
    id: uuidv4(),
    questionId,
    content,
    userId,
    username,
    votes: 0,
    isAccepted: false,
    createdAt: new Date().toISOString()
  };
  
  answers.push(newAnswer);
  writeDataFile(ANSWERS_FILE, answers);
  
  // Update question answer count
  const questionIndex = questions.findIndex(q => q.id === questionId);
  if (questionIndex !== -1) {
    questions[questionIndex].answers += 1;
    writeDataFile(QUESTIONS_FILE, questions);
  }
  
  res.json(newAnswer);
});

app.put('/api/answers/:id/vote', (req, res) => {
  const { voteType } = req.body; // 'up' or 'down'
  const answers = readDataFile(ANSWERS_FILE);
  
  const answerIndex = answers.findIndex(a => a.id === req.params.id);
  if (answerIndex === -1) {
    return res.status(404).json({ message: 'Answer not found' });
  }
  
  answers[answerIndex].votes += voteType === 'up' ? 1 : -1;
  writeDataFile(ANSWERS_FILE, answers);
  
  res.json(answers[answerIndex]);
});

app.put('/api/answers/:id/accept', (req, res) => {
  const { questionId } = req.body;
  const answers = readDataFile(ANSWERS_FILE);
  const questions = readDataFile(QUESTIONS_FILE);
  
  // First, unaccept all answers for this question
  answers.forEach(answer => {
    if (answer.questionId === questionId) {
      answer.isAccepted = false;
    }
  });
  
  // Accept the specific answer
  const answerIndex = answers.findIndex(a => a.id === req.params.id);
  if (answerIndex !== -1) {
    answers[answerIndex].isAccepted = true;
    writeDataFile(ANSWERS_FILE, answers);
    
    // Update question with accepted answer
    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex !== -1) {
      questions[questionIndex].acceptedAnswerId = req.params.id;
      writeDataFile(QUESTIONS_FILE, questions);
    }
  }
  
  res.json(answers[answerIndex]);
});

// Tags route
app.get('/api/tags', (req, res) => {
  const questions = readDataFile(QUESTIONS_FILE);
  const allTags = questions.flatMap(q => q.tags);
  const uniqueTags = [...new Set(allTags)];
  
  res.json(uniqueTags);
});

// Users route
app.get('/api/users/:id', (req, res) => {
  const users = readDataFile(USERS_FILE);
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
    avatar: user.avatar,
    createdAt: user.createdAt
  });
});

// Medal system helper functions
const calculateUserStats = (userId) => {
  const answers = readDataFile(ANSWERS_FILE);
  const questions = readDataFile(QUESTIONS_FILE);
  
  const userAnswers = answers.filter(a => a.userId === userId);
  const userQuestions = questions.filter(q => q.userId === userId);
  
  const totalVotesReceived = userAnswers.reduce((total, answer) => total + answer.votes, 0);
  const acceptedAnswers = userAnswers.filter(a => a.isAccepted).length;
  const totalAnswers = userAnswers.length;
  const totalQuestions = userQuestions.length;
  
  return {
    totalVotesReceived,
    acceptedAnswers,
    totalAnswers,
    totalQuestions
  };
};

const getMedalForUser = (userId) => {
  const stats = calculateUserStats(userId);
  const votes = stats.totalVotesReceived;
  
  const medalTiers = [
    { name: 'Rookie', level: 'beginner', minVotes: 0, maxVotes: 4, icon: '🥉', color: '#CD7F32', description: 'Welcome to the community!' },
    { name: 'Contributor', level: 'beginner', minVotes: 5, maxVotes: 14, icon: '🎯', color: '#4A90E2', description: 'Making valuable contributions' },
    { name: 'Helper', level: 'intermediate', minVotes: 15, maxVotes: 29, icon: '🤝', color: '#7B68EE', description: 'Helping fellow developers' },
    { name: 'Expert', level: 'intermediate', minVotes: 30, maxVotes: 49, icon: '⭐', color: '#FFD700', description: 'Recognized expertise' },
    { name: 'Mentor', level: 'advanced', minVotes: 50, maxVotes: 99, icon: '🏆', color: '#FF6B35', description: 'Guiding the community' },
    { name: 'Master', level: 'advanced', minVotes: 100, maxVotes: 199, icon: '👑', color: '#FF1493', description: 'Master of your craft' },
    { name: 'Legend', level: 'expert', minVotes: 200, maxVotes: Infinity, icon: '🌟', color: '#8A2BE2', description: 'Legendary contributor' }
  ];
  
  let currentMedal = medalTiers[0];
  let nextMedal = medalTiers[1];
  
  for (let i = 0; i < medalTiers.length; i++) {
    if (votes >= medalTiers[i].minVotes && votes <= medalTiers[i].maxVotes) {
      currentMedal = medalTiers[i];
      nextMedal = medalTiers[i + 1] || null;
      break;
    }
  }
  
  const progress = nextMedal ? 
    Math.min(100, ((votes - currentMedal.minVotes) / (nextMedal.minVotes - currentMedal.minVotes)) * 100) : 
    100;
  
  return {
    current: currentMedal,
    next: nextMedal,
    progress: Math.round(progress),
    stats,
    allMedals: medalTiers
  };
};

// User statistics and medals API
app.get('/api/users/:id/stats', (req, res) => {
  const users = readDataFile(USERS_FILE);
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  const stats = calculateUserStats(req.params.id);
  res.json(stats);
});

app.get('/api/users/:id/medal', (req, res) => {
  const users = readDataFile(USERS_FILE);
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  const medalData = getMedalForUser(req.params.id);
  res.json(medalData);
});

// Get all medals (for medal showcase)
app.get('/api/medals', (req, res) => {
  const medalTiers = [
    { name: 'Rookie', level: 'beginner', minVotes: 0, maxVotes: 4, icon: '🥉', color: '#CD7F32', description: 'Welcome to the community!' },
    { name: 'Contributor', level: 'beginner', minVotes: 5, maxVotes: 14, icon: '🎯', color: '#4A90E2', description: 'Making valuable contributions' },
    { name: 'Helper', level: 'intermediate', minVotes: 15, maxVotes: 29, icon: '🤝', color: '#7B68EE', description: 'Helping fellow developers' },
    { name: 'Expert', level: 'intermediate', minVotes: 30, maxVotes: 49, icon: '⭐', color: '#FFD700', description: 'Recognized expertise' },
    { name: 'Mentor', level: 'advanced', minVotes: 50, maxVotes: 99, icon: '🏆', color: '#FF6B35', description: 'Guiding the community' },
    { name: 'Master', level: 'advanced', minVotes: 100, maxVotes: 199, icon: '👑', color: '#FF1493', description: 'Master of your craft' },
    { name: 'Legend', level: 'expert', minVotes: 200, maxVotes: Infinity, icon: '🌟', color: '#8A2BE2', description: 'Legendary contributor' }
  ];
  
  res.json(medalTiers);
});

// AI-Powered Similar Questions Detection
app.post('/api/ai/similar-questions', (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title && !description) {
      return res.status(400).json({ message: 'Title or description required' });
    }

    // Extract features from the new question
    const newQuestionFeatures = aiService.extractQuestionFeatures(title, description);
    
    if (!newQuestionFeatures) {
      return res.json({ similarQuestions: [], suggestions: [] });
    }

    // Get existing questions
    const questions = readDataFile(QUESTIONS_FILE);
    
    // Find similar questions
    const similarQuestions = aiService.findSimilarQuestions(
      newQuestionFeatures, 
      questions, 
      0.5, // Lower threshold for more suggestions
      5
    );

    // Generate auto-tags
    const allTags = questions.flatMap(q => q.tags || []);
    const uniqueTags = [...new Set(allTags)];
    const suggestedTags = aiService.suggestTags(newQuestionFeatures, uniqueTags);

    // Content moderation
    const combinedText = `${title || ''} ${description || ''}`;
    const toxicityCheck = aiService.detectToxicity(combinedText);
    const spamCheck = aiService.detectSpam(combinedText, title);

    res.json({
      similarQuestions: similarQuestions.map(sq => ({
        question: {
          id: sq.question.id,
          title: sq.question.title,
          description: sq.question.description?.substring(0, 200) + '...',
          tags: sq.question.tags,
          votes: sq.question.votes,
          answers: sq.question.answers,
          createdAt: sq.question.createdAt
        },
        similarity: Math.round(sq.similarity * 100),
        reasons: sq.reasons
      })),
      suggestedTags,
      contentAnalysis: {
        questionType: newQuestionFeatures.questionType,
        technologies: newQuestionFeatures.technologies,
        complexity: newQuestionFeatures.complexity,
        sentiment: newQuestionFeatures.sentiment,
        wordCount: newQuestionFeatures.wordCount
      },
      moderation: {
        toxicity: toxicityCheck,
        spam: spamCheck,
        approved: !toxicityCheck.isToxic && !spamCheck.isSpam
      }
    });
  } catch (error) {
    console.error('Error in similar questions detection:', error);
    res.status(500).json({ message: 'AI analysis failed', error: error.message });
  }
});

// AI-Powered Auto-Tagging
app.post('/api/ai/suggest-tags', (req, res) => {
  try {
    const { title, description } = req.body;
    
    const features = aiService.extractQuestionFeatures(title, description);
    if (!features) {
      return res.json({ suggestedTags: [] });
    }

    const questions = readDataFile(QUESTIONS_FILE);
    const allTags = questions.flatMap(q => q.tags || []);
    const uniqueTags = [...new Set(allTags)];
    
    const suggestedTags = aiService.suggestTags(features, uniqueTags);
    
    res.json({ 
      suggestedTags,
      extractedKeywords: features.keywords,
      detectedTechnologies: features.technologies,
      questionType: features.questionType
    });
  } catch (error) {
    console.error('Error in tag suggestion:', error);
    res.status(500).json({ message: 'Tag suggestion failed', error: error.message });
  }
});

// AI Content Moderation
app.post('/api/ai/moderate-content', (req, res) => {
  try {
    const { content, title = '' } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content required for moderation' });
    }

    const toxicityCheck = aiService.detectToxicity(content);
    const spamCheck = aiService.detectSpam(content, title);
    
    res.json({
      toxicity: toxicityCheck,
      spam: spamCheck,
      approved: !toxicityCheck.isToxic && !spamCheck.isSpam,
      recommendation: toxicityCheck.isToxic || spamCheck.isSpam ? 
        'Content flagged for review' : 'Content approved'
    });
  } catch (error) {
    console.error('Error in content moderation:', error);
    res.status(500).json({ message: 'Content moderation failed', error: error.message });
  }
});

// AI Answer Quality Scoring
app.post('/api/ai/score-answer', (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content required for scoring' });
    }

    const qualityScore = aiService.scoreAnswerQuality(content);
    
    res.json({
      score: qualityScore.score,
      grade: qualityScore.grade,
      factors: qualityScore.factors,
      recommendations: qualityScore.score < 0.5 ? [
        'Consider adding code examples',
        'Provide more detailed explanation',
        'Structure content with headers or lists',
        'Include technical details relevant to the question'
      ] : []
    });
  } catch (error) {
    console.error('Error in answer quality scoring:', error);
    res.status(500).json({ message: 'Answer scoring failed', error: error.message });
  }
});

// AI Semantic Search
app.get('/api/ai/smart-search', (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query required' });
    }

    const questions = readDataFile(QUESTIONS_FILE);
    const queryFeatures = aiService.extractQuestionFeatures(query, '');
    
    if (!queryFeatures) {
      return res.json({ results: [] });
    }

    // Calculate similarity for each question
    const searchResults = [];
    
    for (const question of questions) {
      const questionFeatures = aiService.extractQuestionFeatures(question.title, question.description);
      
      if (questionFeatures) {
        const similarity = aiService.calculateSimilarity(queryFeatures, questionFeatures);
        
        if (similarity > 0.1) { // Very low threshold for search
          searchResults.push({
            question,
            relevanceScore: similarity,
            matchReasons: aiService.getSimilarityReasons(queryFeatures, questionFeatures, similarity)
          });
        }
      }
    }

    // Sort by relevance and limit results
    const sortedResults = searchResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, parseInt(limit))
      .map(result => ({
        ...result.question,
        relevanceScore: Math.round(result.relevanceScore * 100),
        matchReasons: result.matchReasons
      }));

    res.json({
      results: sortedResults,
      totalFound: searchResults.length,
      queryAnalysis: {
        extractedTechnologies: queryFeatures.technologies,
        questionType: queryFeatures.questionType,
        keywords: queryFeatures.keywords.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Error in smart search:', error);
    res.status(500).json({ message: 'Smart search failed', error: error.message });
  }
});

// AI Analytics Dashboard
app.get('/api/ai/analytics', (req, res) => {
  try {
    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    
    // Analyze question types
    const questionTypes = {};
    const technologies = {};
    const complexityLevels = { low: 0, medium: 0, high: 0 };
    
    questions.forEach(question => {
      const features = aiService.extractQuestionFeatures(question.title, question.description);
      if (features) {
        // Count question types
        questionTypes[features.questionType] = (questionTypes[features.questionType] || 0) + 1;
        
        // Count technologies
        features.technologies.forEach(tech => {
          technologies[tech] = (technologies[tech] || 0) + 1;
        });
        
        // Count complexity
        complexityLevels[features.complexity]++;
      }
    });

    // Analyze answer quality
    let totalQualityScore = 0;
    let scoredAnswers = 0;
    
    answers.forEach(answer => {
      const qualityScore = aiService.scoreAnswerQuality(answer.content);
      totalQualityScore += qualityScore.score;
      scoredAnswers++;
    });

    const avgAnswerQuality = scoredAnswers > 0 ? totalQualityScore / scoredAnswers : 0;

    res.json({
      overview: {
        totalQuestions: questions.length,
        totalAnswers: answers.length,
        avgAnswerQuality: Math.round(avgAnswerQuality * 100) / 100
      },
      questionTypes: Object.entries(questionTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      topTechnologies: Object.entries(technologies)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15),
      complexityDistribution: complexityLevels,
      insights: [
        `Most common question type: ${Object.keys(questionTypes)[0] || 'general'}`,
        `Top technology: ${Object.keys(technologies)[0] || 'none'}`,
        `Average answer quality: ${avgAnswerQuality > 0.7 ? 'High' : avgAnswerQuality > 0.5 ? 'Medium' : 'Low'}`
      ]
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ message: 'Analytics generation failed', error: error.message });
  }
});

// AI Answer Summarization
app.post('/api/ai/summarize-answer', (req, res) => {
  try {
    const { content, maxLength = 200 } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content required for summarization' });
    }

    const summary = aiService.summarizeAnswer(content, maxLength);
    
    res.json({
      ...summary,
      metadata: {
        processingTime: Date.now(),
        summaryLength: summary.summary.length,
        originalLength: content.length
      }
    });
  } catch (error) {
    console.error('Error in answer summarization:', error);
    res.status(500).json({ message: 'Answer summarization failed', error: error.message });
  }
});

// AI Answer Insights
app.get('/api/ai/answer-insights/:answerId', (req, res) => {
  try {
    const { answerId } = req.params;
    const { includeCode = true, maxLength = 300 } = req.query;
    
    const answers = readDataFile(ANSWERS_FILE);
    const answer = answers.find(a => a.id === answerId);
    
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const summary = aiService.summarizeAnswer(answer.content, parseInt(maxLength));
    const qualityScore = aiService.scoreAnswerQuality(answer.content);
    
    res.json({
      answerId: answer.id,
      author: answer.username,
      createdAt: answer.createdAt,
      votes: answer.votes,
      isAccepted: answer.isAccepted,
      summary: summary.summary,
      keyInsights: summary.keyInsights,
      actionableItems: summary.actionableItems,
      codeSnippets: includeCode === 'true' ? summary.codeSnippets : [],
      qualityScore: qualityScore.score,
      qualityGrade: qualityScore.grade,
      confidence: summary.confidence,
      compressionRatio: summary.compressionRatio
    });
  } catch (error) {
    console.error('Error getting answer insights:', error);
    res.status(500).json({ message: 'Answer insights retrieval failed', error: error.message });
  }
});

// AI Bulk Answer Summarization
app.post('/api/ai/bulk-summarize', (req, res) => {
  try {
    const { questionId, maxLength = 150 } = req.body;
    
    if (!questionId) {
      return res.status(400).json({ message: 'Question ID required' });
    }

    const answers = readDataFile(ANSWERS_FILE);
    const questionAnswers = answers.filter(a => a.questionId === questionId);
    
    if (questionAnswers.length === 0) {
      return res.json({ summaries: [], totalAnswers: 0 });
    }

    const summaries = questionAnswers.map(answer => {
      const summary = aiService.summarizeAnswer(answer.content, maxLength);
      const qualityScore = aiService.scoreAnswerQuality(answer.content);
      
      return {
        answerId: answer.id,
        author: answer.username,
        votes: answer.votes,
        isAccepted: answer.isAccepted,
        summary: summary.summary,
        keyInsights: summary.keyInsights.slice(0, 2), // Limit for bulk view
        actionableItems: summary.actionableItems.slice(0, 3), // Limit for bulk view
        hasCode: summary.codeSnippets.length > 0,
        qualityScore: qualityScore.score,
        qualityGrade: qualityScore.grade,
        confidence: summary.confidence
      };
    });

    // Sort by quality score and acceptance
    const sortedSummaries = summaries.sort((a, b) => {
      if (a.isAccepted && !b.isAccepted) return -1;
      if (!a.isAccepted && b.isAccepted) return 1;
      return (b.qualityScore * 0.7 + b.votes * 0.3) - (a.qualityScore * 0.7 + a.votes * 0.3);
    });

    res.json({
      questionId,
      summaries: sortedSummaries,
      totalAnswers: questionAnswers.length,
      avgQualityScore: summaries.reduce((sum, s) => sum + s.qualityScore, 0) / summaries.length,
      answersWithCode: summaries.filter(s => s.hasCode).length
    });
  } catch (error) {
    console.error('Error in bulk summarization:', error);
    res.status(500).json({ message: 'Bulk summarization failed', error: error.message });
  }
});

// AI Recommendation Engine
app.get('/api/ai/recommendations/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, category = 'all' } = req.query;

    // Get user's activity data
    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    const users = readDataFile(USERS_FILE);

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Gather user activity
    const userActivity = {
      questions: questions.filter(q => q.userId === userId),
      answers: answers.filter(a => a.userId === userId)
    };

    // Generate recommendations
    const recommendations = aiService.generatePersonalizedRecommendations(
      userId,
      userActivity,
      questions,
      answers,
      parseInt(limit)
    );

    // Filter by category if specified
    let filteredRecommendations = recommendations;
    if (category !== 'all') {
      filteredRecommendations = {
        ...recommendations,
        questions: category === 'questions' ? recommendations.questions : [],
        answers: category === 'answers' ? recommendations.answers : [],
        topics: category === 'topics' ? recommendations.topics : [],
        users: category === 'users' ? recommendations.users : []
      };
    }

    res.json({
      userId,
      username: user.username,
      recommendations: filteredRecommendations,
      metadata: {
        totalActivity: userActivity.questions.length + userActivity.answers.length,
        expertiseLevel: recommendations.userProfile.expertiseLevel,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ message: 'Recommendation generation failed', error: error.message });
  }
});

// AI User Interest Profile
app.get('/api/ai/user-profile/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    const users = readDataFile(USERS_FILE);

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userActivity = {
      questions: questions.filter(q => q.userId === userId),
      answers: answers.filter(a => a.userId === userId)
    };

    const userInterests = aiService.analyzeUserInterests(userId, userActivity);
    const expertiseLevel = aiService.assessUserExpertise(userActivity);

    res.json({
      userId,
      username: user.username,
      profile: {
        expertiseLevel,
        activityScore: userInterests.activityScore,
        preferredComplexity: userInterests.preferredComplexity,
        topTechnologies: userInterests.topTechnologies,
        favoriteQuestionTypes: Object.entries(userInterests.questionTypes)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([type, count]) => ({ type, count })),
        stats: {
          totalQuestions: userActivity.questions.length,
          totalAnswers: userActivity.answers.length,
          totalVotes: userActivity.answers.reduce((sum, answer) => sum + answer.votes, 0),
          acceptedAnswers: userActivity.answers.filter(answer => answer.isAccepted).length
        }
      },
      insights: [
        `Primary expertise: ${userInterests.topTechnologies[0]?.tech || 'General'}`,
        `Experience level: ${expertiseLevel}`,
        `Preferred complexity: ${userInterests.preferredComplexity}`,
        `Most asked question type: ${Object.keys(userInterests.questionTypes)[0] || 'General'}`
      ]
    });
  } catch (error) {
    console.error('Error generating user profile:', error);
    res.status(500).json({ message: 'User profile generation failed', error: error.message });
  }
});

// AI Trending Topics
app.get('/api/ai/trending-topics', (req, res) => {
  try {
    const { limit = 20, timeframe = 'all' } = req.query;

    const questions = readDataFile(QUESTIONS_FILE);
    
    // Filter by timeframe
    let filteredQuestions = questions;
    if (timeframe !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (timeframe) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filteredQuestions = questions.filter(q => new Date(q.createdAt) >= cutoffDate);
    }

    const topicCounts = {};
    const questionTypeCounts = {};
    
    filteredQuestions.forEach(question => {
      const features = aiService.extractQuestionFeatures(question.title, question.description);
      if (features) {
        // Count technologies
        features.technologies.forEach(tech => {
          topicCounts[tech] = (topicCounts[tech] || 0) + 1;
        });
        
        // Count question types
        questionTypeCounts[features.questionType] = 
          (questionTypeCounts[features.questionType] || 0) + 1;
      }
    });

    const trendingTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, parseInt(limit))
      .map(([topic, count]) => ({
        topic,
        count,
        percentage: Math.round((count / filteredQuestions.length) * 100)
      }));

    const trendingQuestionTypes = Object.entries(questionTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / filteredQuestions.length) * 100)
      }));

    res.json({
      timeframe,
      totalQuestions: filteredQuestions.length,
      trendingTopics,
      trendingQuestionTypes,
      insights: [
        `Most popular topic: ${trendingTopics[0]?.topic || 'None'}`,
        `Most common question type: ${trendingQuestionTypes[0]?.type || 'None'}`,
        `Total unique topics: ${trendingTopics.length}`,
        `Questions in timeframe: ${filteredQuestions.length}`
      ]
    });
  } catch (error) {
    console.error('Error getting trending topics:', error);
    res.status(500).json({ message: 'Trending topics retrieval failed', error: error.message });
  }
});

// AI Similar Users (Find users with similar interests)
app.get('/api/ai/similar-users/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 5 } = req.query;

    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    const users = readDataFile(USERS_FILE);

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userActivity = {
      questions: questions.filter(q => q.userId === userId),
      answers: answers.filter(a => a.userId === userId)
    };

    const userInterests = aiService.analyzeUserInterests(userId, userActivity);
    const recommendations = aiService.recommendUsers(userInterests, answers, userId);

    res.json({
      userId,
      username: user.username,
      similarUsers: recommendations.slice(0, parseInt(limit)),
      userInterests: {
        topTechnologies: userInterests.topTechnologies.slice(0, 3),
        preferredComplexity: userInterests.preferredComplexity,
        expertiseLevel: aiService.assessUserExpertise(userActivity)
      }
    });
  } catch (error) {
    console.error('Error finding similar users:', error);
    res.status(500).json({ message: 'Similar users retrieval failed', error: error.message });
  }
});

// AI Smart Flagging System
app.post('/api/ai/flag-content', (req, res) => {
  try {
    const { content, title = '', author = '', context = {} } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content required for flagging analysis' });
    }

    const flaggingResult = aiService.intelligentContentFlagging(content, title, author, context);
    
    res.json({
      contentId: req.body.contentId || null,
      flaggingResult,
      timestamp: new Date().toISOString(),
      moderatorAlert: flaggingResult.priority === 'urgent' || flaggingResult.priority === 'high'
    });
  } catch (error) {
    console.error('Error in content flagging:', error);
    res.status(500).json({ message: 'Content flagging failed', error: error.message });
  }
});

// AI Batch Content Analysis
app.post('/api/ai/batch-flag-content', (req, res) => {
  try {
    const { contentItems } = req.body;
    
    if (!contentItems || !Array.isArray(contentItems)) {
      return res.status(400).json({ message: 'Content items array required' });
    }

    const analysisResults = aiService.batchAnalyzeContent(contentItems);
    
    // Categorize results by priority
    const priorityQueue = {
      urgent: [],
      high: [],
      medium: [],
      low: []
    };

    analysisResults.forEach(result => {
      const priority = result.flagging.priority;
      priorityQueue[priority].push(result);
    });

    res.json({
      totalAnalyzed: analysisResults.length,
      flaggedItems: analysisResults.filter(r => r.flagging.flags.length > 0).length,
      priorityQueue,
      summary: {
        urgentFlags: priorityQueue.urgent.length,
        highFlags: priorityQueue.high.length,
        mediumFlags: priorityQueue.medium.length,
        lowFlags: priorityQueue.low.length
      }
    });
  } catch (error) {
    console.error('Error in batch content analysis:', error);
    res.status(500).json({ message: 'Batch content analysis failed', error: error.message });
  }
});

// AI Moderator Queue
app.get('/api/ai/moderator-queue', (req, res) => {
  try {
    const { priority = 'all', limit = 50 } = req.query;
    
    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    
    // Combine all content for analysis
    const contentItems = [
      ...questions.map(q => ({
        id: q.id,
        type: 'question',
        content: q.description,
        title: q.title,
        author: q.username,
        context: {
          expectedTopics: q.tags,
          createdAt: q.createdAt,
          votes: q.votes
        }
      })),
      ...answers.map(a => ({
        id: a.id,
        type: 'answer',
        content: a.content,
        title: '',
        author: a.username,
        context: {
          createdAt: a.createdAt,
          votes: a.votes,
          isAccepted: a.isAccepted
        }
      }))
    ];

    // Analyze content and filter flagged items
    const flaggedItems = contentItems
      .map(item => {
        const flagging = aiService.intelligentContentFlagging(
          item.content,
          item.title,
          item.author,
          item.context
        );
        return {
          ...item,
          flagging,
          needsReview: flagging.requiresReview
        };
      })
      .filter(item => item.needsReview);

    // Filter by priority if specified
    let filteredItems = flaggedItems;
    if (priority !== 'all') {
      filteredItems = flaggedItems.filter(item => item.flagging.priority === priority);
    }

    // Sort by priority and risk score
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    filteredItems.sort((a, b) => {
      const priorityDiff = priorityOrder[b.flagging.priority] - priorityOrder[a.flagging.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.flagging.overallRiskScore - a.flagging.overallRiskScore;
    });

    const result = filteredItems.slice(0, parseInt(limit));

    res.json({
      moderatorQueue: result,
      summary: {
        totalFlagged: flaggedItems.length,
        urgent: flaggedItems.filter(item => item.flagging.priority === 'urgent').length,
        high: flaggedItems.filter(item => item.flagging.priority === 'high').length,
        medium: flaggedItems.filter(item => item.flagging.priority === 'medium').length,
        low: flaggedItems.filter(item => item.flagging.priority === 'low').length
      },
      insights: {
        mostCommonFlagType: this.getMostCommonFlagType(flaggedItems),
        avgRiskScore: flaggedItems.reduce((sum, item) => sum + item.flagging.overallRiskScore, 0) / flaggedItems.length,
        requiresImmediateAttention: flaggedItems.filter(item => 
          item.flagging.recommendation.action === 'immediate_review'
        ).length
      }
    });
  } catch (error) {
    console.error('Error getting moderator queue:', error);
    res.status(500).json({ message: 'Moderator queue retrieval failed', error: error.message });
  }
});

// AI Flagging Insights Dashboard
app.get('/api/ai/flagging-insights', (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;
    
    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    
    // Filter content by timeframe
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
      default:
        cutoffDate.setFullYear(now.getFullYear() - 1);
    }

    const recentQuestions = questions.filter(q => new Date(q.createdAt) >= cutoffDate);
    const recentAnswers = answers.filter(a => new Date(a.createdAt) >= cutoffDate);
    
    // Analyze recent content
    const contentItems = [
      ...recentQuestions.map(q => ({
        id: q.id,
        type: 'question',
        content: q.description,
        title: q.title,
        author: q.username,
        createdAt: q.createdAt
      })),
      ...recentAnswers.map(a => ({
        id: a.id,
        type: 'answer',
        content: a.content,
        title: '',
        author: a.username,
        createdAt: a.createdAt
      }))
    ];

    const flaggingHistory = contentItems.map(item => {
      const flagging = aiService.intelligentContentFlagging(
        item.content,
        item.title,
        item.author,
        { createdAt: item.createdAt }
      );
      return {
        ...item,
        flagging
      };
    });

    // Generate insights
    const insights = aiService.generateFlaggingInsights(flaggingHistory);
    
    // Additional statistics
    const flaggedItems = flaggingHistory.filter(item => item.flagging.flags.length > 0);
    const flagTypes = {};
    const severityDistribution = { high: 0, medium: 0, low: 0 };
    
    flaggedItems.forEach(item => {
      item.flagging.flags.forEach(flag => {
        flagTypes[flag.type] = (flagTypes[flag.type] || 0) + 1;
        severityDistribution[flag.severity]++;
      });
    });

    res.json({
      timeframe,
      period: `${cutoffDate.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`,
      statistics: {
        totalContent: contentItems.length,
        flaggedContent: flaggedItems.length,
        flaggingRate: Math.round((flaggedItems.length / contentItems.length) * 100),
        avgRiskScore: flaggedItems.reduce((sum, item) => sum + item.flagging.overallRiskScore, 0) / Math.max(flaggedItems.length, 1)
      },
      flagTypes: Object.entries(flagTypes)
        .sort(([,a], [,b]) => b - a)
        .map(([type, count]) => ({ type, count })),
      severityDistribution,
      trends: {
        dailyFlags: this.getDailyFlaggingTrends(flaggingHistory, cutoffDate),
        topFlagReasons: this.getTopFlagReasons(flaggingHistory)
      },
      recommendations: [
        flagTypes.spam > flagTypes.toxicity ? 'Focus on spam prevention' : 'Monitor toxic content',
        severityDistribution.high > 5 ? 'Increase moderation capacity' : 'Current moderation adequate',
        flaggedItems.length > contentItems.length * 0.1 ? 'Consider adjusting flag sensitivity' : 'Flag sensitivity appropriate'
      ]
    });
  } catch (error) {
    console.error('Error generating flagging insights:', error);
    res.status(500).json({ message: 'Flagging insights generation failed', error: error.message });
  }
});

// AI Auto-Moderation Action
app.post('/api/ai/auto-moderate', (req, res) => {
  try {
    const { contentId, contentType, action, feedback } = req.body;
    
    if (!contentId || !contentType || !action) {
      return res.status(400).json({ message: 'Content ID, type, and action required' });
    }

    let dataFile, items;
    if (contentType === 'question') {
      dataFile = QUESTIONS_FILE;
      items = readDataFile(QUESTIONS_FILE);
    } else if (contentType === 'answer') {
      dataFile = ANSWERS_FILE;
      items = readDataFile(ANSWERS_FILE);
    } else {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    const itemIndex = items.findIndex(item => item.id === contentId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const item = items[itemIndex];
    const originalContent = item.content || item.description;
    
    // Perform the moderation action
    let result = {};
    
    switch (action) {
      case 'approve':
        result = { action: 'approved', message: 'Content approved by AI moderator' };
        break;
        
      case 'flag_for_review':
        result = { action: 'flagged', message: 'Content flagged for human review' };
        break;
        
      case 'hide':
        // Mark content as hidden
        items[itemIndex].hidden = true;
        items[itemIndex].hiddenReason = 'AI moderation';
        items[itemIndex].hiddenAt = new Date().toISOString();
        writeDataFile(dataFile, items);
        result = { action: 'hidden', message: 'Content hidden by AI moderator' };
        break;
        
      case 'edit':
        // This would require implementing content editing logic
        result = { action: 'edit_suggested', message: 'Content edits suggested' };
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    res.json({
      contentId,
      contentType,
      ...result,
      feedback: feedback || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in auto-moderation:', error);
    res.status(500).json({ message: 'Auto-moderation failed', error: error.message });
  }
});

// AI Topic Extraction and Clustering
app.get('/api/ai/extract-topics', (req, res) => {
  try {
    const { 
      minFrequency = 2, 
      maxTopics = 50, 
      clustering = true, 
      timeAnalysis = false,
      contentType = 'all'
    } = req.query;
    
    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    
    // Prepare content items based on type
    let contentItems = [];
    
    if (contentType === 'all' || contentType === 'questions') {
      contentItems = contentItems.concat(questions.map(q => ({
        id: q.id,
        type: 'question',
        title: q.title,
        content: q.description,
        createdAt: q.createdAt,
        tags: q.tags
      })));
    }
    
    if (contentType === 'all' || contentType === 'answers') {
      contentItems = contentItems.concat(answers.map(a => ({
        id: a.id,
        type: 'answer',
        title: '',
        content: a.content,
        createdAt: a.createdAt,
        tags: []
      })));
    }

    const options = {
      minTopicFrequency: parseInt(minFrequency),
      maxTopics: parseInt(maxTopics),
      clusterSimilarTopics: clustering === 'true',
      timeBasedAnalysis: timeAnalysis === 'true'
    };

    const extractedTopics = aiService.extractTopicsFromContent(contentItems, options);

    res.json({
      ...extractedTopics,
      metadata: {
        totalContent: contentItems.length,
        analysisOptions: options,
        extractedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in topic extraction:', error);
    res.status(500).json({ message: 'Topic extraction failed', error: error.message });
  }
});

// AI Topic Hierarchy
app.get('/api/ai/topic-hierarchy', (req, res) => {
  try {
    const { category = 'all', depth = 2 } = req.query;
    
    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    
    const contentItems = [
      ...questions.map(q => ({
        id: q.id,
        type: 'question',
        title: q.title,
        content: q.description,
        createdAt: q.createdAt
      })),
      ...answers.map(a => ({
        id: a.id,
        type: 'answer',
        title: '',
        content: a.content,
        createdAt: a.createdAt
      }))
    ];

    const extractedTopics = aiService.extractTopicsFromContent(contentItems);
    
    // Filter hierarchy by category if specified
    let hierarchy = extractedTopics.hierarchy;
    if (category !== 'all' && hierarchy.root.children[category]) {
      hierarchy = {
        root: {
          name: category,
          children: { [category]: hierarchy.root.children[category] },
          frequency: hierarchy.root.children[category].frequency
        }
      };
    }

    res.json({
      hierarchy,
      statistics: {
        totalTopics: extractedTopics.topics.length,
        totalCategories: Object.keys(extractedTopics.hierarchy.root.children).length,
        totalClusters: Object.keys(extractedTopics.clusters).length
      },
      availableCategories: Object.keys(extractedTopics.hierarchy.root.children)
    });
  } catch (error) {
    console.error('Error getting topic hierarchy:', error);
    res.status(500).json({ message: 'Topic hierarchy retrieval failed', error: error.message });
  }
});

// AI Topic Clusters
app.get('/api/ai/topic-clusters', (req, res) => {
  try {
    const { minClusterSize = 2, similarityThreshold = 0.7 } = req.query;
    
    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    
    const contentItems = [
      ...questions.map(q => ({ title: q.title, content: q.description })),
      ...answers.map(a => ({ title: '', content: a.content }))
    ];

    const extractedTopics = aiService.extractTopicsFromContent(contentItems);
    
    // Filter clusters by minimum size
    const filteredClusters = {};
    Object.entries(extractedTopics.clusters).forEach(([clusterId, cluster]) => {
      if (cluster.topics.length >= parseInt(minClusterSize)) {
        filteredClusters[clusterId] = cluster;
      }
    });

    // Generate cluster statistics
    const clusterStats = Object.entries(filteredClusters).map(([clusterId, cluster]) => ({
      clusterId,
      name: cluster.name,
      size: cluster.topics.length,
      topics: cluster.topics,
      representative: cluster.representative,
      density: cluster.topics.length / extractedTopics.topics.length
    }));

    res.json({
      clusters: filteredClusters,
      statistics: clusterStats,
      summary: {
        totalClusters: Object.keys(filteredClusters).length,
        avgClusterSize: clusterStats.reduce((sum, c) => sum + c.size, 0) / clusterStats.length,
        largestCluster: clusterStats.reduce((max, c) => c.size > max.size ? c : max, { size: 0 })
      }
    });
  } catch (error) {
    console.error('Error getting topic clusters:', error);
    res.status(500).json({ message: 'Topic clusters retrieval failed', error: error.message });
  }
});

// AI Topic Organization
app.get('/api/ai/organize-by-topics', (req, res) => {
  try {
    const { topic, minContent = 1, sortBy = 'frequency' } = req.query;
    
    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    
    const contentItems = [
      ...questions.map(q => ({
        id: q.id,
        type: 'question',
        title: q.title,
        content: q.description,
        createdAt: q.createdAt,
        votes: q.votes,
        answers: q.answers
      })),
      ...answers.map(a => ({
        id: a.id,
        type: 'answer',
        title: '',
        content: a.content,
        createdAt: a.createdAt,
        votes: a.votes,
        isAccepted: a.isAccepted
      }))
    ];

    const extractedTopics = aiService.extractTopicsFromContent(contentItems);
    const organization = aiService.organizeContentByTopics(contentItems, extractedTopics);

    // Filter by specific topic if requested
    let filteredOrganization = organization;
    if (topic) {
      filteredOrganization = {};
      if (organization[topic]) {
        filteredOrganization[topic] = organization[topic];
      }
    }

    // Filter by minimum content count
    Object.keys(filteredOrganization).forEach(topicKey => {
      if (filteredOrganization[topicKey].totalItems < parseInt(minContent)) {
        delete filteredOrganization[topicKey];
      }
    });

    // Sort organization
    const sortedOrganization = Object.entries(filteredOrganization)
      .sort(([,a], [,b]) => {
        switch (sortBy) {
          case 'frequency':
            return b.totalItems - a.totalItems;
          case 'quality':
            return b.avgQuality - a.avgQuality;
          case 'alphabetical':
            return a.topic.localeCompare(b.topic);
          default:
            return b.totalItems - a.totalItems;
        }
      })
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    res.json({
      organization: sortedOrganization,
      summary: {
        totalTopics: Object.keys(sortedOrganization).length,
        totalContent: Object.values(sortedOrganization).reduce((sum, topic) => sum + topic.totalItems, 0),
        avgContentPerTopic: Object.values(sortedOrganization).reduce((sum, topic) => sum + topic.totalItems, 0) / Object.keys(sortedOrganization).length,
        topTopics: Object.entries(sortedOrganization)
          .slice(0, 10)
          .map(([topic, data]) => ({ topic, items: data.totalItems }))
      }
    });
  } catch (error) {
    console.error('Error organizing content by topics:', error);
    res.status(500).json({ message: 'Topic organization failed', error: error.message });
  }
});

// AI Topic Recommendations
app.post('/api/ai/recommend-topics', (req, res) => {
  try {
    const { title, content, maxRecommendations = 10 } = req.body;
    
    if (!title && !content) {
      return res.status(400).json({ message: 'Title or content required for topic recommendations' });
    }

    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    
    const contentItems = [
      ...questions.map(q => ({ title: q.title, content: q.description })),
      ...answers.map(a => ({ title: '', content: a.content }))
    ];

    const extractedTopics = aiService.extractTopicsFromContent(contentItems);
    const recommendations = aiService.recommendTopicsForContent(
      title || '',
      content || '',
      extractedTopics.topics
    );

    res.json({
      recommendations: recommendations.slice(0, parseInt(maxRecommendations)),
      inputAnalysis: {
        title: title || '',
        contentLength: (content || '').length,
        extractedFeatures: aiService.extractQuestionFeatures(title || '', content || '')
      },
      availableTopics: extractedTopics.topics.length
    });
  } catch (error) {
    console.error('Error recommending topics:', error);
    res.status(500).json({ message: 'Topic recommendation failed', error: error.message });
  }
});

// AI Topic Trends
app.get('/api/ai/topic-trends', (req, res) => {
  try {
    const { timeframe = 'month', topicCount = 20 } = req.query;
    
    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    
    // Filter content by timeframe
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeframe) {
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
        cutoffDate.setMonth(now.getMonth() - 1);
    }

    const recentQuestions = questions.filter(q => new Date(q.createdAt) >= cutoffDate);
    const recentAnswers = answers.filter(a => new Date(a.createdAt) >= cutoffDate);
    
    const contentItems = [
      ...recentQuestions.map(q => ({
        title: q.title,
        content: q.description,
        createdAt: q.createdAt
      })),
      ...recentAnswers.map(a => ({
        title: '',
        content: a.content,
        createdAt: a.createdAt
      }))
    ];

    const extractedTopics = aiService.extractTopicsFromContent(contentItems, {
      timeBasedAnalysis: true,
      maxTopics: parseInt(topicCount)
    });

    // Analyze trends
    const trendingTopics = extractedTopics.topics
      .filter(topic => topic.trends)
      .map(topic => ({
        topic: topic.topic,
        frequency: topic.frequency,
        trend: topic.trends.trend,
        volatility: topic.trends.volatility,
        peak: topic.trends.peak,
        latest: topic.trends.latest
      }))
      .sort((a, b) => {
        // Sort by trend strength and frequency
        const trendScore = (topic) => {
          const trendMultiplier = topic.trend === 'rising' ? 2 : topic.trend === 'declining' ? 0.5 : 1;
          return topic.frequency * trendMultiplier;
        };
        return trendScore(b) - trendScore(a);
      });

    res.json({
      timeframe,
      period: `${cutoffDate.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`,
      trendingTopics: trendingTopics.slice(0, parseInt(topicCount)),
      analysis: {
        risingTopics: trendingTopics.filter(t => t.trend === 'rising').length,
        decliningTopics: trendingTopics.filter(t => t.trend === 'declining').length,
        stableTopics: trendingTopics.filter(t => t.trend === 'stable').length,
        avgVolatility: trendingTopics.reduce((sum, t) => sum + t.volatility, 0) / trendingTopics.length
      },
      insights: extractedTopics.insights
    });
  } catch (error) {
    console.error('Error analyzing topic trends:', error);
    res.status(500).json({ message: 'Topic trends analysis failed', error: error.message });
  }
});

// AI Topic Network
app.get('/api/ai/topic-network', (req, res) => {
  try {
    const { minStrength = 2, maxNodes = 100 } = req.query;
    
    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    
    const contentItems = [
      ...questions.map(q => ({ title: q.title, content: q.description })),
      ...answers.map(a => ({ title: '', content: a.content }))
    ];

    const extractedTopics = aiService.extractTopicsFromContent(contentItems);
    const network = extractedTopics.relationships;

    // Filter network by minimum strength
    const filteredEdges = network.edges.filter(edge => edge.weight >= parseInt(minStrength));
    const connectedNodes = new Set();
    filteredEdges.forEach(edge => {
      connectedNodes.add(edge.from);
      connectedNodes.add(edge.to);
    });

    const filteredNodes = {};
    Array.from(connectedNodes).slice(0, parseInt(maxNodes)).forEach(nodeId => {
      filteredNodes[nodeId] = network.nodes[nodeId];
    });

    res.json({
      network: {
        nodes: filteredNodes,
        edges: filteredEdges.slice(0, parseInt(maxNodes) * 2)
      },
      statistics: {
        totalNodes: Object.keys(filteredNodes).length,
        totalEdges: filteredEdges.length,
        avgConnections: Object.values(filteredNodes).reduce((sum, node) => sum + node.connections, 0) / Object.keys(filteredNodes).length,
        strongestConnection: filteredEdges[0],
        isolatedTopics: Object.keys(network.nodes).filter(nodeId => !connectedNodes.has(nodeId)).length
      }
    });
  } catch (error) {
    console.error('Error building topic network:', error);
    res.status(500).json({ message: 'Topic network construction failed', error: error.message });
  }
});

// AI Duplicate Question Merger
app.post('/api/ai/detect-duplicates', (req, res) => {
  try {
    const { 
      similarityThreshold = 0.8,
      maxCandidates = 5,
      considerAnswers = true,
      strictMode = false,
      batchSize = 100
    } = req.body;
    
    const questions = readDataFile(QUESTIONS_FILE);
    
    const options = {
      similarityThreshold: parseFloat(similarityThreshold),
      maxCandidates: parseInt(maxCandidates),
      considerAnswers: considerAnswers === true,
      strictMode: strictMode === true
    };

    // Use batch processing for large datasets
    let results;
    if (questions.length > parseInt(batchSize)) {
      results = aiService.batchDetectDuplicates(questions, parseInt(batchSize));
    } else {
      const duplicateResults = aiService.detectDuplicateQuestions(questions, options);
      results = {
        duplicateGroups: duplicateResults.duplicateGroups,
        duplicatePairs: duplicateResults.duplicatePairs,
        summary: duplicateResults.summary
      };
    }

    res.json({
      ...results,
      configuration: options,
      processedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error detecting duplicates:', error);
    res.status(500).json({ message: 'Duplicate detection failed', error: error.message });
  }
});

// AI Merge Recommendations
app.post('/api/ai/merge-recommendations', (req, res) => {
  try {
    const { questionIds, confidence = 'medium' } = req.body;
    
    if (!questionIds || questionIds.length < 2) {
      return res.status(400).json({ message: 'At least 2 question IDs required' });
    }

    const questions = readDataFile(QUESTIONS_FILE);
    const targetQuestions = questions.filter(q => questionIds.includes(q.id));
    
    if (targetQuestions.length !== questionIds.length) {
      return res.status(404).json({ message: 'Some questions not found' });
    }

    const recommendations = [];
    
    // Generate pairwise recommendations
    for (let i = 0; i < targetQuestions.length; i++) {
      for (let j = i + 1; j < targetQuestions.length; j++) {
        const question1 = targetQuestions[i];
        const question2 = targetQuestions[j];
        
        const features1 = aiService.extractQuestionFeatures(question1.title, question1.description);
        const features2 = aiService.extractQuestionFeatures(question2.title, question2.description);
        
        if (features1 && features2) {
          const similarity = aiService.calculateDuplicateSimilarity(features1, features2);
          const mergeRecommendation = aiService.getMergeRecommendation(question1, question2, similarity);
          const eligibility = aiService.validateMergeEligibility(question1, question2);
          
          recommendations.push({
            question1: question1.id,
            question2: question2.id,
            similarity: Math.round(similarity * 100),
            recommendation: mergeRecommendation,
            eligibility,
            reasons: aiService.getDuplicateReasons(features1, features2, similarity)
          });
        }
      }
    }

    // Filter by confidence level
    const filteredRecommendations = recommendations.filter(rec => {
      if (confidence === 'high') return rec.recommendation.confidence === 'high';
      if (confidence === 'medium') return ['high', 'medium'].includes(rec.recommendation.confidence);
      return true; // low confidence includes all
    });

    res.json({
      recommendations: filteredRecommendations,
      summary: {
        totalPairs: recommendations.length,
        filteredPairs: filteredRecommendations.length,
        highConfidence: recommendations.filter(r => r.recommendation.confidence === 'high').length,
        autoMergeEligible: recommendations.filter(r => r.recommendation.action === 'auto_merge').length
      }
    });
  } catch (error) {
    console.error('Error generating merge recommendations:', error);
    res.status(500).json({ message: 'Merge recommendations failed', error: error.message });
  }
});

// AI Merge Execution Plan
app.post('/api/ai/merge-execution-plan', (req, res) => {
  try {
    const { duplicateGroupId, questionIds } = req.body;
    
    if (!questionIds || questionIds.length < 2) {
      return res.status(400).json({ message: 'At least 2 question IDs required for merge plan' });
    }

    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    const targetQuestions = questions.filter(q => questionIds.includes(q.id));
    
    if (targetQuestions.length !== questionIds.length) {
      return res.status(404).json({ message: 'Some questions not found' });
    }

    // Create a mock duplicate group for execution planning
    const primaryQuestion = targetQuestions[0];
    const duplicateQuestions = targetQuestions.slice(1);
    
    const duplicateGroup = {
      primary: primaryQuestion,
      duplicates: duplicateQuestions.map(q => ({
        question: q,
        similarity: 0.85, // Mock similarity
        features: aiService.extractQuestionFeatures(q.title, q.description)
      })),
      confidence: 0.85,
      mergeStrategy: aiService.suggestMergeStrategy(primaryQuestion, duplicateQuestions.map(q => ({ question: q })), true)
    };

    const executionPlan = aiService.generateMergeExecutionPlan(duplicateGroup);
    
    // Add additional context
    const relatedAnswers = answers.filter(a => questionIds.includes(a.questionId));
    const totalAnswers = relatedAnswers.length;
    const totalVotes = targetQuestions.reduce((sum, q) => sum + q.votes, 0) + 
                     relatedAnswers.reduce((sum, a) => sum + a.votes, 0);

    res.json({
      executionPlan,
      context: {
        questionsToMerge: targetQuestions.length,
        totalAnswers,
        totalVotes,
        affectedUsers: [...new Set([
          ...targetQuestions.map(q => q.userId),
          ...relatedAnswers.map(a => a.userId)
        ])].length,
        estimatedImpact: totalAnswers > 10 ? 'high' : totalAnswers > 5 ? 'medium' : 'low'
      },
      recommendations: [
        'Notify affected users before merge',
        'Create backup of all content',
        'Test merge in staging environment',
        totalAnswers > 10 ? 'Schedule merge during low-traffic hours' : 'Merge can be performed anytime'
      ]
    });
  } catch (error) {
    console.error('Error generating merge execution plan:', error);
    res.status(500).json({ message: 'Merge execution plan failed', error: error.message });
  }
});

// AI Duplicate Detection for Single Question
app.post('/api/ai/check-duplicate', (req, res) => {
  try {
    const { title, description, excludeId } = req.body;
    
    if (!title && !description) {
      return res.status(400).json({ message: 'Title or description required' });
    }

    const questions = readDataFile(QUESTIONS_FILE);
    let candidates = questions;
    
    // Exclude specific question if provided
    if (excludeId) {
      candidates = questions.filter(q => q.id !== excludeId);
    }

    const queryFeatures = aiService.extractQuestionFeatures(title || '', description || '');
    if (!queryFeatures) {
      return res.json({ duplicates: [], confidence: 0 });
    }

    const duplicates = [];
    
    candidates.forEach(question => {
      const questionFeatures = aiService.extractQuestionFeatures(question.title, question.description);
      if (questionFeatures) {
        const similarity = aiService.calculateDuplicateSimilarity(queryFeatures, questionFeatures);
        
        if (similarity > 0.6) { // Lower threshold for suggestions
          duplicates.push({
            question: {
              id: question.id,
              title: question.title,
              description: question.description.substring(0, 200) + '...',
              votes: question.votes,
              answers: question.answers,
              createdAt: question.createdAt,
              tags: question.tags
            },
            similarity: Math.round(similarity * 100),
            reasons: aiService.getDuplicateReasons(queryFeatures, questionFeatures, similarity),
            recommendation: similarity > 0.8 ? 'likely_duplicate' : 'similar_question'
          });
        }
      }
    });

    // Sort by similarity
    duplicates.sort((a, b) => b.similarity - a.similarity);

    res.json({
      duplicates: duplicates.slice(0, 10),
      summary: {
        totalSimilar: duplicates.length,
        likelyDuplicates: duplicates.filter(d => d.recommendation === 'likely_duplicate').length,
        avgSimilarity: duplicates.length > 0 ? 
          Math.round(duplicates.reduce((sum, d) => sum + d.similarity, 0) / duplicates.length) : 0
      },
      queryAnalysis: {
        extractedTechnologies: queryFeatures.technologies,
        questionType: queryFeatures.questionType,
        keywords: queryFeatures.keywords.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    res.status(500).json({ message: 'Duplicate check failed', error: error.message });
  }
});

// AI Merge Validation
app.post('/api/ai/validate-merge', (req, res) => {
  try {
    const { questionIds, performChecks = true } = req.body;
    
    if (!questionIds || questionIds.length < 2) {
      return res.status(400).json({ message: 'At least 2 question IDs required' });
    }

    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    const targetQuestions = questions.filter(q => questionIds.includes(q.id));
    
    if (targetQuestions.length !== questionIds.length) {
      return res.status(404).json({ message: 'Some questions not found' });
    }

    const validationResults = [];
    let overallEligibility = true;
    const allIssues = [];
    const allWarnings = [];

    // Validate each pair
    for (let i = 0; i < targetQuestions.length; i++) {
      for (let j = i + 1; j < targetQuestions.length; j++) {
        const validation = aiService.validateMergeEligibility(targetQuestions[i], targetQuestions[j]);
        
        validationResults.push({
          question1: targetQuestions[i].id,
          question2: targetQuestions[j].id,
          eligible: validation.eligible,
          confidence: validation.confidence,
          issues: validation.issues,
          warnings: validation.warnings
        });

        if (!validation.eligible) {
          overallEligibility = false;
        }

        allIssues.push(...validation.issues);
        allWarnings.push(...validation.warnings);
      }
    }

    // Additional checks if requested
    let additionalChecks = {};
    if (performChecks) {
      const relatedAnswers = answers.filter(a => questionIds.includes(a.questionId));
      const hasAcceptedAnswers = targetQuestions.filter(q => q.acceptedAnswerId).length;
      const totalActivity = relatedAnswers.length + targetQuestions.reduce((sum, q) => sum + q.answers, 0);

      additionalChecks = {
        answerConflicts: hasAcceptedAnswers > 1,
        highActivity: totalActivity > 20,
        recentActivity: targetQuestions.some(q => {
          const daysSince = (Date.now() - new Date(q.updatedAt || q.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return daysSince < 7;
        }),
        userImpact: [...new Set([
          ...targetQuestions.map(q => q.userId),
          ...relatedAnswers.map(a => a.userId)
        ])].length
      };
    }

    res.json({
      overallEligibility,
      confidence: overallEligibility ? 
        (allWarnings.length === 0 ? 'high' : 'medium') : 'low',
      validationResults,
      summary: {
        totalPairs: validationResults.length,
        eligiblePairs: validationResults.filter(v => v.eligible).length,
        totalIssues: [...new Set(allIssues)].length,
        totalWarnings: [...new Set(allWarnings)].length
      },
      issues: [...new Set(allIssues)],
      warnings: [...new Set(allWarnings)],
      additionalChecks,
      recommendations: [
        !overallEligibility ? 'Resolve blocking issues before merge' : 'Merge can proceed',
        allWarnings.length > 0 ? 'Review warnings carefully' : 'No major concerns detected',
        additionalChecks.highActivity ? 'Consider notifying users' : 'Standard merge process applies',
        additionalChecks.recentActivity ? 'Coordinate with active users' : 'No recent activity conflicts'
      ]
    });
  } catch (error) {
    console.error('Error validating merge:', error);
    res.status(500).json({ message: 'Merge validation failed', error: error.message });
  }
});

// AI Engagement Insights Dashboard
app.get('/api/ai/engagement-insights', (req, res) => {
  try {
    const { 
      timeframe = 'month',
      minEngagementScore = 0.1,
      includeTrends = true,
      analyzePatterns = true
    } = req.query;
    
    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    
    const options = {
      timeframe,
      minEngagementScore: parseFloat(minEngagementScore),
      includeTrends: includeTrends === 'true',
      analyzePatterns: analyzePatterns === 'true'
    };

    const engagementAnalysis = aiService.analyzeContentEngagement(questions, answers, options);
    
    res.json({
      engagementAnalysis,
      configuration: options,
      generatedAt: new Date().toISOString(),
      dataRange: {
        questionsAnalyzed: engagementAnalysis.overview.totalQuestions,
        answersAnalyzed: engagementAnalysis.overview.totalAnswers,
        timeframe
      }
    });
  } catch (error) {
    console.error('Error analyzing engagement insights:', error);
    res.status(500).json({ message: 'Engagement insights analysis failed', error: error.message });
  }
});

// AI Engagement Report
app.get('/api/ai/engagement-report', (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    
    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    
    const engagementData = aiService.analyzeContentEngagement(questions, answers, { 
      timeframe,
      includeTrends: true,
      analyzePatterns: true
    });
    
    const report = aiService.generateEngagementReport(engagementData);
    
    res.json({
      report,
      metadata: {
        generatedAt: new Date().toISOString(),
        timeframe,
        dataPoints: engagementData.overview.totalQuestions + engagementData.overview.totalAnswers
      }
    });
  } catch (error) {
    console.error('Error generating engagement report:', error);
    res.status(500).json({ message: 'Engagement report generation failed', error: error.message });
  }
});

// AI Top Performing Content
app.get('/api/ai/top-performing-content', (req, res) => {
  try {
    const { 
      contentType = 'all',
      timeframe = 'month',
      limit = 10,
      minEngagement = 0.5
    } = req.query;
    
    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    
    const { filteredQuestions, filteredAnswers } = aiService.filterContentByTimeframe(questions, answers, timeframe);
    
    let topContent = {};
    
    if (contentType === 'all' || contentType === 'questions') {
      const questionEngagement = aiService.calculateQuestionEngagement(filteredQuestions, filteredAnswers);
      topContent.questions = questionEngagement
        .filter(q => q.engagementScore >= parseFloat(minEngagement))
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, parseInt(limit))
        .map(q => ({
          ...q,
          engagementPercentage: Math.round(q.engagementScore * 100),
          fullTitle: filteredQuestions.find(fq => fq.id === q.id)?.title,
          createdAt: filteredQuestions.find(fq => fq.id === q.id)?.createdAt,
          tags: filteredQuestions.find(fq => fq.id === q.id)?.tags
        }));
    }
    
    if (contentType === 'all' || contentType === 'answers') {
      const answerEngagement = aiService.calculateAnswerEngagement(filteredAnswers);
      topContent.answers = answerEngagement
        .filter(a => a.engagementScore >= parseFloat(minEngagement))
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, parseInt(limit))
        .map(a => ({
          ...a,
          engagementPercentage: Math.round(a.engagementScore * 100),
          questionId: filteredAnswers.find(fa => fa.id === a.id)?.questionId,
          author: filteredAnswers.find(fa => fa.id === a.id)?.username,
          createdAt: filteredAnswers.find(fa => fa.id === a.id)?.createdAt
        }));
    }

    res.json({
      topContent,
      summary: {
        timeframe,
        contentType,
        totalEligibleQuestions: topContent.questions?.length || 0,
        totalEligibleAnswers: topContent.answers?.length || 0,
        minEngagementThreshold: parseFloat(minEngagement),
        avgEngagement: {
          questions: topContent.questions?.length > 0 ? 
            topContent.questions.reduce((sum, q) => sum + q.engagementScore, 0) / topContent.questions.length : 0,
          answers: topContent.answers?.length > 0 ? 
            topContent.answers.reduce((sum, a) => sum + a.engagementScore, 0) / topContent.answers.length : 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting top performing content:', error);
    res.status(500).json({ message: 'Top performing content retrieval failed', error: error.message });
  }
});

// AI Engagement Trends
app.get('/api/ai/engagement-trends', (req, res) => {
  try {
    const { months = 12, contentType = 'all' } = req.query;
    
    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    
    // Get data for the specified number of months
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - parseInt(months));
    
    const filteredQuestions = questions.filter(q => new Date(q.createdAt) >= startDate);
    const filteredAnswers = answers.filter(a => new Date(a.createdAt) >= startDate);
    
    const trends = aiService.analyzeEngagementTrends(filteredQuestions, filteredAnswers);
    
    // Additional trend calculations
    const monthlyStats = trends.monthlyTrends.map(month => ({
      ...month,
      totalEngagement: (month.avgQuestionEngagement + month.avgAnswerEngagement) / 2,
      contentVolume: month.questionCount + month.answerCount,
      engagementEfficiency: month.totalContent > 0 ? 
        (month.avgQuestionEngagement + month.avgAnswerEngagement) / (2 * Math.log(month.totalContent + 1)) : 0
    }));

    res.json({
      trends: {
        ...trends,
        monthlyStats,
        overallTrendDirection: trends.trendDirection || 'stable',
        summary: {
          totalMonths: monthlyStats.length,
          avgMonthlyEngagement: monthlyStats.reduce((sum, m) => sum + m.totalEngagement, 0) / monthlyStats.length,
          bestMonth: monthlyStats.reduce((best, current) => 
            current.totalEngagement > best.totalEngagement ? current : best, monthlyStats[0]),
          growthRate: monthlyStats.length > 1 ? 
            ((monthlyStats[monthlyStats.length - 1].totalEngagement - monthlyStats[0].totalEngagement) / monthlyStats[0].totalEngagement) * 100 : 0
        }
      },
      insights: [
        trends.trendDirection === 'rising' ? 'Engagement is trending upward' : 
        trends.trendDirection === 'declining' ? 'Engagement is declining - review content strategy' : 
        'Engagement is stable',
        
        monthlyStats.length > 6 ? 
          `Average monthly growth: ${Math.round(((monthlyStats[monthlyStats.length - 1].totalEngagement - monthlyStats[0].totalEngagement) / monthlyStats[0].totalEngagement) * 100)}%` :
          'Need more data for trend analysis',
          
        monthlyStats.reduce((sum, m) => sum + m.contentVolume, 0) > 100 ? 
          'High content volume - focus on quality over quantity' : 
          'Consider increasing content creation'
      ]
    });
  } catch (error) {
    console.error('Error analyzing engagement trends:', error);
    res.status(500).json({ message: 'Engagement trends analysis failed', error: error.message });
  }
});

// AI Engagement Patterns
app.get('/api/ai/engagement-patterns', (req, res) => {
  try {
    const { analysisType = 'all', timeframe = 'month' } = req.query;
    
    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    
    const { filteredQuestions, filteredAnswers } = aiService.filterContentByTimeframe(questions, answers, timeframe);
    
    const questionEngagement = aiService.calculateQuestionEngagement(filteredQuestions, filteredAnswers);
    const answerEngagement = aiService.calculateAnswerEngagement(filteredAnswers);
    
    const patterns = aiService.analyzeEngagementPatterns(questionEngagement, answerEngagement);
    
    // Filter patterns based on analysis type
    let filteredPatterns = patterns;
    if (analysisType === 'questions') {
      filteredPatterns = { questionPatterns: patterns.questionPatterns };
    } else if (analysisType === 'answers') {
      filteredPatterns = { answerPatterns: patterns.answerPatterns };
    }

    // Generate actionable insights from patterns
    const actionableInsights = [];
    
    if (patterns.questionPatterns?.highEngagementFactors?.length > 0) {
      const topFactor = patterns.questionPatterns.highEngagementFactors[0];
      actionableInsights.push({
        type: 'question_optimization',
        insight: `Questions with "${topFactor.factor}" get ${topFactor.percentage}% better engagement`,
        action: `Encourage users to include ${topFactor.factor} in their questions`
      });
    }
    
    if (patterns.answerPatterns?.highEngagementFactors?.length > 0) {
      const topFactor = patterns.answerPatterns.highEngagementFactors[0];
      actionableInsights.push({
        type: 'answer_optimization',
        insight: `Answers with "${topFactor.factor}" get ${topFactor.percentage}% better engagement`,
        action: `Promote ${topFactor.factor} in answer guidelines`
      });
    }

    res.json({
      patterns: filteredPatterns,
      actionableInsights,
      summary: {
        analysisType,
        timeframe,
        questionsAnalyzed: questionEngagement.length,
        answersAnalyzed: answerEngagement.length,
        patternConfidence: patterns.questionPatterns?.highEngagementFactors?.length > 0 || 
                          patterns.answerPatterns?.highEngagementFactors?.length > 0 ? 'high' : 'medium'
      }
    });
  } catch (error) {
    console.error('Error analyzing engagement patterns:', error);
    res.status(500).json({ message: 'Engagement patterns analysis failed', error: error.message });
  }
});

// AI Content Engagement Score
app.post('/api/ai/score-engagement', (req, res) => {
  try {
    const { contentId, contentType } = req.body;
    
    if (!contentId || !contentType) {
      return res.status(400).json({ message: 'Content ID and type required' });
    }

    const questions = readDataFile(QUESTIONS_FILE);
    const answers = readDataFile(ANSWERS_FILE);
    
    let content = null;
    let engagementData = null;
    
    if (contentType === 'question') {
      content = questions.find(q => q.id === contentId);
      if (content) {
        const questionAnswers = answers.filter(a => a.questionId === contentId);
        const questionEngagement = aiService.calculateQuestionEngagement([content], questionAnswers);
        engagementData = questionEngagement[0];
      }
    } else if (contentType === 'answer') {
      content = answers.find(a => a.id === contentId);
      if (content) {
        const answerEngagement = aiService.calculateAnswerEngagement([content]);
        engagementData = answerEngagement[0];
      }
    }
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    res.json({
      contentId,
      contentType,
      engagementScore: Math.round(engagementData.engagementScore * 100),
      grade: engagementData.engagementScore >= 0.8 ? 'excellent' :
             engagementData.engagementScore >= 0.6 ? 'good' :
             engagementData.engagementScore >= 0.4 ? 'fair' : 'poor',
      factors: engagementData.factors,
      metrics: engagementData.metrics,
      recommendations: [
        engagementData.engagementScore < 0.5 ? 'Consider improving content quality' : 'Content performing well',
        engagementData.factors.length < 3 ? 'Add more engaging elements' : 'Good engagement factors present',
        contentType === 'question' && !engagementData.metrics.hasAcceptedAnswer ? 'Encourage answers to improve engagement' : null,
        contentType === 'answer' && engagementData.metrics.qualityScore < 0.6 ? 'Improve answer quality and detail' : null
      ].filter(Boolean)
    });
  } catch (error) {
    console.error('Error scoring content engagement:', error);
    res.status(500).json({ message: 'Content engagement scoring failed', error: error.message });
  }
});

// AI Writing Assistant
app.post('/api/ai/analyze-writing', (req, res) => {
  try {
    const { content, contentType = 'question', title = '' } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content required for writing analysis' });
    }

    const analysis = aiService.analyzeWritingQuality(content, contentType, title);
    
    res.json({
      analysis,
      recommendations: {
        overallGrade: analysis.overallScore >= 0.8 ? 'excellent' :
                     analysis.overallScore >= 0.6 ? 'good' :
                     analysis.overallScore >= 0.4 ? 'fair' : 'needs_improvement',
        primaryFocus: analysis.completenessScore < 0.6 ? 'completeness' :
                     analysis.clarityScore < 0.6 ? 'clarity' : 'readability',
        readyToPost: analysis.issues.filter(issue => issue.severity === 'high').length === 0
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        contentType,
        analysisConfidence: content.length > 50 ? 'high' : 'medium'
      }
    });
  } catch (error) {
    console.error('Error analyzing writing:', error);
    res.status(500).json({ message: 'Writing analysis failed', error: error.message });
  }
});

// AI Writing Templates
app.get('/api/ai/writing-templates', (req, res) => {
  try {
    const { contentType = 'question', topic = '' } = req.query;
    
    const templates = aiService.generateWritingTemplates(contentType, topic);
    
    res.json({
      templates,
      usage: {
        contentType,
        topic: topic || 'general',
        instructions: [
          'Choose a template that matches your content type',
          'Replace placeholder text with your specific information',
          'Customize sections based on your needs',
          'Use the structure as a guide, not a strict requirement'
        ]
      },
      tips: [
        'Be specific in your descriptions',
        'Include code examples when relevant',
        'Use proper formatting for better readability',
        'Consider your target audience when writing'
      ]
    });
  } catch (error) {
    console.error('Error generating writing templates:', error);
    res.status(500).json({ message: 'Writing templates generation failed', error: error.message });
  }
});

// AI Real-time Writing Assistance
app.post('/api/ai/writing-assistance', (req, res) => {
  try {
    const { content, contentType = 'question', cursorPosition = 0 } = req.body;
    
    if (!content) {
      return res.json({
        assistance: {
          suggestions: [],
          autocompletions: [],
          warnings: [],
          encouragement: []
        }
      });
    }

    const assistance = aiService.provideRealTimeAssistance(content, contentType, cursorPosition);
    
    // Add quick metrics for real-time feedback
    const metrics = aiService.calculateWritingMetrics(content);
    
    res.json({
      assistance,
      quickMetrics: {
        wordCount: metrics.wordCount,
        readabilityIndicator: metrics.avgWordsPerSentence > 30 ? 'complex' : 
                             metrics.avgWordsPerSentence > 20 ? 'moderate' : 'simple',
        hasCodeFormatting: metrics.hasCodeBlocks || metrics.hasInlineCode,
        hasStructure: metrics.hasLists || metrics.hasHeadings || metrics.paragraphCount > 1
      }
    });
  } catch (error) {
    console.error('Error providing writing assistance:', error);
    res.status(500).json({ message: 'Writing assistance failed', error: error.message });
  }
});

// AI Writing Improvement Plan
app.post('/api/ai/improvement-plan', (req, res) => {
  try {
    const { content, contentType = 'question', targetAudience = 'general' } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content required for improvement plan' });
    }

    const plan = aiService.generateImprovementPlan(content, contentType, targetAudience);
    const analysis = aiService.analyzeWritingQuality(content, contentType);
    
    res.json({
      improvementPlan: plan,
      currentAnalysis: {
        overallScore: Math.round(analysis.overallScore * 100),
        strengths: analysis.strengths,
        criticalIssues: analysis.issues.filter(issue => issue.severity === 'high'),
        suggestions: analysis.suggestions.filter(s => s.priority === 'high')
      },
      nextSteps: [
        plan.steps.length > 0 ? `Start with: ${plan.steps[0].action}` : 'Content looks good!',
        'Review and apply suggested improvements',
        'Test your content with the target audience',
        'Iterate based on feedback'
      ]
    });
  } catch (error) {
    console.error('Error generating improvement plan:', error);
    res.status(500).json({ message: 'Improvement plan generation failed', error: error.message });
  }
});

// AI Writing Metrics
app.post('/api/ai/writing-metrics', (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content required for metrics calculation' });
    }

    const metrics = aiService.calculateWritingMetrics(content);
    
    // Calculate additional insights
    const insights = {
      readabilityLevel: metrics.avgWordsPerSentence > 25 ? 'advanced' :
                      metrics.avgWordsPerSentence > 15 ? 'intermediate' : 'beginner',
      structureQuality: metrics.paragraphCount > 1 ? 'good' : 'needs_improvement',
      technicalContent: metrics.hasCodeBlocks || metrics.hasInlineCode,
      estimatedReadTime: Math.ceil(metrics.wordCount / 200), // minutes
      completenessIndicator: metrics.wordCount > 100 ? 'comprehensive' :
                           metrics.wordCount > 50 ? 'adequate' : 'brief'
    };
    
    res.json({
      metrics,
      insights,
      benchmarks: {
        idealWordCount: { min: 50, max: 300, current: metrics.wordCount },
        idealSentenceLength: { min: 15, max: 25, current: Math.round(metrics.avgWordsPerSentence) },
        idealParagraphs: { min: 2, max: 6, current: metrics.paragraphCount }
      },
      recommendations: [
        metrics.wordCount < 50 ? 'Consider adding more detail' : null,
        metrics.avgWordsPerSentence > 25 ? 'Break up long sentences' : null,
        metrics.paragraphCount === 1 && metrics.wordCount > 100 ? 'Add paragraph breaks' : null,
        !metrics.hasCodeBlocks && content.toLowerCase().includes('code') ? 'Add code formatting' : null
      ].filter(Boolean)
    });
  } catch (error) {
    console.error('Error calculating writing metrics:', error);
    res.status(500).json({ message: 'Writing metrics calculation failed', error: error.message });
  }
});

// AI Writing Suggestions
app.post('/api/ai/writing-suggestions', (req, res) => {
  try {
    const { content, contentType = 'question', focusArea = 'all' } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content required for suggestions' });
    }

    const analysis = aiService.analyzeWritingQuality(content, contentType);
    
    // Filter suggestions by focus area
    let filteredSuggestions = analysis.suggestions;
    if (focusArea !== 'all') {
      filteredSuggestions = analysis.suggestions.filter(s => s.type === focusArea);
    }

    // Prioritize suggestions
    const prioritizedSuggestions = filteredSuggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    res.json({
      suggestions: prioritizedSuggestions,
      quickWins: analysis.suggestions.filter(s => s.priority === 'high' && s.type === 'formatting'),
      criticalImprovements: analysis.suggestions.filter(s => s.priority === 'high' && s.type === 'improvement'),
      summary: {
        totalSuggestions: analysis.suggestions.length,
        highPriority: analysis.suggestions.filter(s => s.priority === 'high').length,
        focusArea,
        estimatedImprovementTime: analysis.suggestions.length * 2 // minutes per suggestion
      }
    });
  } catch (error) {
    console.error('Error generating writing suggestions:', error);
    res.status(500).json({ message: 'Writing suggestions generation failed', error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 StackIt AI-Powered Backend Server running on port ${PORT}`);
  console.log(`\n📋 Core API Endpoints:`);
  console.log(`- POST /api/auth/login`);
  console.log(`- POST /api/auth/register`);
  console.log(`- GET /api/questions`);
  console.log(`- GET /api/questions/:id`);
  console.log(`- POST /api/questions`);
  console.log(`- PUT /api/questions/:id/vote`);
  console.log(`- POST /api/answers`);
  console.log(`- PUT /api/answers/:id/vote`);
  console.log(`- PUT /api/answers/:id/accept`);
  console.log(`- GET /api/tags`);
  console.log(`- GET /api/users/:id`);
  console.log(`- GET /api/users/:id/stats`);
  console.log(`- GET /api/users/:id/medal`);
  console.log(`- GET /api/medals`);
  console.log(`\n🤖 AI Intelligence Layer Endpoints:`);
  console.log(`- POST /api/ai/similar-questions`);
  console.log(`- POST /api/ai/suggest-tags`);
  console.log(`- POST /api/ai/moderate-content`);
  console.log(`- POST /api/ai/score-answer`);
  console.log(`- GET /api/ai/smart-search`);
  console.log(`- GET /api/ai/analytics`);
  console.log(`- POST /api/ai/summarize-answer`);
  console.log(`- GET /api/ai/answer-insights/:answerId`);
  console.log(`- POST /api/ai/bulk-summarize`);
  console.log(`- GET /api/ai/recommendations/:userId`);
  console.log(`- GET /api/ai/user-profile/:userId`);
  console.log(`- GET /api/ai/trending-topics`);
  console.log(`- GET /api/ai/similar-users/:userId`);
  console.log(`- POST /api/ai/flag-content`);
  console.log(`- POST /api/ai/batch-flag-content`);
  console.log(`- GET /api/ai/moderator-queue`);
  console.log(`- GET /api/ai/flagging-insights`);
  console.log(`- POST /api/ai/auto-moderate`);
  console.log(`- GET /api/ai/extract-topics`);
  console.log(`- GET /api/ai/topic-hierarchy`);
  console.log(`- GET /api/ai/topic-clusters`);
  console.log(`- GET /api/ai/organize-by-topics`);
  console.log(`- POST /api/ai/recommend-topics`);
  console.log(`- GET /api/ai/topic-trends`);
  console.log(`- GET /api/ai/topic-network`);
  console.log(`- POST /api/ai/detect-duplicates`);
  console.log(`- POST /api/ai/merge-recommendations`);
  console.log(`- POST /api/ai/merge-execution-plan`);
  console.log(`- POST /api/ai/check-duplicate`);
  console.log(`- POST /api/ai/validate-merge`);
  console.log(`- GET /api/ai/engagement-insights`);
  console.log(`- GET /api/ai/engagement-report`);
  console.log(`- GET /api/ai/top-performing-content`);
  console.log(`- GET /api/ai/engagement-trends`);
  console.log(`- GET /api/ai/engagement-patterns`);
  console.log(`- POST /api/ai/score-engagement`);
  console.log(`\n✨ AI Features Active: Similar Questions, Auto-Tagging, Content Moderation, Quality Scoring, Answer Summarization, Recommendation Engine, Smart Flagging, Topic Extraction, Duplicate Merger, Engagement Insights`);
}); 