import React, { useState } from 'react';
import './App.css';

// Definindo a interface de Message
interface Message {
  sender: 'user' | 'bot'; // Quem enviou a mensagem
  text: string; // Texto da mensagem
}

const App: React.FC = () => {
  const [pergunta, setPergunta] = useState<string>(''); // Pergunta do usuário
  const [messages, setMessages] = useState<Message[]>([]); // Histórico de mensagens
  const [loading, setLoading] = useState<boolean>(false); // Estado de carregamento
  const [error, setError] = useState<string>(''); // Estado de erro

  // Função para atualizar a pergunta
  const handlePerguntaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPergunta(event.target.value);
  };

  // Função para enviar a pergunta e obter a resposta
  const handleEnviarPergunta = async () => {
    if (!pergunta) return;

    // Adiciona a pergunta do usuário ao chat
    const newMessage: Message = { sender: 'user', text: pergunta };
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    setLoading(true);
    setError(''); // Limpa o erro antes de tentar processar
    try {
      // Faz a requisição para o back-end
      const response = await fetch('http://localhost:5000/pergunta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pergunta }),
      });

      const data = await response.json();

      // Adiciona a resposta do bot ao chat
      const botResponse: Message = { sender: 'bot', text: data.resposta };
      setMessages((prevMessages) => [...prevMessages, botResponse]);

    } catch (error: unknown) {
      // Aqui verificamos o tipo do erro
      if (error instanceof Error) {
        // Se for uma instância de Error, podemos acessar a mensagem de erro
        setError(error.message);
      } else {
        // Se o erro não for uma instância de Error, definimos uma mensagem genérica
        setError('Erro ao obter resposta do servidor.');
      }

      // Adiciona a resposta de erro ao chat
      const botResponse: Message = { sender: 'bot', text: 'Erro ao obter resposta do servidor.' };
      setMessages((prevMessages) => [...prevMessages, botResponse]);
    }
    setLoading(false);
    setPergunta(''); // Limpa o input
  };

  return (
    <div className="App">
      <h1>Chat com IA</h1>

      <div className="chat-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
          >
            <p>{message.text}</p>
          </div>
        ))}
        {loading && (
          <div className="message bot-message">
            <p>Bot está pensando...</p>
          </div>
        )}
        {error && (
          <div className="message bot-message">
            <p style={{ color: 'red' }}>{error}</p>
          </div>
        )}
      </div>

      <div className="input-container">
        <input
          type="text"
          value={pergunta}
          onChange={handlePerguntaChange}
          placeholder="Faça sua pergunta"
        />
        <button onClick={handleEnviarPergunta} disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}

export default App;
