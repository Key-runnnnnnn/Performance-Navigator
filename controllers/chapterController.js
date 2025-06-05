const Chapter = require('../models/chapters');
const Joi = require('joi');
const fs = require('fs');
const redisClient = require('../config/redisClient');

// Define validation schema for a chapter
const chapterSchema = Joi.object({
    subject: Joi.string().required(),
    chapter: Joi.string().required(),
    class: Joi.string().required(),
    unit: Joi.string().required(),
    yearWiseQuestionCount: Joi.object().required(),
    questionSolved: Joi.number().required(),
    status: Joi.string().required(),
    isWeakChapter: Joi.boolean().required()
});

// Helper to clear relevant Redis keys after chapter creation
async function clearChapterCache() {
    try {
        // Clear all chapter list and chapter id caches
        const keys = await redisClient.keys('chapters*');
        if (keys.length) await redisClient.del(keys);
    } catch (err) {
        console.error('Error clearing Redis cache:', err);
    }
}

const createChapter = async (req, res) => {
    try {
        let data;
        if (req.file) {
            try {
                const filePath = req.file.path;
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                data = JSON.parse(fileContent);
                // Optionally delete file after use
                fs.unlink(filePath, () => {});
            } catch (err) {
                return res.status(400).json({
                    message: 'Invalid JSON file uploaded',
                    success: false
                });
            }
        } else {
            data = req.body;
            if (typeof data === 'object' && data !== null && Object.keys(data).length === 1) {
                const firstVal = Object.values(data)[0];
                try {
                    // Try to parse if it's valid JSON
                    data = JSON.parse(firstVal);
                } catch (e) {
                    // Not JSON, leave as is
                }
            }
        }

        // reject if data is empty or not an object/array
        if (!data || (typeof data !== 'object')) {
            return res.status(400).json({
                message: 'Request body must be a chapter object, an array of chapters, or a valid JSON file.',
                success: false
            });
        }

        let result;
        // Handle multiple insert
        // Clear cache before/after insert
        await clearChapterCache();
        if (Array.isArray(data)) {
            if (data.length === 0) {
                return res.status(400).json({
                    message: "No chapters provided",
                    success: false
                });
            }
            // Validate all chapters
            const validationResults = data.map((ch, idx) => {
                const { error } = chapterSchema.validate(ch);
                return error ? { idx, error: error.details[0].message, doc: ch } : null;
            }).filter(Boolean);
            if (validationResults.length > 0) {
                return res.status(400).json({
                    message: "Validation failed for some chapters",
                    success: false,
                    errors: validationResults
                });
            }
            try {
                result = await Chapter.insertMany(data, { ordered: false });
                res.status(201).json({
                    message: "Chapters created successfully",
                    success: true,
                    data: result
                });
            } catch (err) {
                // Partial success handling
                return res.status(207).json({
                    message: "Some chapters failed to insert",
                    success: false,
                    inserted: err.insertedDocs || [],
                    errors: err.writeErrors ? err.writeErrors.map(e => ({
                        index: e.index,
                        error: e.errmsg,
                        doc: data[e.index]
                    })) : []
                });
            }
        } else if (typeof data === 'object' && data !== null) {
            // Validate single chapter
            const { error } = chapterSchema.validate(data);
            if (error) {
                return res.status(400).json({
                    message: "Validation failed",
                    success: false,
                    error: error.details[0].message
                });
            }
            try {
                result = await Chapter.create(data);
                await clearChapterCache();
                res.status(201).json({
                    message: "Chapter created successfully",
                    success: true,
                    data: result
                });
            } catch (err) {
                res.status(500).json({
                    message: err.message,
                    success: false
                });
            }
        } else {
            return res.status(400).json({
                message: 'Invalid request body: must be a chapter object or array of chapters.',
                success: false
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false
        });
    }
}



const getAllChapters = async (req, res) => {
    try {
        // Filter
        const { class: className, unit, status, weakChapters, subject, page = 1, limit = 100 } = req.query;
        const filter = {};
        if (className) filter.class = className;
        if (unit) filter.unit = unit;
        if (status) filter.status = status;
        if (subject) filter.subject = subject;
        if (weakChapters === 'true') filter.isWeakChapter = true;

        // cache key based on filters and pagination
        const cacheKey = `chapters:${JSON.stringify({className, unit, status, weakChapters, subject, page, limit})}`;
        try {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                return res.status(200).json(parsed);
            }
        } catch (err) {
            console.error('Redis cache error (getAllChapters):', err);
        }

        const chapters = await Chapter.find(filter)
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await Chapter.countDocuments(filter);
        const response = {
            message: "Chapters fetched successfully",
            success: true,
            data: chapters,
            total : total,
            page : Number(page),
            limit : Number(limit)
        };
        // Cache the response
        try {
            await redisClient.setEx(cacheKey, 60, JSON.stringify(response)); // cache for 60 seconds
        } catch (err) {
            console.error('Redis cache error (setEx getAllChapters):', err);
        }
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false
        });
    }
}

const getChapterById = async (req, res) => {
    try {
        const cacheKey = `chapter:${req.params.id}`;
        try {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                return res.status(200).json(parsed);
            }
        } catch (err) {
            console.error('Redis cache error (getChapterById):', err);
        }
        const chapter = await Chapter.findById(req.params.id);
        if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
        const response = {
            message: "Chapter fetched successfully",
            success: true,
            data: chapter
        };
        try {
            await redisClient.setEx(cacheKey, 60, JSON.stringify(response));
        } catch (err) {
            console.error('Redis cache error (setEx getChapterById):', err);
        }
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false
        });
    }
}

module.exports = {
    createChapter,
    getAllChapters,
    getChapterById
}