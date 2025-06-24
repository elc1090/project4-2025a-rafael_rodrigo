import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import MainPage from './MainPage';
import Register from './Register'; // Certifique-se de importar o componente Register
import useGitHubToken from './useGitHubToken';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showRegister, setShowRegister] = useState(false);
    const { token, setToken } = useGitHubToken();

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        if (token) {
            // Verify token is still valid
            fetch('http://web-t3.rodrigoappelt.com:8080/api/user/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            })
            .then(response => {
                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    localStorage.removeItem('token');
                    setIsAuthenticated(false);
                }
            })
            .catch(() => {
                localStorage.removeItem('token');
                setIsAuthenticated(false);
            })
            .finally(() => {
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, []);

    const handleLogin = (newToken) => {
        console.log('Login successful, setting token:', newToken);
        if (newToken) {
            localStorage.setItem('token', newToken);
            setToken(newToken);
        }
        setIsAuthenticated(true);
        setShowRegister(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        setToken(null);
        setIsAuthenticated(false);
        setShowRegister(false);
    };

    const handleShowRegister = () => {
        setShowRegister(true);
    };

    const handleShowLogin = () => {
        setShowRegister(false);
    };

    if (isLoading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                background: 'linear-gradient(135deg, #4a6741 0%, #4ca1af 50%, #5db3c1 100%)'
            }}>
                <div style={{ color: 'white', fontSize: '1.2rem' }}>Carregando...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return showRegister ? 
            <Register onRegister={handleLogin} onShowLogin={handleShowLogin} /> :
            <Login onLogin={handleLogin} onShowRegister={handleShowRegister} />;
    }

    return <MainPage onLogout={handleLogout} />;
}

export default App;
