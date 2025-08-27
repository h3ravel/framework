#!/usr/bin/env node

import { EventEmitter } from 'node:events';
import musket from './IO/app'

new musket().bootstrap()
new EventEmitter().once('SIGINT', () => process.exit(0));
