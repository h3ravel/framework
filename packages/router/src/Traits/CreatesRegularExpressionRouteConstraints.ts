import { Collection } from '@h3ravel/support'
import { trait } from '@h3ravel/shared'

export const CreatesRegularExpressionRouteConstraints = trait(Base => {
    return class CreatesRegularExpressionRouteConstraints extends Base {
        where (_wheres: any): this { return this }

        /**
         * Specify that the given route parameters must be alphabetic.
         *
         * @param  parameters
         */
        whereAlpha (parameters: string | string[]) {
            return this.assignExpressionToParameters(parameters, '[a-zA-Z]+')
        }

        /**
         * Specify that the given route parameters must be alphanumeric.
         *
         * @param  parameters
         */
        whereAlphaNumeric (parameters: string | string[]) {
            return this.assignExpressionToParameters(parameters, '[a-zA-Z0-9]+')
        }

        /**
         * Specify that the given route parameters must be numeric.
         *
         * @param  parameters
         */
        whereNumber (parameters: string | string[]) {
            return this.assignExpressionToParameters(parameters, '[0-9]+')
        }

        /**
         * Specify that the given route parameters must be ULIDs.
         *
         * @param  parameters
         */
        whereUlid (parameters: string | string[]) {
            return this.assignExpressionToParameters(parameters, '[0-7][0-9a-hjkmnp-tv-zA-HJKMNP-TV-Z]{25}')
        }

        /**
         * Specify that the given route parameters must be UUIDs.
         *
         * @param  parameters
         */
        whereUuid (parameters: string | string[]) {
            return this.assignExpressionToParameters(parameters, '[da-fA-F]{8}-[da-fA-F]{4}-[da-fA-F]{4}-[da-fA-F]{4}-[da-fA-F]{12}')
        }

        /**
         * Specify that the given route parameters must be one of the given values.
         *
         * @param  parameters
         * @param  values
         */
        whereIn (parameters: string | string[], values: any[]) {
            return this.assignExpressionToParameters(parameters, (new Collection(values))
                .map((value) => value)
                .implode('|')
            )
        }

        /**
         * Apply the given regular expression to the given parameters.
         *
         * @param  parameters
         * @param  expression
         */
        assignExpressionToParameters (parameters: string | string[], expression: string) {
            return this.where(Collection.wrap(parameters)
                .mapWithKeys((parameter) => ({ [parameter as string]: expression } as never))
                .all())
        }
    }
})