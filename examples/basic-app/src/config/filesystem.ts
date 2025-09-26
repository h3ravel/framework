export default () => {
    return {
        /*
        |--------------------------------------------------------------------------
        | Filesystem Disks
        |--------------------------------------------------------------------------
        |
        | Below you may configure as many filesystem disks as necessary, and you
        | may even configure multiple disks for the same driver. Examples for
        | most supported storage drivers are configured here for reference.
        |
        | Supported Drivers: "local", "*ftp", "*sftp", "*s3"
        |
        */

        disks: {
            public: {
                driver: 'local',
                root: storage_path('app/public'),
                url: env('APP_URL') + '/storage',
                visibility: 'public'
            }
        },

        /*
        |--------------------------------------------------------------------------
        | Symbolic Links
        |--------------------------------------------------------------------------
        |
        | Here you may configure the symbolic links that will be created when the
        | `storage:link` Artisan command is executed. The array keys should be
        | the locations of the links and the values should be their targets.
        |
        */

        links: {
            [public_path('storage')]: storage_path('app/public'),
            [public_path('music')]: storage_path('app/public'),
        },
    }
}
