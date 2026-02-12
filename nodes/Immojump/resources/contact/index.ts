import type { INodeProperties } from 'n8n-workflow';

declare const $evaluateExpression: (expression: string, itemIndex?: number) => unknown;

const showOnlyForContact = {
	resource: ['contact'],
};

export const buildContactCreateBody = (
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

	const sanitizeEmail = (value: unknown): string | undefined => {
		const resolved = resolveStringValue(value);
		if (!resolved) {
			return undefined;
		}
		const cleaned = resolved.replace(/^=/, '');
		return cleaned === '' ? undefined : cleaned;
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

	const additional = (parameter.additionalFields as Record<string, unknown>) ?? {};
	const overrides = parseObject(parameter.additionalFieldsExpression, 'additionalFieldsExpression') as
		| Record<string, unknown>
		| undefined;
	const merged = overrides ? { ...additional, ...overrides } : additional;

	const body: Record<string, unknown> = {
		first_name: resolveExpressionValue(parameter.firstName),
		last_name: resolveExpressionValue(parameter.lastName),
		organisation_id: credentials.organisationId ?? credentials.organizationId,
	};

	const emailValue = pickValue(merged.email, parameter.email);
	const email = sanitizeEmail(emailValue);
	if (email !== undefined) {
		body.email = email;
	}
	const phone = resolveStringValue(merged.phone);
	if (phone !== undefined) {
		body.phone = phone;
	}
	const mobile = resolveStringValue(merged.mobile);
	if (mobile !== undefined) {
		body.mobile = mobile;
	}
	const address = resolveStringValue(merged.address);
	if (address !== undefined) {
		body.address = address;
	}
	const role = resolveStringValue(merged.role);
	if (role !== undefined) {
		body.role = role;
	}
	const company = resolveStringValue(merged.company);
	if (company !== undefined) {
		body.company = company;
	}

	return body;
};

export const buildContactUpdateBody = (parameter: Record<string, unknown>) => {
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

	const sanitizeEmail = (value: unknown): string | undefined => {
		const resolved = resolveStringValue(value);
		if (!resolved) {
			return undefined;
		}
		const cleaned = resolved.replace(/^=/, '');
		return cleaned === '' ? undefined : cleaned;
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

	const fields = (parameter.updateFields as Record<string, unknown>) ?? {};
	const overrides = parseObject(parameter.updateFieldsExpression, 'updateFieldsExpression') as
		| Record<string, unknown>
		| undefined;
	const merged = overrides ? { ...fields, ...overrides } : fields;

	const payload: Record<string, unknown> = {};

	const firstName = resolveStringValue(merged.firstName);
	if (firstName !== undefined) {
		payload.first_name = firstName;
	}
	const lastName = resolveStringValue(merged.lastName);
	if (lastName !== undefined) {
		payload.last_name = lastName;
	}

	const emailValue = pickValue(merged.email, parameter.email);
	const email = sanitizeEmail(emailValue);
	if (email !== undefined) {
		payload.email = email;
	}
	const phone = resolveStringValue(merged.phone);
	if (phone !== undefined) {
		payload.phone = phone;
	}
	const mobile = resolveStringValue(merged.mobile);
	if (mobile !== undefined) {
		payload.mobile = mobile;
	}
	const address = resolveStringValue(merged.address);
	if (address !== undefined) {
		payload.address = address;
	}
	const role = resolveStringValue(merged.role);
	if (role !== undefined) {
		payload.role = role;
	}
	const company = resolveStringValue(merged.company);
	if (company !== undefined) {
		payload.company = company;
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
							qs: {
								first_name: '={{$parameter.firstName || undefined}}',
								last_name: '={{$parameter.lastName || undefined}}',
								email: '={{$parameter.additionalFields?.email || undefined}}',
								phone: '={{$parameter.additionalFields?.phone || undefined}}',
								mobile: '={{$parameter.additionalFields?.mobile || undefined}}',
								address: '={{$parameter.additionalFields?.address || undefined}}',
								role: '={{$parameter.additionalFields?.role || undefined}}',
								company: '={{$parameter.additionalFields?.company || undefined}}',
								organisation_id: '={{$credentials.organisationId || $credentials.organizationId || undefined}}',
							},
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
