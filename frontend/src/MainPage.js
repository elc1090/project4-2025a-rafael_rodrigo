import React, { useEffect, useState } from 'react';
import './MainPage.css';

function Header({ onLogout, userName }) {
    const initials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    
    return (
        <header className="main-header">
            <h1 className="header-title">TexTogether</h1>
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

function DocumentItem({ doc, onDownload, onDelete, onRename, userName, canEdit }) {
    return (
        <li className="document-item">
            <div>
                <span className="document-name">{doc.name}</span>
                <span style={{ margin: '0 8px', color: '#888' }}>•</span>
                <span className="document-date">
                    {new Date(doc.created).toLocaleString()} • {userName || 'Usuário'}
                </span>
            </div>
            <div className="document-actions">
                <button className="download-btn" onClick={() => onDownload(doc.id)}>
                    Baixar PDF
                </button>
                {canEdit && (
                    <>
                        <button className="edit-btn" onClick={() => onRename(doc)}>
                            Renomear
                        </button>
                        <button className="delete-btn" onClick={() => onDelete(doc.id)}>
                            Excluir
                        </button>
                    </>
                )}
            </div>
        </li>
    );
}

function Dashboard({ token }) {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userNames, setUserNames] = useState({});

    useEffect(() => {
        fetch('http://web-t3.rodrigoappelt.com:8080/api/document/dashboard', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(res => res.json())
        .then(async docsData => {
            setDocs(docsData);
            // Busca nomes dos usuários para cada documento
            const userIds = [...new Set(docsData.map(doc => doc.userId))];
            const namesObj = {};
            await Promise.all(userIds.map(async userId => {
                try {
                    const res = await fetch(`http://web-t3.rodrigoappelt.com:8080/api/user/${userId}`, {
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        namesObj[userId] = data.name;
                    }
                } catch {}
            }));
            setUserNames(namesObj);
        })
        .finally(() => setLoading(false));
    }, [token]);

    const handleDownload = (docId) => {
        console.log('Download document:', docId);
        window.location.href = `http://web-t3.rodrigoappelt.com:8080/api/document/${docId}`;

    };

    return (
        console.log('Rendering Dashboard with docs:', docs),
        <section className="features-section">
            <h3 className="section-title">Documentos recentes da comunidade</h3>
            {loading ? (
                <div>Carregando...</div>
            ) : (
                <ul className="document-list">
                    {docs.map(doc => (
                        <DocumentItem
                            key={doc.id}
                            doc={doc}
                            onDownload={handleDownload}
                            userName={userNames[doc.userId]}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}

function UserDocuments({ token, userId }) {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [renamingDoc, setRenamingDoc] = useState(null);
    const [newName, setNewName] = useState('');
    const [deletingDoc, setDeletingDoc] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        if (!userId) return;
        fetch(`http://web-t3.rodrigoappelt.com:8080/api/Document/user/${userId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(res => res.json())
        .then(setDocs)
        .finally(() => setLoading(false));
    }, [token, userId, status]);

    const handleDownload = (docId) => {
        console.log('Download document:', docId);
        window.location.href = `http://web-t3.rodrigoappelt.com:8080/api/document/${docId}`;
    };

     const handleDelete = async (docId) => {
        setStatus({ type: 'loading', message: 'Excluindo documento...' });
        try {
            const res = await fetch(`http://web-t3.rodrigoappelt.com:8080/api/document/delete?documentId=${docId}`, {
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!res.ok) throw new Error('Erro ao excluir documento');
            setStatus({ type: 'success', message: 'Documento excluído com sucesso!' });
            setDeletingDoc(null);
        } catch (e) {
            setStatus({ type: 'error', message: e.message });
        }
        setTimeout(() => setStatus({ type: '', message: '' }), 2000);
    };

    const handleRename = (doc) => {
        setRenamingDoc(doc);
        setNewName(doc.name);
    };

    const submitRename = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Renomeando documento...' });
        try {
            const res = await fetch(
                `http://web-t3.rodrigoappelt.com:8080/api/document/rename?documentId=${renamingDoc.id}&newName=${encodeURIComponent(newName)}`,
                {
                    method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + token }
                }
            );
            if (!res.ok) throw new Error('Erro ao renomear documento');
            setStatus({ type: 'success', message: 'Documento renomeado com sucesso!' });
            setRenamingDoc(null);
        } catch (e) {
            setStatus({ type: 'error', message: e.message });
        }
        setTimeout(() => setStatus({ type: '', message: '' }), 2000);
    };

    return (
        <section className="features-section">
            <h3 className="section-title">Meus documentos</h3>
            {loading ? (
                <div>Carregando...</div>
            ) : docs.length > 0 ? (
                <ul className="document-list">
                    {docs.map(doc => (
                        <DocumentItem
                            key={doc.id}
                            doc={doc}
                            onDownload={handleDownload}
                            onDelete={() => setDeletingDoc(doc.id)}
                            onRename={handleRename}
                            canEdit={true}
                        />
                    ))}
                </ul>
            ) : (
                <div>Nenhum documento encontrado. Envie seu primeiro arquivo!</div>
            )}
            {renamingDoc && (
                <div className="rename-modal">
                    <form className="rename-form" onSubmit={submitRename}>
                        <h4 className="confirmation-title">Renomear Documento</h4>
                        <div className="form-group">
                            <label>Novo nome:</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                required
                                autoFocus
                                className="form-control"
                            />
                        </div>
                        <div className="confirmation-buttons">
                            <button type="button" className="cancel-btn" onClick={() => setRenamingDoc(null)}>
                                Cancelar
                            </button>
                            <button type="submit" className="submit-btn" style={{ padding: '8px 16px' }}>
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal de confirmação de exclusão */}
            {deletingDoc && (
                <div className="confirmation-modal">
                    <div className="confirmation-box">
                        <h4 className="confirmation-title">Confirmar Exclusão</h4>
                        <p className="confirmation-message">
                            Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
                        </p>
                        <div className="confirmation-buttons">
                            <button 
                                className="cancel-btn" 
                                onClick={() => setDeletingDoc(null)}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="confirm-btn" 
                                onClick={() => handleDelete(deletingDoc)}
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {status.message && (
                <div className={`status-message status-${status.type}`}>
                    {status.message}
                </div>
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
            const res = await fetch('http://web-t3.rodrigoappelt.com:8080/api/Document/register', {
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
            
            const uploadRes = await fetch(`http://web-t3.rodrigoappelt.com:8080/api/document/upload/${documentId}`, {
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
                    <label htmlFor="doc-name">Nome do documento</label>
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
                    Enviar para compilação
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
    const [userName, setUserName] = useState('');
    const token = localStorage.getItem('token');
    const [activeTab, setActiveTab] = useState('upload');

    useEffect(() => {
        // Busca dados do usuário autenticado
        if (!token) return;
        fetch('http://web-t3.rodrigoappelt.com:8080/api/user/me', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            if (data) {
                setUserId(data.id);
                setUserName(data.name);
            }
        });
    }, [token]);

    // Atualiza lista de documentos do usuário após upload
    const [refresh, setRefresh] = useState(0);

    return (
        <div className="main-container">
            <Header onLogout={onLogout} userName={userName} />
            
            <section className="welcome-section">
                <h2>Bem-vindo ao TexTogether, {userName || 'Usuário'}!</h2>
                <p>Envie seus arquivos LaTeX ou Markdown e receba o PDF compilado em instantes.</p>
            </section>
            
            <div className="features-section">
                <div className="tabs">
                    <div 
                        className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        Novo upload
                    </div>
                    <div 
                        className={`tab ${activeTab === 'my-docs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('my-docs')}
                    >
                        Meus documentos
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