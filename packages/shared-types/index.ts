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
  domainId?: string | null;
  organizationId?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  versions?: APIVersion[];
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  ownerId?: string | null;
  owner?: User | null;
  createdAt: string;
  updatedAt: string;
  apiCount?: number;
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  diagram?: any;
}

export type SoftwareConfigurationType = 'API' | 'DATABASE' | 'MICROSERVICE' | 'FRONTEND' | 'EXTERNAL_SERVICE' | 'MESSAGE_BROKER';

export type SoftwareConfigurationDependencyType = 'REST_CALL' | 'GRPC' | 'PUBSUB' | 'JDBC' | 'SOAP';

export interface ConfigurationItemType {
  id: string;
  name: string;
  icon?: string;
  specifications?: PropertySpecification[];
}

export interface PropertySpecification {
  id: string;
  name: string;
  dataType: 'string' | 'integer' | 'boolean';
  required: boolean;
  typeId: string;
}

export interface Property {
  id: string;
  value: string;
  specificationId: string;
  swciId: string;
}

export interface SoftwareConfigurationItem {
  id: string;
  name: string;
  description?: string;
  typeId: string;
  type?: ConfigurationItemType;
  organizationId: string;
  apiVersionId?: string | null;
  apiVersion?: APIVersion | null;
  properties?: Property[];
  createdAt: string;
  updatedAt: string;
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
  endpoints?: APIEndpoint[];
}

export interface Environment {
  id: string;
  slug: string;
  name: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface APIEndpoint {
  id: string;
  versionId: string;
  environmentId: string;
  environment?: Environment;
  baseUrl: string;
  createdAt: string;
  updatedAt: string;
}
