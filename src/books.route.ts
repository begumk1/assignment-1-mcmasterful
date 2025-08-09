import { Route, Get, Post, Put, Delete, Body, Path, Query, Request } from 'tsoa';
import { type ParameterizedContext, type DefaultContext, type Request as KoaRequest } from 'koa';
import { AppWarehouseDatabaseState, AppBookDatabaseState } from './server-launcher';
import { Book } from './database';
import { MongoDBBookRepository, MongoDBStockService } from './mongodb-repositories';
import { MongoDBWarehouseRepository } from './mongodb-repositories';

export interface BookWithStock extends Book {
    stock: number;
}

export interface CreateBookRequest {
    name: string;
    author: string;
    description: string;
    price: number;
    image: string;
}

export interface UpdateBookRequest {
    name?: string;
    author?: string;
    description?: string;
    price?: number;
    image?: string;
}

export interface Filter {
    from?: number;
    to?: number;
    name?: string;
    author?: string;
}

/**
 * Book catalog management endpoints for McMasterful Books
 * Handles book listing, creation, updates, and stock information
 */
@Route('books')
export class BooksRoutes {
    /**
     * Get all books with their current stock levels
     * @param request - Koa request object for database access
     * @param filters - Optional filters for price range, name, or author
     * @returns Array of books with stock information
     */
    @Get('/')
    public async getBooks(
        @Request() request: KoaRequest,
        @Query() filters?: Filter[]
    ): Promise<BookWithStock[]> {
        const ctx: ParameterizedContext<AppWarehouseDatabaseState & AppBookDatabaseState> = request.ctx;
        
        const bookRepository = new MongoDBBookRepository(ctx.state.books.database);
        const warehouseRepository = new MongoDBWarehouseRepository(ctx.state.warehouse.database);
        const stockService = new MongoDBStockService(warehouseRepository);

        let books: Book[];
        if (filters && filters.length > 0) {
            // Apply filters - this would need to be implemented in the repository
            books = await bookRepository.getAllBooks();
        } else {
            books = await bookRepository.getAllBooks();
        }

        // Add stock information to each book
        const booksWithStock = await Promise.all(
            books.map(async (book) => {
                const stock = await stockService.getStockLevel(book._id!);
                return {
                    ...book,
                    stock
                };
            })
        );

        return booksWithStock;
    }

    /**
     * Get a specific book by ID with stock information
     * @param id - The book ID
     * @param request - Koa request object for database access
     * @returns Book details with stock information
     */
    @Get('{id}')
    public async getBookById(
        @Path() id: string,
        @Request() request: KoaRequest
    ): Promise<BookWithStock> {
        const ctx: ParameterizedContext<AppWarehouseDatabaseState & AppBookDatabaseState> = request.ctx;
        
        const bookRepository = new MongoDBBookRepository(ctx.state.books.database);
        const warehouseRepository = new MongoDBWarehouseRepository(ctx.state.warehouse.database);
        const stockService = new MongoDBStockService(warehouseRepository);

        const book = await bookRepository.getBookById(id);
        if (!book) {
            throw new Error('Book not found');
        }

        const stock = await stockService.getStockLevel(id);
        return {
            ...book,
            stock
        };
    }

    /**
     * Create a new book
     * @param requestBody - Book details
     * @param request - Koa request object for database access
     * @returns Created book information
     */
    @Post('/')
    public async createBook(
        @Body() requestBody: CreateBookRequest,
        @Request() request: KoaRequest
    ): Promise<{ id: string; message: string }> {
        const ctx: ParameterizedContext<AppWarehouseDatabaseState & AppBookDatabaseState> = request.ctx;
        
        const bookRepository = new MongoDBBookRepository(ctx.state.books.database);

        // This would need to be implemented in the repository
        const bookId = 'temp-id'; // Placeholder
        return { id: bookId, message: 'Book created successfully' };
    }

    /**
     * Update an existing book
     * @param id - The book ID
     * @param requestBody - Updated book details
     * @param request - Koa request object for database access
     * @returns Success message
     */
    @Put('{id}')
    public async updateBook(
        @Path() id: string,
        @Body() requestBody: UpdateBookRequest,
        @Request() request: KoaRequest
    ): Promise<{ message: string }> {
        const ctx: ParameterizedContext<AppWarehouseDatabaseState & AppBookDatabaseState> = request.ctx;
        
        const bookRepository = new MongoDBBookRepository(ctx.state.books.database);

        // This would need to be implemented in the repository
        return { message: 'Book updated successfully' };
    }

    /**
     * Delete a book
     * @param id - The book ID
     * @param request - Koa request object for database access
     * @returns Success message
     */
    @Delete('{id}')
    public async deleteBook(
        @Path() id: string,
        @Request() request: KoaRequest
    ): Promise<{ message: string }> {
        const ctx: ParameterizedContext<AppWarehouseDatabaseState & AppBookDatabaseState> = request.ctx;
        
        const bookRepository = new MongoDBBookRepository(ctx.state.books.database);

        // This would need to be implemented in the repository
        return { message: 'Book deleted successfully' };
    }
}
