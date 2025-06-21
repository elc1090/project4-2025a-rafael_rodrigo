import React, { useState } from 'react';
import './UploadTab.css';

function UploadTab({ token, onDocumentCreated }) {
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
        <div className="upload-tab">
            <div className="upload-header">
                <div>
                    <h2 className="upload-title">Novo Documento</h2>
                    <p className="upload-subtitle">Registre e compile seus documentos LaTeX ou Markdown</p>
                </div>
                <div className="upload-stats">
                    <div className="stat-item">
                        <span className="stat-icon">📝</span>
                        <span className="stat-label">LaTeX/MD</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-icon">⚡</span>
                        <span className="stat-label">Compilação</span>
                    </div>
                </div>
            </div>

            <section className="upload-section">
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
                    
                    <div className="form-group file-group">
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
                    )}                </form>
            </section>
        </div>
    );
}

export default UploadTab;