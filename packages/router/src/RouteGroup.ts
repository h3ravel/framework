import { Arr, Obj, Str } from '@h3ravel/support'

import { RouteActions } from '@h3ravel/contracts'

export class RouteGroup {
    /**
     * Merge route groups into a new array.
     *
     * @param  newAct
     * @param  old
     * @param  prependExistingPrefix
     */
    public static merge (newAct: RouteActions, old: RouteActions, prependExistingPrefix = true): RouteActions {
        if (newAct.domain) {
            delete old.domain
        }

        if (newAct.controller) {
            delete old.controller
        }

        newAct = Object.assign(RouteGroup.formatAs(newAct, old), {
            namespace: RouteGroup.formatNamespace(newAct, old),
            prefix: RouteGroup.formatPrefix(newAct, old, prependExistingPrefix),
            where: RouteGroup.formatWhere(newAct, old),
        })

        return Obj.deepMerge(Arr.except(
            old, ['namespace', 'prefix', 'where', 'as']
        ), newAct)
    }

    /**
     * Format the namespace for the new group attributes.
     *
     * @param  newAct
     * @param  old
     */
    protected static formatNamespace (newAct: RouteActions, old: RouteActions) {
        if (newAct.namespace) {
            return !!old.namespace && !!newAct.namespace
                ? Str.trim(old.namespace, '/') + '/' + Str.trim(newAct.namespace, '/')
                : Str.trim(newAct.namespace, '/')
        }

        return old.namespace ?? undefined
    }

    /**
     * Format the prefix for the new group attributes.
     *
     * @param  newAct
     * @param  old
     * @param  prependExistingPrefix
     */
    protected static formatPrefix (newAct: RouteActions, old: RouteActions, prependExistingPrefix = true) {
        const prefix = old.prefix ?? ''

        if (prependExistingPrefix) {
            return newAct.prefix ? Str.trim(prefix, '/') + '/' + Str.trim(newAct.prefix, '/') : prefix
        }

        return newAct.prefix ? Str.trim(newAct['prefix'], '/') + '/' + Str.trim(prefix, '/') : prefix
    }

    /**
     * Format the "wheres" for the new group attributes.
     *
     * @param  newAct
     * @param  old 
     */
    protected static formatWhere (newAct: RouteActions, old: RouteActions) {
        return Object.assign({},
            old.where ?? {},
            newAct.where ?? {}
        )
    }

    /**
     * Format the "as" clause of the new group attributes.
     *
     * @param  newAct
     * @param  old
     * @param  prependExistingPrefix
     */
    protected static formatAs (newAct: RouteActions, old: RouteActions) {
        if (old.as) {
            newAct.as = old.as + (newAct.as ?? '')
        }

        return newAct
    }
}
