import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import './DocumentEditor.css';

function DocumentEditor({ token, onDocumentCreated }) {
    const [name, setName] = useState('');
    const [language, setLanguage] = useState('latex');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isCompiling, setIsCompiling] = useState(false);
    const editorRef = useRef(null);

    const defaultLatexContent = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath}
\\usepackage{amsfonts}
\\usepackage{amssymb}

\\title{Meu Documento}
\\author{Autor}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introdução}
Escreva seu conteúdo aqui...

\\section{Desenvolvimento}
Lorem ipsum dolor sit amet, consectetur adipiscing elit.

\\subsection{Subseção}
Mais conteúdo...

\\section{Conclusão}
Conclusões finais...

\\end{document}`;

    const defaultMarkdownContent = `# Meu Documento

## Introdução
Escreva seu conteúdo aqui...

## Desenvolvimento
Lorem ipsum dolor sit amet, consectetur adipiscing elit.

### Subseção
Mais conteúdo...

## Conclusão
Conclusões finais...

---

**Nota:** Este é um documento criado no TexTogether.`;

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        
        // Registrar linguagem LaTeX customizada
        monaco.languages.register({ id: 'latex' });
        
        // Definir tokens do LaTeX
        monaco.languages.setMonarchTokensProvider('latex', {
            tokenizer: {
                root: [
                    // Comentários
                    [/%.*$/, 'comment'],
                    
                    // Comandos LaTeX
                    [/\\[a-zA-Z@]+\*?/, 'keyword'],
                    
                    // Ambientes
                    [/\\begin\{[^}]+\}/, 'keyword.control'],
                    [/\\end\{[^}]+\}/, 'keyword.control'],
                    
                    // Matemática inline
                    [/\$[^$]*\$/, 'string'],
                    
                    // Matemática display
                    [/\$\$/, { token: 'string', next: '@mathDisplay' }],
                    
                    // Chaves
                    [/[{}]/, 'delimiter.bracket'],
                    
                    // Colchetes para opções
                    [/[\[\]]/, 'delimiter.square'],
                    
                    // Strings entre aspas
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],
                    [/"/, { token: 'string.quote', next: '@string' }],
                    
                    // Números
                    [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                    [/\d+/, 'number'],
                    
                    // Caracteres especiais do LaTeX
                    [/[&~#^_]/, 'keyword.operator'],
                ],
                
                mathDisplay: [
                    [/\$\$/, { token: 'string', next: '@pop' }],
                    [/./, 'string']
                ],
                
                string: [
                    [/[^\\"]+/, 'string'],
                    [/\\./, 'string.escape.invalid'],
                    [/"/, { token: 'string.quote', next: '@pop' }]
                ]
            }
        });
        
        // Configurar auto-complete para LaTeX
        monaco.languages.registerCompletionItemProvider('latex', {
            provideCompletionItems: (model, position) => {
                const suggestions = [
                    // Comandos básicos
                    {
                        label: '\\documentclass',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: '\\documentclass{${1:article}}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Define a classe do documento'
                    },
                    {
                        label: '\\usepackage',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: '\\usepackage{${1:package}}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Carrega um pacote'
                    },
                    {
                        label: '\\begin{document}',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '\\begin{document}\n${1}\n\\end{document}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Ambiente principal do documento'
                    },
                    
                    // Seções
                    {
                        label: '\\section',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: '\\section{${1:título}}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Cria uma seção'
                    },
                    {
                        label: '\\subsection',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: '\\subsection{${1:título}}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Cria uma subseção'
                    },
                    {
                        label: '\\subsubsection',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: '\\subsubsection{${1:título}}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Cria uma subsubseção'
                    },
                    
                    // Formatação
                    {
                        label: '\\textbf',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: '\\textbf{${1:texto}}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Texto em negrito'
                    },
                    {
                        label: '\\textit',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: '\\textit{${1:texto}}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Texto em itálico'
                    },
                    {
                        label: '\\emph',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: '\\emph{${1:texto}}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Texto enfatizado'
                    },
                    
                    // Ambientes
                    {
                        label: 'itemize',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '\\begin{itemize}\n\\item ${1:item}\n\\end{itemize}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Lista não numerada'
                    },
                    {
                        label: 'enumerate',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '\\begin{enumerate}\n\\item ${1:item}\n\\end{enumerate}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Lista numerada'
                    },
                    {
                        label: 'equation',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '\\begin{equation}\n${1:equação}\n\\end{equation}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Equação numerada'
                    },
                    {
                        label: 'figure',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '\\begin{figure}[h]\n\\centering\n\\includegraphics[width=0.8\\textwidth]{${1:imagem}}\n\\caption{${2:legenda}}\n\\label{fig:${3:label}}\n\\end{figure}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Figura com legenda'
                    },
                    {
                        label: 'table',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '\\begin{table}[h]\n\\centering\n\\begin{tabular}{|c|c|}\n\\hline\n${1:coluna1} & ${2:coluna2} \\\\\n\\hline\n${3:linha1} & ${4:linha2} \\\\\n\\hline\n\\end{tabular}\n\\caption{${5:legenda}}\n\\label{tab:${6:label}}\n\\end{table}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Tabela com legenda'
                    },
                    
                    // Matemática
                    {
                        label: '\\frac',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: '\\frac{${1:numerador}}{${2:denominador}}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Fração'
                    },
                    {
                        label: '\\sqrt',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: '\\sqrt{${1:expressão}}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Raiz quadrada'
                    },
                    {
                        label: '\\sum',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: '\\sum_{${1:i=1}}^{${2:n}} ${3:expressão}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Somatório'
                    },
                    {
                        label: '\\int',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: '\\int_{${1:a}}^{${2:b}} ${3:f(x)} dx',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Integral'
                    }
                ];
                
                return { suggestions: suggestions };
            }
        });
        
        // Configurar tema escuro personalizado
        monaco.editor.defineTheme('textogether-theme', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
                { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
                { token: 'keyword.control', foreground: 'C586C0', fontStyle: 'bold' },
                { token: 'keyword.operator', foreground: 'D4D4D4' },
                { token: 'string', foreground: 'CE9178' },
                { token: 'string.quote', foreground: 'CE9178' },
                { token: 'string.escape.invalid', foreground: 'F44747' },
                { token: 'number', foreground: 'B5CEA8' },
                { token: 'number.float', foreground: 'B5CEA8' },
                { token: 'delimiter.bracket', foreground: 'FFD700' },
                { token: 'delimiter.square', foreground: 'DA70D6' }
            ],
            colors: {
                'editor.background': '#1e1e1e',
                'editor.foreground': '#d4d4d4',
                'editorLineNumber.foreground': '#858585',
                'editor.selectionBackground': '#264f78',
                'editor.inactiveSelectionBackground': '#3a3d41'
            }
        });
        
        monaco.editor.setTheme('textogether-theme');
    };

    const handleLanguageChange = (newLanguage) => {
        setLanguage(newLanguage);
        if (newLanguage === 'latex' && !content) {
            setContent(defaultLatexContent);
        } else if (newLanguage === 'markdown' && !content) {
            setContent(defaultMarkdownContent);
        }
    };

    const handleNewDocument = () => {
        setName('');
        setContent(language === 'latex' ? defaultLatexContent : defaultMarkdownContent);
        setStatus({ type: '', message: '' });
    };

    const handleCompileAndSave = async () => {
        if (!name.trim()) {
            setStatus({ type: 'error', message: 'Por favor, digite um nome para o documento.' });
            return;
        }

        if (!content.trim()) {
            setStatus({ type: 'error', message: 'O documento não pode estar vazio.' });
            return;
        }

        setIsCompiling(true);
        setStatus({ type: 'loading', message: 'Compilando documento...' });

        try {
            // 1. Registrar metadados
            const languageEnum = language === 'markdown' ? 1 : 2;
            const registerResponse = await fetch('http://web-t3.rodrigoappelt.com:8080/api/Document/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ name, language: languageEnum })
            });

            if (!registerResponse.ok) {
                throw new Error('Erro ao registrar documento');
            }

            const { documentId } = await registerResponse.json();
            setStatus({ type: 'loading', message: 'Enviando arquivo...' });

            // 2. Criar arquivo e enviar
            const fileExtension = language === 'latex' ? '.tex' : '.md';
            const blob = new Blob([content], { type: 'text/plain' });
            const file = new File([blob], `${name}${fileExtension}`, { type: 'text/plain' });

            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await fetch(`http://web-t3.rodrigoappelt.com:8080/api/document/upload/${documentId}`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Erro ao enviar arquivo');
            }

            setStatus({ type: 'success', message: 'Documento compilado e salvo com sucesso!' });
            onDocumentCreated && onDocumentCreated();

        } catch (error) {
            console.error('Erro:', error);
            setStatus({ type: 'error', message: error.message || 'Ocorreu um erro ao processar o documento' });
        } finally {
            setIsCompiling(false);
        }
    };

    return (
        <div className="document-editor">
            <div className="editor-header">
                <div className="editor-controls">
                    <div className="document-info">
                        <input
                            type="text"
                            className="document-name-input"
                            placeholder="Nome do documento"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <select
                            className="language-selector"
                            value={language}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                        >
                            <option value="latex">LaTeX (.tex)</option>
                            <option value="markdown">Markdown (.md)</option>
                        </select>
                    </div>
                    <div className="editor-actions">
                        <button 
                            className="new-doc-btn"
                            onClick={handleNewDocument}
                        >
                            Novo
                        </button>
                        <button 
                            className="compile-btn"
                            onClick={handleCompileAndSave}
                            disabled={isCompiling}
                        >
                            {isCompiling ? 'Compilando...' : 'Compilar & Salvar'}
                        </button>
                    </div>
                </div>
                
                {status.message && (
                    <div className={`editor-status status-${status.type}`}>
                        {status.message}
                    </div>
                )}
            </div>

            <div className="editor-container">
                <div className="editor-sidebar">
                    <h4>Recursos</h4>
                    <div className="resource-section">
                        <h5>LaTeX</h5>
                        <div className="resource-items">
                            <button onClick={() => setContent(content + '\\section{Nova Seção}\n')}>
                                Seção
                            </button>
                            <button onClick={() => setContent(content + '\\subsection{Subseção}\n')}>
                                Subseção
                            </button>
                            <button onClick={() => setContent(content + '\\textbf{texto em negrito}')}>
                                Negrito
                            </button>
                            <button onClick={() => setContent(content + '\\textit{texto em itálico}')}>
                                Itálico
                            </button>
                            <button onClick={() => setContent(content + '\\begin{itemize}\n\\item Item 1\n\\item Item 2\n\\end{itemize}\n')}>
                                Lista
                            </button>
                            <button onClick={() => setContent(content + '\\begin{equation}\ny = mx + b\n\\end{equation}\n')}>
                                Equação
                            </button>
                        </div>
                    </div>
                    
                    <div className="resource-section">
                        <h5>Markdown</h5>
                        <div className="resource-items">
                            <button onClick={() => setContent(content + '\n## Nova Seção\n')}>
                                Seção
                            </button>
                            <button onClick={() => setContent(content + '\n### Subseção\n')}>
                                Subseção
                            </button>
                            <button onClick={() => setContent(content + '**texto em negrito**')}>
                                Negrito
                            </button>
                            <button onClick={() => setContent(content + '*texto em itálico*')}>
                                Itálico
                            </button>
                            <button onClick={() => setContent(content + '\n- Item 1\n- Item 2\n- Item 3\n')}>
                                Lista
                            </button>
                            <button onClick={() => setContent(content + '\n```\ncódigo aqui\n```\n')}>
                                Código
                            </button>
                        </div>
                    </div>
                </div>

                <div className="editor-main">
                    <Editor
                        height="100%"
                        language={language === 'latex' ? 'latex' : 'markdown'}
                        value={content}
                        onChange={(value) => setContent(value || '')}
                        onMount={handleEditorDidMount}
                        options={{
                            minimap: { enabled: true },
                            fontSize: 14,
                            lineNumbers: 'on',
                            rulers: [80],
                            wordWrap: 'on',
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            folding: true,
                            renderLineHighlight: 'all',
                            selectOnLineNumbers: true,
                            roundedSelection: false,
                            readOnly: false,
                            cursorStyle: 'line',
                            glyphMargin: true,
                            lineDecorationsWidth: 10,
                            lineNumbersMinChars: 3,
                            suggestOnTriggerCharacters: true,
                            quickSuggestions: true,
                            parameterHints: { enabled: true }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default DocumentEditor;
