import {
	type INodeType,
	type INodeTypeDescription,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type IRequestOptions,
} from 'n8n-workflow';
import { userDescription } from './resources/user';
import { companyDescription } from './resources/company';
import { immobilieDescription } from './resources/immobilie';

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
					{
						name: 'Immobilie',
						value: 'immobilie',
					},
				],
				default: 'user',
			},
			...userDescription,
			...companyDescription,
			...immobilieDescription,
		],
	};

	methods = {
		loadOptions: {
			async getStatuses(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('immojumpApi');
				const baseUrl = credentials.baseUrl as string;
				const token = credentials.token as string;
				const organisationId = credentials.organisationId as string | undefined;

				const headers: Record<string, string> = {
					Authorization: `Bearer ${token}`,
				};
				if (organisationId) {
					headers['X-Organisation-Id'] = organisationId;
				}
				const normalisedBaseUrl = baseUrl.replace(/\/$/, '');
				const requestOptions: IRequestOptions = {
					method: 'GET',
					url: `${normalisedBaseUrl}/api/statuses/statuses`,
					headers,
					json: true,
				};

				this.logger.debug('immojump.getStatuses request', {
					url: requestOptions.url,
					hasOrganisationId: Boolean(organisationId),
				});

				try {
					const response = await this.helpers.request(requestOptions);

					if (Array.isArray(response)) {
						this.logger.debug('immojump.getStatuses response', {
							count: response.length,
							url: requestOptions.url,
						});
						return response.map((status: any) => ({
							name: status.name || `Status ${status.id}`,
							value: status.id,
						}));
					}

					this.logger.warn('immojump.getStatuses unexpected payload', {
						type: typeof response,
						url: requestOptions.url,
					});
					return [];
				} catch (error: any) {
					this.logger.error('immojump.getStatuses failed', {
						message: error?.message,
						statusCode: error?.statusCode,
						url: requestOptions.url,
					});
					return [
						{ name: 'Debug: API Error', value: 'error' },
						{ name: `Debug: ${error?.message || 'Unknown error'}`, value: 'debug' },
					];
				}
			},

			async getTags(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('immojumpApi');
				const baseUrl = credentials.baseUrl as string;
				const token = credentials.token as string;
				const organisationId = credentials.organisationId as string | undefined;

				const headers: Record<string, string> = {
					Authorization: `Bearer ${token}`,
				};
				if (organisationId) {
					headers['X-Organisation-Id'] = organisationId;
				}

				if (!organisationId) {
					this.logger.error('immojump.getTags missing organisationId');
					return [
						{ name: 'Debug: Missing organisation', value: 'missing_org' },
					];
				}

				const normalisedBaseUrl = baseUrl.replace(/\/$/, '');
				const requestOptions: IRequestOptions = {
					method: 'GET',
					url: `${normalisedBaseUrl}/api/${organisationId}/tags`,
					headers,
					json: true,
				};

				this.logger.debug('immojump.getTags request', {
					url: requestOptions.url,
					hasOrganisationId: Boolean(organisationId),
				});

				try {
					const response = await this.helpers.request(requestOptions);

					if (Array.isArray(response)) {
						this.logger.debug('immojump.getTags response', {
							count: response.length,
							url: requestOptions.url,
						});
						return response.map((tag: any) => ({
							name: tag.name || `Tag ${tag.id}`,
							value: tag.id,
						}));
					}

					this.logger.warn('immojump.getTags unexpected payload', {
						type: typeof response,
						url: requestOptions.url,
					});
					return [];
				} catch (error: any) {
					this.logger.error('immojump.getTags failed', {
						message: error?.message,
						statusCode: error?.statusCode,
						url: requestOptions.url,
					});
					return [
						{ name: 'Debug: API Error', value: 'error' },
						{ name: `Debug: ${error?.message || 'Unknown error'}`, value: 'debug' },
					];
				}
			},
		},
	};
}
