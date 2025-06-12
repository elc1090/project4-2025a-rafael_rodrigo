import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import MainPage from './MainPage';

function App() {
    const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));
    const [showRegister, setShowRegister] = useState(false);

    if (loggedIn) {
        return <MainPage onLogout={() => {
            localStorage.removeItem('token');
            setLoggedIn(false);
        }} />;
    }

    if (showRegister) {
        return <Register 
            onRegister={() => setLoggedIn(true)}
            onBackToLogin={() => setShowRegister(false)}
        />;
    }

    return <Login 
        onLogin={() => setLoggedIn(true)}
        onShowRegister={() => setShowRegister(true)}
    />;
}

export default App;
