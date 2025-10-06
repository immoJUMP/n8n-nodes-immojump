import {
	type INodeType,
	type INodeTypeDescription,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type IRequestOptions,
} from 'n8n-workflow';
import { immobilieDescription } from './resources/immobilie';

type StatusResponse = {
	id: string | number;
	name?: string | null;
};

type TagResponse = {
	id: string | number;
	name?: string | null;
};

const isStatusResponse = (value: unknown): value is StatusResponse => {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const candidate = value as Record<string, unknown>;
	return (
		('id' in candidate && (typeof candidate.id === 'string' || typeof candidate.id === 'number')) &&
		('name' in candidate ? typeof candidate.name === 'string' || candidate.name === null || candidate.name === undefined : true)
	);
};

const isTagResponse = (value: unknown): value is TagResponse => {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const candidate = value as Record<string, unknown>;
	return (
		('id' in candidate && (typeof candidate.id === 'string' || typeof candidate.id === 'number')) &&
		('name' in candidate ? typeof candidate.name === 'string' || candidate.name === null || candidate.name === undefined : true)
	);
};

const parseErrorDetails = (
	error: unknown,
): {
	message?: string;
	statusCode?: number;
} => {
	const details: { message?: string; statusCode?: number } = {};
	if (error instanceof Error && typeof error.message === 'string') {
		details.message = error.message;
	}
	if (typeof error === 'object' && error !== null) {
		const candidate = error as Record<string, unknown>;
		if (typeof candidate.message === 'string') {
			details.message = candidate.message;
		}
		if (typeof candidate.statusCode === 'number') {
			details.statusCode = candidate.statusCode;
		}
	}
	return details;
};

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
						name: 'Immobilie',
						value: 'immobilie',
					},
				],
				default: 'immobilie',
			},
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
						const statuses = response.filter(isStatusResponse);
						this.logger.debug('immojump.getStatuses response', {
							count: statuses.length,
							url: requestOptions.url,
						});
						return statuses.map((status) => ({
							name:
								typeof status.name === 'string' && status.name.trim() !== ''
									? status.name
									: `Status ${status.id}`,
							value: String(status.id),
						}));
					}

					this.logger.warn('immojump.getStatuses unexpected payload', {
						type: typeof response,
						url: requestOptions.url,
					});
					return [];
				} catch (error: unknown) {
					const { message, statusCode } = parseErrorDetails(error);
					this.logger.error('immojump.getStatuses failed', {
						message,
						statusCode,
						url: requestOptions.url,
					});
					return [
						{ name: 'Debug: API Error', value: 'error' },
						{ name: `Debug: ${message ?? 'Unknown error'}`, value: 'debug' },
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
						const tags = response.filter(isTagResponse);
						this.logger.debug('immojump.getTags response', {
							count: tags.length,
							url: requestOptions.url,
						});
						return tags.map((tag) => ({
							name:
								typeof tag.name === 'string' && tag.name.trim() !== ''
									? tag.name
									: `Tag ${tag.id}`,
							value: String(tag.id),
						}));
					}

					this.logger.warn('immojump.getTags unexpected payload', {
						type: typeof response,
						url: requestOptions.url,
					});
					return [];
				} catch (error: unknown) {
					const { message, statusCode } = parseErrorDetails(error);
					this.logger.error('immojump.getTags failed', {
						message,
						statusCode,
						url: requestOptions.url,
					});
					return [
						{ name: 'Debug: API Error', value: 'error' },
						{ name: `Debug: ${message ?? 'Unknown error'}`, value: 'debug' },
					];
				}
			},
		},
	};
}
