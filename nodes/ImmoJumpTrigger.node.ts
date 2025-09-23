import { IHookFunctions, IWebhookFunctions } from 'n8n-core';
import { INodeType, INodeTypeDescription } from 'n8n-workflow';

export class ImmoJumpTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'ImmoJump Trigger',
    name: 'immoJumpTrigger',
    group: ['trigger'],
    version: 1,
    description: 'Triggers on ImmoJump events',
    defaults: { name: 'ImmoJump Trigger' },
    inputs: [],
    outputs: ['main'],
    credentials: [{ name: 'immoJumpApi', required: true }],
    webhooks: [{
      name: 'default', httpMethod: 'POST', responseMode: 'onReceived', path: 'immojump',
    }],
    properties: [
      {
        displayName: 'Event Types',
        name: 'eventTypes',
        type: 'string',
        default: 'immobilie.created,immobilie.status_changed',
        description: 'Comma separated list',
      },
      {
        displayName: 'Filter: Status From',
        name: 'filterStatusFrom',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Filter: Status To',
        name: 'filterStatusTo',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Filter: Tag Name',
        name: 'filterTagName',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Filter: Immobilie ID',
        name: 'filterImmobilieId',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Deduplicate Events',
        name: 'dedupe',
        type: 'boolean',
        default: true,
      },
    ],
  };

  async webhook(this: IWebhookFunctions) {
    const body = this.getBodyData();
    // Dedupe by envelope id
    const dedupe = this.getNodeParameter('dedupe') as boolean;
    if (dedupe) {
      const store = this.getWorkflowStaticData('global');
      const seen = store.__immojump_seen_ids || (store.__immojump_seen_ids = []);
      const id = body?.id;
      if (id && seen.includes(id)) return { workflowData: [[/* drop */]] };
      if (id) {
        seen.push(id);
        if (seen.length > 500) seen.shift();
      }
    }
    // Filters
    const allowed = (this.getNodeParameter('eventTypes') as string).split(',').map(s => s.trim()).filter(Boolean);
    if (allowed.length && !allowed.includes(body?.type)) return { workflowData: [[/* drop */]] };
    const fFrom = (this.getNodeParameter('filterStatusFrom') as string).trim();
    const fTo = (this.getNodeParameter('filterStatusTo') as string).trim();
    const fTag = (this.getNodeParameter('filterTagName') as string).trim();
    const fObj = (this.getNodeParameter('filterImmobilieId') as string).trim();
    if (fObj && body?.object?.id !== fObj) return { workflowData: [[/* drop */]] };
    if (fFrom && (body?.payload?.old_status_name || body?.payload?.old_status_id)?.toString() !== fFrom) return { workflowData: [[/* drop */]] };
    if (fTo && (body?.payload?.new_status_name || body?.payload?.new_status_id)?.toString() !== fTo) return { workflowData: [[/* drop */]] };
    if (fTag && (body?.payload?.tag_name || body?.payload?.tag_id)?.toString() !== fTag) return { workflowData: [[/* drop */]] };
    return { workflowData: [[{ json: body }]] };
  }

  async activate(this: IHookFunctions) {
    const cred = await this.getCredentials('immoJumpApi');
    const baseUrl = (cred.baseUrl as string).replace(/\/$/, '');
    const token = cred.token as string;
    const orgId = (cred.organisationId as string) || '';
    const webhookUrl = this.getNodeWebhookUrl('default');
    const eventTypes = (this.getNodeParameter('eventTypes') as string).split(',').map(s => s.trim()).filter(Boolean);
    const body: any = { target_url: webhookUrl, event_types: eventTypes };
    const res = await this.helpers.request({
      method: 'POST', uri: `${baseUrl}/api/integrations/webhooks`,
      body, json: true,
      headers: { Authorization: `Bearer ${token}`, ...(orgId ? { 'X-Organisation-Id': orgId } : {}) },
    });
    // store subscription id
    (this.getWorkflowStaticData('node') as any).subId = res.id;
    return true;
  }

  async deactivate(this: IHookFunctions) {
    const cred = await this.getCredentials('immoJumpApi');
    const baseUrl = (cred.baseUrl as string).replace(/\/$/, '');
    const token = cred.token as string;
    const orgId = (cred.organisationId as string) || '';
    const subId = (this.getWorkflowStaticData('node') as any).subId;
    if (!subId) return true;
    try {
      await this.helpers.request({
        method: 'DELETE', uri: `${baseUrl}/api/integrations/webhooks/${subId}`,
        headers: { Authorization: `Bearer ${token}`, ...(orgId ? { 'X-Organisation-Id': orgId } : {}) },
      });
    } catch {}
    return true;
  }
}
