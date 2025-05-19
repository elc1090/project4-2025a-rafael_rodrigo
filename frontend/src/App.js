import React, { useState, useEffect } from 'react';
import Login from './Login';

function Home({ onLogout }) {
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            onLogout();
            return;
        }
        fetch('http://localhost:5083/api/User', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(data => setUserInfo(data))
        .catch(() => {
            localStorage.removeItem('token');
            onLogout();
        });
    }, [onLogout]);

    return (
        <div>
            <h2>Bem-vindo!</h2>
            <button onClick={() => {
                localStorage.removeItem('token');
                onLogout();
            }}>Sair</button>
            <div>
                {userInfo ? `Usuário: ${userInfo.username}` : 'Carregando...'}
            </div>
        </div>
    );
}

function App() {
    const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));

    return loggedIn
        ? <Home onLogout={() => setLoggedIn(false)} />
        : <Login onLogin={() => setLoggedIn(true)} />;
}

export default App;
