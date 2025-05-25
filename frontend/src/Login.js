import React, { useState } from 'react';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
        const response = await fetch(
            `http://web-t3-api.rodrigoappelt.com:8080/api/User/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }
        );
        if (!response.ok) {
            setError('Usuário ou senha inválidos.');
            return;
        }
        const data = await response.json();
        localStorage.setItem('token', data.authToken);
        if (onLogin) onLogin();
    } catch {
        setError('Erro ao conectar ao servidor.');
    }
    };

    return (
        <div style={{
            maxWidth: 300, margin: '100px auto', padding: 20,
            background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001'
        }}>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Usuário"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    style={{ width: '100%', margin: '8px 0', padding: 8 }}
                />
                <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', margin: '8px 0', padding: 8 }}
                />
                <button type="submit" style={{ width: '100%', padding: 8 }}>Entrar</button>
                {error && <div style={{ color: 'red' }}>{error}</div>}
            </form>
        </div>
    );
}

export default Login;
