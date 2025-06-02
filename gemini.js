const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const chatHistory = {};

function getSessionHistory(sessionId = 'default') {
  if (!chatHistory[sessionId]) {
    chatHistory[sessionId] = [];
  }
  return chatHistory[sessionId];
}

async function gerarSQL(userQuestion, sessionId = 'default', respostaClarificacao = null) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const history = getSessionHistory(sessionId);

  // Verifica se é uma resposta de clarificação
  if (respostaClarificacao) {
    const pendingQuery = history.find(msg => msg.role === 'system' && msg.needsClarification);
    if (pendingQuery) {
      // Remove a marcação de pendente
      history.splice(history.indexOf(pendingQuery), 1);
      
      // Reconstrói a pergunta com a clarificação
      const fullQuestion = `${pendingQuery.content.replace('Pendente: ', '')} ${respostaClarificacao}`;
      history.push({ role: 'user', content: fullQuestion });
    }
  }

  // Verifica consultas amplas
  const isBroadQuery = /(listar|mostrar|retornar|todos? os|todas? as|me\s+(dê|mostre|retorne))\s*(usuários?|registros?|dados?|clientes?)/i.test(userQuestion);

  if (isBroadQuery && !respostaClarificacao) {
    const tableMatch = userQuestion.match(/(usuários?|registros?|dados?|clientes?)/i);
    const tableName = tableMatch ? tableMatch[0].toLowerCase() : 'registros';
    
    const clarificationPrompt = `O usuário solicitou: "${userQuestion}". 
    Gere uma única pergunta de esclarecimento em português brasileiro (sem SQL) seguindo este formato:
    
    "Você gostaria de ver todos os ${tableName} ou deseja filtrar por algum critério específico? (como nome, idade, ID, etc.)"
    
    Mantenha a resposta curta e direta.`;

    const clarificationResult = await model.generateContent(clarificationPrompt);
    const clarification = clarificationResult.response.text().trim();
    
    history.push({ 
      role: 'system', 
      content: `Pendente: ${userQuestion}`,
      needsClarification: true
    });
    
    return { 
      needsClarification: true, 
      message: clarification,
      query: null
    };
  }

  // Adiciona a pergunta ao histórico
  history.push({ role: 'user', content: userQuestion });

  // Gera o SQL
  const prompt = `
# CONTEXTO DA CONVERSA
Você é um especialista em SQL com conhecimento do seguinte esquema:

## ESQUEMA DO BANCO
Tabela: users
- id (INT): Chave primária
- name (VARCHAR): Nome do usuário
- email (VARCHAR): Email único
- age (INT): Idade

## HISTÓRICO DA CONVERSA
${history.slice(-5).map(msg => 
  `${msg.role === 'system' ? '📌 Pendente' : msg.role === 'user' ? '👤' : '🤖'} ${msg.content}`
).join('\n')}

## INSTRUÇÕES
1. Gere SOMENTE o comando SQL para MySQL
2. Considere o contexto da conversa
3. Não inclua explicações

# ÚLTIMA PERGUNTA
${userQuestion}

# SQL:`;

  const result = await model.generateContent(prompt);
  const query = result.response.text().trim().replace(/```sql|```/g, '').trim();

  history.push({ role: 'assistant', content: query });
  
  return { 
    needsClarification: false, 
    query: query,
    message: null
  };
}

async function gerarResposta(perguntaOriginal, resultadoSQL, sessionId = 'default') {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const history = getSessionHistory(sessionId);

  const prompt = `
# CONTEXTO DA CONVERSA
${history.slice(-3).map(msg => 
  `${msg.role === 'system' ? '📌 Contexto' : msg.role === 'user' ? '👤' : '🤖'} ${msg.content}`
).join('\n')}

# RESULTADO DA CONSULTA
${JSON.stringify(resultadoSQL, null, 2)}

# DIRETRIZES PARA RESPOSTA
1. Seja natural e amigável
2. Destaque informações relevantes
3. Considere o histórico da conversa
4. Responda em português brasileiro`;

  const result = await model.generateContent(prompt);
  const resposta = result.response.text().trim();

  history.push({ role: 'assistant', content: resposta });
  
  return resposta;
}

async function listarPerguntasAnteriores(sessionId = 'default') {
  const history = getSessionHistory(sessionId);
  const perguntas = history.filter(msg => msg.role === 'user').map(msg => msg.content);
  
  if (perguntas.length === 0) {
    return "Você ainda não fez nenhuma pergunta nesta conversa.";
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `
# HISTÓRICO DE PERGUNTAS
${perguntas.map((q, i) => `${i + 1}. ${q}`).join('\n')}

# INSTRUÇÃO
Formate esta lista como uma resposta amigável em português, incluindo:
- Número total de perguntas
- Lista numerada das perguntas
- Sugestão para detalhar qualquer uma delas`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

module.exports = { 
  gerarSQL, 
  gerarResposta, 
  listarPerguntasAnteriores 
};