export interface ValidationError {
    file: string;
    row?: number;
    message: string;
}

export const CSV_SCHEMAS = {
    nodes: {
        required: ['node_id', 'node_name', 'node_type', 'latitude', 'longitude', 'capacity'],
        enums: {
            node_type: ['port', 'rail_hub', 'warehouse', 'city']
        }
    },
    edges: {
        required: ['from_node_id', 'to_node_id', 'mode', 'distance_km', 'base_cost', 'fuel_sensitivity', 'capacity'],
        enums: {
            mode: ['truck', 'rail', 'sea']
        }
    },
    pricing: {
        required: ['carrier_id', 'mode', 'cost_per_km', 'fuel_indexed'],
        enums: {
            mode: ['truck', 'rail', 'sea']
        }
    },
    fuel: {
        required: ['fuel_type', 'base_price', 'region'],
        enums: {
            fuel_type: ['diesel', 'bunker', 'bunkerfuel', 'electric']
        }
    },
    shipments: {
        required: ['shipment_id', 'origin_node_id', 'destination_node_id', 'volume'],
        optional: true
    }
};

export function validateRow(schema: any, row: Record<string, any>, rowIdx: number, fileName: string): string[] | null {
    const errors: string[] = [];

    // Check required columns
    for (const col of schema.required) {
        if (row[col] === undefined || row[col] === null || row[col] === '') {
            errors.push(`Row ${rowIdx}: Missing required column "${col}"`);
        }
    }

    // Check enums
    if (schema.enums) {
        for (const [col, values] of Object.entries(schema.enums) as [string, string[]][]) {
            const val = row[col]?.toString().toLowerCase();
            if (val && !values.includes(val)) {
                errors.push(`Row ${rowIdx}: Invalid value "${row[col]}" for "${col}". Expected: ${values.join(', ')}`);
            }
        }
    }

    // Check numbers
    const numericCols = ['latitude', 'longitude', 'capacity', 'distance_km', 'base_cost', 'fuel_sensitivity', 'cost_per_km', 'base_price', 'volume'];
    for (const col of numericCols) {
        if (row[col] !== undefined && row[col] !== '') {
            const num = parseFloat(row[col]);
            if (isNaN(num)) {
                errors.push(`Row ${rowIdx}: Column "${col}" must be a number.`);
            }
            if (col === 'fuel_sensitivity' && (num < 0 || num > 1)) {
                errors.push(`Row ${rowIdx}: "fuel_sensitivity" must be between 0.0 and 1.0.`);
            }
            if (['capacity', 'distance_km', 'base_cost', 'cost_per_km', 'base_price', 'volume'].includes(col) && num < 0) {
                errors.push(`Row ${rowIdx}: "${col}" cannot be negative.`);
            }
        }
    }

    return errors.length > 0 ? errors : null;
}
