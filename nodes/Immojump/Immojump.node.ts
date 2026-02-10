import {
	type INodeType,
	type INodeTypeDescription,
	type ILoadOptionsFunctions,
	type IAllExecuteFunctions,
	type INodePropertyOptions,
	type IHttpRequestOptions,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { immobilieDescription } from './resources/immobilie';
import { contactDescription } from './resources/contact';
import { activityDescription } from './resources/activity';

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
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'immojumpApi', required: true }],
		requestDefaults: {
			baseURL: '={{ ($credentials.baseUrl || "").replace(/\\/$/, "").replace(/\\/api$/, "") }}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: '={{"Bearer " + $credentials.token}}',
				'X-Organisation-Id': '={{$credentials.organisationId}}',
			},
			json: true,
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
					{
						name: 'Contact',
						value: 'contact',
					},
					{
						name: 'Activity',
						value: 'activity',
					},
				],
				default: 'immobilie',
			},
			...immobilieDescription,
			...contactDescription,
			...activityDescription,
		],
	};

	methods = {
		loadOptions: {
			async getStatuses(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('immojumpApi');
				const baseUrl = credentials.baseUrl as string;

				const normalisedBaseUrl = baseUrl.replace(/\/$/, '');
				const requestOptions: IHttpRequestOptions = {
					method: 'GET',
					url: `${normalisedBaseUrl}/api/statuses/statuses`,
					json: true,
				};

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this as unknown as IAllExecuteFunctions,
						'immojumpApi',
						requestOptions,
					);

					if (Array.isArray(response)) {
						const statuses = response.filter(isStatusResponse);
						return statuses.map((status) => ({
							name:
								typeof status.name === 'string' && status.name.trim() !== ''
									? status.name
									: `Status ${status.id}`,
							value: String(status.id),
						}));
					}

					return [];
				} catch (error: unknown) {
					const { message } = parseErrorDetails(error);
					return [
						{ name: 'Debug: API Error', value: 'error' },
						{ name: `Debug: ${message ?? 'Unknown error'}`, value: 'debug' },
					];
				}
			},

			async getTags(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('immojumpApi');
				const baseUrl = credentials.baseUrl as string;
				const organisationId = credentials.organisationId as string | undefined;

				if (!organisationId) {
					return [
						{ name: 'Debug: Missing organisation', value: 'missing_org' },
					];
				}

				const normalisedBaseUrl = baseUrl.replace(/\/$/, '');
				const requestOptions: IHttpRequestOptions = {
					method: 'GET',
					url: `${normalisedBaseUrl}/api/${organisationId}/tags`,
					json: true,
				};

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this as unknown as IAllExecuteFunctions,
						'immojumpApi',
						requestOptions,
					);

					if (Array.isArray(response)) {
						const tags = response.filter(isTagResponse);
						return tags.map((tag) => ({
							name:
								typeof tag.name === 'string' && tag.name.trim() !== ''
									? tag.name
									: `Tag ${tag.id}`,
							value: String(tag.id),
						}));
					}

					return [];
				} catch (error: unknown) {
					const { message } = parseErrorDetails(error);
					return [
						{ name: 'Debug: API Error', value: 'error' },
						{ name: `Debug: ${message ?? 'Unknown error'}`, value: 'debug' },
					];
				}
			},
		},
	};
}
