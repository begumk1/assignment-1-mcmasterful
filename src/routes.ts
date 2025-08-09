import createRouter from 'koa-zod-router';
import { z } from 'zod';
import { Context } from 'koa';
import adapter from '../adapter';

const router = createRouter();

const FilterSchema = z.object({
    from: z.number().optional(),
    to: z.number().optional(),
}).refine((data) => {
    if (data.from === undefined && data.to === undefined) {
        return false;
    }
    if (data.from !== undefined && data.to !== undefined && data.from > data.to) {
        return false;
    }
    return true;
}, {
    message: "Invalid filter: at least one of 'from' or 'to' must be defined, and 'from' must be <= 'to' when both are provided"
});

const FiltersSchema = z.array(FilterSchema).optional();

router.get('/books', async (ctx: Context) => {
    try {
        const filters = ctx.query.filters;
        const validatedFilters = filters ? FiltersSchema.parse(filters) : undefined;
        
        const books = await adapter.listBooks(validatedFilters);
        ctx.body = books;
    } catch (error) {
        if (error instanceof z.ZodError) {
            ctx.status = 400;
            ctx.body = { 
                error: 'Invalid filters provided',
                details: error.errors 
            };
        } else {
            ctx.status = 500;
            ctx.body = { error: `Failed to fetch books due to: ${error}` };
        }
    }
}, {
    query: z.object({
        filters: FiltersSchema
    })
});

export default router;
