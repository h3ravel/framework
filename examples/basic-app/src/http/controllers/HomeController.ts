import { Controller } from '@h3ravel/core'
import { HttpContext } from '@h3ravel/http'

export class HomeController extends Controller {
    public async index ({ response }: HttpContext) {
        const view = this.app.make('view')
        const config = this.app.make('config')
        console.log(config.get('APP_NAME'))
        return response.html(await view.render('index', {
            user: { name: 'John' }
        }))
    }
}
