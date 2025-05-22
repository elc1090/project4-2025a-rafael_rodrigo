import React, { useState } from 'react';
import Login from './Login';
import MainPage from './MainPage';

function App() {
    const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));

    return loggedIn
        ? <MainPage onLogout={() => {
            localStorage.removeItem('token');
            setLoggedIn(false);
        }} />
        : <Login onLogin={() => setLoggedIn(true)} />;
}

export default App;
