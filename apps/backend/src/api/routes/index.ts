import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { profileRoutes } from './profile.routes.js';
import { rulesRoutes } from './rules.routes.js';
import { plaidRoutes } from './plaid.routes.js';
import { snaptradeRoutes } from './snaptrade.routes.js';
import { transactionsRoutes } from './transactions.routes.js';
import { evaluationsRoutes } from './evaluations.routes.js';
import { ordersRoutes } from './orders.routes.js';
import { gamificationRoutes } from './gamification.routes.js';

export const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/profile', profileRoutes);
routes.use('/rules', rulesRoutes);
routes.use('/plaid', plaidRoutes);
routes.use('/snaptrade', snaptradeRoutes);
routes.use('/transactions', transactionsRoutes);
routes.use('/evaluations', evaluationsRoutes);
routes.use('/orders', ordersRoutes);
routes.use('/gamification', gamificationRoutes);
