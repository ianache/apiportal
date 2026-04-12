const COLLECTION_NAME = 'kbapi';

interface QDrantPoint {
  id: string;
  vector: number[];
  payload: Record<string, any>;
}

class QDrantService {
  private baseUrl: string;
  private apiKey: string;
  private collectionName: string;
  private vectorSize: number | null = null;

  constructor() {
    this.baseUrl = process.env.QDRANT_URL || 'http://localhost:6333';
    this.apiKey = process.env.QDRANT_API_KEY || '';
    this.collectionName = COLLECTION_NAME;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'api-key': this.apiKey } : {}),
      ...options.headers as Record<string, string>,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`QDrant request failed: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async collectionExists(): Promise<boolean> {
    try {
      console.log(`[QDrant] Checking if collection '${this.collectionName}' exists...`);
      await this.request(`/collections/${this.collectionName}`);
      console.log(`[QDrant] Collection '${this.collectionName}' exists`);
      return true;
    } catch (error: any) {
      console.log(`[QDrant] Collection '${this.collectionName}' does not exist: ${error.message}`);
      return false;
    }
  }

  async createCollection(vectorSize: number): Promise<void> {
    this.vectorSize = vectorSize;
    console.log(`[QDrant] Creating collection '${this.collectionName}' with vector size ${vectorSize} and distance Cosine`);
    const result = await this.request(`/collections/${this.collectionName}`, {
      method: 'PUT',
      body: JSON.stringify({
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      }),
    });
    console.log(`[QDrant] Collection '${this.collectionName}' created successfully:`, result);
  }

  async ensureCollection(vectorSize: number): Promise<void> {
    const exists = await this.collectionExists();
    if (!exists) {
      await this.createCollection(vectorSize);
    } else {
      this.vectorSize = vectorSize;
    }
  }

  async upsertPoint(point: QDrantPoint): Promise<void> {
    console.log(`[QDrant] Upserting point ${point.id} to collection '${this.collectionName}'`);
    console.log(`[QDrant] Point data:`, {
      id: point.id,
      vectorLength: point.vector?.length || 0,
      vectorSample: point.vector ? `[${(point.vector as number[]).slice(0, 5).join(', ')}, ...]` : 'EMPTY',
      payloadKeys: Object.keys(point.payload)
    });
    
    const body = {
      points: [
        {
          id: point.id,
          vector: point.vector,
          payload: point.payload
        }
      ]
    };
    console.log(`[QDrant] Full request body:`, JSON.stringify(body, null, 2));
    
    const result = await this.request(`/collections/${this.collectionName}/points`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    console.log(`[QDrant] Point ${point.id} upserted:`, result);
  }

  async deletePoint(id: string): Promise<void> {
    await this.request(`/collections/${this.collectionName}/points/delete`, {
      method: 'POST',
      body: JSON.stringify({
        points: [id],
      }),
    });
  }

  async searchPoints(queryVector: number[], limit: number, filter?: { domainId?: string; typeId?: string }): Promise<any[]> {
    console.log(`[QDrant] Searching in '${this.collectionName}' with limit ${limit}`);
    console.log(`[QDrant] Filter:`, filter);
    
    const filterBody: any = { must: [] };
    if (filter?.domainId) {
      filterBody.must.push({ key: 'domainId', match: { value: filter.domainId } });
    }
    if (filter?.typeId) {
      filterBody.must.push({ key: 'typeId', match: { value: filter.typeId } });
    }
    
    const requestBody: any = {
      vector: queryVector,
      limit: limit,
      with_payload: true,
      with_vector: false,
    };
    
    if (filterBody.must.length > 0) {
      requestBody.filter = filterBody;
    }
    
    console.log(`[QDrant] Search request body:`, JSON.stringify(requestBody, null, 2));
    
    const result = await this.request(`/collections/${this.collectionName}/points/search`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    
    console.log(`[QDrant] Search results:`, result);
    return (result as any).results || [];
  }
}

export const qdrantService = new QDrantService();
export { QDrantService, COLLECTION_NAME };
