import React, { useState, useEffect } from 'react';
import './CommunityTab.css';
import { copyShareLink } from './shareUtils';

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
                                    onClick={async () => {
                                        const result = await copyShareLink(doc.id, token);
                                        if (result.success) {
                                            // Criar toast de sucesso
                                            const toastElement = document.createElement('div');
                                            toastElement.className = 'custom-toast toast-success';
                                            toastElement.innerHTML = `
                                                <div class="toast-content">
                                                    <div class="toast-icon">✅</div>
                                                    <div class="toast-message">
                                                        <strong>Link compartilhado criado!</strong><br>
                                                        <small>Código: ${result.shortname}</small><br>
                                                        <small style="word-break: break-all;">${result.url}</small>
                                                    </div>
                                                    <button class="toast-close" onclick="this.parentElement.parentElement.remove()">✕</button>
                                                </div>
                                            `;
                                            toastElement.style.cssText = `
                                                position: fixed;
                                                top: 20px;
                                                right: 20px;
                                                z-index: 9999;
                                                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                                                color: white;
                                                padding: 12px 16px;
                                                border-radius: 8px;
                                                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                                                max-width: 400px;
                                                animation: slideInRight 0.3s ease;
                                            `;
                                            
                                            document.body.appendChild(toastElement);
                                            
                                            // Remover após 5 segundos
                                            setTimeout(() => {
                                                if (toastElement.parentElement) {
                                                    toastElement.style.animation = 'slideOutRight 0.3s ease';
                                                    setTimeout(() => {
                                                        toastElement.remove();
                                                    }, 300);
                                                }
                                            }, 5000);
                                        } else {
                                            // Criar toast de erro
                                            const errorToast = document.createElement('div');
                                            errorToast.className = 'custom-toast toast-error';
                                            errorToast.innerHTML = `
                                                <div class="toast-content">
                                                    <div class="toast-icon">❌</div>
                                                    <div class="toast-message">
                                                        <strong>Erro ao compartilhar</strong><br>
                                                        <small>${result.error}</small>
                                                    </div>
                                                    <button class="toast-close" onclick="this.parentElement.parentElement.remove()">✕</button>
                                                </div>
                                            `;
                                            errorToast.style.cssText = `
                                                position: fixed;
                                                top: 20px;
                                                right: 20px;
                                                z-index: 9999;
                                                background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                                                color: white;
                                                padding: 12px 16px;
                                                border-radius: 8px;
                                                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                                                max-width: 400px;
                                                animation: slideInRight 0.3s ease;
                                            `;
                                            
                                            document.body.appendChild(errorToast);
                                            
                                            setTimeout(() => {
                                                if (errorToast.parentElement) {
                                                    errorToast.style.animation = 'slideOutRight 0.3s ease';
                                                    setTimeout(() => {
                                                        errorToast.remove();
                                                    }, 300);
                                                }
                                            }, 4000);
                                        }
                                    }}
                                >
                                    <span>🔗</span>
                                    Copiar link
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