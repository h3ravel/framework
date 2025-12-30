import { CacheOptions } from '@h3ravel/contracts'

export enum ResponseCodes {
    HTTP_CONTINUE = 100,
    HTTP_SWITCHING_PROTOCOLS = 101,
    HTTP_PROCESSING = 102,                                             // RFC2518
    HTTP_EARLY_HINTS = 103,                                            // RFC8297
    HTTP_OK = 200,
    HTTP_CREATED = 201,
    HTTP_ACCEPTED = 202,
    HTTP_NON_AUTHORITATIVE_INFORMATION = 203,
    HTTP_NO_CONTENT = 204,
    HTTP_RESET_CONTENT = 205,
    HTTP_PARTIAL_CONTENT = 206,
    HTTP_MULTI_STATUS = 207,                                           // RFC4918
    HTTP_ALREADY_REPORTED = 208,                                       // RFC5842
    HTTP_IM_USED = 226,                                                // RFC3229
    HTTP_MULTIPLE_CHOICES = 300,
    HTTP_MOVED_PERMANENTLY = 301,
    HTTP_FOUND = 302,
    HTTP_SEE_OTHER = 303,
    HTTP_NOT_MODIFIED = 304,
    HTTP_USE_PROXY = 305,
    HTTP_RESERVED = 306,
    HTTP_TEMPORARY_REDIRECT = 307,
    HTTP_PERMANENTLY_REDIRECT = 308,                                   // RFC7238
    HTTP_BAD_REQUEST = 400,
    HTTP_UNAUTHORIZED = 401,
    HTTP_PAYMENT_REQUIRED = 402,
    HTTP_FORBIDDEN = 403,
    HTTP_NOT_FOUND = 404,
    HTTP_METHOD_NOT_ALLOWED = 405,
    HTTP_NOT_ACCEPTABLE = 406,
    HTTP_PROXY_AUTHENTICATION_REQUIRED = 407,
    HTTP_REQUEST_TIMEOUT = 408,
    HTTP_CONFLICT = 409,
    HTTP_GONE = 410,
    HTTP_LENGTH_REQUIRED = 411,
    HTTP_PRECONDITION_FAILED = 412,
    HTTP_REQUEST_ENTITY_TOO_LARGE = 413,
    HTTP_REQUEST_URI_TOO_LONG = 414,
    HTTP_UNSUPPORTED_MEDIA_TYPE = 415,
    HTTP_REQUESTED_RANGE_NOT_SATISFIABLE = 416,
    HTTP_EXPECTATION_FAILED = 417,
    HTTP_I_AM_A_TEAPOT = 418,                                               // RFC2324
    HTTP_MISDIRECTED_REQUEST = 421,                                         // RFC7540
    HTTP_UNPROCESSABLE_ENTITY = 422,                                        // RFC4918
    HTTP_LOCKED = 423,                                                      // RFC4918
    HTTP_FAILED_DEPENDENCY = 424,                                           // RFC4918
    HTTP_TOO_EARLY = 425,                                                   // RFC-ietf-httpbis-replay-04
    HTTP_UPGRADE_REQUIRED = 426,                                            // RFC2817
    HTTP_PRECONDITION_REQUIRED = 428,                                       // RFC6585
    HTTP_TOO_MANY_REQUESTS = 429,                                           // RFC6585
    HTTP_REQUEST_HEADER_FIELDS_TOO_LARGE = 431,                             // RFC6585
    HTTP_UNAVAILABLE_FOR_LEGAL_REASONS = 451,                               // RFC7725
    HTTP_INTERNAL_SERVER_ERROR = 500,
    HTTP_NOT_IMPLEMENTED = 501,
    HTTP_BAD_GATEWAY = 502,
    HTTP_SERVICE_UNAVAILABLE = 503,
    HTTP_GATEWAY_TIMEOUT = 504,
    HTTP_VERSION_NOT_SUPPORTED = 505,
    HTTP_VARIANT_ALSO_NEGOTIATES_EXPERIMENTAL = 506,                        // RFC2295
    HTTP_INSUFFICIENT_STORAGE = 507,                                        // RFC4918
    HTTP_LOOP_DETECTED = 508,                                               // RFC5842
    HTTP_NOT_EXTENDED = 510,                                                // RFC2774
    HTTP_NETWORK_AUTHENTICATION_REQUIRED = 511,
}

export const HTTP_RESPONSE_CACHE_CONTROL_DIRECTIVES: CacheOptions = {
    must_revalidate: false,
    no_cache: false,
    no_store: false,
    no_transform: false,
    public: false,
    private: false,
    proxy_revalidate: false,
    max_age: 604800,
    s_maxage: 604800,
    stale_if_error: 86400,         // RFC5861
    stale_while_revalidate: 86400, // RFC5861
    immutable: false,
    last_modified: new Date(),
    etag: '',
}


/**
 * Status codes translation table.
 *
 * The list of codes is complete according to the
 * @link https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml Hypertext Transfer Protocol (HTTP) Status Code Registry
 * (last updated 2021-10-01).
 *
 * Unless otherwise noted, the status code is defined in RFC2616.
 */
export const statusTexts: { [key: number]: string } = {
    100: 'Continue',
    101: 'Switching Protocols',
    102: 'Processing',            // RFC2518
    103: 'Early Hints',
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',
    207: 'Multi-Status',          // RFC4918
    208: 'Already Reported',      // RFC5842
    226: 'IM Used',               // RFC3229
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    305: 'Use Proxy',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',    // RFC7238
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Content Too Large',                                           // RFC-ietf-httpbis-semantics
    414: 'URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Range Not Satisfiable',
    417: 'Expectation Failed',
    418: 'I\'m a teapot',                                               // RFC2324
    421: 'Misdirected Request',                                         // RFC7540
    422: 'Unprocessable Content',                                       // RFC-ietf-httpbis-semantics
    423: 'Locked',                                                      // RFC4918
    424: 'Failed Dependency',                                           // RFC4918
    425: 'Too Early',                                                   // RFC-ietf-httpbis-replay-04
    426: 'Upgrade Required',                                            // RFC2817
    428: 'Precondition Required',                                       // RFC6585
    429: 'Too Many Requests',                                           // RFC6585
    431: 'Request Header Fields Too Large',                             // RFC6585
    451: 'Unavailable For Legal Reasons',                               // RFC7725
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates',                                     // RFC2295
    507: 'Insufficient Storage',                                        // RFC4918
    508: 'Loop Detected',                                               // RFC5842
    510: 'Not Extended',                                                // RFC2774
    511: 'Network Authentication Required',                             // RFC6585
}