import {
	type INodeType,
	type INodeTypeDescription,
	type IDataObject,
	type IHookFunctions,
	type IWebhookFunctions,
	type IWebhookResponseData,
	type ILoadOptionsFunctions,
	type IAllExecuteFunctions,
	type INodePropertyOptions,
	type IHttpRequestOptions,
	NodeConnectionTypes,
} from 'n8n-workflow';

type StatusResponse = {
	id: string | number;
	name?: string | null;
};

type TagResponse = {
	id: string | number;
	name?: string | null;
};

type WebhookSummary = {
	id?: string | number | null;
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

const isWebhookSummary = (value: unknown): value is WebhookSummary => {
	return typeof value === 'object' && value !== null && 'id' in value;
};

const extractId = (value: unknown): string | undefined => {
	if (typeof value === 'string') {
		return value;
	}
	if (typeof value === 'number') {
		return String(value);
	}
	if (typeof value === 'object' && value !== null && 'id' in value) {
		const candidate = value as Record<string, unknown>;
		if (typeof candidate.id === 'string') {
			return candidate.id;
		}
		if (typeof candidate.id === 'number') {
			return String(candidate.id);
		}
	}
	return undefined;
};

const parseErrorDetails = (
	error: unknown,
): {
	message?: string;
	statusCode?: number;
	responseBody?: unknown;
} => {
	const details: { message?: string; statusCode?: number; responseBody?: unknown } = {};
	if (error instanceof Error) {
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
		if ('responseBody' in candidate) {
			details.responseBody = candidate.responseBody;
		}
	}
	return details;
};

export class ImmojumpTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Immojump Trigger',
		name: 'immojumpTrigger',
		icon: { light: 'file:../Immojump/immojump.svg', dark: 'file:../Immojump/immojump.dark.svg' },
		group: ['trigger'],
		version: 1,
		description: 'Trigger workflows on Immojump events',
		defaults: {
			name: 'Immojump Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'immojumpApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Trigger Event',
				name: 'events',
				type: 'multiOptions',
				options: [
					{
						name: 'Status Changed',
						value: 'immobilie.status_changed',
						description: 'Triggers when an immobilie status is changed',
					},
					{
						name: 'Tag Assigned',
						value: 'immobilie.tag_added',
						description: 'Triggers when a tag is assigned to an immobilie',
					},
					{
						name: 'Tag Removed',
						value: 'immobilie.tag_removed',
						description: 'Triggers when a tag is removed from an immobilie',
					},
					{
						name: 'New Immobilie Created',
						value: 'immobilie.created',
						description: 'Triggers when a new immobilie is created',
					},
				],
				default: ['immobilie.status_changed'],
				required: true,
				description: 'The events that should trigger this node',
			},
			{
				displayName: 'Filter by Status',
				name: 'statusFilter',
				type: 'multiOptions',
				displayOptions: {
					show: {
						'/events': ['immobilie.status_changed'],
					},
				},
				default: [],
				typeOptions: {
					loadOptionsMethod: 'getStatuses',
				},
				description:
					'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Filter by Tag',
				name: 'tagFilter',
				type: 'multiOptions',
				displayOptions: {
					show: {
						'/events': ['immobilie.tag_added', 'immobilie.tag_removed'],
					},
				},
				default: [],
				typeOptions: {
					loadOptionsMethod: 'getTags',
				},
				description:
					'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Filter by Property Type',
				name: 'propertyTypeFilter',
				type: 'multiOptions',
				displayOptions: {
					show: {
						'/events': ['immobilie.created'],
					},
				},
				default: [],
				options: [
					{ name: 'Commercial (GEW)', value: 'GEW' },
					{ name: 'Condominium (ETW)', value: 'ETW' },
					{ name: 'Multi-Family House (MFH)', value: 'MFH' },
					{ name: 'Other', value: 'Sonstiges' },
					{ name: 'Residential Building (WGH)', value: 'WGH' },
					{ name: 'Single-Family House (EFH)', value: 'EFH' },
				],
				description: 'Only trigger for specific property types',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData() as IDataObject;
		const events = this.getNodeParameter('events') as string[];
		const statusFilters = this.getNodeParameter('statusFilter', []) as string[];
		const tagFilters = this.getNodeParameter('tagFilter', []) as string[];
		const propertyTypeFilters = this.getNodeParameter('propertyTypeFilter', []) as string[];

		const payloadData = (bodyData.payload as IDataObject | undefined);
		const event = (bodyData.event ?? bodyData.type ?? payloadData?.event) as string | undefined;
		const immobilie = bodyData.immobilie as IDataObject | undefined;

		// Check if this event should trigger
		if (!event || !events.includes(event)) {
			return {
				webhookResponse: {
					success: true,
					ignored: true,
					reason: event ? 'event_filtered' : 'event_missing',
				},
			};
		}

		// Apply filters based on event type
		let shouldTrigger = true;

		if (event === 'immobilie.status_changed' && statusFilters.length > 0) {
			// For status changes, check against the new status name in payload
			const payload = bodyData.payload as IDataObject;
			const newStatusName = payload?.new_status_name as string;
			shouldTrigger = statusFilters.includes(newStatusName);
		}

		if ((event === 'immobilie.tag_added' || event === 'immobilie.tag_removed') && tagFilters.length > 0) {
			const payload = bodyData.payload as IDataObject;
			const tagName = payload?.tag_name as string;
			shouldTrigger = tagFilters.includes(tagName);
		}

		if (event === 'immobilie.created' && propertyTypeFilters.length > 0) {
			// For immobilie.created, check the type from the payload (immobilie_type) or object.type
			const payload = bodyData.payload as IDataObject | undefined;
			const objectData = bodyData.object as IDataObject | undefined;
			const propertyType = (
				(payload?.immobilie_type as string) ||
				(immobilie && (immobilie.type as string)) ||
				(objectData?.type as string) ||
				''
			) as string;
			shouldTrigger = propertyType ? propertyTypeFilters.includes(propertyType) : false;
		}

		if (!shouldTrigger) {
			return {
				webhookResponse: {
					success: true,
					ignored: true,
					reason: 'filter_mismatch',
				},
			};
		}

		// Return the webhook data
		return {
			workflowData: [this.helpers.returnJsonArray([bodyData])],
		};
	}

	methods = {
		loadOptions: {
			async getStatuses(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('immojumpApi');
				const baseUrl = credentials.baseUrl as string;
				const organisationId = credentials.organisationId as string;

				const normalisedBaseUrl = baseUrl.replace(/\/$/, '');
				const requestOptions: IHttpRequestOptions = {
					method: 'GET',
					url: `${normalisedBaseUrl}/api/statuses/statuses`,
					qs: organisationId ? { organisation_id: organisationId } : undefined,
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
							value: typeof status.name === 'string' && status.name.trim() !== ''
								? status.name
								: String(status.id),
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
				const organisationId = credentials.organisationId as string;

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
								typeof tag.name === 'string' && tag.name.trim() !== '' ? tag.name : `Tag ${tag.id}`,
							value: typeof tag.name === 'string' && tag.name.trim() !== '' ? tag.name : String(tag.id),
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

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const webhookId = staticData.webhookId as string | undefined;
				if (!webhookId) {
					return false;
				}

				const credentials = await this.getCredentials('immojumpApi');
				const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
				const organisationId = credentials.organisationId as string | undefined;

				if (!organisationId) {
					return false;
				}

				const requestOptions: IHttpRequestOptions = {
					method: 'GET',
					url: `${baseUrl}/api/integrations/webhooks`,
					json: true,
				};

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this as unknown as IAllExecuteFunctions,
						'immojumpApi',
						requestOptions,
					);
					const exists =
						Array.isArray(response) &&
						response.some(
							(hook) =>
								isWebhookSummary(hook) && hook.id !== null && hook.id !== undefined && String(hook.id) === webhookId,
						);
					if (!exists) {
						delete staticData.webhookId;
					}
					return exists;
				} catch {
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('immojumpApi');
				const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
				const organisationId = credentials.organisationId as string | undefined;

				if (!organisationId) {
					return false;
				}

				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events', []) as string[];

				const body = {
					target_url: webhookUrl,
					event_types: events,
				};

				const requestOptions: IHttpRequestOptions = {
					method: 'POST',
					url: `${baseUrl}/api/integrations/webhooks`,
					body,
					json: true,
				};

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this as unknown as IAllExecuteFunctions,
						'immojumpApi',
						requestOptions,
					);
					const webhookId = extractId(response);
					if (webhookId) {
						const staticData = this.getWorkflowStaticData('node');
						staticData.webhookId = webhookId;
						return true;
					}
				} catch {
					return false;
				}

				return false;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const webhookId = staticData.webhookId as string | undefined;
				if (!webhookId) {
					return true;
				}

				const credentials = await this.getCredentials('immojumpApi');
				const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
				const organisationId = credentials.organisationId as string | undefined;

				if (!organisationId) {
					return false;
				}

				const requestOptions: IHttpRequestOptions = {
					method: 'DELETE',
					url: `${baseUrl}/api/integrations/webhooks/${webhookId}`,
					json: true,
				};

				try {
					await this.helpers.httpRequestWithAuthentication.call(
						this as unknown as IAllExecuteFunctions,
						'immojumpApi',
						requestOptions,
					);
					delete staticData.webhookId;
					return true;
				} catch (error: unknown) {
					const { statusCode } = parseErrorDetails(error);
					if (statusCode === 404) {
						delete staticData.webhookId;
						return true;
					}
					return false;
				}
			},
		},
	};
}
