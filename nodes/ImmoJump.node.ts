import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData, INodeProperties, NodeOperationError, INodeType, INodeTypeDescription } from 'n8n-workflow';

const properties: INodeProperties[] = [
  {
    displayName: 'Resource',
    name: 'resource',
    type: 'options',
    options: [
      { name: 'Immobilie', value: 'immobilie' },
      { name: 'Org Feed', value: 'feed' },
    ],
    default: 'immobilie',
  },
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: { show: { resource: ['immobilie'] } },
    options: [
      { name: 'Create', value: 'create' },
      { name: 'Update Status', value: 'updateStatus' },
      { name: 'Set Tags', value: 'setTags' },
    ],
    default: 'create',
  },
  {
    displayName: 'Type',
    name: 'type',
    type: 'string',
    displayOptions: { show: { resource: ['immobilie'], operation: ['create'] } },
    default: 'ETW',
  },
  {
    displayName: 'Daten (JSON)',
    name: 'daten',
    type: 'string',
    displayOptions: { show: { resource: ['immobilie'], operation: ['create'] } },
    default: '{"adresse": "Teststraße 1"}',
  },
  {
    displayName: 'Immobilie ID',
    name: 'immobilieId',
    type: 'string',
    displayOptions: { show: { resource: ['immobilie'], operation: ['updateStatus', 'setTags'] } },
    default: '',
    placeholder: 'UUID of the property',
  },
  {
    displayName: 'Status',
    name: 'statusId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getStatuses' },
    displayOptions: { show: { resource: ['immobilie'], operation: ['updateStatus'] } },
    default: '',
  },
  {
    displayName: 'Tags',
    name: 'tagIds',
    type: 'multiOptions',
    typeOptions: { loadOptionsMethod: 'getTags' },
    displayOptions: { show: { resource: ['immobilie'], operation: ['setTags'] } },
    default: [],
  },
  {
    displayName: 'Operation',
    name: 'operationFeed',
    type: 'options',
    displayOptions: { show: { resource: ['feed'] } },
    options: [
      { name: 'Post Message', value: 'post' },
    ],
    default: 'post',
  },
  {
    displayName: 'Title',
    name: 'title',
    type: 'string',
    displayOptions: { show: { resource: ['feed'], operationFeed: ['post'] } },
    default: '',
  },
  {
    displayName: 'Message (HTML)',
    name: 'message',
    type: 'string',
    typeOptions: { rows: 4 },
    displayOptions: { show: { resource: ['feed'], operationFeed: ['post'] } },
    default: '',
  },
  {
    displayName: 'Channel ID',
    name: 'channelId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getChannels' },
    displayOptions: { show: { resource: ['feed'], operationFeed: ['post'] } },
    default: '',
  },
  // Integration helper
  {
    displayName: 'Operation',
    name: 'operationIntegration',
    type: 'options',
    displayOptions: { show: { resource: ['integration'] } },
    options: [
      { name: 'Send Test Event', value: 'sendTestEvent' },
    ],
    default: 'sendTestEvent',
  },
  {
    displayName: 'Object Type',
    name: 'objectType',
    type: 'string',
    displayOptions: { show: { resource: ['integration'], operationIntegration: ['sendTestEvent'] } },
    default: 'integration',
  },
  {
    displayName: 'Object ID',
    name: 'objectId',
    type: 'string',
    displayOptions: { show: { resource: ['integration'], operationIntegration: ['sendTestEvent'] } },
    default: 'test',
  },
  {
    displayName: 'Payload (JSON)',
    name: 'payload',
    type: 'string',
    typeOptions: { rows: 3 },
    displayOptions: { show: { resource: ['integration'], operationIntegration: ['sendTestEvent'] } },
    default: '{"source":"n8n"}',
  },
];

export class ImmoJump implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'ImmoJump',
    name: 'immoJump',
    group: ['transform'],
    version: 1,
    description: 'ImmoJump actions',
    defaults: { name: 'ImmoJump' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'immoJumpApi', required: true }],
    properties,
  };

  methods = {
    loadOptions: {
      async getChannels(this: IExecuteFunctions) {
        const cred = await this.getCredentials('immoJumpApi');
        const baseUrl = (cred.baseUrl as string).replace(/\/$/, '');
        const headers: any = { Authorization: `Bearer ${cred.token}` };
        if (cred.organisationId) headers['X-Organisation-Id'] = cred.organisationId as string;
        const res = await this.helpers.request({ method: 'GET', uri: `${baseUrl}/api/organisation-feed/channels`, json: true, headers });
        return (res || []).map((c: any) => ({ name: c.name, value: c.id }));
      },
      async getStatuses(this: IExecuteFunctions) {
        const cred = await this.getCredentials('immoJumpApi');
        const baseUrl = (cred.baseUrl as string).replace(/\/$/, '');
        const headers: any = { Authorization: `Bearer ${cred.token}` };
        // Backend registers status_bp at url_prefix='/api/statuses', route '/statuses' → '/api/statuses/statuses'
        const res = await this.helpers.request({ method: 'GET', uri: `${baseUrl}/api/statuses/statuses`, json: true, headers });
        return (res || []).map((s: any) => ({ name: s.name || `${s.id}`, value: s.id }));
      },
      async getTags(this: IExecuteFunctions) {
        const cred = await this.getCredentials('immoJumpApi');
        const baseUrl = (cred.baseUrl as string).replace(/\/$/, '');
        const orgId = (cred.organisationId as string) || '';
        const headers: any = { Authorization: `Bearer ${cred.token}` };
        if (!orgId) return [];
        const res = await this.helpers.request({ method: 'GET', uri: `${baseUrl}/api/${orgId}/tags`, json: true, headers });
        return (res || []).map((t: any) => ({ name: t.name, value: t.id }));
      },
    },
  } as any;

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const cred = await this.getCredentials('immoJumpApi');
    const baseUrl = (cred.baseUrl as string).replace(/\/$/, '');
    const token = cred.token as string;
    const orgId = (cred.organisationId as string) || '';

    const out: INodeExecutionData[] = [];
    for (let i = 0; i < items.length; i++) {
      const resource = this.getNodeParameter('resource', i) as string;
      if (resource === 'immobilie') {
        const op = this.getNodeParameter('operation', i) as string;
        if (op === 'create') {
          const type = this.getNodeParameter('type', i) as string;
          const datenRaw = this.getNodeParameter('daten', i) as string;
          let daten;
          try { daten = JSON.parse(datenRaw || '{}'); } catch { throw new NodeOperationError('Invalid JSON in daten'); }
          const body: any = { type, daten };
          if (orgId) body.organisation_id = orgId;
          const res = await this.helpers.request({
            method: 'POST', uri: `${baseUrl}/api/v2/immobilien`,
            body, json: true,
            headers: { Authorization: `Bearer ${token}`, ...(orgId ? { 'X-Organisation-Id': orgId } : {}) },
          });
          out.push({ json: res });
        } else if (op === 'updateStatus') {
          const immobilieId = this.getNodeParameter('immobilieId', i) as string;
          const statusId = this.getNodeParameter('statusId', i) as number | string;
          const body: any = { status_id: Number(statusId) };
          const res = await this.helpers.request({
            method: 'PUT', uri: `${baseUrl}/api/v2/immobilien/${immobilieId}`,
            body, json: true,
            headers: { Authorization: `Bearer ${token}`, ...(orgId ? { 'X-Organisation-Id': orgId } : {}) },
          });
          out.push({ json: res });
        } else if (op === 'setTags') {
          const immobilieId = this.getNodeParameter('immobilieId', i) as string;
          const tagIds = this.getNodeParameter('tagIds', i) as string[];
          const res = await this.helpers.request({
            method: 'PUT', uri: `${baseUrl}/api/immobilie/${immobilieId}/tags`,
            body: tagIds, json: true,
            headers: { Authorization: `Bearer ${token}`, ...(orgId ? { 'X-Organisation-Id': orgId } : {}) },
          });
          out.push({ json: res });
        }
      } else if (resource === 'feed') {
        const title = this.getNodeParameter('title', i) as string;
        const message = this.getNodeParameter('message', i) as string;
        const channelId = this.getNodeParameter('channelId', i) as string;
        const body: any = { title, message };
        if (channelId) body.channel_id = channelId;
        const res = await this.helpers.request({
          method: 'POST', uri: `${baseUrl}/api/organisation-feed/post`,
          body, json: true,
          headers: { Authorization: `Bearer ${token}`, ...(orgId ? { 'X-Organisation-Id': orgId } : {}) },
        });
        out.push({ json: res });
      } else if (resource === 'integration') {
        const op = this.getNodeParameter('operationIntegration', i) as string;
        if (op === 'sendTestEvent') {
          const objectType = this.getNodeParameter('objectType', i) as string;
          const objectId = this.getNodeParameter('objectId', i) as string;
          const payloadRaw = this.getNodeParameter('payload', i) as string;
          let payload;
          try { payload = JSON.parse(payloadRaw || '{}'); } catch { throw new NodeOperationError('Invalid JSON in payload'); }
          const res = await this.helpers.request({
            method: 'POST', uri: `${baseUrl}/api/integrations/test-event`, json: true,
            body: { object_type: objectType, object_id: objectId, payload },
            headers: { Authorization: `Bearer ${token}`, ...(orgId ? { 'X-Organisation-Id': orgId } : {}) },
          });
          out.push({ json: res });
        }
      }
    }
    return [out];
  }
}
