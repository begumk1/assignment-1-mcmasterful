import createRouter from 'koa-zod-router';
import { z } from 'zod';
import { Context } from 'koa';
import { dbService } from './database';

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

const BookSchema = z.object({
    name: z.string().min(1, "Book name is required"),
    author: z.string().min(1, "Author name is required"),
    description: z.string().min(1, "Description is required"),
    price: z.number().positive("Price must be positive"),
    image: z.string().url("Image must be a valid URL")
});

router.get('/books', async (ctx: Context) => {
    try {
        const filters = ctx.query.filters;
        const validatedFilters = filters ? FiltersSchema.parse(filters) : undefined;
        
        let books;
        if (validatedFilters && validatedFilters.length > 0) {
            books = await dbService.getBooksByPriceRange(validatedFilters);
        } else {
            books = await dbService.getAllBooks();
        }
        
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

router.post('/books', async (ctx: Context) => {
    try {
        const bookData = ctx.request.body;
        const validatedBook = BookSchema.parse(bookData);
        
        const bookId = await dbService.createBook(validatedBook);
        ctx.status = 201;
        ctx.body = { id: bookId, message: 'Book created successfully' };
    } catch (error) {
        if (error instanceof z.ZodError) {
            ctx.status = 400;
            ctx.body = { 
                error: 'Invalid book data',
                details: error.errors 
            };
        } else {
            ctx.status = 500;
            ctx.body = { error: `Failed to create book due to: ${error}` };
        }
    }
}, {
    body: BookSchema
});

router.put('/books/:id', async (ctx: Context) => {
    try {
        const bookId = ctx.params.id;
        const bookData = ctx.request.body;
        const validatedBook = BookSchema.partial().parse(bookData);
        
        await dbService.updateBook(bookId, validatedBook);
        ctx.body = { message: 'Book updated successfully' };
    } catch (error) {
        if (error instanceof z.ZodError) {
            ctx.status = 400;
            ctx.body = { 
                error: 'Invalid book data',
                details: error.errors 
            };
        } else if (error instanceof Error && error.message === 'Book not found') {
            ctx.status = 404;
            ctx.body = { error: 'Book not found' };
        } else {
            ctx.status = 500;
            ctx.body = { error: `Failed to update book due to: ${error}` };
        }
    }
}, {
    params: z.object({
        id: z.string()
    }),
    body: BookSchema.partial()
});

router.delete('/books/:id', async (ctx: Context) => {
    try {
        const bookId = ctx.params.id;
        await dbService.deleteBook(bookId);
        ctx.body = { message: 'Book deleted successfully' };
    } catch (error) {
        if (error instanceof Error && error.message === 'Book not found') {
            ctx.status = 404;
            ctx.body = { error: 'Book not found' };
        } else {
            ctx.status = 500;
            ctx.body = { error: `Failed to delete book due to: ${error}` };
        }
    }
}, {
    params: z.object({
        id: z.string()
    })
});

export default router;
