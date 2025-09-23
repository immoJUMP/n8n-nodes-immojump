import { type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { userDescription } from './resources/user';
import { companyDescription } from './resources/company';

export class Immojump implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Immojump',
		name: 'immojump',
		icon: { light: 'file:immojump.svg', dark: 'file:immojump.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the ImmoJump API',
		defaults: {
			name: 'Immojump',
		},
		usableAsTool: true,
    inputs: ['main'],
    outputs: ['main'],
		credentials: [{ name: 'immojumpApi', required: true }],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: '={{"Bearer " + $credentials.token}}',
				'X-Organisation-Id': '={{$credentials.organisationId}}',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'User',
						value: 'user',
					},
					{
						name: 'Company',
						value: 'company',
					},
				],
				default: 'user',
			},
			...userDescription,
			...companyDescription,
		],
	};
}
