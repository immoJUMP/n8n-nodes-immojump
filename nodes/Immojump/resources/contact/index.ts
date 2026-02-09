import type { INodeProperties } from 'n8n-workflow';

const showOnlyForContact = {
	resource: ['contact'],
};

const resolveExpressionValueSnippet = `
	const resolveValue = (value) => {
		if (value === undefined || value === null) {
			return undefined;
		}
		if (typeof value !== 'string') {
			return value;
		}
		const trimmed = value.trim();
		if (trimmed === '') {
			return undefined;
		}
		if (trimmed.startsWith('={{') || trimmed.startsWith('{{')) {
			try {
				return $evaluateExpression(trimmed);
			} catch (error) {
				return trimmed;
			}
		}
		return trimmed;
	};

	const resolveStringValue = (value) => {
		const resolved = resolveValue(value);
		if (resolved === undefined || resolved === null) {
			return undefined;
		}
		const stringValue = String(resolved).trim();
		return stringValue === '' ? undefined : stringValue;
	};

	const resolveEmailValue = (value) => {
		const resolved = resolveStringValue(value);
		if (!resolved) {
			return undefined;
		}
		return resolved.replace(/^=/, '');
	};
`;

const contactCreateBodyExpression = `={{ (() => {
${resolveExpressionValueSnippet}
	const payload = {
		first_name: $parameter.firstName,
		last_name: $parameter.lastName,
		organisation_id: $credentials.organisationId,
	};
	const fields = $parameter.additionalFields ?? {};

	const email = resolveEmailValue(fields.email);
	if (email !== undefined) {
		payload.email = email;
	}
	const phone = resolveStringValue(fields.phone);
	if (phone !== undefined) {
		payload.phone = phone;
	}
	const mobile = resolveStringValue(fields.mobile);
	if (mobile !== undefined) {
		payload.mobile = mobile;
	}
	const address = resolveStringValue(fields.address);
	if (address !== undefined) {
		payload.address = address;
	}
	const role = resolveStringValue(fields.role);
	if (role !== undefined) {
		payload.role = role;
	}
	const company = resolveStringValue(fields.company);
	if (company !== undefined) {
		payload.company = company;
	}

	return payload;
})() }}`;

const contactUpdateBodyExpression = `={{ (() => {
${resolveExpressionValueSnippet}
	const payload = {};
	const fields = $parameter.updateFields ?? {};

	const firstName = resolveStringValue(fields.firstName);
	if (firstName !== undefined) {
		payload.first_name = firstName;
	}
	const lastName = resolveStringValue(fields.lastName);
	if (lastName !== undefined) {
		payload.last_name = lastName;
	}
	const email = resolveEmailValue(fields.email);
	if (email !== undefined) {
		payload.email = email;
	}
	const phone = resolveStringValue(fields.phone);
	if (phone !== undefined) {
		payload.phone = phone;
	}
	const mobile = resolveStringValue(fields.mobile);
	if (mobile !== undefined) {
		payload.mobile = mobile;
	}
	const address = resolveStringValue(fields.address);
	if (address !== undefined) {
		payload.address = address;
	}
	const role = resolveStringValue(fields.role);
	if (role !== undefined) {
		payload.role = role;
	}
	const company = resolveStringValue(fields.company);
	if (company !== undefined) {
		payload.company = company;
	}

	return payload;
})() }}`;

export const contactDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForContact,
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get contacts',
				description: 'List contacts with optional pagination and search',
				routing: {
					request: {
						method: 'GET',
						url: '/api/contacts',
						qs: {
							organisation_id: '={{$credentials.organisationId || undefined}}',
							page: '={{$parameter.page || 1}}',
							per_page: '={{$parameter.perPage || 50}}',
							q: '={{$parameter.search || undefined}}',
							sort: '={{$parameter.sort || undefined}}',
							order: '={{$parameter.order || undefined}}',
						},
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get contact',
				description: 'Retrieve a contact by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/api/contacts/{{$parameter.contactId}}',
					},
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create contact',
				description: 'Create a new contact for the current organisation',
				routing: {
					request: {
						method: 'POST',
						url: '/api/contacts',
						body: contactCreateBodyExpression,
						json: true,
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update contact',
				description: 'Update an existing contact',
				routing: {
					request: {
						method: 'PUT',
						url: '=/api/contacts/{{$parameter.contactId}}',
						body: contactUpdateBodyExpression,
						json: true,
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete contact',
				description: 'Remove a contact by ID',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/api/contacts/{{$parameter.contactId}}',
					},
				},
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForContact,
				operation: ['get', 'update', 'delete'],
			},
		},
		default: '',
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
				...showOnlyForContact,
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
				...showOnlyForContact,
				operation: ['getAll'],
			},
		},
		default: 50,
	},
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		displayOptions: {
			show: {
				...showOnlyForContact,
				operation: ['getAll'],
			},
		},
		default: '',
		description: 'Optional search term used to filter contacts',
	},
	{
		displayName: 'Sort Field',
		name: 'sort',
		type: 'string',
		displayOptions: {
			show: {
				...showOnlyForContact,
				operation: ['getAll'],
			},
		},
		default: '',
		description: 'Optional field name to sort by, e.g. first_name or created_at',
	},
	{
		displayName: 'Sort Order',
		name: 'order',
		type: 'options',
		options: [
			{
				name: 'Ascending',
				value: 'asc',
			},
			{
				name: 'Descending',
				value: 'desc',
			},
		],
		displayOptions: {
			show: {
				...showOnlyForContact,
				operation: ['getAll'],
			},
		},
		default: 'asc',
		description: 'Sort direction to apply when a sort field is provided',
	},
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForContact,
				operation: ['create'],
			},
		},
		default: '',
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				...showOnlyForContact,
				operation: ['create'],
			},
		},
		default: '',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				...showOnlyForContact,
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Company',
				name: 'company',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'name@email.com',
			},
			{
				displayName: 'Mobile',
				name: 'mobile',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Role',
				name: 'role',
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
				...showOnlyForContact,
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Company',
				name: 'company',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'name@email.com',
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Mobile',
				name: 'mobile',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Role',
				name: 'role',
				type: 'string',
				default: '',
			},
		],
	},
];
