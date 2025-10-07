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

const createBodyExpression = `={{ (() => {
	const body: Record<string, any> = {
		type: $parameter.type,
		name: $parameter.name,
		organisation_id: $credentials.organisationId,
	};
	const additional = $parameter.additionalFields ?? {};
	const daten: Record<string, any> = {};

	if (additional.adresse) {
		daten.adresse = additional.adresse;
	}
	if (additional.kaufpreis !== undefined) {
		daten.kaufpreis = additional.kaufpreis;
	}
	if (additional.flaeche !== undefined) {
		daten.flaeche = additional.flaeche;
	}
	if (additional.baujahr !== undefined) {
		daten.baujahr = additional.baujahr;
	}
	if (additional.zustand) {
		daten.zustand = additional.zustand;
	}
	if (additional.datenJson) {
		const raw = additional.datenJson;
		const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
		if (parsed && typeof parsed === 'object') {
			Object.assign(daten, parsed as Record<string, any>);
		}
	}

	if (Object.keys(daten).length > 0) {
		body.daten = daten;
	}

	return body;
})() }}`;

const updateBodyExpression = `={{ (() => {
	const payload: Record<string, any> = {};
	const fields = $parameter.updateFields ?? {};

	if (fields.name) {
		payload.name = fields.name;
	}
	if (fields.type) {
		payload.type = fields.type;
	}

	const numericMappings: Array<[keyof typeof fields, string]> = [
		['acquisitionPrice', 'acquisition_price'],
		['salePrice', 'sale_price'],
		['askingPrice', 'asking_price'],
		['targetSalePrice', 'target_sale_price'],
	];

	for (const [sourceKey, targetKey] of numericMappings) {
		const value = (fields as Record<string, unknown>)[sourceKey];
		if (value !== undefined) {
			payload[targetKey] = value;
		}
	}

	if (fields.previewImageId !== undefined) {
		payload.preview_image_id = fields.previewImageId || null;
	}

	const daten: Record<string, any> = {};
	if (fields.adresse) {
		daten.adresse = fields.adresse;
	}
	if (fields.kaufpreis !== undefined) {
		daten.kaufpreis = fields.kaufpreis;
	}
	if (fields.flaeche !== undefined) {
		daten.flaeche = fields.flaeche;
	}
	if (fields.baujahr !== undefined) {
		daten.baujahr = fields.baujahr;
	}
	if (fields.zustand) {
		daten.zustand = fields.zustand;
	}
	if (fields.datenJson) {
		const raw = fields.datenJson;
		const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
		if (parsed && typeof parsed === 'object') {
			Object.assign(daten, parsed as Record<string, any>);
		}
	}

	if (fields.resetDaten === true) {
		payload.daten = {};
	} else if (Object.keys(daten).length > 0) {
		payload.daten = daten;
	}

	return payload;
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
						url: '=/api/v2/immobilien?organisation_id={{$credentials.organisationId}}&page={{$parameter.page || 1}}&per_page={{$parameter.perPage || 20}}',
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
						body: createBodyExpression,
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
				operation: ['get', 'update', 'delete', 'updateStatus', 'setTags'],
			},
		},
		default: '',
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
				displayName: 'Fläche (M²)',
				name: 'flaeche',
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
				displayName: 'Zustand',
				name: 'zustand',
				type: 'string',
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
					displayName: 'Fläche (M²)',
				name: 'flaeche',
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
