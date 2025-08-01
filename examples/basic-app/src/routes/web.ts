import { Router } from "@h3ravel/router"

export default (router: Router) => {
    router.get('/', () => 'Hello', 'hello.route')
}
