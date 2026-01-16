import type { ActionInput, IController, RouteActions } from '@h3ravel/contracts'

import { LogicException } from '@h3ravel/foundation'
import { UnexpectedValueException } from '@h3ravel/http'
import { isCallable } from '@h3ravel/support'

export class RouteAction {
    /**
     * The route action array.
     */
    private static action: RouteActions = {}

    static parse (uri: string, action?: ActionInput): RouteActions {
        /**
         * If no action was provided return the missing action error handler
         */
        if (!action) {
            return this.missingAction(uri)
        }

        /**
         * Handle closure
         */
        if (isCallable(action)) {
            return { uses: action }
        }

        /**
         * Handle Controller class
         */
        if (this.isClass(action)) {
            return {
                uses: action,
                controller: action.name + '@index',
            }
        }

        /**
         * Handle [Controller, method] map
         */
        if (Array.isArray(action)) {
            const [uses, method] = action

            if (!this.isClass(uses)) {
                throw new LogicException(
                    `Invalid controller reference for route: ${uri}`
                )
            }

            return {
                uses,
                controller: uses.name + '@' + method,
            }
        }

        /**
         * Handle an object with "uses" property
         */
        if (typeof action === 'object' && (action as RouteActions).uses) {
            this.action = action

            return this.normalizeUses((action as RouteActions).uses, uri)
        }

        throw new LogicException(
            `Unrecognized route action for URI: ${uri}`
        )
    }

    /**
     * Normalize the "uses" field
     */
    private static normalizeUses (uses: any, uri: string): RouteActions {
        /**
         * uses: function
         */
        if (isCallable(uses)) {
            return { ...this.action, uses }
        }

        /**
         * uses: Controller
         */
        if (this.isClass(uses)) {
            return {
                uses: this.action,
                controller: this.action.name + '@index',
                ...this.action,
            }
        }

        /**
         * uses: [Controller, 'method']
         */
        if (Array.isArray(uses)) {
            const [controller, method] = uses

            if (!this.isClass(controller)) {
                throw new LogicException(
                    `Invalid controller reference in 'uses' for route: ${uri}`
                )
            }

            return {
                ...this.action,
                uses: controller as never,
                controller: controller.name + '@' + method,
            }
        }

        throw new LogicException(
            `Invalid 'uses' value for route: ${uri}`
        )
    }

    /**
     * Missing action fallback
     */
    private static missingAction (uri: string): RouteActions {
        return {
            handler: () => {
                throw new LogicException(
                    `Route for [${uri}] has no action.`
                )
            },
        }
    }

    /**
     * Make an action for an invokable controller.
     *
     * @param action
     *
     * @throws {UnexpectedValueException}
     */
    protected static makeInvokable (action: IController) {
        if (!action['__invoke']) {
            throw new UnexpectedValueException(`Invalid route action: [${action}].`)
        }

        return action['__invoke']
    }

    /**
     * Detect if a value is a class constructor
     */
    private static isClass (value: any): value is typeof IController {
        return typeof value === 'function' && value.prototype && value.prototype.constructor === value
    }
}