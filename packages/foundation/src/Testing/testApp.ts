import { Application } from '@h3ravel/core'
import { H3 } from 'h3'
import { TestApplication } from './TestApplication'

export const testApp = async (app?: Application): Promise<H3> => {

    if (!app) {
        app = await new TestApplication().init()
    }

    const h3App = app?.getH3App() ?? new H3()

    return h3App
}