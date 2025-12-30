export type CacheOptions = Partial<{
    must_revalidate: boolean
    no_cache: boolean
    no_store: boolean
    no_transform: boolean
    public: boolean
    private: boolean
    proxy_revalidate: boolean
    max_age: number
    s_maxage: number
    immutable: boolean
    stale_while_revalidate: number
    stale_if_error: number
    last_modified: string | Date
    etag: string
}>