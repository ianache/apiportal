export type Role = 'API_MANAGER' | 'API_DESIGNER' | 'API_DEVELOPER';

export interface User {
  id: string;
  sub: string; // Keycloak subject ID
  name: string | null;
  email: string;
  role: Role;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  timestamp: string;
  details?: Record<string, any>;
}

export type APIStatus = 'DESIGN' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'DEPRECATED' | 'RETIRED';

export interface API {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  versions?: APIVersion[];
}

export interface APIVersion {
  id: string;
  apiId: string;
  version: string; // SemVer e.g., "1.0.0"
  status: APIStatus;
  definition?: any; // OpenAPI-like metadata
  flowConfig?: any; // Visual Designer nodes/edges (Phase 3)
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}
