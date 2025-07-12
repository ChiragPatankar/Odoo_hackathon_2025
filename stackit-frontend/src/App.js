import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import HomePage from './components/HomePage';
import QuestionDetail from './components/QuestionDetail';
import AskQuestion from './components/AskQuestion';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

// Context for global state
const AppContext = createContext();

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('stackit_user');
    const savedToken = localStorage.getItem('stackit_token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('stackit_user', JSON.stringify(data.user));
        localStorage.setItem('stackit_token', data.token);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('stackit_user', JSON.stringify(data.user));
        localStorage.setItem('stackit_token', data.token);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stackit_user');
    localStorage.removeItem('stackit_token');
  };

  const contextValue = {
    user,
    login,
    register,
    logout,
    API_BASE_URL,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-blue-600" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-4 text-gray-600 text-lg">Loading StackIt...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Landing page route */}
            <Route path="/" element={
              <>
                <Header />
                <LandingPage />
              </>
            } />
            
            {/* Questions page route */}
            <Route path="/questions" element={
              <>
                <Header />
                <main className="container mx-auto px-4 py-8">
                  <HomePage />
                </main>
              </>
            } />
            
            {/* Question detail route */}
            <Route path="/questions/:id" element={
              <>
                <Header />
                <main className="container mx-auto px-4 py-8">
                  <QuestionDetail />
                </main>
              </>
            } />
            
            {/* Ask question route */}
            <Route path="/ask" element={
              user ? (
                <>
                  <Header />
                  <main className="container mx-auto px-4 py-8">
                    <AskQuestion />
                  </main>
                </>
              ) : (
                <Navigate to="/login" replace />
              )
            } />
            
            {/* Auth routes */}
            <Route path="/login" element={
              !user ? (
                <>
                  <Header />
                  <main className="container mx-auto px-4 py-8">
                    <Login />
                  </main>
                </>
              ) : (
                <Navigate to="/" replace />
              )
            } />
            
            <Route path="/register" element={
              !user ? (
                <>
                  <Header />
                  <main className="container mx-auto px-4 py-8">
                    <Register />
                  </main>
                </>
              ) : (
                <Navigate to="/" replace />
              )
            } />
            
            {/* Redirect all other routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AppContext.Provider>
  );
}

export default App;
