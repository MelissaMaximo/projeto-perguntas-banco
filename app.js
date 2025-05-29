// npm install mysql2

const readline = require('readline');
const db = require('./database');
const { gerarSQL, gerarResposta } = require('./gemini');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function processarPergunta(pergunta) {
  try {
    console.log('Gerando query SQL com IA...');
    let query = await gerarSQL(pergunta);

    
    query = query.replace(/```sql|```/g, '').trim();
    console.log(`Query gerada limpa: ${query}`);

    console.log('Executando query no banco de dados...');
    const [rows] = await db.query(query);

    console.log('Gerando resposta baseada nos dados...');
    const resposta = await gerarResposta(pergunta, rows);

    console.log('\n Resposta:\n' + resposta);
  } catch (err) {
    console.error('Erro:', err.message); //mostrando erro, caso tenha
  }

  
}

async function perguntar() {
  let input = '';

  while (input.toLowerCase() !== 'sair') {
    // primeira pergunta para o usuário
    input = await new Promise(resolve => {
      rl.question('📨 Faça uma pergunta sobre o banco: ', resolve);
    });

    if (input.toLowerCase() !== 'sair') {
      await processarPergunta(input); // pensando na pergunta feita 
    } else {
      console.log('Tchau!');
      rl.close(); //fechando tudo
      process.exit(); 
    }
  }
}

perguntar(); 
