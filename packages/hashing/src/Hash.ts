import bcrypt from 'bcryptjs'

export class Hash {
    /**
     * Hash the given value.
     *
     * @param  value
     * @param  options
     * 
     * @return {String}
     */
    public async make (value: string, options: { [key: string]: string | number } = {}): Promise<string> {
        const salt = await bcrypt.genSalt(12) //TODO: Use config value
        return await bcrypt.hash(value, salt)
    }

    /**
     * Check the given plain value against a hash.
     *
     * @param  value
     * @param  hashedValue
     * @param  options
     * 
     * @return {String}
     */
    public check (value: string, hashedValue: string, options: { [key: string]: string | number } = {}): string {
        return ''
    }

    /**
     * Get information about the given hashed value.
     *
     * @param  hashedValue
     * 
     * @return {Object}
     */
    public info (hashedValue: string): { [key: string]: any } {
        return {}
    }

    /**
     * Check if the given hash has been hashed using the given options.
     *
     * @param  hashedValue
     * @param  options
     * 
     * @return {Boolean}
     */
    public needsRehash (hashedValue: string, options: { [key: string]: string | number } = {}): string {
        return ''
    }

    /**
     * Determine if a given string is already hashed.
     *
     * @param  value
     * 
     * @return {Boolean}
     */
    public isHashed (value: string): boolean {
        return false
    }
}
