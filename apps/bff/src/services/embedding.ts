class EmbeddingService {
  private ollamaUrl: string;
  private model: string;

  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.EMBEDDING_MODEL || 'nomic-embed-text:latest';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    console.log(`[Ollama] Generating embedding with model: ${this.model}`);
    console.log(`[Ollama] Text length: ${text.length} chars`);
    
    const response = await fetch(`${this.ollamaUrl}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Ollama] Embedding failed: ${response.status} - ${errorText}`);
      throw new Error(`Embedding generation failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Ollama] Response keys: ${Object.keys(data)}`);
    console.log(`[Ollama] Embedding type: ${typeof data.embedding}, length: ${data.embedding?.length}`);
    
    if (!data.embedding || !Array.isArray(data.embedding) || data.embedding.length === 0) {
      console.error(`[Ollama] Invalid embedding response:`, data);
      throw new Error(`Invalid embedding response from Ollama`);
    }
    
    return data.embedding as number[];
  }
}

export const embeddingService = new EmbeddingService();
export { EmbeddingService };
