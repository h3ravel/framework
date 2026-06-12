import type { Application } from '@h3ravel/core'
import type { H3 } from 'h3'
import request, { type Method, type PRequest } from 'parasito'

export class TestClient<TBody = any> {
    constructor(private readonly app: H3) { }

    /**
     * Creates a new request builder for an application instance
     *
     * @returns
     */
    request<TResponse = TBody> (): PRequest<TResponse> {
        return request<TResponse>(this.app)
    }

    /**
     * Sets the request method to GET and updates the target path.
     *
     * @param path
     * @returns
     */
    get<TResponse = TBody> (path: string): PRequest<TResponse> {
        return this.request<TResponse>().get(path)
    }

    /**
     * Sets the request method to POST and updates the target path.
     *
     * @param path
     * @returns
     */
    post<TResponse = TBody> (path: string): PRequest<TResponse> {
        return this.request<TResponse>().post(path)
    }

    /**
     * Sets the request method to PUT and updates the target path.
     *
     * @param path
     * @returns
     */
    put<TResponse = TBody> (path: string): PRequest<TResponse> {
        return this.request<TResponse>().put(path)
    }

    /**
     * Sets the request method to PATCH and updates the target path.
     *
     * @param path
     * @returns
     */
    patch<TResponse = TBody> (path: string): PRequest<TResponse> {
        return this.request<TResponse>().patch(path)
    }

    /**
     * Sets the request method to DELETE and updates the target path.
     *
     * @param path
     * @returns
     */
    delete<TResponse = TBody> (path: string): PRequest<TResponse> {
        return this.request<TResponse>().delete(path)
    }

    /**
     * Sets the request method to HEAD and updates the target path.
     *
     * @param path
     * @returns
     */
    head<TResponse = TBody> (path: string): PRequest<TResponse> {
        return this.request<TResponse>().head(path)
    }

    /**
     * Sets the request method to OPTIONS and updates the target path.
     *
     * @param path
     * @returns
     */
    options<TResponse = TBody> (path: string): PRequest<TResponse> {
        return this.request<TResponse>().options(path)
    }

    /**
     * Sets the HTTP method and path for the request.
     *
     * @param path
     * @returns
     */
    method<TResponse = TBody> (method: Method, path: string): PRequest<TResponse> {
        return this.request<TResponse>().method(method, path)
    }
}

/**
 * Create a new test client
 *
 * @param app
 * @returns
 */
export const testApp = async <TBody = any> (app?: Application): Promise<TestClient<TBody>> => {
    if (!app) {
        const { TestApplication } = await import('./TestApplication')
        app = await new TestApplication().init()
    }

    const h3App = app.getH3App()

    if (!h3App) {
        throw new Error('Unable to create a test client because the application has no H3 instance.')
    }

    return new TestClient<TBody>(h3App)
}
