import type { INodeProperties } from 'n8n-workflow';

const showOnlyForImmobilie = {
	resource: ['immobilie'],
};
const immobilieTypeOptions = [
	{ name: 'Eigentumswohnung (ETW)', value: 'ETW' },
	{ name: 'Mehrfamilienhaus (MFH)', value: 'MFH' },
	{ name: 'Einfamilienhaus (EFH)', value: 'EFH' },
	{ name: 'Wohn- Und Geschäftshaus (WGH)', value: 'WGH' },
	{ name: 'Gewerbeimmobilie (GEW)', value: 'GEW' },
	{ name: 'Sonstiges', value: 'Sonstiges' },
];

export const buildImmobilieCreateBody = (
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
			} catch {
				throw new Error(`${fieldName} must be valid JSON`);
			}
		}
		if (typeof value === 'object') {
			return value;
		}
		throw new Error(`${fieldName} must be an object or JSON string`);
	};

	const body: Record<string, unknown> = {
		type: parameter.type,
		name: parameter.name,
		organisation_id: credentials.organisationId,
	};
	const additional = (parameter.additionalFields as Record<string, unknown>) ?? {};
	const overrides = parseObject(parameter.additionalFieldsExpression, 'additionalFieldsExpression') as
		| Record<string, unknown>
		| undefined;
	const merged = overrides ? { ...additional, ...overrides } : additional;
	const daten: Record<string, unknown> = {};

	if (merged.adresse) {
		daten.adresse = merged.adresse;
	}
	if (merged.kaufpreis !== undefined) {
		daten.kaufpreis = merged.kaufpreis;
	}
	if (merged.flaeche !== undefined) {
		daten.wohnflaeche = merged.flaeche;
	}
	if (merged.baujahr !== undefined) {
		daten.baujahr = merged.baujahr;
	}
	if (merged.zustand) {
		daten.zustand = merged.zustand;
	}
	if (merged.datenJson) {
		const raw = merged.datenJson;
		const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
		if (parsed && typeof parsed === 'object') {
			Object.assign(daten, parsed);
		}
	}

	if (Object.keys(daten).length > 0) {
		body.daten = daten;
	}

	return body;
};

export const buildImmobilieUpdateBody = (parameter: Record<string, unknown>) => {
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
			} catch {
				throw new Error(`${fieldName} must be valid JSON`);
			}
		}
		if (typeof value === 'object') {
			return value;
		}
		throw new Error(`${fieldName} must be an object or JSON string`);
	};

	const payload: Record<string, unknown> = {};
	const fields = (parameter.updateFields as Record<string, unknown>) ?? {};
	const overrides = parseObject(parameter.updateFieldsExpression, 'updateFieldsExpression') as
		| Record<string, unknown>
		| undefined;
	const merged = overrides ? { ...fields, ...overrides } : fields;

	if (merged.name) {
		payload.name = merged.name;
	}
	if (merged.type) {
		payload.type = merged.type;
	}

	const numericMappings: Array<[string, string]> = [
		['acquisitionPrice', 'acquisition_price'],
		['salePrice', 'sale_price'],
		['askingPrice', 'asking_price'],
		['targetSalePrice', 'target_sale_price'],
	];

	for (const [sourceKey, targetKey] of numericMappings) {
		const value = merged[sourceKey];
		if (value !== undefined) {
			payload[targetKey] = value;
		}
	}

	if (merged.previewImageId !== undefined) {
		payload.preview_image_id = merged.previewImageId || null;
	}

	const daten: Record<string, unknown> = {};
	if (merged.adresse) {
		daten.adresse = merged.adresse;
	}
	if (merged.kaufpreis !== undefined) {
		daten.kaufpreis = merged.kaufpreis;
	}
	if (merged.flaeche !== undefined) {
		daten.wohnflaeche = merged.flaeche;
	}
	if (merged.baujahr !== undefined) {
		daten.baujahr = merged.baujahr;
	}
	if (merged.zustand) {
		daten.zustand = merged.zustand;
	}
	if (merged.datenJson) {
		const raw = merged.datenJson;
		const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
		if (parsed && typeof parsed === 'object') {
			Object.assign(daten, parsed);
		}
	}

	if (merged.resetDaten === true) {
		payload.daten = {};
	} else if (Object.keys(daten).length > 0) {
		payload.daten = daten;
	}

	return payload;
};

const createBodyExpression = `={{ (${buildImmobilieCreateBody.toString()})($parameter, $credentials) }}`;
const updateBodyExpression = `={{ (${buildImmobilieUpdateBody.toString()})($parameter) }}`;

const createResourceLinkBodyExpression = `={{ (() => {
	const body = {
		title: $parameter.linkTitle,
		url: $parameter.linkUrl,
	};
	const optional = $parameter.linkOptionalFields ?? {};
	if (optional.notes) {
		body.notes = optional.notes;
	}
	if (optional.icon) {
		body.icon = optional.icon;
	}
	if (optional.color) {
		body.color = optional.color;
	}
	if (optional.orderIndex !== undefined && optional.orderIndex !== null) {
		body.order_index = optional.orderIndex;
	}
	return body;
})() }}`;


export const immobilieDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForImmobilie,
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get immobilien',
				description: 'Get immobilien for the current organisation',
				routing: {
					request: {
						method: 'GET',
						url: '=/api/v2/immobilien?organisation_id={{$parameter.organisationId || $credentials.organisationId}}&page={{$parameter.page || 1}}&per_page={{$parameter.perPage || 20}}',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get immobilie',
				description: 'Get a single immobilie by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/api/v2/immobilien/{{$parameter.immobilieId}}',
					},
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create immobilie',
				description: 'Create a new immobilie in the current organisation',
				routing: {
					request: {
						method: 'POST',
						url: '/api/v2/immobilien',
						qs: {
							name: '={{$parameter.name || undefined}}',
							type: '={{$parameter.type || undefined}}',
							organisation_id: '={{$credentials.organisationId || undefined}}',
						},
						body: createBodyExpression,
						json: true,
					},
				},
			},
			{
				name: 'Add Resource Link',
				value: 'addResourceLink',
				action: 'Add resource link',
				description: 'Attach an external link to an immobilie',
				routing: {
					request: {
						method: 'POST',
						url: '=/api/resource-links/immobilie/{{$parameter.immobilieId}}',
						body: createResourceLinkBodyExpression,
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update immobilie',
				description: 'Patch an existing immobilie',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/api/v2/immobilien/{{$parameter.immobilieId}}',
						body: updateBodyExpression,
						json: true,
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete immobilie',
				description: 'Delete an immobilie by ID',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/api/v2/immobilien/{{$parameter.immobilieId}}',
					},
				},
			},
			{
				name: 'Update Status',
				value: 'updateStatus',
				action: 'Update immobilie status',
				description: 'Update the status of an immobilie',
				routing: {
					request: {
						method: 'PUT',
						url: '=/api/statuses/immobilien/{{$parameter.immobilieId}}/status',
						body: '={{ ({ status_id: $parameter.statusId }) }}',
					},
				},
			},
			{
				name: 'Set Tags',
				value: 'setTags',
				action: 'Set immobilie tags',
				description: 'Replace the tags assigned to an immobilie',
				routing: {
					request: {
						method: 'PUT',
						url: '=/api/immobilie/{{$parameter.immobilieId}}/tags',
						body: '={{ $parameter.tagIds ?? [] }}',
					},
				},
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Immobilie ID',
		name: 'immobilieId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['get', 'update', 'delete', 'updateStatus', 'setTags', 'addResourceLink'],
			},
		},
		default: '',
	},
	{
		displayName: 'Link Title',
		name: 'linkTitle',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['addResourceLink'],
			},
		},
		default: '',
		description: 'Title displayed for the resource link',
	},
	{
		displayName: 'Link URL',
		name: 'linkUrl',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['addResourceLink'],
			},
		},
		default: '',
		description: 'Destination URL (http/https)',
	},
	{
		displayName: 'Optional Fields',
		name: 'linkOptionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['addResourceLink'],
			},
		},
		options: [
			{
				displayName: 'Color',
				name: 'color',
				type: 'color',
				default: '#6c757d',
				description: 'Optional color value such as #FFAA00',
			},
			{
				displayName: 'Icon',
				name: 'icon',
				type: 'string',
				default: '',
				description: 'Optional icon identifier for the link',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				default: '',
				description: 'Optional note describing the resource link',
			},
			{
				displayName: 'Order Index',
				name: 'orderIndex',
				type: 'number',
				default: 0,
				description: 'Optional position used for ordering links',
			},
		],
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['getAll'],
			},
		},
		description: 'Page number (>= 1)',
	},
	{
		displayName: 'Organisation ID',
		name: 'organisationId',
		type: 'string',
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['getAll'],
			},
		},
		default: '',
		description:
			'Organisation scope for listing immobilien. Defaults to the Organisation ID from the credentials when left empty.',
	},
	{
		displayName: 'Per Page',
		name: 'perPage',
		type: 'number',
		default: 20,
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['getAll'],
			},
		},
		description: 'Number of results per page (1-100)',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['create'],
			},
		},
		default: '',
		description: 'Human readable name for the immobilie',
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		options: immobilieTypeOptions,
		required: true,
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['create'],
			},
		},
		default: 'ETW',
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
				...showOnlyForImmobilie,
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
				...showOnlyForImmobilie,
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Adresse',
				name: 'adresse',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Baujahr',
				name: 'baujahr',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Kaufpreis',
				name: 'kaufpreis',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Raw Daten (JSON)',
				name: 'datenJson',
				type: 'string',
				default: '',
				description: 'Optional JSON string merged into the immobilie daten payload',
			},
			{
				displayName: 'Wohnfläche (M²)',
				name: 'flaeche',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Zustand',
				name: 'zustand',
				type: 'string',
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
				...showOnlyForImmobilie,
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
				...showOnlyForImmobilie,
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Adresse',
				name: 'adresse',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Angebotspreis (EUR)',
				name: 'askingPrice',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Ankaufspreis (EUR)',
				name: 'acquisitionPrice',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Baujahr',
				name: 'baujahr',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Kaufpreis',
				name: 'kaufpreis',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Preview Image ID',
				name: 'previewImageId',
				type: 'string',
				default: '',
				description: 'UUID of an uploaded image to use as preview',
			},
			{
				displayName: 'Raw Daten (JSON)',
				name: 'datenJson',
				type: 'string',
				default: '',
				description: 'Optional JSON string merged into the immobilie daten payload',
			},
			{
				displayName: 'Reset Daten',
				name: 'resetDaten',
				type: 'boolean',
				default: false,
				description: 'Whether to reset existing daten before applying updates',
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: immobilieTypeOptions,
				default: 'ETW',
			},
			{
				displayName: 'Verkaufspreis (EUR)',
				name: 'salePrice',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Wohnfläche (M²)',
				name: 'flaeche',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Zielverkaufspreis (EUR)',
				name: 'targetSalePrice',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Zustand',
				name: 'zustand',
				type: 'string',
				default: '',
			},
		],
	},
	{
		displayName: 'Status Name or ID',
		name: 'statusId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getStatuses',
		},
		required: true,
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['updateStatus'],
			},
		},
		default: '',
		description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	{
		displayName: 'Tag Names or IDs',
		name: 'tagIds',
		type: 'multiOptions',
		typeOptions: {
			loadOptionsMethod: 'getTags',
		},
		required: true,
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['setTags'],
			},
		},
		default: [],
		description: 'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
];
