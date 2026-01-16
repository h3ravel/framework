import { AccessDeniedHttpException } from '../AccessDeniedHttpException'
import { BadRequestHttpException } from '../BadRequestHttpException'
import { ConflictHttpException } from '../ConflictHttpException'
import { GoneHttpException } from '../GoneHttpException'
import { LengthRequiredHttpException } from '../LengthRequiredHttpException'
import { LockedHttpException } from '../LockedHttpException'
import { NotAcceptableHttpException } from '../NotAcceptableHttpException'
import { NotFoundHttpException } from '../NotFoundHttpException'
import { PreconditionFailedHttpException } from '../PreconditionFailedHttpException'
import { PreconditionRequiredHttpException } from '../PreconditionRequiredHttpException'
import { ServiceUnavailableHttpException } from '../ServiceUnavailableHttpException'
import { TooManyRequestsHttpException } from '../TooManyRequestsHttpException'
import { UnprocessableEntityHttpException } from '../UnprocessableEntityHttpException'
import { UnsupportedMediaTypeHttpException } from '../UnsupportedMediaTypeHttpException'

/**
 * HttpException.
 */
export class HttpException extends Error {
    constructor(
        protected statusCode: number,
        public message: string = '',
        protected previous?: Error,
        protected headers: Record<string, string> = {},
        public code: number = 0,
    ) {
        super(message)
    }

    public static fromStatusCode (statusCode: number, message: string = '', previous?: Error, headers: Record<string, string> = {}, code: number = 0) {
        switch (statusCode) {
            case 400:
                return new BadRequestHttpException(message, previous, code, headers)
            case 403:
                return new AccessDeniedHttpException(message, previous, code, headers)
            case 404:
                return new NotFoundHttpException(message, previous, code, headers)
            case 406:
                return new NotAcceptableHttpException(message, previous, code, headers)
            case 409:
                return new ConflictHttpException(message, previous, code, headers)
            case 410:
                return new GoneHttpException(message, previous, code, headers)
            case 411:
                return new LengthRequiredHttpException(message, previous, code, headers)
            case 412:
                return new PreconditionFailedHttpException(message, previous, code, headers)
            case 423:
                return new LockedHttpException(message, previous, code, headers)
            case 415:
                return new UnsupportedMediaTypeHttpException(message, previous, code, headers)
            case 422:
                return new UnprocessableEntityHttpException(message, previous, code, headers)
            case 428:
                return new PreconditionRequiredHttpException(message, previous, code, headers)
            case 429:
                return new TooManyRequestsHttpException(undefined, message, previous, code, headers)
            case 503:
                return new ServiceUnavailableHttpException(undefined, message, previous, code, headers)
            default:
                return new HttpException(statusCode, message, previous, headers, code)
        }
    }

    public getStatusCode (): number {
        return this.statusCode
    }

    public getHeaders (): Record<string, string> {
        return this.headers
    }

    public setHeaders (headers: Record<string, string>): void {
        this.headers = headers
    }
}