import { GenericWithNullableStringValues } from '../Contracts/ObjContract';

export class EnvParser {

    static parse (initial: GenericWithNullableStringValues) {
        const parsed = { ...initial }

        for (const key in parsed) {
            let value: any = parsed[key]
            parsed[key] = this.parseValue(value)
        }

        return parsed
    }

    static parseValue (value: any) {
        /**
         * Null/undefined stay untouched 
         */
        if (value === null || value === undefined) return value;

        /**
         * Convert string "true"/"false" to boolean 
         */
        if (value === 'true') return true;
        if (value === 'false') return false;

        /**
         *  Convert string numbers to number 
         */
        if (!isNaN(value) && value.trim() !== '') {
            return Number(value);
        }

        /**
         * Convert string "null" and "undefined"
         */
        if (value === 'null') return null;
        if (value === 'undefined') return undefined;

        /**
         * Otherwise return as-is (string)
         */
        return value;
    }
}
