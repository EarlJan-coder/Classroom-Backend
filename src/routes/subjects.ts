import express from "express";
import {and, count, desc, eq, getTableColumns, ilike, or, sql} from "drizzle-orm";
import {departments, subjects} from "../db/schema";
import { db } from '../db';

const router = express.Router();

// get all subjects with optional search filtering and pagination
router.get('/', async (req, res) => {
    try {
        const { search, department, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, Number(page) || 1);
        const limitPerPage = Math.max(1, Math.min(100, Number(limit) || 10));

        const offset = (currentPage - 1) * limitPerPage;

        const filterCondition = [];
        const escapeLikePattern = (str: string) => str.replace(/[%_\\]/g, '\\$&');

    //      if search query exists, filter by subject name or subject code
        if (search) {
            const escaped = escapeLikePattern(String(search));
            filterCondition.push(
                or(
                    ilike(subjects.name, `%${escaped}%`),
                    ilike(subjects.code, `%${escaped}%`),
                )
            );
        }

        //     if department filter exists, match department name
        if (department && department !== 'all') {
            const escaped = escapeLikePattern(String(department));
            filterCondition.push(ilike(departments.name, `%${escaped}%`));
        }

    //     Combine all filters using AND if any exists
        const whereClause = filterCondition.length > 0 ? and( ...filterCondition ) : undefined;

        const countResult = await db
            .select({ count: sql<number> `count(*)` })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const subjectsList = await db.select({
            ...getTableColumns(subjects),
            department: { ...getTableColumns(departments)}
        }).from(subjects).leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: subjectsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        });

    } catch (e) {
        console.error(`GET /subjects error: ${e}`);
        res.status(500).json({ error: 'Failed to get subjects from server' });
    }
});

export default router;