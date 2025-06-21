import React, { useState, useEffect } from 'react';

// Hook para capturar token da URL
const useGitHubToken = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há token na URL 
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      console.log('Token capturado da URL:', urlToken);
      
      // Salvar token no localStorage
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
      
      // Limpar a URL removendo o token por segurança
      const newUrl = window.location.protocol + "//" + 
                     window.location.host + 
                     window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      console.log('Token salvo e URL limpa');
    }
    
    setIsLoading(false);
  }, []);

  return { token, setToken, isLoading };
};

export default useGitHubToken;