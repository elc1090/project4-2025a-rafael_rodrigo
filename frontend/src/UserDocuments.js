import React, { useState, useEffect } from 'react';
import './UserDocuments.css';
import { copyShareLink } from './shareUtils';

function UserDocuments({ token, userId, onEditDocument }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userName, setUserName] = useState('');
    const [renamingDoc, setRenamingDoc] = useState(null);
    const [newName, setNewName] = useState('');
    const [aiSummaryDoc, setAiSummaryDoc] = useState(null);
    const [aiSummary, setAiSummary] = useState('');
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);

    useEffect(() => {
        fetchUserInfo();
        fetchDocuments();
    }, [token, userId]);

    const fetchUserInfo = async () => {
        try {
            const response = await fetch('http://web-t3.rodrigoappelt.com:8080/api/user/me', {
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
            const response = await fetch(`http://web-t3.rodrigoappelt.com:8080/api/document/user/${userId}?limit=10&offset=0`, {
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
            const response = await fetch(`http://web-t3.rodrigoappelt.com:8080/api/document/delete?documentId=${documentId}`, {
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (response.ok) {
                setDocuments(documents.filter(doc => doc.id !== documentId));
            } else if (response.status === 404) {
                alert('Documento não encontrado');
            } else if (response.status === 401) {
                alert('Não autorizado a excluir este documento');
            } else {
                alert('Erro ao excluir documento');
            }
        } catch (error) {
            alert('Erro de conexão');
            console.error('Erro:', error);
        }
    };

    const handleRename = async (doc) => {
        setRenamingDoc(doc);
        setNewName(doc.title);
    };

    const submitRename = async () => {
        if (!newName.trim()) {
            alert('Nome não pode estar vazio');
            return;
        }

        try {
            const response = await fetch(`http://web-t3.rodrigoappelt.com:8080/api/document/rename?documentId=${renamingDoc.id}&newName=${encodeURIComponent(newName)}`, {
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (response.ok) {
                setDocuments(documents.map(doc => 
                    doc.id === renamingDoc.id ? { ...doc, title: newName } : doc
                ));
                setRenamingDoc(null);
                setNewName('');
            } else {
                alert('Erro ao renomear documento');
            }
        } catch (error) {
            alert('Erro de conexão');
            console.error('Erro:', error);
        }
    };

    const handleEdit = async (doc) => {
        // Pass the document to the parent component to open the editor
        onEditDocument && onEditDocument({
            id: doc.id,
            title: doc.title,
            sourceCode: doc.sourceCode,
            language: doc.documentLanguage === 1 ? 'markdown' : 'latex'
        });
    };

    const handleViewPDF = (docId) => {
        window.open(`http://web-t3.rodrigoappelt.com:8080/api/document/${docId}/pdf`, '_blank');
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

    const handleAiSummarize = async (doc) => {
        setAiSummaryDoc(doc);
        setIsLoadingSummary(true);
        setAiSummary('');
        
        try {
            const response = await fetch(`http://web-t3.rodrigoappelt.com:8080/api/ai/summarize?documentId=${doc.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            console.log('Chamando API de IA para resumo:', response);
            if (response.ok) {
                const summaryData = await response.text();
                console.log('Resposta da IA:', summaryData);
                setAiSummary(summaryData);
            } else if (response.status === 400) {
                setAiSummary('Erro: Documento não encontrado ou inválido');
            } else if (response.status === 500) {
                setAiSummary('Erro: Falha no servidor de IA. Tente novamente mais tarde.');
            } else {
                setAiSummary('Erro: Não foi possível gerar o resumo');
            }
        } catch (error) {
            console.error('Erro na API de IA:', error);
            setAiSummary('Erro de conexão: ' + error.message);
        } finally {
            setIsLoadingSummary(false);
        }
    };

    const closeAiModal = () => {
        setAiSummaryDoc(null);
        setAiSummary('');
        setIsLoadingSummary(false);
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
                    const languageInfo = getLanguageDisplay(doc.documentLanguage);
                    return (
                        <div key={doc.id} className="document-card">
                            <div className="document-header">
                                <div className="document-info">
                                    <h3>{doc.title}</h3>
                                    <div className="document-meta">
                                        <div className="meta-item">
                                            <span className="meta-icon">👤</span>
                                            <span>{userName}</span>
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

                            <div className="document-actions">
                                <button
                                    className="action-button primary"
                                    onClick={() => handleViewPDF(doc.id)}
                                >
                                    <span>👁️</span>
                                    Ver PDF
                                </button>
                                <a
                                    href={`http://web-t3.rodrigoappelt.com:8080/api/document/download/${doc.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="action-button secondary"
                                >
                                    <span>📥</span>
                                    Download
                                </a>
                                <button
                                    className="action-button info"
                                    onClick={() => handleAiSummarize(doc)}
                                    title="Gerar resumo com IA"
                                >
                                    <span>🤖</span>
                                    Resumir IA
                                </button>
                                <button
                                    className="action-button secondary copy-btn"
                                    data-doc-id={doc.id}
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
                                <button
                                    className="action-button info"
                                    onClick={() => handleEdit(doc)}
                                >
                                    <span>✏️</span>
                                    Editar
                                </button>
                                <button
                                    className="action-button warning"
                                    onClick={() => handleRename(doc)}
                                >
                                    <span>🏷️</span>
                                    Renomear
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

            {/* Modal de Renomear */}
            {renamingDoc && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">Renomear Documento</h3>
                        <div className="form-group">
                            <label htmlFor="new-name">Novo nome:</label>
                            <input
                                id="new-name"
                                type="text"
                                className="form-control"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="modal-actions">
                            <button 
                                className="action-button secondary"
                                onClick={() => {
                                    setRenamingDoc(null);
                                    setNewName('');
                                }}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="action-button primary"
                                onClick={submitRename}
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Resumo IA */}
            {aiSummaryDoc && (
                <div className="modal-overlay">
                    <div className="modal-content modal-large">
                        <h3 className="modal-title">
                            🤖 Resumo IA: {aiSummaryDoc.title}
                        </h3>
                        
                        <div className="ai-summary-content">
                            {isLoadingSummary ? (
                                <div className="ai-loading">
                                    <div className="ai-spinner"></div>
                                    <p>Gerando resumo com IA...</p>
                                    <small>Isso pode levar alguns segundos</small>
                                </div>
                            ) : aiSummary ? (
                                <div className="ai-summary-result">
                                    <div className="ai-summary-header">
                                        <h4>📄 Resumo do Documento</h4>
                                        <button 
                                            className="copy-summary-btn"
                                            onClick={() => {
                                                navigator.clipboard.writeText(aiSummary);
                                                // Toast notification
                                                const toast = document.createElement('div');
                                                toast.className = 'custom-toast toast-success';
                                                toast.innerHTML = `
                                                    <div class="toast-content">
                                                        <div class="toast-icon">✅</div>
                                                        <div class="toast-message">
                                                            <strong>Resumo copiado!</strong>
                                                        </div>
                                                    </div>
                                                `;
                                                toast.style.cssText = `
                                                    position: fixed;
                                                    top: 20px;
                                                    right: 20px;
                                                    z-index: 10000;
                                                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                                                    color: white;
                                                    padding: 12px 16px;
                                                    border-radius: 8px;
                                                    animation: slideInRight 0.3s ease;
                                                `;
                                                document.body.appendChild(toast);
                                                setTimeout(() => toast.remove(), 2000);
                                            }}
                                            title="Copiar resumo"
                                        >
                                            📋 Copiar
                                        </button>
                                    </div>
                                    <div className="ai-summary-text">
                                        <pre>{aiSummary}</pre>
                                    </div>
                                </div>
                            ) : (
                                <div className="ai-empty">
                                    <p>Clique em "Gerar Novamente" para criar um resumo.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="modal-actions">
                            <button 
                                className="action-button secondary"
                                onClick={closeAiModal}
                            >
                                Fechar
                            </button>
                            {!isLoadingSummary && (
                                <button 
                                    className="action-button primary"
                                    onClick={() => handleAiSummarize(aiSummaryDoc)}
                                >
                                    🔄 Gerar Novamente
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserDocuments;