import type { INodeProperties } from 'n8n-workflow';

const showOnlyForImmobilie = {
	resource: ['immobilie'],
};

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
				action: 'Get immobilies',
				description: 'Get many immobilies',
				routing: {
					request: {
						method: 'GET',
						url: '/immobilies',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an immobilie',
				description: 'Get the data of a single immobilie',
				routing: {
					request: {
						method: 'GET',
						url: '=/immobilies/{{$parameter.immobilieId}}',
					},
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a new immobilie',
				description: 'Create a new immobilie',
				routing: {
					request: {
						method: 'POST',
						url: '/immobilies',
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
						},
					},
			},
			{
				name: 'Assign Tag',
				value: 'assignTag',
				action: 'Assign tag to immobilie',
				description: 'Assign a tag to an immobilie',
				routing: {
					request: {
						method: 'POST',
						url: '=/immobilies/{{$parameter.immobilieId}}/tags',
					},
				},
			},
			{
				name: 'Remove Tag',
				value: 'removeTag',
				action: 'Remove tag from immobilie',
				description: 'Remove a tag from an immobilie',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/immobilies/{{$parameter.immobilieId}}/tags/{{$parameter.tagName}}',
					},
				},
			},
		],
		default: 'getAll',
	},
	// Get operation parameters
	{
		displayName: 'Immobilie ID',
		name: 'immobilieId',
		type: 'string',
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['get', 'updateStatus', 'assignTag', 'removeTag'],
			},
		},
		default: '',
		required: true,
		description: "The immobilie's ID",
	},
	// Create operation parameters
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['create'],
			},
		},
		default: '',
		required: true,
		description: 'The title of the immobilie',
		routing: {
			send: {
				type: 'body',
				property: 'title',
			},
		},
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['create'],
			},
		},
		default: '',
		required: true,
		description: 'The address of the immobilie',
		routing: {
			send: {
				type: 'body',
				property: 'address',
			},
		},
	},
	{
		displayName: 'Price',
		name: 'price',
		type: 'number',
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['create'],
			},
		},
		default: 0,
		description: 'The price of the immobilie',
		routing: {
			send: {
				type: 'body',
				property: 'price',
			},
		},
	},
	{
		displayName: 'Property Type',
		name: 'type',
		type: 'options',
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['create'],
			},
		},
		options: [
			{ name: 'Apartment', value: 'apartment' },
			{ name: 'House', value: 'house' },
			{ name: 'Commercial', value: 'commercial' },
			{ name: 'Land', value: 'land' },
		],
		default: 'apartment',
		description: 'The type of the immobilie',
		routing: {
			send: {
				type: 'body',
				property: 'type',
			},
		},
	},
	// Update status parameters
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['updateStatus'],
			},
		},
		typeOptions: {
			loadOptionsMethod: 'getStatuses',
		},
		default: '',
		required: true,
		description: 'The new status for the immobilie',
		routing: {
			send: {
				type: 'body',
				property: 'status_id',
			},
		},
	},
	// Tag operations parameters
	{
		displayName: 'Tag',
		name: 'tagName',
		type: 'options',
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['assignTag', 'removeTag'],
			},
		},
		typeOptions: {
			loadOptionsMethod: 'getTags',
		},
		default: '',
		required: true,
		description: 'The tag to assign or remove',
		routing: {
			send: {
				type: 'body',
				property: 'tag_id',
			},
		},
	},
	// Get Many parameters
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 50,
		routing: {
			send: {
				type: 'query',
				property: 'limit',
			},
			output: {
				maxResults: '={{$value}}',
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				...showOnlyForImmobilie,
				operation: ['getAll'],
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		routing: {
			send: {
				paginate: '={{ $value }}',
			},
			operations: {
				pagination: {
					type: 'offset',
					properties: {
						limitParameter: 'limit',
						offsetParameter: 'offset',
						pageSize: 100,
						type: 'query',
					},
				},
			},
		},
	},
];
