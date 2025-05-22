import React from 'react';
import './MainPage.css';

function Header({ onLogout }) {
    return (
        <header className="main-header">
            <h1>Projeto 2025A</h1>
            <button className="logout-btn" onClick={onLogout}>Sair</button>
        </header>
    );
}

function WelcomeSection() {
    return (
        <section className="welcome-section">
            <h2>Bem-vindo ao site!</h2>
            <p>Esta é a página inicial do projeto. Explore os recursos disponíveis no menu.</p>
        </section>
    );
}

function Features() {
    return (
        <section className="features-section">
            <h3>Funcionalidades</h3>
            <ul>
                <li>Autenticação de usuários</li>
                <li>Visualização de dados</li>
                <li>Design responsivo</li>
                {/* Adicione mais funcionalidades conforme necessário */}
            </ul>
        </section>
    );
}

function MainPage({ onLogout }) {
    return (
        <div className="main-container">
            <Header onLogout={onLogout} />
            <WelcomeSection />
            <Features />
        </div>
    );
}

export default MainPage;
