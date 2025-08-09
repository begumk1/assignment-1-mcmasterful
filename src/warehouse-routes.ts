import createRouter from 'koa-zod-router';
import { z } from 'zod';
import { Context } from 'koa';
import { WarehouseService } from './warehouse-service';
import { MongoDBBookRepository, MongoDBWarehouseRepository, MongoDBStockService } from './mongodb-repositories';
import { dbService } from './database';

const router = createRouter();

// Create the warehouse service with separate databases
const bookRepository = new MongoDBBookRepository(dbService.getBookListingDb()!);
const warehouseRepository = new MongoDBWarehouseRepository(dbService.getWarehouseDb()!);
const stockService = new MongoDBStockService(warehouseRepository);
const warehouseService = new WarehouseService(bookRepository, warehouseRepository, stockService);

const PlaceBooksSchema = z.object({
    bookId: z.string(),
    numberOfBooks: z.number().positive(),
    shelf: z.string(),
});

const OrderBooksSchema = z.object({
    books: z.array(z.string()),
});

const FulfillOrderSchema = z.object({
    orderId: z.string(),
    booksFulfilled: z.array(z.object({
        book: z.string(),
        shelf: z.string(),
        numberOfBooks: z.number().positive(),
    })),
});

router.post(
    '/warehouse/place-books',
    async (ctx: Context) => {
        try {
            const { bookId, numberOfBooks, shelf } = ctx.request.body as { bookId: string; numberOfBooks: number; shelf: string };
            await warehouseService.placeBooksOnShelf(bookId, numberOfBooks, shelf);
            ctx.status = 201;
            ctx.body = { message: 'Books placed on shelf successfully' };
        } catch (error) {
            if (error instanceof Error && error.message.includes('does not exist')) {
                ctx.status = 400;
                ctx.body = { error: error.message };
            } else {
                ctx.status = 500;
                ctx.body = { error: `Failed to place books: ${error}` };
            }
        }
    },
    {
        body: PlaceBooksSchema,
    }
);

router.get(
    '/warehouse/find-book/:bookId',
    async (ctx: Context) => {
        try {
            const bookId = ctx.params.bookId;
            const locations = await warehouseService.findBookOnShelf(bookId);
            ctx.body = locations;
        } catch (error) {
            if (error instanceof Error && error.message.includes('does not exist')) {
                ctx.status = 404;
                ctx.body = { error: error.message };
            } else {
                ctx.status = 500;
                ctx.body = { error: `Failed to find book: ${error}` };
            }
        }
    },
    {
        params: z.object({
            bookId: z.string(),
        }),
    }
);

router.post(
    '/warehouse/order',
    async (ctx: Context) => {
        try {
            const { books } = ctx.request.body as { books: string[] };
            const result = await warehouseService.orderBooks(books);
            ctx.status = 201;
            ctx.body = result;
        } catch (error) {
            if (error instanceof Error && error.message.includes('does not exist')) {
                ctx.status = 400;
                ctx.body = { error: error.message };
            } else {
                ctx.status = 500;
                ctx.body = { error: `Failed to create order: ${error}` };
            }
        }
    },
    {
        body: OrderBooksSchema,
    }
);

router.get(
    '/warehouse/orders',
    async (ctx: Context) => {
        try {
            const orders = await warehouseService.listOrders();
            ctx.body = orders;
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: `Failed to list orders: ${error}` };
        }
    }
);

router.post(
    '/warehouse/fulfil-order',
    async (ctx: Context) => {
        try {
            const { orderId, booksFulfilled } = ctx.request.body as { orderId: string; booksFulfilled: Array<{ book: string; shelf: string; numberOfBooks: number }> };
            await warehouseService.fulfilOrder(orderId, booksFulfilled);
            ctx.body = { message: 'Order fulfilled successfully' };
        } catch (error) {
            if (error instanceof Error && (error.message.includes('does not exist') || error.message.includes('Insufficient stock'))) {
                ctx.status = 400;
                ctx.body = { error: error.message };
            } else {
                ctx.status = 500;
                ctx.body = { error: `Failed to fulfil order: ${error}` };
            }
        }
    },
    {
        body: FulfillOrderSchema,
    }
);

export default router;
