import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class ImmoJumpApi implements ICredentialType {
  name = 'immoJumpApi';
  displayName = 'ImmoJump API';
  properties: INodeProperties[] = [
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://immokalkulation.de',
      placeholder: 'https://immokalkulation.de',
      required: true,
    },
    {
      displayName: 'API Token',
      name: 'token',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
    },
    {
      displayName: 'Organisation ID',
      name: 'organisationId',
      type: 'string',
      default: '',
      description: 'If empty, backend uses current organisation of the token user',
    },
  ];

  // Let n8n attach Authorization and optional org header automatically
  // and provide a simple test request.
  authenticate = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '={{"Bearer " + $credentials.token}}',
        'X-Organisation-Id': '={{$credentials.organisationId}}',
      },
    },
  } as any;

  test = {
    request: {
      baseURL: '={{$credentials.baseUrl}}',
      url: '/api/user/me-auth',
      method: 'GET',
    },
  } as any;
}
