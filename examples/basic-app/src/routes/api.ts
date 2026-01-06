import { AuthMiddleware } from 'App/Http/Middlewares/AuthMiddleware'
import { Route } from '@h3ravel/support/facades'
import { UserController } from 'App/Http/Controllers/UserController'

Route.prefix('/').group(() => {
    Route.apiResource('/users', UserController).middleware([new AuthMiddleware()])
})

Route.get('/hello', () => 'Hello').name('hello.route')
Route.get('/hello/hi', [UserController, 'index']).name('hello.route')