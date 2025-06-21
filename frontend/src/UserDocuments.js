import React, { useState, useEffect } from 'react';
import './UserDocuments.css';

function UserDocuments({ token, userId }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userName, setUserName] = useState('');

    useEffect(() => {
        fetchUserInfo();
        fetchDocuments();
    }, [token, userId]);

    const fetchUserInfo = async () => {
        try {
            const response = await fetch('http://web-t3.rodrigoappelt.com:8080/api/User/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            
            if (response.ok) {
                const userInfo = await response.json();
                setUserName(userInfo.username || userInfo.name || 'Usuário');
            }
        } catch (error) {
            console.error('Erro ao buscar informações do usuário:', error);
        }
    };

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://web-t3.rodrigoappelt.com:8080/api/Document/user/${userId}`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            
            if (response.ok) {
                const docs = await response.json();
                setDocuments(docs);
                console.log('Documentos carregados:', docs);
            } else {
                setError('Erro ao carregar documentos');
            }
        } catch (error) {
            setError('Erro de conexão');
            console.error('Erro:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (documentId) => {
        if (!window.confirm('Tem certeza que deseja excluir este documento?')) {
            return;
        }

        try {
            const response = await fetch(`http://web-t3.rodrigoappelt.com:8080/api/Document/${documentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (response.ok) {
                setDocuments(documents.filter(doc => doc.id !== documentId));
            } else {
                alert('Erro ao excluir documento');
            }
        } catch (error) {
            alert('Erro de conexão');
            console.error('Erro:', error);
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Data inválida';
        }
    };

    if (loading) {
        return (
            <div className="user-documents">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Carregando seus documentos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="user-documents">
                <div className="empty-state">
                    <div className="empty-icon">⚠️</div>
                    <h3 className="empty-title">Erro ao carregar</h3>
                    <p className="empty-message">{error}</p>
                    <button className="create-first-doc" onClick={fetchDocuments}>
                        🔄 Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="user-documents">
                <div className="empty-state">
                    <div className="empty-icon">📄</div>
                    <h3 className="empty-title">Nenhum documento encontrado</h3>
                    <p className="empty-message">
                        Você ainda não criou nenhum documento.<br />
                        Que tal começar criando seu primeiro documento?
                    </p>
                    <button className="create-first-doc" onClick={() => window.location.reload()}>
                        ✨ Criar primeiro documento
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="user-documents">
            <div className="documents-header">
                <div>
                    <h2 className="documents-title">Meus Documentos</h2>
                    <p className="documents-subtitle">Gerencie e visualize seus documentos</p>
                </div>
                <div className="documents-stats">
                    <div className="stat-item">
                        <span className="stat-number">{documents.length}</span>
                        <span className="stat-label">Documentos</span>
                    </div>
                </div>
            </div>

            <div className="documents-grid">
                {documents.map(doc => {
                    return (
                        <div key={doc.id} className="document-card">
                            <div className="document-header">
                                <div className="document-info">
                                    <h3>{doc.name}</h3>
                                    <div className="document-meta">
                                        <div className="meta-item">
                                            <span className="meta-icon">👤</span>
                                            <span>{userName}</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="meta-icon">📅</span>
                                            <span>{formatDate(doc.created)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="document-actions">
                                <a
                                    href={`http://web-t3.rodrigoappelt.com:8080/api/document/download/${doc.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="action-button primary"
                                >
                                    <span>📥</span>
                                    Download PDF
                                </a>
                                <button
                                    className="action-button secondary"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`http://web-t3.rodrigoappelt.com:8080/api/document/download/${doc.id}`);
                                        alert('Link copiado!');
                                    }}
                                >
                                    <span>🔗</span>
                                    Copiar Link
                                </button>
                                <button
                                    className="action-button danger"
                                    onClick={() => handleDelete(doc.id)}
                                >
                                    <span>🗑️</span>
                                    Excluir
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default UserDocuments;