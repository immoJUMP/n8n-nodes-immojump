import { describe, expect, it } from 'vitest';
import {
	activityDescription,
	buildActivityCreateBody,
	buildActivityUpdateBody,
} from '../nodes/Immojump/resources/activity/index';

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

	it('uses optional activityTitleUpdate fallback when updateFields.title is not set', () => {
		const body = buildActivityUpdateBody({
			activityTitleUpdate: 'Titel aus Feld',
			updateFields: {},
		});

		expect(body).toEqual({
			title: 'Titel aus Feld',
		});
	});
});

describe('activity getAll routing', () => {
	it('uses organisation id from credentials in query params', () => {
		const operationProperty = activityDescription.find((property) => property.name === 'operation') as
			| { options?: Array<{ value: string; routing?: { request?: { url?: string; qs?: Record<string, unknown> } } }> }
			| undefined;
		const getAllOption = operationProperty?.options?.find((option) => option.value === 'getAll');
		const request = getAllOption?.routing?.request;

		expect(request?.url).toBe('/api/activities/activities');
		expect(request?.qs).toEqual({
			organisation_id:
				'={{$credentials.organisationId || $credentials.organizationId || $parameter.organisationId || undefined}}',
			page: '={{$parameter.page || 1}}',
			per_page: '={{$parameter.perPage || 25}}',
			q: '={{$parameter.additionalOptions?.search || $parameter.search || undefined}}',
			type: '={{$parameter.additionalOptions?.typeFilter || $parameter.typeFilter || undefined}}',
			status: '={{$parameter.additionalOptions?.statusFilter || $parameter.statusFilter || undefined}}',
			priority: '={{$parameter.additionalOptions?.priorityFilter || $parameter.priorityFilter || undefined}}',
			immobilie: '={{$parameter.additionalOptions?.immobilienId || $parameter.immobilienId || undefined}}',
		});
	});
});

describe('activity create routing', () => {
	it('sends create payload as object field expressions', () => {
		const operationProperty = activityDescription.find((property) => property.name === 'operation') as
			| {
					options?: Array<{
						value: string;
						routing?: { request?: { method?: string; url?: string; json?: boolean; body?: Record<string, unknown> } };
					}>;
			  }
			| undefined;
		const createOption = operationProperty?.options?.find((option) => option.value === 'create');
		const request = createOption?.routing?.request;

		expect(request?.method).toBe('POST');
		expect(request?.url).toBe('/api/activities/activities');
		expect(request?.json).toBe(true);
		expect(request?.qs).toEqual({
			organisation_id: '={{$credentials.organisationId || $credentials.organizationId || undefined}}',
		});
		expect(request?.body).toMatchObject({
			title: expect.stringContaining("$parameter, 'title'"),
			type: expect.stringContaining("$parameter, 'type'"),
			status: expect.stringContaining("$parameter, 'status'"),
			priority: expect.stringContaining("$parameter, 'priority'"),
			description: expect.stringContaining("$parameter, 'additionalFields.description'"),
			contact_ids: expect.stringContaining('$parameter.additionalFields?.contactIds'),
			organisation_id: '={{$credentials.organisationId || $credentials.organizationId || undefined}}',
		});
	});
});

describe('activity update routing', () => {
	it('updates activity by activity id and sends json body', () => {
		const operationProperty = activityDescription.find((property) => property.name === 'operation') as
			| {
					options?: Array<{
						value: string;
						routing?: { request?: { method?: string; url?: string; json?: boolean; qs?: Record<string, unknown> } };
					}>;
			  }
			| undefined;
		const updateOption = operationProperty?.options?.find((option) => option.value === 'update');
		const request = updateOption?.routing?.request;

		expect(request?.method).toBe('PUT');
		expect(request?.url).toBe('=/api/activities/activities/{{$parameter.activityIdUpdate}}');
		expect(request?.json).toBe(true);
		expect(request?.qs).toMatchObject({
			title: expect.stringContaining("$parameter, 'updateFields.title'"),
			type: expect.stringContaining("$parameter, 'updateFields.type'"),
			status: expect.stringContaining("$parameter, 'updateFields.status'"),
			priority: expect.stringContaining("$parameter, 'updateFields.priority'"),
			description: expect.stringContaining("$parameter, 'updateFields.description'"),
			immobilien_id: expect.stringContaining("$parameter, 'updateFields.immobilienId'"),
		});
	});
});

describe('activity delete routing', () => {
	it('deletes activity by activity id', () => {
		const operationProperty = activityDescription.find((property) => property.name === 'operation') as
			| {
					options?: Array<{
						value: string;
						routing?: { request?: { method?: string; url?: string; qs?: Record<string, unknown> } };
					}>;
			  }
			| undefined;
		const deleteOption = operationProperty?.options?.find((option) => option.value === 'delete');
		const request = deleteOption?.routing?.request;

		expect(request?.method).toBe('DELETE');
		expect(request?.url).toBe('=/api/activities/activities/{{$parameter.activityIdDelete}}');
		expect(request?.qs).toBeUndefined();
	});
});
