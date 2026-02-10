import { describe, expect, it } from 'vitest';
import { buildActivityCreateBody, buildActivityUpdateBody } from '../nodes/Immojump/resources/activity/index';

describe('buildActivityCreateBody', () => {
	it('maps all fields and applies overrides', () => {
		const body = buildActivityCreateBody(
			{
				title: 'New Mail',
				type: 'E-MAIL',
				status: 'Geplant',
				priority: 'Hoch',
				descriptionExpression: 'Expr Description',
				immobilienId: 'imm-1',
				organisationId: 'org-param',
				additionalFields: {
					description: 'Ignored',
					scheduledStart: '2026-02-10T10:00:00.000Z',
					scheduledEnd: '2026-02-10T11:00:00.000Z',
					actualStart: '2026-02-10T10:05:00.000Z',
					actualEnd: '2026-02-10T10:30:00.000Z',
					assignedToId: 'user-1',
					contactIds: '["c1","c2"]',
				},
				additionalFieldsExpression: {
					scheduledEnd: '2026-02-10T12:00:00.000Z',
					contactIds: ['c3'],
				},
			},
			{ organisationId: 'org-cred' },
		);

		expect(body).toEqual({
			title: 'New Mail',
			type: 'E-MAIL',
			status: 'Geplant',
			priority: 'Hoch',
			description: 'Expr Description',
			scheduled_start: '2026-02-10T10:00:00.000Z',
			scheduled_end: '2026-02-10T12:00:00.000Z',
			actual_start: '2026-02-10T10:05:00.000Z',
			actual_end: '2026-02-10T10:30:00.000Z',
			assigned_to_id: 'user-1',
			immobilien_id: 'imm-1',
			organisation_id: 'org-param',
			contact_ids: ['c3'],
		});
	});
});

describe('buildActivityUpdateBody', () => {
	it('maps all update fields and applies overrides', () => {
		const body = buildActivityUpdateBody({
			descriptionExpression: 'Expr Update',
			updateFields: {
				title: 'Updated',
				type: 'MEETING',
				status: 'In Bearbeitung',
				priority: 'Mittel',
				description: 'Ignored',
				scheduledStart: '2026-02-11T10:00:00.000Z',
				scheduledEnd: '2026-02-11T11:00:00.000Z',
				actualStart: '2026-02-11T10:05:00.000Z',
				actualEnd: '2026-02-11T10:30:00.000Z',
				assignedToId: 'user-2',
				immobilienId: 'imm-2',
				contactIds: '["c4","c5"]',
			},
			updateFieldsExpression: {
				status: 'Geplant',
				contactIds: ['c6'],
			},
		});

		expect(body).toEqual({
			title: 'Updated',
			type: 'MEETING',
			status: 'Geplant',
			priority: 'Mittel',
			description: 'Expr Update',
			scheduled_start: '2026-02-11T10:00:00.000Z',
			scheduled_end: '2026-02-11T11:00:00.000Z',
			actual_start: '2026-02-11T10:05:00.000Z',
			actual_end: '2026-02-11T10:30:00.000Z',
			assigned_to_id: 'user-2',
			immobilien_id: 'imm-2',
			contact_ids: ['c6'],
		});
	});
});
