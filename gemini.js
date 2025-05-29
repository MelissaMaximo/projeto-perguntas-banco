const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function gerarSQL(userQuestion) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
Você é um assistente que gera queries SQL para MySQL com base em perguntas em linguagem natural.

Estas são as tabelas existentes no banco de dados:

Tabela: users
- id (int)
- name (varchar)
- email (varchar)
- age (int)

Com base nisso, gere **somente** a query SQL correspondente à pergunta abaixo, sem explicações, nem blocos de código.

Pergunta: ${userQuestion}
`;


  const result = await model.generateContent(prompt);
  const query = result.response.text().trim();
  return query;
}

async function gerarResposta(perguntaOriginal, resultadoSQL) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
O usuário perguntou: "${perguntaOriginal}"

O banco de dados retornou:
${JSON.stringify(resultadoSQL, null, 2)}

Crie uma resposta clara e amigável para o usuário com base nos dados retornados.
`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

module.exports = { gerarSQL, gerarResposta };
