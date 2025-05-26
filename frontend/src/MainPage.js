import React, { useEffect, useState } from 'react';
import './MainPage.css';

function Header({ onLogout, userName }) {
    const initials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    
    return (
        <header className="main-header">
            <h1 className="header-title">TexCompiler</h1>
            <div className="header-nav">
                <div className="user-profile">
                    <div className="user-avatar">{initials}</div>
                    <span>{userName || 'Usuário'}</span>
                </div>
                <button className="logout-btn" onClick={onLogout}>Sair</button>
            </div>
        </header>
    );
}

function DocumentItem({ doc, onDownload }) {
    return (
        <li className="document-item">
            <div>
                <span className="document-name">{doc.name}</span>
                <span className="document-date">
                    {new Date(doc.created).toLocaleString()} • {doc.language === 2 ? 'LaTeX' : 'Markdown'}
                </span>
            </div>
            <div className="document-actions">
                <button className="download-btn" onClick={() => onDownload(doc.id)}>
                    Baixar PDF
                </button>
            </div>
        </li>
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

    const handleDownload = (docId) => {
        console.log('Download document:', docId);
        window.location.href = `http://web-t3-api.rodrigoappelt.com:8080/api/document/${docId}`;

    };

    return (
        <section className="features-section">
            <h3 className="section-title">Documentos Recentes da Comunidade</h3>
            {loading ? (
                <div>Carregando...</div>
            ) : (
                <ul className="document-list">
                    {docs.map(doc => (
                        <DocumentItem key={doc.id} doc={doc} onDownload={handleDownload} />
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

    const handleDownload = (docId) => {
        console.log('Download document:', docId);
        window.location.href = `http://web-t3-api.rodrigoappelt.com:8080/api/document/${docId}`;
    };

    return (
        <section className="features-section">
            <h3 className="section-title">Meus Documentos</h3>
            {loading ? (
                <div>Carregando...</div>
            ) : docs.length > 0 ? (
                <ul className="document-list">
                    {docs.map(doc => (
                        <DocumentItem key={doc.id} doc={doc} onDownload={handleDownload} />
                    ))}
                </ul>
            ) : (
                <div>Nenhum documento encontrado. Envie seu primeiro arquivo!</div>
            )}
        </section>
    );
}

function NewDocumentForm({ token, onDocumentCreated }) {
    const [name, setName] = useState('');
    const [language, setLanguage] = useState('Markdown');
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Registrando documento...' });
        
        try {
            const languageEnum = language === 'Markdown' ? 1 : 2;
            
            // 1. Registrar metadados
            const res = await fetch('http://web-t3-api.rodrigoappelt.com:8080/api/Document/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ name, language: languageEnum })
            });
            
            if (!res.ok) {
                throw new Error('Erro ao registrar documento');
            }
            
            const { documentId } = await res.json();
            setStatus({ type: 'loading', message: 'Enviando arquivo...' });
            
            // 2. Enviar arquivo
            const formData = new FormData();
            formData.append('file', file);
            
            const uploadRes = await fetch(`http://web-t3-api.rodrigoappelt.com:8080/api/document/upload/${documentId}`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                body: formData
            });
            
            if (!uploadRes.ok) {
                throw new Error('Erro ao enviar arquivo');
            }
            
            setStatus({ type: 'success', message: 'Documento enviado com sucesso!' });
            setName('');
            setFile(null);
            setFileName('');
            onDocumentCreated && onDocumentCreated();
            
        } catch (error) {
            console.error('Erro:', error);
            setStatus({ type: 'error', message: error.message || 'Ocorreu um erro ao processar o documento' });
        }
    };

    return (
        <section className="features-section">
            <h3 className="section-title">Novo Documento</h3>
            <form className="upload-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="doc-name">Nome do Documento</label>
                    <input
                        id="doc-name"
                        type="text"
                        className="form-control"
                        placeholder="Ex: Artigo Científico"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="doc-language">Linguagem</label>
                    <select
                        id="doc-language"
                        className="form-control"
                        value={language}
                        onChange={e => setLanguage(e.target.value)}
                    >
                        <option value="Markdown">Markdown</option>
                        <option value="Latex">LaTeX</option>
                    </select>
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="doc-file">Arquivo</label>
                    <input
                        id="doc-file"
                        type="file"
                        className="file-input"
                        accept={language === 'Latex' ? '.tex' : '.md'}
                        onChange={handleFileChange}
                        required
                    />
                    <label htmlFor="doc-file" className="file-label">
                        {fileName || `Clique para selecionar um arquivo .${language === 'Latex' ? 'tex' : 'md'}`}
                    </label>
                    {fileName && <div className="file-name">{fileName}</div>}
                </div>
                
                <button type="submit" className="submit-btn" disabled={!file}>
                    Enviar para Compilação
                </button>
                
                {status.message && (
                    <div className={`status-message status-${status.type}`}>
                        {status.message}
                    </div>
                )}
            </form>
        </section>
    );
}

function MainPage({ onLogout }) {
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState('Usuário Teste'); // Substituir por dados reais
    const token = localStorage.getItem('token');
    const [activeTab, setActiveTab] = useState('upload');

    // Recupera userId e userName do token (simulação)
    useEffect(() => {
        // Simulação - substituir por chamada real à API
        setUserId(1);
        setUserName('João Silva');
    }, []);

    // Atualiza lista de documentos do usuário após upload
    const [refresh, setRefresh] = useState(0);

    return (
        <div className="main-container">
            <Header onLogout={onLogout} userName={userName} />
            
            <section className="welcome-section">
                <h2>Bem-vindo ao TexCompiler, {userName}!</h2>
                <p>Envie seus arquivos LaTeX ou Markdown e receba o PDF compilado em instantes.</p>
            </section>
            
            <div className="features-section">
                <div className="tabs">
                    <div 
                        className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        Novo Upload
                    </div>
                    <div 
                        className={`tab ${activeTab === 'my-docs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('my-docs')}
                    >
                        Meus Documentos
                    </div>
                    <div 
                        className={`tab ${activeTab === 'community' ? 'active' : ''}`}
                        onClick={() => setActiveTab('community')}
                    >
                        Comunidade
                    </div>
                </div>
                
                {activeTab === 'upload' && (
                    <NewDocumentForm 
                        token={token} 
                        onDocumentCreated={() => {
                            setRefresh(r => r + 1);
                            setActiveTab('my-docs');
                        }} 
                    />
                )}
                
                {activeTab === 'my-docs' && (
                    <UserDocuments token={token} userId={userId} key={`user-${refresh}`} />
                )}
                
                {activeTab === 'community' && (
                    <Dashboard token={token} key={`dash-${refresh}`} />
                )}
            </div>
        </div>
    );
}

export default MainPage;