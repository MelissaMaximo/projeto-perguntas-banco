import React, { useState, type ChangeEvent, type FormEvent } from 'react';

interface RespostaData {
  resposta: string;
}

function PerguntaForm() {
  const [pergunta, setPergunta] = useState<string>('');
  const [resposta, setResposta] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Função para lidar com a submissão do formulário
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!pergunta.trim()) return; // Verificar se a pergunta não está vazia

    setLoading(true);
    try {
      // Enviar a pergunta para o back-end
      const response = await fetch('http://localhost:5000/pergunta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pergunta }),
      });

      const data: RespostaData = await response.json();

      if (response.ok) {
        setResposta(data.resposta);
      } else {
        setResposta('Erro ao processar sua pergunta');
      }
    } catch (error) {
      console.error('Erro de rede:', error);
      setResposta('Erro ao se comunicar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Função para lidar com mudanças na textarea
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPergunta(e.target.value);
  };

  return (
    <div>
      <h1>Faça uma pergunta sobre o banco de dados</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={pergunta}
          onChange={handleChange}
          placeholder="Digite sua pergunta..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processando...' : 'Enviar Pergunta'}
        </button>
      </form>

      {resposta && <div><h3>Resposta:</h3><p>{resposta}</p></div>}
    </div>
  );
}

export default PerguntaForm;
