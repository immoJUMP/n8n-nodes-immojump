import { describe, expect, it } from 'vitest';
import {
	buildContactCreateBody,
	buildContactUpdateBody,
	contactDescription,
} from '../nodes/Immojump/resources/contact/index';

const globalAny = globalThis as typeof globalThis & {
	$evaluateExpression?: (expression: string) => unknown;
	$json?: Record<string, unknown>;
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

	it('resolves simple $json expressions when evaluateExpression is unavailable', () => {
		globalAny.$json = {
			email: 'waltertill@mail.de',
			phone: '+12345',
		};

		const body = buildContactCreateBody(
			{
				firstName: 'Felix',
				lastName: 'Walter',
				additionalFields: {
					email: '={{ $json.email }}',
					phone: '={{ $json.phone }}',
				},
			},
			{ organisationId: 'org-json' },
		);

		delete globalAny.$json;

		expect(body).toEqual({
			first_name: 'Felix',
			last_name: 'Walter',
			organisation_id: 'org-json',
			email: 'waltertill@mail.de',
			phone: '+12345',
		});
	});

	it('normalizes moustache expressions before evaluateExpression', () => {
		globalAny.$evaluateExpression = (expr: string) => {
			if (expr === '$json.email') return 'waltertill@mail.de';
			if (expr === '$json.phone') return '+12345';
			return undefined;
		};

		const body = buildContactCreateBody(
			{
				firstName: 'Felix',
				lastName: 'Walter',
				additionalFields: {
					email: '={{ $json.email }}',
					phone: '={{ $json.phone }}',
				},
			},
			{ organisationId: 'org-eval' },
		);

		delete globalAny.$evaluateExpression;

		expect(body).toEqual({
			first_name: 'Felix',
			last_name: 'Walter',
			organisation_id: 'org-eval',
			email: 'waltertill@mail.de',
			phone: '+12345',
		});
	});

	it('falls back to evaluateExpression when direct $json lookup is unavailable', () => {
		delete globalAny.$json;
		globalAny.$evaluateExpression = (expr: string) => {
			if (expr === '$json.email') return 'fallback@mail.de';
			if (expr === '$json.phone') return '+49000111';
			return undefined;
		};

		const body = buildContactCreateBody(
			{
				firstName: 'Felix',
				lastName: 'Walter',
				additionalFields: {
					email: '={{ $json.email }}',
					phone: '={{ $json.phone }}',
				},
			},
			{ organisationId: 'org-fallback' },
		);

		delete globalAny.$evaluateExpression;

		expect(body).toEqual({
			first_name: 'Felix',
			last_name: 'Walter',
			organisation_id: 'org-fallback',
			email: 'fallback@mail.de',
			phone: '+49000111',
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
		expect(request?.qs).toBeDefined();
		const qs = (request?.qs ?? {}) as Record<string, string>;
		expect(qs.organisation_id).toBe('={{$credentials.organisationId || $credentials.organizationId || undefined}}');
		expect(qs.first_name).toContain("getByPath($parameter, 'firstName')");
		expect(qs.last_name).toContain("getByPath($parameter, 'lastName')");
		expect(qs.email).toContain("getByPath($parameter, 'additionalFields.email')");
		expect(qs.phone).toContain("getByPath($parameter, 'additionalFields.phone')");
		expect(qs.mobile).toContain("getByPath($parameter, 'additionalFields.mobile')");
		expect(qs.address).toContain("getByPath($parameter, 'additionalFields.address')");
		expect(qs.role).toContain("getByPath($parameter, 'additionalFields.role')");
		expect(qs.company).toContain("getByPath($parameter, 'additionalFields.company')");
	});
});
