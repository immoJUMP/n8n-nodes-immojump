import type { INodeProperties } from 'n8n-workflow';

const showOnlyForActivity = {
	resource: ['activity'],
};

export const buildActivityCreateBody = (
	parameter: Record<string, unknown>,
	credentials: Record<string, unknown>,
) => {
	const parseObject = (value: unknown, fieldName: string) => {
		if (value === undefined || value === null || value === '') {
			return undefined;
		}
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (trimmed === '') {
				return undefined;
			}
			try {
				return JSON.parse(trimmed);
			} catch (error) {
				throw new Error(`${fieldName} must be valid JSON`);
			}
		}
		if (typeof value === 'object') {
			return value;
		}
		throw new Error(`${fieldName} must be an object or JSON string`);
	};

	const pickValue = (primary: unknown, fallback: unknown) =>
		primary === undefined || primary === null || primary === '' ? fallback : primary;

	const body: Record<string, unknown> = {
		title: parameter.title,
		type: parameter.type,
		status: parameter.status,
		priority: parameter.priority,
	};

	const additional = (parameter.additionalFields as Record<string, unknown>) ?? {};
	const overrides = parseObject(parameter.additionalFieldsExpression, 'additionalFieldsExpression') as
		| Record<string, unknown>
		| undefined;
	const merged = overrides ? { ...additional, ...overrides } : additional;

	const description = pickValue(parameter.descriptionExpression, merged.description);
	if (description !== undefined && description !== '') {
		body.description = description;
	}
	if (merged.scheduledStart) {
		body.scheduled_start = merged.scheduledStart;
	}
	if (merged.scheduledEnd) {
		body.scheduled_end = merged.scheduledEnd;
	}
	if (merged.actualStart) {
		body.actual_start = merged.actualStart;
	}
	if (merged.actualEnd) {
		body.actual_end = merged.actualEnd;
	}
	if (merged.assignedToId) {
		body.assigned_to_id = merged.assignedToId;
	}
	if (parameter.immobilienId) {
		body.immobilien_id = parameter.immobilienId;
	}

	const organisationId = pickValue(parameter.organisationId, credentials.organisationId);
	if (organisationId) {
		body.organisation_id = organisationId;
	}

	const rawContactIds = merged.contactIds;
	if (rawContactIds !== undefined && rawContactIds !== '' && rawContactIds !== null) {
		let parsedContactIds = rawContactIds;
		if (typeof rawContactIds === 'string') {
			try {
				parsedContactIds = JSON.parse(rawContactIds);
			} catch (error) {
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
	const parseObject = (value: unknown, fieldName: string) => {
		if (value === undefined || value === null || value === '') {
			return undefined;
		}
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (trimmed === '') {
				return undefined;
			}
			try {
				return JSON.parse(trimmed);
			} catch (error) {
				throw new Error(`${fieldName} must be valid JSON`);
			}
		}
		if (typeof value === 'object') {
			return value;
		}
		throw new Error(`${fieldName} must be an object or JSON string`);
	};

	const pickValue = (primary: unknown, fallback: unknown) =>
		primary === undefined || primary === null || primary === '' ? fallback : primary;

	const payload: Record<string, unknown> = {};
	const fields = (parameter.updateFields as Record<string, unknown>) ?? {};
	const overrides = parseObject(parameter.updateFieldsExpression, 'updateFieldsExpression') as
		| Record<string, unknown>
		| undefined;
	const merged = overrides ? { ...fields, ...overrides } : fields;

	if (merged.title !== undefined) {
		payload.title = merged.title;
	}
	if (merged.type !== undefined) {
		payload.type = merged.type;
	}
	if (merged.status !== undefined) {
		payload.status = merged.status;
	}
	if (merged.priority !== undefined) {
		payload.priority = merged.priority;
	}

	const description = pickValue(parameter.descriptionExpression, merged.description);
	if (description !== undefined && description !== '') {
		payload.description = description;
	}
	if (merged.scheduledStart !== undefined) {
		payload.scheduled_start = merged.scheduledStart;
	}
	if (merged.scheduledEnd !== undefined) {
		payload.scheduled_end = merged.scheduledEnd;
	}
	if (merged.actualStart !== undefined) {
		payload.actual_start = merged.actualStart;
	}
	if (merged.actualEnd !== undefined) {
		payload.actual_end = merged.actualEnd;
	}
	if (merged.assignedToId !== undefined) {
		payload.assigned_to_id = merged.assignedToId;
	}
	if (merged.immobilienId !== undefined) {
		payload.immobilien_id = merged.immobilienId || null;
	}
	if (merged.contactIds !== undefined && merged.contactIds !== '' && merged.contactIds !== null) {
		let parsedContactIds = merged.contactIds;
		if (typeof merged.contactIds === 'string') {
			try {
				parsedContactIds = JSON.parse(merged.contactIds);
			} catch (error) {
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

const activityCreateBodyExpression = `={{ (${buildActivityCreateBody.toString()})($parameter, $credentials) }}`;
const activityUpdateBodyExpression = `={{ (${buildActivityUpdateBody.toString()})($parameter) }}`;

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
								'={{$parameter.organisationId || $credentials.organisationId || undefined}}',
							page: '={{$parameter.page || 1}}',
							per_page: '={{$parameter.perPage || 25}}',
							q: '={{$parameter.search || undefined}}',
							type: '={{$parameter.typeFilter || undefined}}',
							status: '={{$parameter.statusFilter || undefined}}',
							priority: '={{$parameter.priorityFilter || undefined}}',
							immobilie: '={{$parameter.immobilienId || undefined}}',
						},
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get activity',
				description: 'Retrieve a single activity by Immobilie and title',
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
						url: '={{ $parameter.immobilienId ? \'/api/activities/activities/immobilie/\' + $parameter.immobilienId : \'/api/activities/activities\' }}',
						body: activityCreateBodyExpression,
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update activity',
				description: 'Update an existing activity by Immobilie and title',
				routing: {
					request: {
						method: 'PUT',
						url: '=/api/activities/activities/immobilie/{{$parameter.immobilienIdUpdate}}/by-title',
						qs: {
							title: '={{$parameter.activityTitleUpdate}}',
						},
						body: activityUpdateBodyExpression,
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete activity',
				description: 'Delete an activity by Immobilie and title',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/api/activities/activities/immobilie/{{$parameter.immobilienIdDelete}}/by-title',
						qs: {
							title: '={{$parameter.activityTitleDelete}}',
						},
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
		description: 'Exact activity title to look up (must be unique within the Immobilie)',
	},
	{
		displayName: 'Organisation ID',
		name: 'organisationId',
		type: 'string',
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['getAll', 'create'],
			},
		},
		default: '',
		description:
			'Overrides the credential organisation for the request. Defaults to the organisation from the credentials.',
	},
	{
		displayName: 'Immobilien ID',
		name: 'immobilienId',
		type: 'string',
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['getAll', 'create', 'update'],
			},
		},
		default: '',
		description: 'ID of the Immobilie to filter by or associate with the activity',
	},
	{
		displayName: 'Immobilien ID',
		name: 'immobilienIdUpdate',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['update'],
			},
		},
		default: '',
		description: 'ID of the Immobilie whose activity should be updated',
	},
	{
		displayName: 'Immobilien ID',
		name: 'immobilienIdDelete',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['delete'],
			},
		},
		default: '',
		description: 'ID of the Immobilie whose activity should be deleted',
	},
	{
		displayName: 'Activity Title',
		name: 'activityTitleUpdate',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['update'],
			},
		},
		default: '',
		description: 'Exact activity title to update (must be unique within the Immobilie)',
	},
	{
		displayName: 'Activity Title',
		name: 'activityTitleDelete',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['delete'],
			},
		},
		default: '',
		description: 'Exact activity title to delete (must be unique within the Immobilie)',
	},
	{
		displayName: 'Immobilien ID',
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
		description: 'ID of the Immobilie whose activity title should be looked up',
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
		displayName: 'Search',
		name: 'search',
		type: 'string',
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['getAll'],
			},
		},
		default: '',
		description: 'Text to search within title, description and other fields',
	},
	{
		displayName: 'Type Filter',
		name: 'typeFilter',
		type: 'options',
		options: [
			{ name: 'Anruf', value: 'ANRUF' },
			{ name: 'Any', value: 'all' },
			{ name: 'Besichtigung', value: 'BESICHTIGUNG' },
			{ name: 'Brief', value: 'BRIEF' },
			{ name: 'E-Mail', value: 'E-MAIL' },
			{ name: 'Meeting', value: 'MEETING' },
			{ name: 'Notiz', value: 'NOTIZ' },
			{ name: 'Sonstiges', value: 'SONSTIGES' },
		],
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['getAll'],
			},
		},
		default: 'all',
		description: 'Filter by activity type',
	},
	{
		displayName: 'Status Filter',
		name: 'statusFilter',
		type: 'options',
		options: [
			{ name: 'Abgebrochen', value: 'Abgebrochen' },
			{ name: 'Abgeschlossen', value: 'Abgeschlossen' },
			{ name: 'Any', value: 'all' },
			{ name: 'Geplant', value: 'Geplant' },
			{ name: 'In Bearbeitung', value: 'In Bearbeitung' },
		],
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['getAll'],
			},
		},
		default: 'all',
		description: 'Filter by status',
	},
	{
		displayName: 'Priority Filter',
		name: 'priorityFilter',
		type: 'options',
		options: [
			{ name: 'Any', value: 'all' },
			{ name: 'Hoch', value: 'Hoch' },
			{ name: 'Mittel', value: 'Mittel' },
			{ name: 'Nicht Gesetzt', value: 'NA' },
			{ name: 'Niedrig', value: 'Niedrig' },
		],
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['getAll'],
			},
		},
		default: 'all',
		description: 'Filter by priority',
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
			{ name: 'Anruf', value: 'ANRUF' },
			{ name: 'Besichtigung', value: 'BESICHTIGUNG' },
			{ name: 'Brief', value: 'BRIEF' },
			{ name: 'E-Mail', value: 'E-MAIL' },
			{ name: 'Meeting', value: 'MEETING' },
			{ name: 'Notiz', value: 'NOTIZ' },
			{ name: 'Sonstiges', value: 'SONSTIGES' },
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
			{ name: 'Abgeschlossen', value: 'Abgeschlossen' },
			{ name: 'Abgebrochen', value: 'Abgebrochen' },
			{ name: 'Geplant', value: 'Geplant' },
			{ name: 'In Bearbeitung', value: 'In Bearbeitung' },
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
			{ name: 'Hoch', value: 'Hoch' },
			{ name: 'Mittel', value: 'Mittel' },
			{ name: 'Nicht Gesetzt', value: 'NA' },
			{ name: 'Niedrig', value: 'Niedrig' },
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
		displayName: 'Description (Expression)',
		name: 'descriptionExpression',
		type: 'string',
		typeOptions: {
			rows: 3,
		},
		default: '',
		description:
			'Use this field when you need expressions. It overrides Additional Fields / Update Fields Description.',
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Additional Fields (Expression JSON)',
		name: 'additionalFieldsExpression',
		type: 'json',
		default: '',
		description:
			'Optional JSON object to override Additional Fields. Useful when you need expressions for nested fields.',
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['create'],
			},
		},
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
		displayName: 'Update Fields (Expression JSON)',
		name: 'updateFieldsExpression',
		type: 'json',
		default: '',
		description:
			'Optional JSON object to override Update Fields. Useful when you need expressions for nested fields.',
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['update'],
			},
		},
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
				displayName: 'Immobilien ID',
				name: 'immobilienId',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				options: [
					{ name: 'Hoch', value: 'Hoch' },
					{ name: 'Mittel', value: 'Mittel' },
					{ name: 'Nicht Gesetzt', value: 'NA' },
					{ name: 'Niedrig', value: 'Niedrig' },
				],
				default: 'NA',
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
					{ name: 'Abgeschlossen', value: 'Abgeschlossen' },
					{ name: 'Abgebrochen', value: 'Abgebrochen' },
					{ name: 'Geplant', value: 'Geplant' },
					{ name: 'In Bearbeitung', value: 'In Bearbeitung' },
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
					{ name: 'Anruf', value: 'ANRUF' },
					{ name: 'Besichtigung', value: 'BESICHTIGUNG' },
					{ name: 'Brief', value: 'BRIEF' },
					{ name: 'E-Mail', value: 'E-MAIL' },
					{ name: 'Meeting', value: 'MEETING' },
					{ name: 'Notiz', value: 'NOTIZ' },
					{ name: 'Sonstiges', value: 'SONSTIGES' },
				],
				default: 'ANRUF',
			},
		],
	},
];
