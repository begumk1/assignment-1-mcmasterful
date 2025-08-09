import { Route, Get, Post, Body, Path, Request } from 'tsoa';
import { type ParameterizedContext, type DefaultContext, type Request as KoaRequest } from 'koa';
import { AppWarehouseDatabaseState, AppBookDatabaseState } from './server-launcher';
import { WarehouseService } from './warehouse-service';
import { MongoDBBookRepository, MongoDBWarehouseRepository, MongoDBStockService } from './mongodb-repositories';

export type BookID = string;
export type ShelfId = string;
export type OrderId = string;

export interface PlaceBooksRequest {
    bookId: BookID;
    numberOfBooks: number;
    shelf: ShelfId;
}

export interface OrderBooksRequest {
    books: BookID[];
}

export interface FulfillOrderRequest {
    orderId: OrderId;
    booksFulfilled: Array<{
        book: BookID;
        shelf: ShelfId;
        numberOfBooks: number;
    }>;
}

export interface BookLocation {
    shelf: ShelfId;
    count: number;
}

export interface Order {
    orderId: OrderId;
    books: Record<BookID, number>;
}

/**
 * Warehouse management endpoints for McMasterful Books
 * Handles inventory management, order processing, and stock tracking
 */
@Route('warehouse')
export class WarehouseRoutes {
    /**
     * Place books on a specific shelf in the warehouse
     * @param requestBody - Book placement details
     * @param request - Koa request object for database access
     * @returns Success message
     */
    @Post('place-books')
    public async placeBooksOnShelf(
        @Body() requestBody: PlaceBooksRequest,
        @Request() request: KoaRequest
    ): Promise<{ message: string }> {
        const ctx: ParameterizedContext<AppWarehouseDatabaseState & AppBookDatabaseState> = request.ctx;
        
        const bookRepository = new MongoDBBookRepository(ctx.state.books.database);
        const warehouseRepository = new MongoDBWarehouseRepository(ctx.state.warehouse.database);
        const stockService = new MongoDBStockService(warehouseRepository);
        const warehouseService = new WarehouseService(bookRepository, warehouseRepository, stockService);

        await warehouseService.placeBooksOnShelf(
            requestBody.bookId,
            requestBody.numberOfBooks,
            requestBody.shelf
        );

        return { message: 'Books placed on shelf successfully' };
    }

    /**
     * Find all locations of a book in the warehouse
     * @param bookId - The ID of the book to find
     * @param request - Koa request object for database access
     * @returns Array of book locations with shelf and count
     */
    @Get('find-book/{bookId}')
    public async findBookOnShelf(
        @Path() bookId: BookID,
        @Request() request: KoaRequest
    ): Promise<BookLocation[]> {
        const ctx: ParameterizedContext<AppWarehouseDatabaseState & AppBookDatabaseState> = request.ctx;
        
        const bookRepository = new MongoDBBookRepository(ctx.state.books.database);
        const warehouseRepository = new MongoDBWarehouseRepository(ctx.state.warehouse.database);
        const stockService = new MongoDBStockService(warehouseRepository);
        const warehouseService = new WarehouseService(bookRepository, warehouseRepository, stockService);

        return await warehouseService.findBookOnShelf(bookId);
    }

    /**
     * Create a new order for books
     * @param requestBody - Order details with book IDs
     * @param request - Koa request object for database access
     * @returns Order creation result with order ID
     */
    @Post('order')
    public async orderBooks(
        @Body() requestBody: OrderBooksRequest,
        @Request() request: KoaRequest
    ): Promise<{ orderId: OrderId }> {
        const ctx: ParameterizedContext<AppWarehouseDatabaseState & AppBookDatabaseState> = request.ctx;
        
        const bookRepository = new MongoDBBookRepository(ctx.state.books.database);
        const warehouseRepository = new MongoDBWarehouseRepository(ctx.state.warehouse.database);
        const stockService = new MongoDBStockService(warehouseRepository);
        const warehouseService = new WarehouseService(bookRepository, warehouseRepository, stockService);

        return await warehouseService.orderBooks(requestBody.books);
    }

    /**
     * Get all orders in the system
     * @param request - Koa request object for database access
     * @returns Array of all orders
     */
    @Get('orders')
    public async listOrders(
        @Request() request: KoaRequest
    ): Promise<Order[]> {
        const ctx: ParameterizedContext<AppWarehouseDatabaseState & AppBookDatabaseState> = request.ctx;
        
        const bookRepository = new MongoDBBookRepository(ctx.state.books.database);
        const warehouseRepository = new MongoDBWarehouseRepository(ctx.state.warehouse.database);
        const stockService = new MongoDBStockService(warehouseRepository);
        const warehouseService = new WarehouseService(bookRepository, warehouseRepository, stockService);

        return await warehouseService.listOrders();
    }

    /**
     * Fulfill an order by removing books from shelves
     * @param requestBody - Order fulfillment details
     * @param request - Koa request object for database access
     * @returns Success message
     */
    @Post('fulfil-order')
    public async fulfilOrder(
        @Body() requestBody: FulfillOrderRequest,
        @Request() request: KoaRequest
    ): Promise<{ message: string }> {
        const ctx: ParameterizedContext<AppWarehouseDatabaseState & AppBookDatabaseState> = request.ctx;
        
        const bookRepository = new MongoDBBookRepository(ctx.state.books.database);
        const warehouseRepository = new MongoDBWarehouseRepository(ctx.state.warehouse.database);
        const stockService = new MongoDBStockService(warehouseRepository);
        const warehouseService = new WarehouseService(bookRepository, warehouseRepository, stockService);

        await warehouseService.fulfilOrder(requestBody.orderId, requestBody.booksFulfilled);

        return { message: 'Order fulfilled successfully' };
    }
}
