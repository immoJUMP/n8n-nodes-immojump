import type { INodeProperties } from 'n8n-workflow';

const showOnlyForActivity = {
	resource: ['activity'],
};

const activityCreateBodyExpression = `={{ (() => {
	const body = {
		title: $parameter.title,
		type: $parameter.type,
		status: $parameter.status,
		priority: $parameter.priority,
	};

	const optional = $parameter.additionalFields ?? {};

	if (optional.description) {
		body.description = optional.description;
	}
	if (optional.scheduledStart) {
		body.scheduled_start = optional.scheduledStart;
	}
	if (optional.scheduledEnd) {
		body.scheduled_end = optional.scheduledEnd;
	}
	if (optional.actualStart) {
		body.actual_start = optional.actualStart;
	}
	if (optional.actualEnd) {
		body.actual_end = optional.actualEnd;
	}
	if (optional.assignedToId) {
		body.assigned_to_id = optional.assignedToId;
	}
	if ($parameter.immobilienId) {
		body.immobilien_id = $parameter.immobilienId;
	}

	const organisationId = $parameter.organisationId || $credentials.organisationId;
	if (organisationId) {
		body.organisation_id = organisationId;
	}

	const rawContactIds = optional.contactIds;
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
})() }}`;

const activityUpdateBodyExpression = `={{ (() => {
	const payload = {};
	const fields = $parameter.updateFields ?? {};

	if (fields.title !== undefined) {
		payload.title = fields.title;
	}
	if (fields.type !== undefined) {
		payload.type = fields.type;
	}
	if (fields.status !== undefined) {
		payload.status = fields.status;
	}
	if (fields.priority !== undefined) {
		payload.priority = fields.priority;
	}
	if (fields.description !== undefined) {
		payload.description = fields.description;
	}
	if (fields.scheduledStart !== undefined) {
		payload.scheduled_start = fields.scheduledStart;
	}
	if (fields.scheduledEnd !== undefined) {
		payload.scheduled_end = fields.scheduledEnd;
	}
	if (fields.actualStart !== undefined) {
		payload.actual_start = fields.actualStart;
	}
	if (fields.actualEnd !== undefined) {
		payload.actual_end = fields.actualEnd;
	}
	if (fields.assignedToId !== undefined) {
		payload.assigned_to_id = fields.assignedToId;
	}
	if (fields.immobilienId !== undefined) {
		payload.immobilien_id = fields.immobilienId || null;
	}
	if (fields.contactIds !== undefined && fields.contactIds !== '' && fields.contactIds !== null) {
		let parsedContactIds = fields.contactIds;
		if (typeof fields.contactIds === 'string') {
			try {
				parsedContactIds = JSON.parse(fields.contactIds);
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
				description: 'Retrieve a single activity by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/api/activities/activities/{{$parameter.activityId}}',
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
				description: 'Update an existing activity',
				routing: {
					request: {
						method: 'PUT',
						url: '=/api/activities/activities/{{$parameter.activityId}}',
						body: activityUpdateBodyExpression,
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
						url: '=/api/activities/activities/{{$parameter.activityId}}',
					},
				},
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Activity ID',
		name: 'activityId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForActivity,
				operation: ['get', 'update', 'delete'],
			},
		},
		default: '',
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
		description: 'ID of the immobilie to filter by or associate with the activity',
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
			{ name: 'Any', value: 'all' },
			{ name: 'Anruf', value: 'ANRUF' },
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
			{ name: 'Any', value: 'all' },
			{ name: 'Geplant', value: 'Geplant' },
			{ name: 'In Bearbeitung', value: 'In Bearbeitung' },
			{ name: 'Abgeschlossen', value: 'Abgeschlossen' },
			{ name: 'Abgebrochen', value: 'Abgebrochen' },
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
			{ name: 'Niedrig', value: 'Niedrig' },
			{ name: 'Nicht gesetzt', value: 'NA' },
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
			{ name: 'Geplant', value: 'Geplant' },
			{ name: 'In Bearbeitung', value: 'In Bearbeitung' },
			{ name: 'Abgeschlossen', value: 'Abgeschlossen' },
			{ name: 'Abgebrochen', value: 'Abgebrochen' },
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
			{ name: 'Niedrig', value: 'Niedrig' },
			{ name: 'Nicht gesetzt', value: 'NA' },
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
					{ name: 'Niedrig', value: 'Niedrig' },
					{ name: 'Nicht gesetzt', value: 'NA' },
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
					{ name: 'Geplant', value: 'Geplant' },
					{ name: 'In Bearbeitung', value: 'In Bearbeitung' },
					{ name: 'Abgeschlossen', value: 'Abgeschlossen' },
					{ name: 'Abgebrochen', value: 'Abgebrochen' },
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
