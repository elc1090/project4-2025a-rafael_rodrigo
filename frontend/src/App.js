import React, { useState } from 'react';
import './App.css';
import Login from './Login';
import MainPage from './MainPage';
import useGitHubToken from './useGitHubToken';

function App() {
  const { token, setToken, isLoading } = useGitHubToken();
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  // Mostrar loading enquanto verifica token da URL
  if (isLoading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {token ? (
        <MainPage token={token} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
