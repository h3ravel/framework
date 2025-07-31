import { Router } from '@h3ravel/router'
import { UserController } from '../http/controllers/UserController'

export default (router: Router) => {
    const userController = new UserController()

    router.group({
        prefix: '/api', middleware: [
            (event) => {
                console.log(`Incoming ${event.method} request`)
            }
        ]
    }, () => {
        router.apiResource('/users', userController)
    })

    router.get('/hello', () => 'Hello', 'hello.route')
}
