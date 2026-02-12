import { describe, expect, it } from 'vitest';
import {
	buildContactCreateBody,
	buildContactUpdateBody,
	contactDescription,
} from '../nodes/Immojump/resources/contact/index';

const globalAny = globalThis as typeof globalThis & {
	$evaluateExpression?: (expression: string) => unknown;
};

describe('buildContactCreateBody', () => {
	it('maps all fields and sanitizes email', () => {
		const body = buildContactCreateBody(
			{
				firstName: 'Test',
				lastName: 'User',
				email: '=test@example.com',
				additionalFields: {
					phone: '123',
					mobile: '456',
					address: 'Street 1',
					role: 'Owner',
					company: 'Acme',
				},
			},
			{ organisationId: 'org-1' },
		);

		expect(body).toEqual({
			first_name: 'Test',
			last_name: 'User',
			organisation_id: 'org-1',
			email: 'test@example.com',
			phone: '123',
			mobile: '456',
			address: 'Street 1',
			role: 'Owner',
			company: 'Acme',
		});
	});

	it('evaluates expressions in fields', () => {
		globalAny.$evaluateExpression = (expr: string) => {
			const map: Record<string, string> = {
				first: 'Alice',
				emailExpr: 'alice@example.com',
				phoneExpr: '555',
			};
			return map[expr] ?? `unknown:${expr}`;
		};

		const body = buildContactCreateBody(
			{
				firstName: '=first',
				lastName: 'Smith',
				email: '=emailExpr',
				additionalFields: {
					phone: '=phoneExpr',
				},
			},
			{ organisationId: 'org-3' },
		);

		delete globalAny.$evaluateExpression;

		expect(body).toEqual({
			first_name: 'Alice',
			last_name: 'Smith',
			organisation_id: 'org-3',
			email: 'alice@example.com',
			phone: '555',
		});
	});

	it('throws when additionalFieldsExpression is invalid JSON', () => {
		expect(() =>
			buildContactCreateBody(
				{
					firstName: 'Bad',
					lastName: 'Json',
					additionalFieldsExpression: '{',
				},
				{ organisationId: 'org-4' },
			),
		).toThrow('additionalFieldsExpression must be valid JSON');
	});

	it('overrides additional fields via expression JSON', () => {
		const body = buildContactCreateBody(
			{
				firstName: 'Test',
				lastName: 'User',
				additionalFields: {
					phone: '123',
					company: 'OldCo',
				},
				additionalFieldsExpression: {
					phone: '999',
					company: 'NewCo',
					address: 'New Street',
					email: '=override@example.com',
				},
			},
			{ organisationId: 'org-2' },
		);

		expect(body).toEqual({
			first_name: 'Test',
			last_name: 'User',
			organisation_id: 'org-2',
			email: 'override@example.com',
			phone: '999',
			address: 'New Street',
			company: 'NewCo',
		});
	});
});

describe('buildContactUpdateBody', () => {
	it('maps all update fields and allows overrides', () => {
		const body = buildContactUpdateBody({
			email: '=top@example.com',
			updateFields: {
				firstName: 'New',
				lastName: 'Name',
				phone: '111',
				mobile: '222',
				address: 'Addr',
				role: 'Role',
				company: 'Company',
				email: 'ignored@example.com',
			},
			updateFieldsExpression: {
				phone: '333',
				company: 'OverrideCo',
			},
		});

		expect(body).toEqual({
			first_name: 'New',
			last_name: 'Name',
			email: 'ignored@example.com',
			phone: '333',
			mobile: '222',
			address: 'Addr',
			role: 'Role',
			company: 'OverrideCo',
		});
	});

	it('evaluates expressions for update fields', () => {
		globalAny.$evaluateExpression = (expr: string) => {
			const map: Record<string, string> = {
				first: 'Bob',
				last: 'Jones',
				emailExpr: 'bob@example.com',
			};
			return map[expr] ?? `unknown:${expr}`;
		};

		const body = buildContactUpdateBody({
			email: '=emailExpr',
			updateFields: {
				firstName: '=first',
				lastName: '=last',
				phone: '123',
			},
		});

		delete globalAny.$evaluateExpression;

		expect(body).toEqual({
			first_name: 'Bob',
			last_name: 'Jones',
			email: 'bob@example.com',
			phone: '123',
		});
	});

	it('throws when updateFieldsExpression is invalid JSON', () => {
		expect(() =>
			buildContactUpdateBody({
				updateFieldsExpression: '{bad',
			}),
		).toThrow('updateFieldsExpression must be valid JSON');
	});
});

describe('contact create routing', () => {
	it('includes query fallback params for integrations that drop JSON body', () => {
		const operationProperty = contactDescription.find((property) => property.name === 'operation') as
			| { options?: Array<{ value: string; routing?: { request?: { url?: string; qs?: Record<string, unknown> } } }> }
			| undefined;
		const createOption = operationProperty?.options?.find((option) => option.value === 'create');
		const request = createOption?.routing?.request;

		expect(request?.url).toBe('/api/contacts');
		expect(request?.qs).toEqual({
			first_name: '={{$parameter.firstName || undefined}}',
			last_name: '={{$parameter.lastName || undefined}}',
			email: '={{$parameter.additionalFields?.email || undefined}}',
			phone: '={{$parameter.additionalFields?.phone || undefined}}',
			mobile: '={{$parameter.additionalFields?.mobile || undefined}}',
			address: '={{$parameter.additionalFields?.address || undefined}}',
			role: '={{$parameter.additionalFields?.role || undefined}}',
			company: '={{$parameter.additionalFields?.company || undefined}}',
			organisation_id: '={{$credentials.organisationId || $credentials.organizationId || undefined}}',
		});
	});
});
