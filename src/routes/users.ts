import express from "express";
import {and, count, desc, eq, getTableColumns, ilike, or, sql} from "drizzle-orm";
import {user} from "../db/schema/index.js";
import { db } from '../db/index.js';

const router = express.Router();

// get all users with optional search filtering and pagination
router.get('/', async (req, res) => {
    try {
        const { search, role, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, Number(page) || 1);
        const limitPerPage = Math.max(1, Math.min(100, Number(limit) || 10));

        const offset = (currentPage - 1) * limitPerPage;

        const filterCondition = [];
        const escapeLikePattern = (str: string) => str.replace(/[%_\\]/g, '\\$&');

        // if search query exists, filter by user name or email
        if (search) {
            const escaped = escapeLikePattern(String(search));
            filterCondition.push(
                or(
                    ilike(user.name, `%${escaped}%`),
                    ilike(user.email, `%${escaped}%`),
                )
            );
        }

        // if role filter exists, exact match
        if (role && role !== 'all') {
            filterCondition.push(eq(user.role, role as any));
        }

        // Combine all filters using AND if any exists
        const whereClause = filterCondition.length > 0 ? and( ...filterCondition ) : undefined;

        const countResult = await db
            .select({ count: sql<number> `count(*)` })
            .from(user)
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const usersList = await db.select({
            ...getTableColumns(user),
        }).from(user)
            .where(whereClause)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        });

    } catch (e) {
        console.error(`GET /users error: ${e}`);
        res.status(500).json({ error: 'Failed to get users from server' });
    }
});

export default router;
