import express from "express";
import {and, count, desc, eq, getTableColumns, ilike, or, sql} from "drizzle-orm";
import {classes, subjects, user} from "../db/schema/index.js";
import { db } from '../db/index.js';

const router = express.Router();

// get all classes with optional search filtering and pagination
router.get('/', async (req, res) => {
    try {
        const { search, subject, teacher, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, Number(page) || 1);
        const limitPerPage = Math.max(1, Math.min(100, Number(limit) || 10));

        const offset = (currentPage - 1) * limitPerPage;

        const filterCondition = [];
        const escapeLikePattern = (str: string) => str.replace(/[%_\\]/g, '\\$&');

        // if search query exists, filter by class name or invite code
        if (search) {
            const escaped = escapeLikePattern(String(search));
            filterCondition.push(
                or(
                    ilike(classes.name, `%${escaped}%`),
                    ilike(classes.inviteCode, `%${escaped}%`),
                )
            );
        }

        // if subject filter exists, match subject name
        if (subject && subject !== 'all') {
            const escaped = escapeLikePattern(String(subject));
            filterCondition.push(eq(subjects.name, escaped));
        }

        // if teacher filter exists, match teacher name
        if (teacher && teacher !== 'all') {
            const escaped = escapeLikePattern(String(teacher));
            filterCondition.push(eq(user.name, escaped));
        }

        // Combine all filters using AND if any exists
        const whereClause = filterCondition.length > 0 ? and( ...filterCondition ) : undefined;

        const countResult = await db
            .select({ count: sql<number> `count(*)` })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const classesList = await db.select({
            ...getTableColumns(classes),
            subject: { ...getTableColumns(subjects) },
            teacher: { ...getTableColumns(user) }
        }).from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause)
            .orderBy(desc(classes.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: classesList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        });

    } catch (e) {
        console.error(`GET /classes error: ${e}`);
        res.status(500).json({ error: 'Failed to get classes from server' });
    }
});

export default router;
