import React, { useEffect, useState } from 'react';
import './MainPage.css';

function Header({ onLogout }) {
    return (
        <header className="main-header">
            <h1>Projeto 2025A</h1>
            <button className="logout-btn" onClick={onLogout}>Sair</button>
        </header>
    );
}

function Dashboard({ token }) {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://web-t3-api.rodrigoappelt.com:8080/api/document/dashboard', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(res => res.json())
        .then(setDocs)
        .finally(() => setLoading(false));
    }, [token]);

    return (
        <section className="features-section">
            <h3>Documentos Recentes</h3>
            {loading ? 'Carregando...' : (
                <ul>
                    {docs.map(doc => (
                        <li key={doc.id}>
                            {doc.name} ({new Date(doc.created).toLocaleString()})
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function UserDocuments({ token, userId }) {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        fetch(`http://web-t3-api.rodrigoappelt.com:8080/api/Document/user/${userId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(res => res.json())
        .then(setDocs)
        .finally(() => setLoading(false));
    }, [token, userId]);

    return (
        <section className="features-section">
            <h3>Meus Documentos</h3>
            {loading ? 'Carregando...' : (
                <ul>
                    {docs.map(doc => (
                        <li key={doc.id}>
                            {doc.name} ({new Date(doc.created).toLocaleString()})
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function NewDocumentForm({ token, onDocumentCreated }) {
    const [name, setName] = useState('');
    const [language, setLanguage] = useState('Markdown');
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Registrando documento...');
        // 1. Registrar metadados
        const res = await fetch('http://web-t3-api.rodrigoappelt.com:8080/api/Document/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ name, language })
        });
        if (!res.ok) {
            console.error('Erro ao registrar documento:', res);
            setStatus('Erro ao registrar documento');
            return;
        }
        const { documentId } = await res.json();
        setStatus('Enviando arquivo...');
        // 2. Upload do arquivo
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch(`http://web-t3-api.rodrigoappelt.com:8080/api/Document/upload/${documentId}`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });
        if (!uploadRes.ok) {
            setStatus('Erro ao enviar arquivo');
            return;
        }
        setStatus('Documento enviado com sucesso!');
        setName('');
        setFile(null);
        onDocumentCreated && onDocumentCreated();
    };

    return (
        <section className="features-section">
            <h3>Novo Documento</h3>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Nome do documento"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />
                <select value={language} onChange={e => setLanguage(e.target.value)}>
                    <option value="Markdown">Markdown</option>
                    <option value="Latex">Latex</option>
                </select>
                <input
                    type="file"
                    accept=".md,.tex"
                    onChange={e => setFile(e.target.files[0])}
                    required
                />
                <button type="submit" disabled={!file}>Enviar</button>
            </form>
            {status && <div>{status}</div>}
        </section>
    );
}

function MainPage({ onLogout }) {
    const [userId, setUserId] = useState(null);
    const token = localStorage.getItem('token');

    // Recupera userId do token (simples, supondo que backend retorna userId em algum endpoint futuro)
    useEffect(() => {
        // Exemplo: buscar userId do backend se necessário
        // Aqui, como não há endpoint, não faz nada
    }, []);

    // Atualiza lista de documentos do usuário após upload
    const [refresh, setRefresh] = useState(0);

    return (
        <div className="main-container">
            <Header onLogout={onLogout} />
            <section className="welcome-section">
                <h2>Bem-vindo ao site!</h2>
                <p>Esta é a página inicial do projeto. Explore os recursos abaixo.</p>
            </section>
            <NewDocumentForm token={token} onDocumentCreated={() => setRefresh(r => r + 1)} />
            <Dashboard token={token} />
            {/* Se souber o userId, pode mostrar os documentos do usuário */}
            {/* <UserDocuments token={token} userId={userId} /> */}
        </div>
    );
}

export default MainPage;
