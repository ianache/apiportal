export interface PropertyDef {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
  required: boolean;
  defaultValue?: any;
  options?: string[];
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
  // ── Protocol ───────────────────────────────────────────────
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

  // ── Transform ──────────────────────────────────────────────
  {
    id: 'json-transform@v1',
    name: 'JSON Transform',
    description: 'Transforms the message body using a JSONata or Handlebars template.',
    category: 'Transform',
    icon: 'data_object',
    color: '#7c3aed',
    properties: [
      { key: 'template',  label: 'Template',    type: 'textarea', required: true  },
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
      { key: 'code',     label: 'Code',     type: 'textarea', required: true  },
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

  // ── Routing ────────────────────────────────────────────────
  {
    id: 'choice@v1',
    name: 'Choice',
    description: 'Routes messages to different paths based on a boolean expression.',
    category: 'Routing',
    icon: 'alt_route',
    color: '#9e3d00',
    properties: [
      { key: 'expression', label: 'Expression', type: 'string', required: true },
    ],
  },
  {
    id: 'split@v1',
    name: 'Split',
    description: 'Splits a collection message into individual messages for parallel processing.',
    category: 'Routing',
    icon: 'call_split',
    color: '#9e3d00',
    properties: [
      { key: 'splitExpression', label: 'Split Expression', type: 'string', required: true },
    ],
  },
  {
    id: 'filter-msg@v1',
    name: 'Filter',
    description: 'Drops messages that do not match the specified condition.',
    category: 'Routing',
    icon: 'filter_alt',
    color: '#9e3d00',
    properties: [
      { key: 'condition', label: 'Condition', type: 'string', required: true },
    ],
  },

  // ── Connector ──────────────────────────────────────────────
  {
    id: 'http-request@v1',
    name: 'HTTP Request',
    description: 'Calls an external HTTP/REST endpoint and returns the response.',
    category: 'Connector',
    icon: 'send',
    color: '#047857',
    properties: [
      { key: 'url',     label: 'URL',     type: 'string',   required: true  },
      { key: 'method',  label: 'Method',  type: 'select',   required: true, defaultValue: 'GET', options: ['GET','POST','PUT','PATCH','DELETE'] },
      { key: 'headers', label: 'Headers', type: 'textarea', required: false },
    ],
  },
  {
    id: 'db-query@v1',
    name: 'DB Query',
    description: 'Executes a SQL query against a configured data source.',
    category: 'Connector',
    icon: 'database',
    color: '#047857',
    properties: [
      { key: 'datasource', label: 'Data Source', type: 'string',   required: true  },
      { key: 'query',      label: 'Query',        type: 'textarea', required: true  },
    ],
  },
  {
    id: 'queue-publish@v1',
    name: 'Queue Publish',
    description: 'Publishes a message to a queue or topic via AMQP/RabbitMQ.',
    category: 'Connector',
    icon: 'publish',
    color: '#047857',
    properties: [
      { key: 'queue',    label: 'Queue',    type: 'string', required: true  },
      { key: 'exchange', label: 'Exchange', type: 'string', required: false, defaultValue: '' },
    ],
  },

  // ── Catalog ────────────────────────────────────────────────
  {
    id: 'catalog-node@v1',
    name: 'Catalog Node',
    description: 'Instantiates a custom node type from the catalog with its configured properties.',
    category: 'Catalog',
    icon: 'category',
    color: '#0f766e',
    properties: [],
  },

  // ── Control ────────────────────────────────────────────────
  {
    id: 'logger@v1',
    name: 'Logger',
    description: 'Logs the current message or a custom expression to the flow log.',
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
      { key: 'when',      label: 'When',       type: 'string', required: false },
    ],
  },
];

export const CATEGORIES = ['Protocol', 'Transform', 'Routing', 'Connector', 'Catalog', 'Control'] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Protocol:  '#0058bc',
  Transform: '#7c3aed',
  Routing:   '#9e3d00',
  Connector: '#047857',
  Catalog:   '#0f766e',
  Control:   '#414755',
};

export function findNodeType(id: string): NodeTypeDef | undefined {
  return NODE_TYPE_CATALOG.find(n => n.id === id);
}
