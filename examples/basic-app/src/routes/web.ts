import { HomeController } from 'App/Http/Controllers/HomeController'
import { Router } from '@h3ravel/router'

export default (Route: Router) => {
    Route.get('/', [HomeController, 'index'])
    Route.get('/app', async function ({ request, response }) {
        const view = request.app.make('view')

        return response.html(await view('index', {
            links: {
                documentation: 'https://h3ravel.toneflix.net/docs',
                performance: 'https://h3ravel.toneflix.net/performance',
                integration: 'https://h3ravel.toneflix.net/h3-integration',
                features: 'https://h3ravel.toneflix.net/features',
            }
        }))
    })
}
