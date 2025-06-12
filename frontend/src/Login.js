import React, { useState, useEffect } from 'react';
import './Login.css';
import texIcon from './img/texIcon.png';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const response = await fetch(
                `http://web-t3.rodrigoappelt.com:8080/api/User/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            
            if (!response.ok) {
                throw new Error('Usuário ou senha inválidos.');
            }
            
            const data = await response.json();
            localStorage.setItem('token', data.authToken);
            if (onLogin) onLogin();
            
        } catch (error) {
            setError(error.message || 'Erro ao conectar ao servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handleGitHubLogin = () => {
        window.location.href = 'http://web-t3.rodrigoappelt.com:8080/api/github/login';
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <img src={texIcon} alt="TexTogether Icon" style={{ width: 64, height: 64, margin: '0 auto 16px', display: 'block' }} />
                <h2 className="login-title">TexTogether</h2>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Usuário</label>
                        <input
                            id="username"
                            type="text"
                            className="form-control"
                            placeholder="Digite seu usuário"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Senha</label>
                        <input
                            id="password"
                            type="password"
                            className="form-control"
                            placeholder="Digite sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className={`login-btn ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? '' : 'Entrar'}
                    </button>
                    
                    {error && <div className="error-message">{error}</div>}
                </form>
                
                <div className="login-divider">
                    <span>ou</span>
                </div>
                
                <button 
                    type="button" 
                    className="github-login-btn"
                    onClick={handleGitHubLogin}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    Entrar com GitHub
                </button>
                
                <div className="login-footer">
                    Ainda não tem conta? <a href="#">Cadastre-se</a>
                </div>
            </div>
        </div>
    );
}

export default Login;