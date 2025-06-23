import React, { useState, useEffect } from 'react';
import './CommunityTab.css';

function CommunityTab({ token }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCommunityDocuments();
    }, [token]);

    const fetchCommunityDocuments = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await fetch('http://web-t3.rodrigoappelt.com:8080/api/document/dashboard?limit=10&offset=0', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            
            if (response.ok) {
                const docs = await response.json();
                console.log('Documentos recebidos:', docs);
                const userIds = [...new Set(docs.map(doc => doc.userId))];
                const namesObject = {};
                await Promise.all(userIds.map(async (userId) => {
                    try {
                        const userResponse = await fetch(`http://web-t3.rodrigoappelt.com:8080/api/User/${userId}`, {
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                        if (userResponse.ok) {
                            const userData = await userResponse.json();
                            namesObject[userId] = userData.name;
                        } else {
                            namesObject[userId] = 'Usuário Desconhecido';
                        }
                    } catch (error) {
                        console.error(`Erro ao buscar usuário ${userId}:`, error);
                        namesObject[userId] = 'Usuário Desconhecido';
                    }
                }));
                docs.forEach(doc => {
                    doc.userName = namesObject[doc.userId];
                });
                console.log('Documentos da comunidade carregados:', docs);
                setDocuments(docs);
            } else {
                setError('Erro ao carregar documentos da comunidade');
            }
        } catch (error) {
            setError('Erro de conexão');
            console.error('Erro:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (docId) => {
        window.open(`http://web-t3.rodrigoappelt.com:8080/api/document/download/${docId}`, '_blank');
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

    const getLanguageDisplay = (language) => {
        switch (language) {
            case 1: return { name: 'Markdown', class: 'markdown' };
            case 2: return { name: 'LaTeX', class: 'latex' };
            default: return { name: 'Desconhecido', class: 'unknown' };
        }
    };

    if (loading) {
        return (
            <div className="community-tab">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Carregando documentos da comunidade...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="community-tab">
                <div className="empty-state">
                    <div className="empty-icon">⚠️</div>
                    <h3 className="empty-title">Erro ao carregar</h3>
                    <p className="empty-message">{error}</p>
                    <button className="retry-btn" onClick={fetchCommunityDocuments}>
                        🔄 Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="community-tab">
                <div className="empty-state">
                    <div className="empty-icon">🌍</div>
                    <h3 className="empty-title">Nenhum documento público encontrado</h3>
                    <p className="empty-message">
                        A comunidade ainda não compartilhou documentos.<br />
                        Seja o primeiro a compartilhar!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="community-tab">
            <div className="community-header">
                <div>
                    <h2 className="community-title">Documentos da Comunidade</h2>
                    <p className="community-subtitle">Explore documentos públicos criados pela comunidade</p>
                </div>
                <div className="community-stats">
                    <div className="stat-item">
                        <span className="stat-number">{documents.length}</span>
                        <span className="stat-label">Documentos</span>
                    </div>
                    <button 
                        className="refresh-btn" 
                        onClick={fetchCommunityDocuments}
                        title="Atualizar"
                    >
                        🔄 Atualizar
                    </button>
                </div>
            </div>

            <div className="community-grid">
                {documents.map(doc => {
                    const languageInfo = getLanguageDisplay(doc.documentLanguage);
                    return (
                        <div key={doc.id} className="community-card">
                            <div className="community-card-header">
                                <div className="document-info">
                                    <h3>{doc.title}</h3>
                                    <div className="document-meta">
                                        <div className="meta-item">
                                            <span className="meta-icon">👤</span>
                                            <span>{doc.userName || 'Usuário Desconhecido'}</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="meta-icon">📅</span>
                                            <span>{formatDate(doc.lastModificationTime)}</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="meta-icon">📝</span>
                                            <span className={`document-type ${languageInfo.class}`}>
                                                {languageInfo.name}
                                            </span>
                                        </div>
                                        {doc.isPublic && (
                                            <div className="meta-item">
                                                <span className="meta-icon">🌍</span>
                                                <span>Público</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="community-actions">
                                <button
                                    className="action-button primary"
                                    onClick={() => handleDownload(doc.id)}
                                >
                                    <span>📥</span>
                                    Download PDF
                                </button>
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
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CommunityTab;