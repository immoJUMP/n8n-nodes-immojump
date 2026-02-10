import { describe, expect, it } from 'vitest';
import { buildContactCreateBody, buildContactUpdateBody } from '../nodes/Immojump/resources/contact/index';

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
			email: 'top@example.com',
			phone: '333',
			mobile: '222',
			address: 'Addr',
			role: 'Role',
			company: 'OverrideCo',
		});
	});
});
