import { HomeController } from 'App/Http/Controllers/HomeController'
import { HttpContext } from '@h3ravel/http'
import { MailController } from 'src/app/Http/Controllers/MailController'
import { Router } from '@h3ravel/router'
import { UrlExampleController } from 'src/app/Http/Controllers/UrlExampleController'

export default (Route: Router) => {
    // Route.get('/', [HomeController, 'index'])
    Route.get('/mail', [MailController, 'send'])

    // URL examples
    Route.get('/url-examples', [UrlExampleController, 'index'], 'url.examples')
    Route.get('/url-signing', [UrlExampleController, 'signing'], 'url.signing')
    Route.get('/url-manipulation', [UrlExampleController, 'manipulation'], 'url.manipulation')
    Route.match(['post', 'get'], 'path5/{user:name}/{name}', () => { }).name('path5')
    Route.match(['get'], '/', [HomeController, 'index']).name('index').middleware('web')
    Route.match(['get'], '/test/{user:name}', (request, free) => {
        console.log(free)
        return '{ Test Result }'
    }).name('index')

    Route.get('/app', async function () {
        return await view('index', {
            links: {
                documentation: 'https://h3ravel.toneflix.net/docs',
                performance: 'https://h3ravel.toneflix.net/performance',
                integration: 'https://h3ravel.toneflix.net/h3-integration',
                features: 'https://h3ravel.toneflix.net/features',
            }
        })
    })

    Route.get('/form', async function () {
        console.log(session('_errors'))
        return await view('test.form')
    })

    Route.put('/validation', async ({ request, response }: HttpContext) => {
        const data = await request.validate({
            name: ['required', 'string'],
            age: ['required', 'integer'],
        })

        return response
            .setStatusCode(202)
            .json({
                message: `User ${data.name} created`,
                data,
            })
    })
}
