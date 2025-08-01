import { Request } from "../Request"
import { Response } from "../Response"

export interface HttpContext {
    request: Request
    response: Response
}
