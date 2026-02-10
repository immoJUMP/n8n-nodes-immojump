import type { INodeProperties } from 'n8n-workflow';

const showOnlyForContact = {
	resource: ['contact'],
};

export const buildContactCreateBody = (
	parameter: Record<string, unknown>,
	credentials: Record<string, unknown>,
) => {
	const sanitizeEmail = (value: unknown): string | undefined => {
		if (value === undefined || value === null) {
			return undefined;
		}
		const trimmed = String(value).trim();
		if (trimmed === '') {
			return undefined;
		}
		const cleaned = trimmed.replace(/^=/, '');
		return cleaned === '' ? undefined : cleaned;
	};

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

	const additional = (parameter.additionalFields as Record<string, unknown>) ?? {};
	const overrides = parseObject(parameter.additionalFieldsExpression, 'additionalFieldsExpression') as
		| Record<string, unknown>
		| undefined;
	const merged = overrides ? { ...additional, ...overrides } : additional;

	const body: Record<string, unknown> = {
		first_name: parameter.firstName,
		last_name: parameter.lastName,
		organisation_id: credentials.organisationId,
	};

	const emailValue = pickValue(parameter.email, merged.email);
	const email = sanitizeEmail(emailValue);
	if (email !== undefined) {
		body.email = email;
	}
	if (merged.phone !== undefined && merged.phone !== '') {
		body.phone = merged.phone;
	}
	if (merged.mobile !== undefined && merged.mobile !== '') {
		body.mobile = merged.mobile;
	}
	if (merged.address !== undefined && merged.address !== '') {
		body.address = merged.address;
	}
	if (merged.role !== undefined && merged.role !== '') {
		body.role = merged.role;
	}
	if (merged.company !== undefined && merged.company !== '') {
		body.company = merged.company;
	}

	return body;
};

export const buildContactUpdateBody = (parameter: Record<string, unknown>) => {
	const sanitizeEmail = (value: unknown): string | undefined => {
		if (value === undefined || value === null) {
			return undefined;
		}
		const trimmed = String(value).trim();
		if (trimmed === '') {
			return undefined;
		}
		const cleaned = trimmed.replace(/^=/, '');
		return cleaned === '' ? undefined : cleaned;
	};

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

	const fields = (parameter.updateFields as Record<string, unknown>) ?? {};
	const overrides = parseObject(parameter.updateFieldsExpression, 'updateFieldsExpression') as
		| Record<string, unknown>
		| undefined;
	const merged = overrides ? { ...fields, ...overrides } : fields;

	const payload: Record<string, unknown> = {};

	if (merged.firstName !== undefined && merged.firstName !== '') {
		payload.first_name = merged.firstName;
	}
	if (merged.lastName !== undefined && merged.lastName !== '') {
		payload.last_name = merged.lastName;
	}

	const emailValue = pickValue(parameter.email, merged.email);
	const email = sanitizeEmail(emailValue);
	if (email !== undefined) {
		payload.email = email;
	}
	if (merged.phone !== undefined && merged.phone !== '') {
		payload.phone = merged.phone;
	}
	if (merged.mobile !== undefined && merged.mobile !== '') {
		payload.mobile = merged.mobile;
	}
	if (merged.address !== undefined && merged.address !== '') {
		payload.address = merged.address;
	}
	if (merged.role !== undefined && merged.role !== '') {
		payload.role = merged.role;
	}
	if (merged.company !== undefined && merged.company !== '') {
		payload.company = merged.company;
	}

	return payload;
};

const contactCreateBodyExpression = `={{ (${buildContactCreateBody.toString()})($parameter, $credentials) }}`;
const contactUpdateBodyExpression = `={{ (${buildContactUpdateBody.toString()})($parameter) }}`;

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
		displayName: 'Email (Expression)',
		name: 'email',
		type: 'string',
		default: '',
		placeholder: 'name@email.com',
		description:
			'Use this field when you need expressions. It overrides Additional Fields / Update Fields Email.',
		displayOptions: {
			show: {
				...showOnlyForContact,
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
				...showOnlyForContact,
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
		displayName: 'Update Fields (Expression JSON)',
		name: 'updateFieldsExpression',
		type: 'json',
		default: '',
		description:
			'Optional JSON object to override Update Fields. Useful when you need expressions for nested fields.',
		displayOptions: {
			show: {
				...showOnlyForContact,
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
