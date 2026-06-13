import { HomeController } from '../HomeController'
import { Route } from '@h3ravel/support/facades'

Route.get('/', [HomeController, 'index'])