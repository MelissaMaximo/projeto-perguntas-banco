const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { gerarSQL, gerarResposta, listarPerguntasAnteriores } = require('./gemini');
const db = require('./database');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post('/pergunta', async (req, res) => {
  try {
    const { pergunta, sessionId = 'default', respostaClarificacao } = req.body;

    if (!pergunta) {
      return res.status(400).json({ resposta: 'Pergunta inválida' });
    }

    const lowerPergunta = pergunta.toLowerCase();
    
    

    // Processa a pergunta
    const sqlResult = await gerarSQL(pergunta, sessionId, respostaClarificacao);
    
    if (sqlResult.needsClarification) {
      return res.json({ 
        resposta: sqlResult.message, 
        needsClarification: true 
      });
    }

    // Executa a query se não precisar de clarificação
    const [rows] = await db.query(sqlResult.query);
    const resposta = await gerarResposta(pergunta, rows, sessionId);

    res.json({ resposta });
  } catch (err) {
    console.error('Erro no processamento:', err);
    res.status(500).json({ 
      resposta: 'Erro ao processar a pergunta',
      error: err.message 
    });
  }
});

app.post('/limpar-historico', (req, res) => {
  const { sessionId = 'default' } = req.body;
  chatHistory[sessionId] = [];
  res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});