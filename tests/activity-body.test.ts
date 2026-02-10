import { describe, expect, it } from 'vitest';
import { buildActivityCreateBody, buildActivityUpdateBody } from '../nodes/Immojump/resources/activity/index';

const globalAny = globalThis as typeof globalThis & {
	$evaluateExpression?: (expression: string) => unknown;
};

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
				additionalFields: {
					description: 'From Additional',
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
			description: 'From Additional',
			scheduled_start: '2026-02-10T10:00:00.000Z',
			scheduled_end: '2026-02-10T12:00:00.000Z',
			actual_start: '2026-02-10T10:05:00.000Z',
			actual_end: '2026-02-10T10:30:00.000Z',
			assigned_to_id: 'user-1',
			immobilien_id: 'imm-1',
			organisation_id: 'org-cred',
			contact_ids: ['c3'],
		});
	});

	it('evaluates expressions and uses credential organisation id', () => {
		globalAny.$evaluateExpression = (expr: string) => {
			const map: Record<string, unknown> = {
				desc: 'Resolved Description',
				imm: 'imm-9',
				contacts: ['c9', 'c10'],
			};
			return map[expr] ?? `unknown:${expr}`;
		};

		const body = buildActivityCreateBody(
			{
				title: 'Task',
				type: 'ANRUF',
				status: 'Geplant',
				priority: 'NA',
				descriptionExpression: '=fallback',
				immobilienId: '=imm',
				organisationId: 'org-param',
				additionalFields: {
					description: '=desc',
					contactIds: '=contacts',
				},
			},
			{ organisationId: 'org-cred' },
		);

		delete globalAny.$evaluateExpression;

		expect(body).toEqual({
			title: 'Task',
			type: 'ANRUF',
			status: 'Geplant',
			priority: 'NA',
			description: 'Resolved Description',
			immobilien_id: 'imm-9',
			organisation_id: 'org-cred',
			contact_ids: ['c9', 'c10'],
		});
	});

	it('throws on invalid contactIds JSON', () => {
		expect(() =>
			buildActivityCreateBody(
				{
					title: 'Bad',
					type: 'ANRUF',
					status: 'Geplant',
					priority: 'NA',
					additionalFields: {
						contactIds: '{bad',
					},
				},
				{ organisationId: 'org-1' },
			),
		).toThrow('contactIds must be valid JSON');
	});

	it('throws on invalid additionalFieldsExpression JSON', () => {
		expect(() =>
			buildActivityCreateBody(
				{
					title: 'Bad',
					type: 'ANRUF',
					status: 'Geplant',
					priority: 'NA',
					additionalFieldsExpression: '{bad',
				},
				{ organisationId: 'org-1' },
			),
		).toThrow('additionalFieldsExpression must be valid JSON');
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
				description: 'From Update',
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
			description: 'From Update',
			scheduled_start: '2026-02-11T10:00:00.000Z',
			scheduled_end: '2026-02-11T11:00:00.000Z',
			actual_start: '2026-02-11T10:05:00.000Z',
			actual_end: '2026-02-11T10:30:00.000Z',
			assigned_to_id: 'user-2',
			immobilien_id: 'imm-2',
			contact_ids: ['c6'],
		});
	});

	it('throws on invalid contactIds for update', () => {
		expect(() =>
			buildActivityUpdateBody({
				updateFields: {
					contactIds: '{"not":"array"}',
				},
			}),
		).toThrow('contactIds must be an array');
	});

	it('throws on invalid updateFieldsExpression JSON', () => {
		expect(() =>
			buildActivityUpdateBody({
				updateFieldsExpression: '{bad',
			}),
		).toThrow('updateFieldsExpression must be valid JSON');
	});
});
