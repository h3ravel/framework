import 'reflect-metadata'

import app from 'src/bootstrap/app'

new app().bootstrap()

process.on("SIGINT", () => {
    process.exit(0);
});
process.on("SIGTERM", () => {
    process.exit(0);
});
