import type { INodeProperties } from 'n8n-workflow';

declare const $evaluateExpression: (expression: string, itemIndex?: number) => unknown;
declare const $json: Record<string, unknown>;

const showOnlyForActivity = {
	resource: ['activity'],
};

export const buildActivityCreateBody = (
	parameter: Record<string, unknown>,
	credentials: Record<string, unknown>,
) => {
	const resolveExpressionValue = (value: unknown): unknown => {
		if (typeof value !== 'string') {
			return value;
		}
		const trimmed = value.trim();
		if (trimmed === '') {
			return value;
		}
		const hasExpression = trimmed.startsWith('=');
		if (!hasExpression || typeof $evaluateExpression !== 'function') {
			return value;
		}
		const expression = trimmed.startsWith('=') ? trimmed.slice(1) : trimmed;
		return $evaluateExpression(expression);
	};

	const resolveStringValue = (value: unknown): string | undefined => {
		const resolved = resolveExpressionValue(value);
		if (resolved === undefined || resolved === null) {
			return undefined;
		}
		const trimmed = String(resolved).trim();
		return trimmed === '' ? undefined : trimmed;
	};

	const parseObject = (value: unknown, fieldName: string) => {
		const resolved = resolveExpressionValue(value);
		if (resolved === undefined || resolved === null || resolved === '') {
			return undefined;
		}
		if (typeof resolved === 'string') {
			const trimmed = resolved.trim();
			if (trimmed === '') {
				return undefined;
			}
			try {
				return JSON.parse(trimmed);
			} catch {
				throw new Error(`${fieldName} must be valid JSON`);
			}
		}
		if (typeof resolved === 'object') {
			return resolved;
		}
		throw new Error(`${fieldName} must be an object or JSON string`);
	};

	const pickValue = (primary: unknown, fallback: unknown) =>
		primary === undefined || primary === null || primary === '' ? fallback : primary;

	const body: Record<string, unknown> = {
		title: resolveExpressionValue(parameter.title),
		type: resolveExpressionValue(parameter.type),
		status: resolveExpressionValue(parameter.status),
		priority: resolveExpressionValue(parameter.priority),
	};

	const additional = (parameter.additionalFields as Record<string, unknown>) ?? {};
	const overrides = parseObject(parameter.additionalFieldsExpression, 'additionalFieldsExpression') as
		| Record<string, unknown>
		| undefined;
	const merged = overrides ? { ...additional, ...overrides } : additional;

	const descriptionSource = pickValue(merged.description, parameter.descriptionExpression);
	const description = resolveStringValue(descriptionSource);
	if (description !== undefined) {
		body.description = description;
	}
	const scheduledStart = resolveExpressionValue(merged.scheduledStart);
	if (scheduledStart !== undefined && scheduledStart !== '') {
		body.scheduled_start = scheduledStart;
	}
	const scheduledEnd = resolveExpressionValue(merged.scheduledEnd);
	if (scheduledEnd !== undefined && scheduledEnd !== '') {
		body.scheduled_end = scheduledEnd;
	}
	const actualStart = resolveExpressionValue(merged.actualStart);
	if (actualStart !== undefined && actualStart !== '') {
		body.actual_start = actualStart;
	}
	const actualEnd = resolveExpressionValue(merged.actualEnd);
	if (actualEnd !== undefined && actualEnd !== '') {
		body.actual_end = actualEnd;
	}
	const assignedToId = resolveStringValue(merged.assignedToId);
	if (assignedToId !== undefined) {
		body.assigned_to_id = assignedToId;
	}
	const immobilienId = resolveExpressionValue(pickValue(merged.immobilienId, parameter.immobilienId));
	if (immobilienId !== undefined && immobilienId !== '') {
		body.immobilien_id = immobilienId;
	}

	const credentialOrganisationId =
		(credentials.organisationId as string | undefined) ||
		(credentials.organizationId as string | undefined);
	if (credentialOrganisationId) {
		body.organisation_id = credentialOrganisationId;
	}

	const rawContactIds = resolveExpressionValue(merged.contactIds);
	if (rawContactIds !== undefined && rawContactIds !== '' && rawContactIds !== null) {
		let parsedContactIds = rawContactIds;
		if (typeof rawContactIds === 'string') {
			try {
				parsedContactIds = JSON.parse(rawContactIds);
			} catch {
				throw new Error('contactIds must be valid JSON (e.g. ["uuid1","uuid2"])');
			}
		}
		if (Array.isArray(parsedContactIds)) {
			body.contact_ids = parsedContactIds;
		} else {
			throw new Error('contactIds must be an array of UUID strings');
		}
	}

	return body;
};

export const buildActivityUpdateBody = (parameter: Record<string, unknown>) => {
	const resolveExpressionValue = (value: unknown): unknown => {
		if (typeof value !== 'string') {
			return value;
		}
		const trimmed = value.trim();
		if (trimmed === '') {
			return value;
		}
		const hasExpression = trimmed.startsWith('=');
		if (!hasExpression || typeof $evaluateExpression !== 'function') {
			return value;
		}
		const expression = trimmed.startsWith('=') ? trimmed.slice(1) : trimmed;
		return $evaluateExpression(expression);
	};

	const resolveStringValue = (value: unknown): string | undefined => {
		const resolved = resolveExpressionValue(value);
		if (resolved === undefined || resolved === null) {
			return undefined;
		}
		const trimmed = String(resolved).trim();
		return trimmed === '' ? undefined : trimmed;
	};

	const parseObject = (value: unknown, fieldName: string) => {
		const resolved = resolveExpressionValue(value);
		if (resolved === undefined || resolved === null || resolved === '') {
			return undefined;
		}
		if (typeof resolved === 'string') {
			const trimmed = resolved.trim();
			if (trimmed === '') {
				return undefined;
			}
			try {
				return JSON.parse(trimmed);
			} catch {
				throw new Error(`${fieldName} must be valid JSON`);
			}
		}
		if (typeof resolved === 'object') {
			return resolved;
		}
		throw new Error(`${fieldName} must be an object or JSON string`);
	};

	const pickValue = (primary: unknown, fallback: unknown) =>
		primary === undefined || primary === null || primary === '' ? fallback : primary;

	const payload: Record<string, unknown> = {};
	const fields = (parameter.updateFields as Record<string, unknown>) ?? {};
	const additionalOptions = (parameter.additionalOptionsUpdate as Record<string, unknown>) ?? {};
	const overrides = parseObject(parameter.updateFieldsExpression, 'updateFieldsExpression') as
		| Record<string, unknown>
		| undefined;
	const merged = overrides ? { ...fields, ...overrides } : fields;

	const titleSource = pickValue(merged.title, pickValue(additionalOptions.activityTitle, parameter.activityTitleUpdate));
	if (titleSource !== undefined && titleSource !== null && titleSource !== '') {
		payload.title = resolveExpressionValue(titleSource);
	}
	if (merged.type !== undefined) {
		payload.type = resolveExpressionValue(merged.type);
	}
	if (merged.status !== undefined) {
		payload.status = resolveExpressionValue(merged.status);
	}
	if (merged.priority !== undefined) {
		payload.priority = resolveExpressionValue(merged.priority);
	}

	const descriptionSource = pickValue(merged.description, parameter.descriptionExpression);
	const description = resolveStringValue(descriptionSource);
	if (description !== undefined) {
		payload.description = description;
	}
	if (merged.scheduledStart !== undefined) {
		payload.scheduled_start = resolveExpressionValue(merged.scheduledStart);
	}
	if (merged.scheduledEnd !== undefined) {
		payload.scheduled_end = resolveExpressionValue(merged.scheduledEnd);
	}
	if (merged.actualStart !== undefined) {
		payload.actual_start = resolveExpressionValue(merged.actualStart);
	}
	if (merged.actualEnd !== undefined) {
		payload.actual_end = resolveExpressionValue(merged.actualEnd);
	}
	if (merged.assignedToId !== undefined) {
		const assignedToId = resolveStringValue(merged.assignedToId);
		if (assignedToId !== undefined) {
			payload.assigned_to_id = assignedToId;
		}
	}
	if (merged.immobilienId !== undefined) {
		const immobilienId = resolveExpressionValue(merged.immobilienId);
		payload.immobilien_id = immobilienId || null;
	}
	const rawContactIds = resolveExpressionValue(merged.contactIds);
	if (rawContactIds !== undefined && rawContactIds !== '' && rawContactIds !== null) {
		let parsedContactIds = rawContactIds;
		if (typeof rawContactIds === 'string') {
			try {
				parsedContactIds = JSON.parse(rawContactIds);
			} catch {
				throw new Error('contactIds must be valid JSON (e.g. ["uuid1","uuid2"])');
			}
		}
		if (Array.isArray(parsedContactIds)) {
			payload.contact_ids = parsedContactIds;
		} else {
			throw new Error('contactIds must be an array of UUID strings');
		}
	}

	return payload;
};

const activityUpdateBodyExpression = `={{ (${buildActivityUpdateBody.toString()})($parameter) }}`;
const activityParamOrJsonExpression = (parameterPath: string) =>
	`={{ (() => {
		const getByPath = (obj, path) => {
			if (!obj || typeof obj !== 'object') return undefined;
			let current = obj;
			for (const segment of path.split('.')) {
				if (!segment) continue;
				if (!current || typeof current !== 'object' || !(segment in current)) return undefined;
				current = current[segment];
			}
			return current;
		};
		const resolveValue = (raw) => {
			if (raw === undefined || raw === null) return undefined;
			if (typeof raw !== 'string') return raw;
			const trimmed = raw.trim();
			if (!trimmed.startsWith('=')) return trimmed === '' ? undefined : trimmed;

			const expressionCandidate = trimmed.slice(1).trim();
			const moustacheMatch = expressionCandidate.match(/^\\{\\{\\s*(.*?)\\s*\\}\\}$/);
			const normalizedExpression = moustacheMatch ? moustacheMatch[1] : expressionCandidate;
			const jsonPathMatch = normalizedExpression.match(/^\\$json\\.([A-Za-z0-9_.]+)$/);
			if (jsonPathMatch) {
				const resolvedFromJson = getByPath($json, jsonPathMatch[1]);
				if (resolvedFromJson !== undefined) return resolvedFromJson;
			}
			if (typeof $evaluateExpression === 'function') {
				const evaluated = $evaluateExpression(normalizedExpression);
				if (typeof evaluated === 'string' && evaluated.trim() === trimmed) return undefined;
				return evaluated;
			}
			return undefined;
		};
		return resolveValue(getByPath($parameter, '${parameterPath}')) ?? undefined;
	})() }}`;
const activityParamOrJsonExpressionWithFallback = (
	primaryPath: string,
	fallbackPathOrPaths: string | string[],
) =>
	`={{ (() => {
		const getByPath = (obj, path) => {
			if (!obj || typeof obj !== 'object') return undefined;
			let current = obj;
			for (const segment of path.split('.')) {
				if (!segment) continue;
				if (!current || typeof current !== 'object' || !(segment in current)) return undefined;
				current = current[segment];
			}
			return current;
		};
		const resolveValue = (raw) => {
			if (raw === undefined || raw === null) return undefined;
			if (typeof raw !== 'string') return raw;
			const trimmed = raw.trim();
			if (!trimmed.startsWith('=')) return trimmed === '' ? undefined : trimmed;

			const expressionCandidate = trimmed.slice(1).trim();
			const moustacheMatch = expressionCandidate.match(/^\\{\\{\\s*(.*?)\\s*\\}\\}$/);
			const normalizedExpression = moustacheMatch ? moustacheMatch[1] : expressionCandidate;
			const jsonPathMatch = normalizedExpression.match(/^\\$json\\.([A-Za-z0-9_.]+)$/);
			if (jsonPathMatch) {
				const resolvedFromJson = getByPath($json, jsonPathMatch[1]);
				if (resolvedFromJson !== undefined) return resolvedFromJson;
			}
			if (typeof $evaluateExpression === 'function') {
				const evaluated = $evaluateExpression(normalizedExpression);
				if (typeof evaluated === 'string' && evaluated.trim() === trimmed) return undefined;
				return evaluated;
			}
			return undefined;
		};
		const primary = resolveValue(getByPath($parameter, '${primaryPath}'));
		if (primary !== undefined && primary !== null && primary !== '') return primary;
		const fallbackPaths = ${JSON.stringify(
			Array.isArray(fallbackPathOrPaths) ? fallbackPathOrPaths : [fallbackPathOrPaths],
		)};
		for (const fallbackPath of fallbackPaths) {
			const fallback = resolveValue(getByPath($parameter, fallbackPath));
			if (fallback !== undefined && fallback !== null && fallback !== '') return fallback;
		}
		return undefined;
	})() }}`;
const activityCreateImmobilienIdExpression = activityParamOrJsonExpressionWithFallback(
	'additionalFields.immobilienId',
	'immobilienId',
);
const activityCreateContactIdsExpression = `={{ (() => {
	const raw = (() => {
		const value = $parameter.additionalFields?.contactIds;
		if (value === undefined || value === null || value === '') return undefined;
		if (typeof value !== 'string') return value;
		const trimmed = value.trim();
		if (!trimmed.startsWith('=')) return trimmed;
		const expressionCandidate = trimmed.slice(1).trim();
		const moustacheMatch = expressionCandidate.match(/^\\{\\{\\s*(.*?)\\s*\\}\\}$/);
		const normalizedExpression = moustacheMatch ? moustacheMatch[1] : expressionCandidate;
		const jsonPathMatch = normalizedExpression.match(/^\\$json\\.([A-Za-z0-9_.]+)$/);
		if (jsonPathMatch) {
			const getByPath = (obj, path) => {
				if (!obj || typeof obj !== 'object') return undefined;
				let current = obj;
				for (const segment of path.split('.')) {
					if (!segment) continue;
					if (!current || typeof current !== 'object' || !(segment in current)) return undefined;
					current = current[segment];
				}
				return current;
			};
			const resolvedFromJson = getByPath($json, jsonPathMatch[1]);
			if (resolvedFromJson !== undefined) return resolvedFromJson;
		}
		if (typeof $evaluateExpression === 'function') {
			const evaluated = $evaluateExpression(normalizedExpression);
			if (typeof evaluated === 'string' && evaluated.trim() === trimmed) return undefined;
			return evaluated;
		}
		return undefined;
	})();
	if (raw === undefined || raw === null || raw === '') return undefined;
	if (Array.isArray(raw)) return raw;
	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		if (trimmed === '') return undefined;
		try {
			const parsed = JSON.parse(trimmed);
			return Array.isArray(parsed) ? parsed : undefined;
		} catch {
			return undefined;
		}
	}
	return undefined;
})() }}`;

export const activityDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForActivity,
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get activities',
				description: 'List activities with optional filters',
				routing: {
					request: {
						method: 'GET',
						url: '/api/activities/activities',
						qs: {
							organisation_id:
								'={{$credentials.organisationId || $credentials.organizationId || $parameter.organisationId || undefined}}',
							page: '={{$parameter.page || 1}}',
							per_page: '={{$parameter.perPage || 25}}',
							q: '={{$parameter.additionalOptions?.search || $parameter.search || undefined}}',
							type: '={{$parameter.additionalOptions?.typeFilter || $parameter.typeFilter || undefined}}',
							status: '={{$parameter.additionalOptions?.statusFilter || $parameter.statusFilter || undefined}}',
							priority:
								'={{$parameter.additionalOptions?.priorityFilter || $parameter.priorityFilter || undefined}}',
							immobilie:
								'={{$parameter.additionalOptions?.immobilienId || $parameter.immobilienId || undefined}}',
						},
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get activity',
				description: 'Retrieve a single activity by property and title',
				routing: {
					request: {
						method: 'GET',
						url: '=/api/activities/activities/immobilie/{{$parameter.immobilienIdGet}}/by-title',
						qs: {
							title: '={{$parameter.activityTitle}}',
						},
					},
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create activity',
				description: 'Create a new activity, optionally linked to a property',
					routing: {
						request: {
							method: 'POST',
							url: '/api/activities/activities',
							qs: {
								organisation_id: '={{$credentials.organisationId || $credentials.organizationId || undefined}}',
							},
							body: {
								title: activityParamOrJsonExpression('title'),
								type: activityParamOrJsonExpression('type'),
							status: activityParamOrJsonExpression('status'),
							priority: activityParamOrJsonExpression('priority'),
							description: activityParamOrJsonExpression('additionalFields.description'),
							scheduled_start: activityParamOrJsonExpression('additionalFields.scheduledStart'),
							scheduled_end: activityParamOrJsonExpression('additionalFields.scheduledEnd'),
							actual_start: activityParamOrJsonExpression('additionalFields.actualStart'),
							actual_end: activityParamOrJsonExpression('additionalFields.actualEnd'),
							assigned_to_id: activityParamOrJsonExpression('additionalFields.assignedToId'),
							contact_ids: activityCreateContactIdsExpression,
								immobilien_id: activityCreateImmobilienIdExpression,
								organisation_id: '={{$credentials.organisationId || $credentials.organizationId || undefined}}',
							},
							json: true,
						},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update activity',
				description: 'Update an existing activity by ID',
				routing: {
					request: {
						method: 'PUT',
						url: '=/api/activities/activities/{{$parameter.activityIdUpdate}}',
						qs: {
							title: activityParamOrJsonExpressionWithFallback('updateFields.title', [
								'additionalOptionsUpdate.activityTitle',
								'activityTitleUpdate',
							]),
							type: activityParamOrJsonExpression('updateFields.type'),
							status: activityParamOrJsonExpression('updateFields.status'),
							priority: activityParamOrJsonExpression('updateFields.priority'),
							description: activityParamOrJsonExpression('updateFields.description'),
							scheduled_start: activityParamOrJsonExpression('updateFields.scheduledStart'),
							scheduled_end: activityParamOrJsonExpression('updateFields.scheduledEnd'),
							actual_start: activityParamOrJsonExpression('updateFields.actualStart'),
							actual_end: activityParamOrJsonExpression('updateFields.actualEnd'),
							assigned_to_id: activityParamOrJsonExpression('updateFields.assignedToId'),
							immobilien_id: activityParamOrJsonExpression('updateFields.immobilienId'),
						},
						body: activityUpdateBodyExpression,
						json: true,
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete activity',
				description: 'Delete an activity by ID',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/api/activities/activities/{{$parameter.activityIdDelete}}',
					},
				},
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Activity Title',
		name: 'activityTitle',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['get'],
			},
		},
		default: '',
		description: 'Exact activity title to look up (must be unique within the property)',
	},
	{
		displayName: 'Activity ID',
		name: 'activityIdUpdate',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['update'],
			},
		},
		default: '',
		description: 'ID of the activity to update',
	},
	{
		displayName: 'Activity ID',
		name: 'activityIdDelete',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['delete'],
			},
		},
		default: '',
		description: 'ID of the activity to delete',
	},
	{
		displayName: 'Property ID',
		name: 'immobilienIdGet',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['get'],
			},
		},
		default: '',
		description: 'ID of the property whose activity title should be looked up',
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['getAll'],
			},
		},
		default: 1,
	},
	{
		displayName: 'Per Page',
		name: 'perPage',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 200,
		},
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['getAll'],
			},
		},
		default: 25,
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Priority Filter',
				name: 'priorityFilter',
				type: 'options',
				options: [
					{ name: 'Any', value: 'all' },
					{ name: 'High', value: 'Hoch' },
					{ name: 'Low', value: 'Niedrig' },
					{ name: 'Medium', value: 'Mittel' },
					{ name: 'Not Set', value: 'NA' },
				],
				default: 'all',
				description: 'Filter by priority',
			},
			{
				displayName: 'Property ID',
				name: 'immobilienId',
				type: 'string',
				default: '',
				description: 'Filter by property ID',
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Text to search within title, description and other fields',
			},
			{
				displayName: 'Status Filter',
				name: 'statusFilter',
				type: 'options',
				options: [
					{ name: 'Any', value: 'all' },
					{ name: 'Cancelled', value: 'Abgebrochen' },
					{ name: 'Completed', value: 'Abgeschlossen' },
					{ name: 'In Progress', value: 'In Bearbeitung' },
					{ name: 'Planned', value: 'Geplant' },
				],
				default: 'all',
				description: 'Filter by status',
			},
			{
				displayName: 'Type Filter',
				name: 'typeFilter',
				type: 'options',
				options: [
					{ name: 'Any', value: 'all' },
					{ name: 'Call', value: 'ANRUF' },
					{ name: 'Email', value: 'E-MAIL' },
					{ name: 'Letter', value: 'BRIEF' },
					{ name: 'Meeting', value: 'MEETING' },
					{ name: 'Note', value: 'NOTIZ' },
					{ name: 'Other', value: 'SONSTIGES' },
					{ name: 'Viewing', value: 'BESICHTIGUNG' },
				],
				default: 'all',
				description: 'Filter by activity type',
			},
		],
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['create'],
			},
		},
		default: '',
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		options: [
			{ name: 'Call', value: 'ANRUF' },
			{ name: 'Email', value: 'E-MAIL' },
			{ name: 'Letter', value: 'BRIEF' },
			{ name: 'Meeting', value: 'MEETING' },
			{ name: 'Note', value: 'NOTIZ' },
			{ name: 'Other', value: 'SONSTIGES' },
			{ name: 'Viewing', value: 'BESICHTIGUNG' },
		],
		required: true,
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['create'],
			},
		},
		default: 'ANRUF',
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		options: [
			{ name: 'Completed', value: 'Abgeschlossen' },
			{ name: 'Cancelled', value: 'Abgebrochen' },
			{ name: 'Planned', value: 'Geplant' },
			{ name: 'In Progress', value: 'In Bearbeitung' },
		],
		required: true,
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['create'],
			},
		},
		default: 'Geplant',
	},
	{
		displayName: 'Priority',
		name: 'priority',
		type: 'options',
		options: [
			{ name: 'High', value: 'Hoch' },
			{ name: 'Medium', value: 'Mittel' },
			{ name: 'Not Set', value: 'NA' },
			{ name: 'Low', value: 'Niedrig' },
		],
		required: true,
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['create'],
			},
		},
		default: 'NA',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Actual End',
				name: 'actualEnd',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Actual Start',
				name: 'actualStart',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Assigned To ID',
				name: 'assignedToId',
				type: 'string',
				default: '',
				description: 'User ID to assign the activity to',
			},
			{
				displayName: 'Contact IDs',
				name: 'contactIds',
				type: 'json',
				default: '',
				description: 'JSON array of contact UUIDs to link to the activity',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
			},
			{
				displayName: 'Property ID',
				name: 'immobilienId',
				type: 'string',
				default: '',
				description: 'ID of the property to associate with the activity',
			},
			{
				displayName: 'Scheduled End',
				name: 'scheduledEnd',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Scheduled Start',
				name: 'scheduledStart',
				type: 'dateTime',
				default: '',
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptionsUpdate',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Activity Title',
				name: 'activityTitle',
				type: 'string',
				default: '',
				description: 'Optional new title. You can also set title in Update Fields.',
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptionsDelete',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['delete'],
			},
		},
		options: [
			{
				displayName: 'Activity Title',
				name: 'activityTitle',
				type: 'string',
				default: '',
				description: 'Optional label for your workflow context (not used for delete request)',
			},
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Actual End',
				name: 'actualEnd',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Actual Start',
				name: 'actualStart',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Assigned To ID',
				name: 'assignedToId',
				type: 'string',
				default: '',
				description: 'User ID to assign the activity to',
			},
			{
				displayName: 'Contact IDs',
				name: 'contactIds',
				type: 'json',
				default: '',
				description: 'JSON array of contact UUIDs to link to the activity',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				options: [
					{ name: 'High', value: 'Hoch' },
					{ name: 'Medium', value: 'Mittel' },
					{ name: 'Not Set', value: 'NA' },
					{ name: 'Low', value: 'Niedrig' },
				],
				default: 'NA',
			},
			{
				displayName: 'Property ID',
				name: 'immobilienId',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Scheduled End',
				name: 'scheduledEnd',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Scheduled Start',
				name: 'scheduledStart',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Completed', value: 'Abgeschlossen' },
					{ name: 'Cancelled', value: 'Abgebrochen' },
					{ name: 'Planned', value: 'Geplant' },
					{ name: 'In Progress', value: 'In Bearbeitung' },
				],
				default: 'Geplant',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Call', value: 'ANRUF' },
					{ name: 'Email', value: 'E-MAIL' },
					{ name: 'Letter', value: 'BRIEF' },
					{ name: 'Meeting', value: 'MEETING' },
					{ name: 'Note', value: 'NOTIZ' },
					{ name: 'Other', value: 'SONSTIGES' },
					{ name: 'Viewing', value: 'BESICHTIGUNG' },
				],
				default: 'ANRUF',
			},
		],
	},
];
