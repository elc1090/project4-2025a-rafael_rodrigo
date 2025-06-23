import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './DocumentEditor.css';

function DocumentEditor({ token, onDocumentCreated, editingDocument, onDocumentSaved }) {
    const [name, setName] = useState('');
    const [language, setLanguage] = useState('latex');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isCompiling, setIsCompiling] = useState(false);
    const [activeToolbar, setActiveToolbar] = useState('latex');
    const [isEditMode, setIsEditMode] = useState(false);
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
          // Configurar tema claro personalizado integrado ao site
        monaco.editor.defineTheme('textogether-theme', {
            base: 'vs',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6A994E', fontStyle: 'italic' },
                { token: 'keyword', foreground: '4ca1af', fontStyle: 'bold' },
                { token: 'keyword.control', foreground: '6c5ce7', fontStyle: 'bold' },
                { token: 'keyword.operator', foreground: '2c3e50' },
                { token: 'string', foreground: 'e17055' },
                { token: 'string.quote', foreground: 'e17055' },
                { token: 'string.escape.invalid', foreground: 'e74c3c' },
                { token: 'number', foreground: '00b894' },
                { token: 'number.float', foreground: '00b894' },
                { token: 'delimiter.bracket', foreground: 'f39c12' },
                { token: 'delimiter.square', foreground: '9b59b6' }
            ],
            colors: {
                'editor.background': '#fafbfc',
                'editor.foreground': '#2c3e50',
                'editorLineNumber.foreground': '#95a5a6',
                'editorLineNumber.activeForeground': '#4ca1af',
                'editor.selectionBackground': '#d4e9f0',
                'editor.inactiveSelectionBackground': '#ecf3f7',
                'editor.lineHighlightBackground': '#f8f9fa',
                'editorCursor.foreground': '#4ca1af',
                'editor.findMatchBackground': '#ffeaa7',
                'editor.findMatchHighlightBackground': '#fff5d6',
                'editorWidget.background': '#ffffff',
                'editorWidget.border': '#e9ecef',
                'editorSuggestWidget.background': '#ffffff',
                'editorSuggestWidget.border': '#e9ecef',
                'editorSuggestWidget.selectedBackground': '#f1f3f4',
                'editorHoverWidget.background': '#ffffff',
                'editorHoverWidget.border': '#e9ecef'
            }
        });
        
        monaco.editor.setTheme('textogether-theme');
    };

    // Load editing document when it changes
    useEffect(() => {
        if (editingDocument) {
            setName(editingDocument.title);
            setContent(editingDocument.sourceCode);
            setLanguage(editingDocument.language);
            setIsEditMode(true);
            setStatus({ type: 'success', message: 'Documento carregado para edição!' });
            setTimeout(() => setStatus({ type: '', message: '' }), 2000);
        } else {
            // Reset for new document
            setIsEditMode(false);
            setName('');
            setContent('');
            setStatus({ type: '', message: '' });
        }
    }, [editingDocument]);

    const handleLanguageChange = (newLanguage) => {
        if (isEditMode) {
            // Não permitir mudança de linguagem em modo de edição
            return;
        }
        setLanguage(newLanguage);
        if (newLanguage === 'latex' && !content) {
            setContent(defaultLatexContent);
        } else if (newLanguage === 'markdown' && !content) {
            setContent(defaultMarkdownContent);
        }
    };

    const handleNewDocument = () => {
        setIsEditMode(false);
        setName('');
        setContent(language === 'latex' ? defaultLatexContent : defaultMarkdownContent);
        setStatus({ type: '', message: '' });
    };

    const insertText = (text) => {
        if (editorRef.current) {
            const editor = editorRef.current;
            const selection = editor.getSelection();
            const range = new window.monaco.Range(
                selection.startLineNumber,
                selection.startColumn,
                selection.endLineNumber,
                selection.endColumn
            );
            editor.executeEdits('', [{
                range: range,
                text: text
            }]);
            editor.focus();
        } else {
            setContent(content + text);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setStatus({ type: 'error', message: 'Por favor, digite um nome para o documento.' });
            return;
        }

        if (!content.trim()) {
            setStatus({ type: 'error', message: 'O documento não pode estar vazio.' });
            return;
        }

        setIsCompiling(true);

        if (isEditMode && editingDocument) {
            // Update existing document
            setStatus({ type: 'loading', message: 'Atualizando documento...' });
            
            try {
                // Update source code
                const updateResponse = await fetch(`http://web-t3.rodrigoappelt.com:8080/api/document/update?documentId=${editingDocument.id}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'text/plain'
                    },
                    body: content
                });

                if (!updateResponse.ok) {
                    throw new Error('Erro ao atualizar código fonte');
                }

                // Update name if changed
                if (name !== editingDocument.title) {
                    const renameResponse = await fetch(`http://web-t3.rodrigoappelt.com:8080/api/document/rename?documentId=${editingDocument.id}&newName=${encodeURIComponent(name)}`, {
                        method: 'GET',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });

                    if (!renameResponse.ok) {
                        throw new Error('Erro ao atualizar nome do documento');
                    }
                }

                setStatus({ type: 'success', message: 'Documento atualizado com sucesso!' });
                onDocumentSaved && onDocumentSaved();

            } catch (error) {
                console.error('Erro:', error);
                setStatus({ type: 'error', message: error.message || 'Ocorreu um erro ao atualizar o documento' });
            }
        } else {
            // Create new document
            setStatus({ type: 'loading', message: 'Compilando documento...' });
            
            try {
                const languageEnum = language === 'markdown' ? 1 : 2;
                
                const response = await fetch('http://web-t3.rodrigoappelt.com:8080/api/document/new', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ 
                        name, 
                        language: languageEnum,
                        sourceCode: content,
                        isPublic: true
                    })
                });

                if (!response.ok) {
                    throw new Error('Erro ao compilar documento');
                }

                setStatus({ type: 'success', message: 'Documento compilado e salvo com sucesso!' });
                onDocumentCreated && onDocumentCreated();

            } catch (error) {
                console.error('Erro:', error);
                setStatus({ type: 'error', message: error.message || 'Ocorreu um erro ao processar o documento' });
            }
        }
        
        setIsCompiling(false);
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
                            disabled={isEditMode}
                        >
                            <option value="latex">LaTeX (.tex)</option>
                            <option value="markdown">Markdown (.md)</option>
                        </select>
                        {isEditMode && (
                            <span className="edit-mode-indicator">
                                ✏️ Editando
                            </span>
                        )}
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
                            onClick={handleSave}
                            disabled={isCompiling}
                        >
                            {isCompiling ? 
                                (isEditMode ? 'Atualizando...' : 'Compilando...') : 
                                (isEditMode ? 'Salvar Alterações' : 'Compilar & Salvar')
                            }
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
                <div className="editor-toolbar">
                    <div className="toolbar-main">
                        {/* Ações principais */}
                        <div className="toolbar-group">
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\textbf{texto}')}>
                                <strong>B</strong>
                            </button>
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\textit{texto}')}>
                                <em>I</em>
                            </button>
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\underline{texto}')}>
                                <u>U</u>
                            </button>
                        </div>
                        
                        <div className="toolbar-separator-vertical"></div>
                        
                        {/* Estrutura do documento */}
                        <div className="toolbar-group">
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\section{Nova Seção}\n')} title="Seção">
                                H1
                            </button>
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\subsection{Subseção}\n')} title="Subseção">
                                H2
                            </button>
                        </div>
                        
                        <div className="toolbar-separator-vertical"></div>
                        
                        {/* Listas */}
                        <div className="toolbar-group">
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\begin{itemize}\n\\item Item\n\\end{itemize}\n')} title="Lista">
                                ⋅⋅⋅
                            </button>
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\begin{enumerate}\n\\item Item\n\\end{enumerate}\n')} title="Lista Numerada">
                                123
                            </button>
                        </div>
                        
                        <div className="toolbar-separator-vertical"></div>
                        
                        {/* Matemática */}
                        <div className="toolbar-group">
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\frac{a}{b}')} title="Fração">
                                ᵃ∕ᵦ
                            </button>
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\sqrt{x}')} title="Raiz">
                                √
                            </button>
                            <button className="toolbar-icon-btn" onClick={() => insertText('x^{2}')} title="Exponente">
                                x²
                            </button>
                            <button className="toolbar-icon-btn" onClick={() => insertText('x_{i}')} title="Subscrito">
                                xᵢ
                            </button>
                        </div>
                        
                        <div className="toolbar-separator-vertical"></div>
                        
                        {/* Símbolos matemáticos */}
                        <div className="toolbar-group">
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\sum_{i=1}^{n}')} title="Somatório">
                                Σ
                            </button>
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\int_{a}^{b}')} title="Integral">
                                ∫
                            </button>
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\prod_{i=1}^{n}')} title="Produtório">
                                ∏
                            </button>
                        </div>
                        
                        <div className="toolbar-separator-vertical"></div>
                        
                        {/* Ambientes */}
                        <div className="toolbar-group">
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\begin{equation}\n\n\\end{equation}\n')} title="Equação">
                                ƒ(x)
                            </button>
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\begin{figure}[h]\n\\centering\n\\includegraphics[width=0.8\\textwidth]{imagem}\n\\caption{Legenda}\n\\end{figure}\n')} title="Figura">
                                🖼
                            </button>
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\begin{table}[h]\n\\centering\n\\begin{tabular}{|c|c|}\n\\hline\nA & B \\\\\n\\hline\n\\end{tabular}\n\\caption{Legenda}\n\\end{table}\n')} title="Tabela">
                                ⚏
                            </button>
                        </div>
                        
                        <div className="toolbar-separator-vertical"></div>
                        
                        {/* Símbolos especiais */}
                        <div className="toolbar-group">
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\alpha')} title="Alpha">
                                α
                            </button>
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\beta')} title="Beta">
                                β
                            </button>
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\gamma')} title="Gamma">
                                γ
                            </button>
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\delta')} title="Delta">
                                δ
                            </button>
                            <button className="toolbar-icon-btn" onClick={() => insertText('\\pi')} title="Pi">
                                π
                            </button>
                        </div>
                    </div>
                    
                    {/* Dropdown para mais opções */}
                    <div className="toolbar-dropdown">
                        <select className="toolbar-select" onChange={(e) => {
                            if (e.target.value) {
                                insertText(e.target.value);
                                e.target.value = '';
                            }
                        }}>
                            <option value="">Mais símbolos...</option>
                            <optgroup label="Letras Gregas">
                                <option value="\\lambda">λ (lambda)</option>
                                <option value="\\mu">μ (mu)</option>
                                <option value="\\sigma">σ (sigma)</option>
                                <option value="\\omega">ω (omega)</option>
                                <option value="\\theta">θ (theta)</option>
                                <option value="\\phi">φ (phi)</option>
                            </optgroup>
                            <optgroup label="Operadores">
                                <option value="\\leq">≤ (menor ou igual)</option>
                                <option value="\\geq">≥ (maior ou igual)</option>
                                <option value="\\neq">≠ (diferente)</option>
                                <option value="\\approx">≈ (aproximadamente)</option>
                                <option value="\\infty">∞ (infinito)</option>
                            </optgroup>
                            <optgroup label="Conjuntos">
                                <option value="\\mathbb{R}">ℝ (reais)</option>
                                <option value="\\mathbb{N}">ℕ (naturais)</option>
                                <option value="\\mathbb{Z}">ℤ (inteiros)</option>
                                <option value="\\mathbb{Q}">ℚ (racionais)</option>
                            </optgroup>
                        </select>
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
                            fontSize: 16,
                            lineHeight: 24,
                            letterSpacing: 0.5,
                            lineNumbers: 'on',
                            rulers: [0],
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
                            parameterHints: { enabled: true },
                            padding: { top: 15, bottom: 15 }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}



export default DocumentEditor;
