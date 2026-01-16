import { HomeController } from 'App/Http/Controllers/HomeController'
import { HttpContext } from '@h3ravel/http'
import { MailController } from 'App/Http/Controllers/MailController'
import { Route } from '@h3ravel/support/facades'
import { UrlExampleController } from 'App/Http/Controllers/UrlExampleController'

Route.get('/', [HomeController, 'index'])
Route.get('.well-known/{k1?}/{k2?}', (_, ee, ii) => { console.log(ee, ii) })
Route.get('/mail', [MailController, 'send'])
// URL examples
Route.get('/url-examples/{id?}', [UrlExampleController, 'index']).name('url.examples')
Route.get('/url-signing', [UrlExampleController, 'signing']).name('url.signing')
Route.get('/url-manipulation', [UrlExampleController, 'manipulation']).name('url.manipulation')
Route.match(['GET', 'GET'], 'path5/{user:username}/{name?}', () => ({ name: 2 })).name('path5')
Route.match(['GET'], '/', [HomeController, 'index']).name('index').middleware('web')
Route.match(['GET'], '/test/{user:username}', (_: any, user: any) => {
    return `{ Test Result: ${user} }`
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

Route.match(['PUT', 'POST'], '/validation', async ({ request, response }: HttpContext) => {
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