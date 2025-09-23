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
    type: 'string',
    displayOptions: { show: { resource: ['feed'], operationFeed: ['post'] } },
    default: '',
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
      }
    }
    return [out];
  }
}
