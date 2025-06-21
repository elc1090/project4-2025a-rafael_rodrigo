import React, { useEffect, useState } from 'react';
import './MainPage.css';
import DocumentEditor from './DocumentEditor';
import UserDocuments from './UserDocuments';

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

/*function UserDocuments({ token, userId }) {
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
            )}*/

            {/* Modal de confirmação de exclusão */}
            /*
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
*/
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
    const [currentView, setCurrentView] = useState('home');
    const [refresh, setRefresh] = useState(0);

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
    const renderCurrentView = () => {
        switch(currentView) {
            case 'editor':
                return (
                    <div className="content-area editor-view">
                        <DocumentEditor 
                            token={token} 
                            onDocumentCreated={() => {
                                setRefresh(r => r + 1);
                                setCurrentView('my-docs');
                            }} 
                        />
                    </div>
                );
            
            case 'upload':
                return (
                    <div className="content-area">
                        <div className="page-header">
                            <h2>Novo Upload</h2>
                            <p>Envie seus arquivos LaTeX ou Markdown para compilação</p>
                        </div>
                        <div className="content-card">
                            <NewDocumentForm 
                                token={token} 
                                onDocumentCreated={() => {
                                    setRefresh(r => r + 1);
                                    setCurrentView('my-docs');
                                }} 
                            />
                        </div>
                    </div>
                );
            
            case 'my-docs':
                return (
                    <div className="content-area">
                        <div className="page-header">
                            <h2>Meus Documentos</h2>
                            <p>Gerencie e visualize seus documentos compilados</p>
                        </div>
                        <div className="content-card">
                            <UserDocuments token={token} userId={userId} key={`user-${refresh}`} />
                        </div>
                    </div>
                );
            
            case 'community':
                return (
                    <div className="content-area">
                        <div className="page-header">
                            <h2>Comunidade</h2>
                            <p>Explore documentos públicos da comunidade</p>
                        </div>
                        <div className="content-card">
                            <Dashboard token={token} key={`dash-${refresh}`} />
                        </div>
                    </div>
                );
            
            default:
                return (
                    <div className="content-area">
                        <div className="page-header">
                            <h2>Bem-vindo ao TexTogether, {userName || 'Usuário'}!</h2>
                            <p>Plataforma completa para criação e compilação de documentos LaTeX e Markdown</p>
                        </div>
                        
                        <div className="content-grid">
                            <div className="feature-card">
                                <h3>📝 Editor Online</h3>
                                <p>Editor completo com syntax highlighting, auto-complete e templates para LaTeX e Markdown</p>
                            </div>
                            <div className="feature-card">
                                <h3>📤 Upload Rápido</h3>
                                <p>Faça upload dos seus arquivos existentes e compile instantaneamente</p>
                            </div>
                            <div className="feature-card">
                                <h3>📚 Biblioteca</h3>
                                <p>Organize e gerencie todos os seus documentos em um só lugar</p>
                            </div>
                            <div className="feature-card">
                                <h3>🌐 Comunidade</h3>
                                <p>Compartilhe e descubra documentos públicos da comunidade</p>
                            </div>
                        </div>
                        
                        <div className="quick-actions">
                            <button 
                                className="action-btn" 
                                onClick={() => setCurrentView('editor')}
                            >
                                ✨ Criar Documento
                            </button>
                            <button 
                                className="action-btn secondary" 
                                onClick={() => setCurrentView('upload')}
                            >
                                📁 Fazer Upload
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="main-container">
            <div className="navigation-header">
                <div className="nav-brand">
                    <h1>TexTogether</h1>
                    <p className="nav-welcome">Olá, {userName || 'Usuário'}!</p>
                </div>
                
                <div className="nav-buttons">
                    <button 
                        className={`nav-btn ${currentView === 'home' ? 'active' : ''}`}
                        onClick={() => setCurrentView('home')}
                    >
                        🏠 Início
                    </button>
                    <button 
                        className={`nav-btn ${currentView === 'editor' ? 'active' : ''}`}
                        onClick={() => setCurrentView('editor')}
                    >
                        ✏️ Editor
                    </button>
                    <button 
                        className={`nav-btn ${currentView === 'upload' ? 'active' : ''}`}
                        onClick={() => setCurrentView('upload')}
                    >
                        📤 Upload
                    </button>
                    <button 
                        className={`nav-btn ${currentView === 'my-docs' ? 'active' : ''}`}
                        onClick={() => setCurrentView('my-docs')}
                    >
                        📚 Meus Docs
                    </button>
                    <button 
                        className={`nav-btn ${currentView === 'community' ? 'active' : ''}`}
                        onClick={() => setCurrentView('community')}
                    >
                        🌐 Comunidade
                    </button>
                    <button 
                        className="nav-btn logout"
                        onClick={onLogout}
                    >
                        🚪 Sair
                    </button>
                </div>
            </div>
            
            <div className="main-content">
                {renderCurrentView()}
            </div>
        </div>
    );
}

export default MainPage;