// Utilitário para debug de autenticação GitHub
export const debugGitHubAuth = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  console.log('=== DEBUG GITHUB AUTH ===');
  console.log('URL atual:', window.location.href);
  console.log('Search params:', window.location.search);
  console.log('Token na URL:', token);
  console.log('Token no localStorage:', localStorage.getItem('token'));
  console.log('========================');
  
  return token;
};

// Função para simular login GitHub (para testes)
export const simulateGitHubLogin = (testToken = 'test_token_123') => {
  const newUrl = `${window.location.origin}/?token=${testToken}`;
  console.log('Simulando redirecionamento do GitHub para:', newUrl);
  window.location.href = newUrl;
};

// Função para limpar autenticação
export const clearAuth = () => {
  localStorage.removeItem('token');
  window.location.href = window.location.origin;
};