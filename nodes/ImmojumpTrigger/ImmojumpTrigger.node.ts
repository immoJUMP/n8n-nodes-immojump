import {
	type INodeType,
	type INodeTypeDescription,
	type ITriggerFunctions,
	type ITriggerResponse,
	type IDataObject,
	type IHookFunctions,
	type IWebhookFunctions,
	type IWebhookResponseData,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type IRequestOptions,
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
		outputs: ['main'],
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
						events: ['immobilie.status_changed'],
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
						events: ['immobilie.tag_added', 'immobilie.tag_removed'],
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
						events: ['immobilie.created'],
					},
				},
				default: [],
				options: [
					{ name: 'Eigentumswohnung (ETW)', value: 'ETW' },
					{ name: 'Einfamilienhaus (EFH)', value: 'EFH' },
					{ name: 'Gewerbe (GEW)', value: 'GEW' },
					{ name: 'Mehrfamilienhaus (MFH)', value: 'MFH' },
					{ name: 'Sonstiges', value: 'Sonstiges' },
					{ name: 'Wohngebäude (WGH)', value: 'WGH' },
				],
				description: 'Only trigger for specific property types',
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const manualTriggerFunction = async () => {
			// For manual testing - return sample data
			const sampleData = {
				event: 'immobilie.status_changed',
				immobilie: {
					id: 'sample-123',
					title: 'Sample Property',
					status: 'active',
					tags: ['premium'],
					type: 'apartment',
					address: 'Sample Street 123',
					price: 250000,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				previousStatus: 'pending',
				timestamp: new Date().toISOString(),
			};

			this.emit([this.helpers.returnJsonArray([sampleData])]);
		};

		return {
			manualTriggerFunction,
		};
	}

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData() as IDataObject;
		const events = this.getNodeParameter('events') as string[];
		const statusFilters = this.getNodeParameter('statusFilter', []) as string[];
		const tagFilters = this.getNodeParameter('tagFilter', []) as string[];
		const propertyTypeFilters = this.getNodeParameter('propertyTypeFilter', []) as string[];

		const event = bodyData.event as string;
		const immobilie = bodyData.immobilie as IDataObject;

		// Check if this event should trigger
		if (!events.includes(event)) {
			return { noWebhookResponse: true };
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
			// For immobilie.created, check the type from the main object or payload
			const propertyType = (immobilie.type || bodyData.object_type) as string;
			shouldTrigger = propertyTypeFilters.includes(propertyType);
		}

		if (!shouldTrigger) {
			return { noWebhookResponse: true };
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
				const token = credentials.token as string;
				const organisationId = credentials.organisationId as string;

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
					qs: organisationId ? { organisation_id: organisationId } : undefined,
					json: true,
				};

				this.logger.debug('immojumpTrigger.getStatuses request', {
					url: requestOptions.url,
					hasOrganisationId: Boolean(organisationId),
				});

				try {
					const response = await this.helpers.request(requestOptions);

					if (Array.isArray(response)) {
						const statuses = response.filter(isStatusResponse);
						this.logger.debug('immojumpTrigger.getStatuses response', {
							count: statuses.length,
							url: requestOptions.url,
						});
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

					this.logger.warn('immojumpTrigger.getStatuses unexpected payload', {
						type: typeof response,
						url: requestOptions.url,
					});
					return [];
				} catch (error: unknown) {
					const { message, statusCode } = parseErrorDetails(error);
					this.logger.error('immojumpTrigger.getStatuses failed', {
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
				const organisationId = credentials.organisationId as string;

				const headers: Record<string, string> = {
					Authorization: `Bearer ${token}`,
				};
				if (organisationId) {
					headers['X-Organisation-Id'] = organisationId;
				}

				if (!organisationId) {
					this.logger.error('immojumpTrigger.getTags missing organisationId');
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

				this.logger.debug('immojumpTrigger.getTags request', {
					url: requestOptions.url,
					hasOrganisationId: Boolean(organisationId),
				});

				try {
					const response = await this.helpers.request(requestOptions);

					if (Array.isArray(response)) {
						const tags = response.filter(isTagResponse);
						this.logger.debug('immojumpTrigger.getTags response', {
							count: tags.length,
							url: requestOptions.url,
						});
						return tags.map((tag) => ({
							name:
								typeof tag.name === 'string' && tag.name.trim() !== '' ? tag.name : `Tag ${tag.id}`,
							value: typeof tag.name === 'string' && tag.name.trim() !== '' ? tag.name : String(tag.id),
						}));
					}

					this.logger.warn('immojumpTrigger.getTags unexpected payload', {
						type: typeof response,
						url: requestOptions.url,
					});
					return [];
				} catch (error: unknown) {
					const { message, statusCode } = parseErrorDetails(error);
					this.logger.error('immojumpTrigger.getTags failed', {
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
				const token = credentials.token as string;
				const organisationId = credentials.organisationId as string | undefined;

				if (!organisationId) {
					this.logger.error('immojumpTrigger.checkExists missing organisationId');
					return false;
				}

				const headers: Record<string, string> = {
					Authorization: `Bearer ${token}`,
				};
				headers['X-Organisation-Id'] = organisationId;

				const requestOptions: IRequestOptions = {
					method: 'GET',
					url: `${baseUrl}/api/integrations/webhooks`,
					headers,
					json: true,
				};

				this.logger.debug('immojumpTrigger.checkExists request', {
					url: requestOptions.url,
					webhookId,
				});

					try {
						const response = await this.helpers.request(requestOptions);
						const exists =
							Array.isArray(response) &&
							response.some(
								(hook) =>
									isWebhookSummary(hook) && hook.id !== null && hook.id !== undefined && String(hook.id) === webhookId,
							);
						if (!exists) {
							delete staticData.webhookId;
						}
						this.logger.debug('immojumpTrigger.checkExists result', { webhookId, exists });
						return exists;
					} catch (error: unknown) {
						const { message, statusCode, responseBody } = parseErrorDetails(error);
						this.logger.error('immojumpTrigger.checkExists failed', {
							message,
							statusCode,
							responseBody,
						});
						return false;
					}
				},

			async create(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('immojumpApi');
				const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
				const token = credentials.token as string;
				const organisationId = credentials.organisationId as string | undefined;

				if (!organisationId) {
					this.logger.error('immojumpTrigger.create missing organisationId');
					return false;
				}

				const headers: Record<string, string> = {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				};
				headers['X-Organisation-Id'] = organisationId;

				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events', []) as string[];

				const body = {
					target_url: webhookUrl,
					event_types: events,
				};

				const requestOptions: IRequestOptions = {
					method: 'POST',
					url: `${baseUrl}/api/integrations/webhooks`,
					headers,
					body,
					json: true,
				};

				this.logger.debug('immojumpTrigger.create request', {
					url: requestOptions.url,
					events,
					webhookUrl,
				});

					try {
						const response = await this.helpers.request(requestOptions);
						const webhookId = extractId(response);
						if (webhookId) {
							const staticData = this.getWorkflowStaticData('node');
							staticData.webhookId = webhookId;
							this.logger.debug('immojumpTrigger.create success', { webhookId });
							return true;
						}
						this.logger.warn('immojumpTrigger.create missing webhook id in response');
					} catch (error: unknown) {
						const { message, statusCode, responseBody } = parseErrorDetails(error);
						this.logger.error('immojumpTrigger.create failed', {
							message,
							statusCode,
							responseBody,
						});
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
				const token = credentials.token as string;
				const organisationId = credentials.organisationId as string | undefined;

				if (!organisationId) {
					this.logger.error('immojumpTrigger.delete missing organisationId');
					return false;
				}

				const headers: Record<string, string> = {
					Authorization: `Bearer ${token}`,
				};
				headers['X-Organisation-Id'] = organisationId;

				const requestOptions: IRequestOptions = {
					method: 'DELETE',
					url: `${baseUrl}/api/integrations/webhooks/${webhookId}`,
					headers,
					json: true,
				};

				this.logger.debug('immojumpTrigger.delete request', {
					url: requestOptions.url,
					webhookId,
				});

					try {
						await this.helpers.request(requestOptions);
						delete staticData.webhookId;
						this.logger.debug('immojumpTrigger.delete success', { webhookId });
						return true;
					} catch (error: unknown) {
						const { message, statusCode, responseBody } = parseErrorDetails(error);
						if (statusCode === 404) {
							delete staticData.webhookId;
							return true;
						}
						this.logger.error('immojumpTrigger.delete failed', {
							message,
							statusCode,
							responseBody,
						});
						return false;
					}
				},
			},
		};
}
