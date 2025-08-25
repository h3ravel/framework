import 'reflect-metadata'

import { EventEmitter } from 'node:events';
import app from 'src/bootstrap/app'

new app().bootstrap()
new EventEmitter().once('SIGINT', () => process.exit(0));
