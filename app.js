const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { gerarSQL, gerarResposta } = require('./gemini');
const db = require('./database');

const app = express();
app.use(cors()); // Permite requisições de outros domínios
app.use(bodyParser.json()); // Lê o corpo das requisições em formato JSON

// Definindo a rota para processar a pergunta
app.post('/pergunta', async (req, res) => {
  try {
    const { pergunta } = req.body;

    if (!pergunta) {
      return res.status(400).json({ resposta: 'Pergunta inválida' });
    }

    let query = await gerarSQL(pergunta);
    query = query.replace(/```sql|```/g, '').trim();

    const [rows] = await db.query(query);
    const resposta = await gerarResposta(pergunta, rows);

    res.json({ resposta });
  } catch (err) {
    console.error('Erro no processamento:', err.message);
    res.status(500).json({ resposta: 'Erro ao processar a pergunta' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
