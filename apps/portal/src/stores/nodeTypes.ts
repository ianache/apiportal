export interface PropertyDef {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'code' | 'json';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  language?: string; // For 'code' type: 'javascript', 'jsonata', 'xml', 'sql', etc.
}

export interface NodeTypeDef {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  properties: PropertyDef[];
}

export const NODE_TYPE_CATALOG: NodeTypeDef[] = [
  // ── Protocol (Entry Points) ───────────────────────────────
  {
    id: 'http-listener@v1',
    name: 'HTTP Listener',
    description: 'Receives inbound HTTP requests on a configured path and method.',
    category: 'Protocol',
    icon: 'http',
    color: '#0058bc',
    properties: [
      { key: 'path',   label: 'Path',   type: 'string', required: true,  defaultValue: '/' },
      { key: 'method', label: 'Method', type: 'select', required: true,  defaultValue: 'GET', options: ['GET','POST','PUT','PATCH','DELETE','ANY'] },
      { key: 'port',   label: 'Port',   type: 'number', required: false, defaultValue: 8080 },
    ],
  },
  {
    id: 'kafka-consumer@v1',
    name: 'Kafka Consumer',
    description: 'Consumes messages from a Kafka topic using a consumer group.',
    category: 'Protocol',
    icon: 'stream',
    color: '#0058bc',
    properties: [
      { key: 'topic',   label: 'Topic',   type: 'string', required: true  },
      { key: 'group',   label: 'Group',   type: 'string', required: true  },
      { key: 'brokers', label: 'Brokers', type: 'string', required: true, defaultValue: 'localhost:9092' },
    ],
  },
  {
    id: 'timer@v1',
    name: 'Timer',
    description: 'Fires on a cron schedule to trigger downstream flow steps.',
    category: 'Protocol',
    icon: 'schedule',
    color: '#0058bc',
    properties: [
      { key: 'cron',     label: 'Cron Expression', type: 'string', required: true,  defaultValue: '0 * * * *' },
      { key: 'timezone', label: 'Timezone',         type: 'string', required: false, defaultValue: 'UTC' },
    ],
  },

  // ── Validate ──────────────────────────────────────────────
  {
    id: 'schema-validator@v1',
    name: 'Schema Validator',
    description: 'Validates the message body against a JSON Schema or XML XSD.',
    category: 'Validate',
    icon: 'rule',
    color: '#0ea5e9',
    properties: [
      { key: 'schemaType', label: 'Schema Type', type: 'select', required: true, defaultValue: 'json', options: ['json', 'xml'] },
      { key: 'schema',     label: 'Schema Definition', type: 'code', required: true, language: 'json' },
      { key: 'failFast',   label: 'Fail Fast', type: 'boolean', required: false, defaultValue: true },
    ],
  },
  {
    id: 'ip-bw-list@v1',
    name: 'IP Filter',
    description: 'Filters or validates IP addresses against a configurable allowlist or blocklist.',
    category: 'Validate',
    icon: 'phonelink_lock',
    color: '#0ea5e9',
    properties: [
      { key: 'mode', label: 'Mode', type: 'select', required: true, defaultValue: 'allow', options: ['allow', 'block'] },
      { key: 'ipList', label: 'IP List', type: 'textarea', required: true, defaultValue: '192.168.1.0/24' },
    ],
  },

  // ── Enrich ────────────────────────────────────────────────
  {
    id: 'content-enricher@v1',
    name: 'Content Enricher',
    description: 'Calls an external service and merges the response into the current message.',
    category: 'Enrich',
    icon: 'library_add',
    color: '#ec4899',
    properties: [
      { key: 'resourceUri', label: 'Resource URI', type: 'string', required: true, defaultValue: 'http://api.example.com/data' },
      { key: 'targetPath',  label: 'Target Path (JSON)', type: 'string', required: true, defaultValue: 'body.enrichedData' },
      { key: 'aggregationStrategy', label: 'Strategy', type: 'select', required: true, defaultValue: 'merge', options: ['merge', 'replace', 'append'] },
    ],
  },

  // ── Transform ──────────────────────────────────────────────
  {
    id: 'json-transform@v1',
    name: 'JSON Transform',
    description: 'Transforms the message body using a JSONata or Handlebars template.',
    category: 'Transform',
    icon: 'data_object',
    color: '#7c3aed',
    properties: [
      { key: 'template',  label: 'Template',    type: 'code', required: true, language: 'jsonata' },
      { key: 'outputVar', label: 'Output Var',  type: 'string',   required: false, defaultValue: 'body' },
    ],
  },
  {
    id: 'script@v1',
    name: 'Script',
    description: 'Executes a custom script to transform or enrich the message.',
    category: 'Transform',
    icon: 'code',
    color: '#7c3aed',
    properties: [
      { key: 'language', label: 'Language', type: 'select',   required: true, defaultValue: 'javascript', options: ['javascript','groovy','python'] },
      { key: 'code',     label: 'Code',     type: 'code',     required: true, language: 'javascript' },
    ],
  },
  {
    id: 'set-variable@v1',
    name: 'Set Variable',
    description: 'Sets a named variable in the exchange for use by downstream steps.',
    category: 'Transform',
    icon: 'variable_add',
    color: '#7c3aed',
    properties: [
      { key: 'name',  label: 'Variable Name',  type: 'string', required: true  },
      { key: 'value', label: 'Variable Value', type: 'string', required: true  },
    ],
  },

  // ── Route ──────────────────────────────────────────────────
  {
    id: 'choice@v1',
    name: 'Choice',
    description: 'Routes messages to different paths based on a boolean expression.',
    category: 'Route',
    icon: 'alt_route',
    color: '#9e3d00',
    properties: [
      { key: 'expression', label: 'Expression', type: 'string', required: true, defaultValue: '${header.type} == "urgent"' },
    ],
  },
  {
    id: 'split@v1',
    name: 'Split',
    description: 'Splits a collection message into individual messages for parallel processing.',
    category: 'Route',
    icon: 'call_split',
    color: '#9e3d00',
    properties: [
      { key: 'splitExpression', label: 'Split Expression', type: 'string', required: true, defaultValue: 'body.items' },
    ],
  },
  {
    id: 'filter-msg@v1',
    name: 'Filter',
    description: 'Drops messages that do not match the specified condition.',
    category: 'Route',
    icon: 'filter_alt',
    color: '#9e3d00',
    properties: [
      { key: 'condition', label: 'Condition', type: 'string', required: true },
    ],
  },

  // ── Operate (Connectors) ──────────────────────────────────
  {
    id: 'http-request@v1',
    name: 'HTTP Request',
    description: 'Calls an external HTTP/REST endpoint and returns the response.',
    category: 'Operate',
    icon: 'send',
    color: '#047857',
    properties: [
      { key: 'url',     label: 'URL',     type: 'string',   required: true  },
      { key: 'method',  label: 'Method',  type: 'select',   required: true, defaultValue: 'GET', options: ['GET','POST','PUT','PATCH','DELETE'] },
      { key: 'headers', label: 'Headers', type: 'json',     required: false, language: 'json' },
    ],
  },
  {
    id: 'db-query@v1',
    name: 'DB Query',
    description: 'Executes a SQL query against a configured data source.',
    category: 'Operate',
    icon: 'database',
    color: '#047857',
    properties: [
      { key: 'datasource', label: 'Data Source', type: 'string',   required: true  },
      { key: 'query',      label: 'Query',        type: 'code',     required: true, language: 'sql' },
    ],
  },
  {
    id: 'queue-publish@v1',
    name: 'Queue Publish',
    description: 'Publishes a message to a queue or topic via AMQP/RabbitMQ.',
    category: 'Operate',
    icon: 'publish',
    color: '#047857',
    properties: [
      { key: 'queue',    label: 'Queue',    type: 'string', required: true  },
      { key: 'exchange', label: 'Exchange', type: 'string', required: false, defaultValue: '' },
    ],
  },

  // ── Other ──────────────────────────────────────────────────
  {
    id: 'subflow-node@v1',
    name: 'Sub Flow',
    description: 'Groups a set of steps into a named, reusable composite node.',
    category: 'Composition',
    icon: 'layers',
    color: '#6b21a8',
    properties: [],
  },
  {
    id: 'catalog-node@v1',
    name: 'Catalog Node',
    description: 'Instantiates a custom node type from the catalog.',
    category: 'Catalog',
    icon: 'category',
    color: '#0f766e',
    properties: [],
  },
  {
    id: 'logger@v1',
    name: 'Logger',
    description: 'Logs the current message or a custom expression.',
    category: 'Control',
    icon: 'description',
    color: '#414755',
    properties: [
      { key: 'message', label: 'Message', type: 'string', required: true, defaultValue: '${body}' },
      { key: 'level',   label: 'Level',   type: 'select', required: true, defaultValue: 'INFO', options: ['DEBUG','INFO','WARN','ERROR'] },
    ],
  },
  {
    id: 'error-handler@v1',
    name: 'Error Handler',
    description: 'Catches and handles errors matching the specified error type.',
    category: 'Control',
    icon: 'error',
    color: '#414755',
    properties: [
      { key: 'errorType', label: 'Error Type', type: 'string', required: true, defaultValue: 'Exception' },
    ],
  },
];

export const CATEGORIES = ['Protocol', 'Validate', 'Enrich', 'Transform', 'Route', 'Operate', 'Composition', 'Catalog', 'Control'] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Protocol:    '#0058bc',
  Validate:    '#0ea5e9',
  Enrich:      '#ec4899',
  Transform:   '#7c3aed',
  Route:       '#9e3d00',
  Operate:     '#047857',
  Composition: '#6b21a8',
  Catalog:     '#0f766e',
  Control:     '#414755',
};

export function findNodeType(id: string): NodeTypeDef | undefined {
  return NODE_TYPE_CATALOG.find(n => n.id === id);
}
