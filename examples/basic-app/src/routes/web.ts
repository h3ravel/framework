import { Router } from '@h3ravel/router'
import { UserController } from '../controllers/UserController'

export default (router: Router) => {
    const userController = new UserController()

    router.apiResource('/users', userController)
}
