import { describe, expect, it } from 'vitest';
import { buildImmobilieCreateBody, buildImmobilieUpdateBody } from '../nodes/Immojump/resources/immobilie/index';

const globalAny = globalThis as typeof globalThis & {
	$evaluateExpression?: (expression: string) => unknown;
};

describe('buildImmobilieCreateBody', () => {
	it('maps all fields and builds daten payload', () => {
		const body = buildImmobilieCreateBody(
			{
				type: 'ETW',
				name: 'Objekt 1',
				additionalFields: {
					adresse: 'Street 1',
					kaufpreis: 100000,
					flaeche: 85,
					baujahr: 1999,
					zustand: 'Gut',
					datenJson: '{"foo":"bar"}',
				},
				additionalFieldsExpression: {
					kaufpreis: 120000,
				},
			},
			{ organisationId: 'org-1' },
		);

		expect(body).toEqual({
			type: 'ETW',
			name: 'Objekt 1',
			organisation_id: 'org-1',
			daten: {
				adresse: 'Street 1',
				kaufpreis: 120000,
				wohnflaeche: 85,
				baujahr: 1999,
				zustand: 'Gut',
				foo: 'bar',
			},
		});
	});

	it('evaluates expressions and merges datenJson', () => {
		globalAny.$evaluateExpression = (expr: string) => {
			const map: Record<string, unknown> = {
				typeExpr: 'MFH',
				nameExpr: 'Objekt Expr',
				priceExpr: 150000,
				datenExpr: '{"foo":"baz"}',
			};
			return map[expr] ?? `unknown:${expr}`;
		};

		const body = buildImmobilieCreateBody(
			{
				type: '=typeExpr',
				name: '=nameExpr',
				additionalFields: {
					kaufpreis: '=priceExpr',
					datenJson: '=datenExpr',
				},
			},
			{ organisationId: 'org-x' },
		);

		delete globalAny.$evaluateExpression;

		expect(body).toEqual({
			type: 'MFH',
			name: 'Objekt Expr',
			organisation_id: 'org-x',
			daten: {
				kaufpreis: 150000,
				foo: 'baz',
			},
		});
	});

	it('throws on invalid datenJson', () => {
		expect(() =>
			buildImmobilieCreateBody(
				{
					type: 'ETW',
					name: 'Objekt Bad',
					additionalFields: {
						datenJson: '{bad',
					},
				},
				{ organisationId: 'org-y' },
			),
		).toThrow();
	});
});

describe('buildImmobilieUpdateBody', () => {
	it('maps all update fields and daten payload', () => {
		const payload = buildImmobilieUpdateBody({
			updateFields: {
				name: 'Objekt Neu',
				type: 'MFH',
				acquisitionPrice: 10,
				salePrice: 20,
				askingPrice: 30,
				targetSalePrice: 40,
				previewImageId: '',
				adresse: 'Street 2',
				kaufpreis: 200000,
				flaeche: 100,
				baujahr: 2005,
				zustand: 'Neu',
				datenJson: '{"foo":"bar"}',
			},
			updateFieldsExpression: {
				kaufpreis: 250000,
				zustand: 'Saniert',
			},
		});

		expect(payload).toEqual({
			name: 'Objekt Neu',
			type: 'MFH',
			acquisition_price: 10,
			sale_price: 20,
			asking_price: 30,
			target_sale_price: 40,
			preview_image_id: null,
			daten: {
				adresse: 'Street 2',
				kaufpreis: 250000,
				wohnflaeche: 100,
				baujahr: 2005,
				zustand: 'Saniert',
				foo: 'bar',
			},
		});
	});

	it('resets daten when requested', () => {
		const payload = buildImmobilieUpdateBody({
			updateFields: {
				resetDaten: true,
				adresse: 'Street 3',
				kaufpreis: 300000,
			},
		});

		expect(payload).toEqual({
			daten: {},
		});
	});

	it('evaluates expressions on update fields', () => {
		globalAny.$evaluateExpression = (expr: string) => {
			const map: Record<string, unknown> = {
				nameExpr: 'Objekt Expr Update',
				priceExpr: 400000,
			};
			return map[expr] ?? `unknown:${expr}`;
		};

		const payload = buildImmobilieUpdateBody({
			updateFields: {
				name: '=nameExpr',
				kaufpreis: '=priceExpr',
			},
		});

		delete globalAny.$evaluateExpression;

		expect(payload).toEqual({
			name: 'Objekt Expr Update',
			daten: {
				kaufpreis: 400000,
			},
		});
	});

	it('throws on invalid updateFieldsExpression JSON', () => {
		expect(() =>
			buildImmobilieUpdateBody({
				updateFieldsExpression: '{bad',
			}),
		).toThrow('updateFieldsExpression must be valid JSON');
	});
});
