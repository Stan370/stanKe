export const streamChatResponse = async function* (history: { role: string, content: string }[], newMessage: string) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: newMessage, history })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      yield `Error: ${errData.error || response.statusText}`;
      return;
    }

    if (!response.body) {
      yield "Error: No response body received from the server.";
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      yield chunk;
    }

  } catch (error) {
    console.error("Chat Service Error:", error);
    yield "Sorry, I encountered an error communicating with the server. Please try again later.";
  }
};