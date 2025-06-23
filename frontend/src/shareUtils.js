// Utilitário para gerenciar links de compartilhamento
export const createShareLink = async (documentId, token) => {
    try {
        const response = await fetch(`http://web-t3.rodrigoappelt.com:8080/api/share/create?documentId=${documentId}`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ${response.status}: ${errorText}`);
        }

        const shareData = await response.json();
        return {
            success: true,
            shortname: shareData.shortname,
            shareUrl: `http://web-t3.rodrigoappelt.com:8080/api/share/${shareData.shortname}`,
            originalUrl: shareData.url
        };
    } catch (error) {
        console.error('Erro ao criar link de compartilhamento:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
/*
// Função para copiar link com toast notification
export const copyShareLink = async (documentId, token, showToast = null) => {
    const result = await createShareLink(documentId, token);
    
    if (result.success) {
        try {
            await navigator.clipboard.writeText(result.shareUrl);
            
            // Usar toast se disponível, senão usar feedback no botão
            if (showToast) {
                showToast(`Link copiado! ${result.shareUrl}`, 'success', 4000);
            } else {
                // Fallback: feedback visual no botão (mantido para compatibilidade)
                const button = document.querySelector(`[data-doc-id="${documentId}"] .copy-btn`);
                if (button) {
                    const originalHTML = button.innerHTML;
                    const originalClass = button.className;
                    
                    button.innerHTML = '<span>✅</span>Copiado!';
                    button.className = originalClass + ' success';
                    
                    setTimeout(() => {
                        button.innerHTML = originalHTML;
                        button.className = originalClass;
                    }, 2500);
                }
            }
            
            console.log('✅ Link copiado:', result.shareUrl);
            return { success: true, url: result.shareUrl };
            
        } catch (clipboardError) {
            console.error('Erro ao copiar para clipboard:', clipboardError);
            
            if (showToast) {
                showToast('Erro ao copiar. Link: ' + result.shareUrl, 'warning', 6000);
            } else {
                // Fallback: mostrar prompt para copiar manualmente
                prompt('Copie este link:', result.shareUrl);
            }
            return { success: true, url: result.shareUrl };
        }
    } else {
        if (showToast) {
            showToast('Erro ao criar link de compartilhamento: ' + result.error, 'error', 5000);
        } else {
            alert('Erro ao criar link de compartilhamento: ' + result.error);
        }
        return { success: false, error: result.error };
    }
};*/

// Função para redirecionar para link compartilhado
export const openShareLink = (shortname) => {
    const shareUrl = `http://web-t3.rodrigoappelt.com:8080/api/share/${shortname}`;
    window.open(shareUrl, '_blank');
};

export const copyShareLink = async (documentId, token) => {
    try {
        const response = await fetch(`http://web-t3.rodrigoappelt.com:8080/api/share/create?documentId=${documentId}&useLatest=true`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (response.ok) {
            const data = await response.json();
            // Copy the short URL to clipboard
            await navigator.clipboard.writeText(data.shortUrl);
            return { 
                success: true, 
                url: data.shortUrl,
                pdfUrl: data.pdfUrl,
                shortname: data.shortname
            };
        } else if (response.status === 404) {
            return { success: false, error: 'Documento não encontrado' };
        } else if (response.status === 400) {
            return { success: false, error: 'Requisição inválida' };
        } else {
            return { success: false, error: 'Erro ao criar link compartilhado' };
        }
    } catch (error) {
        console.error('Erro ao criar link compartilhado:', error);
        return { success: false, error: 'Erro de conexão' };
    }
};