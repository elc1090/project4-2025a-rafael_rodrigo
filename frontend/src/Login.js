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
                `http://web-t3-api.rodrigoappelt.com:8080/api/User/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
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
                
                <div className="login-footer">
                    Ainda não tem conta? <a href="#">Cadastre-se</a>
                </div>
            </div>
        </div>
    );
}

export default Login;