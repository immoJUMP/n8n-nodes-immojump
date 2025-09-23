import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class ImmojumpApi implements ICredentialType {
  name = 'immojumpApi';

  displayName = 'ImmoJump API';

  documentationUrl = 'https://github.com/immoJUMP/n8n-nodes-immojump#credentials';

  properties: INodeProperties[] = [
    { displayName: 'Base URL', name: 'baseUrl', type: 'string', default: 'http://localhost:8080', required: true },
    { displayName: 'Bearer Token', name: 'token', type: 'string', typeOptions: { password: true }, required: true, default: '' },
    { displayName: 'Organisation ID', name: 'organisationId', type: 'string', default: '' },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '={{"Bearer " + $credentials.token}}',
        'X-Organisation-Id': '={{$credentials.organisationId}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl}}',
      url: '/api/user/me-auth',
      method: 'GET',
    },
  };
}
