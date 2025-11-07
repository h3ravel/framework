export class Rule {
    /**
     * Checks if a database record exists
     */
    public static exists (value: any) {
        return {
            rule () {
                return false
            },
            name: 'exists',
            messages: {
                en: 'The record doesn\'t exists on database: {0}',
            },
        }
    }
}