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
    ],
  };

  async webhook(this: IWebhookFunctions) {
    const body = this.getBodyData();
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

