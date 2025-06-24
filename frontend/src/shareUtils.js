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