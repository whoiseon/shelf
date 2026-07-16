import { Hono } from 'hono';
import { factoryServer } from '@/server';
import { appRoutes } from './features';

const app = new Hono();

// init routes
app.route('/', appRoutes);

factoryServer(app);
