import { BookRepository, WarehouseRepository, StockService } from '../ports';
import { Book } from '../database';

export class InMemoryBookRepository implements BookRepository {
    private books: Map<string, Book> = new Map();

    constructor(initialBooks: Book[] = []) {
        initialBooks.forEach(book => {
            if (book._id) {
                this.books.set(book._id, book);
            }
        });
    }

    async getBookById(id: string): Promise<Book | null> {
        return this.books.get(id) || null;
    }

    async getAllBooks(): Promise<Book[]> {
        return Array.from(this.books.values());
    }

    // Helper method for testing
    addBook(book: Book): void {
        if (book._id) {
            this.books.set(book._id, book);
        }
    }
}

export class InMemoryWarehouseRepository implements WarehouseRepository {
    private warehouse: Map<string, Map<string, number>> = new Map(); // bookId -> shelfId -> count
    private orders: Map<string, { orderId: string; books: Record<string, number>; status: string }> = new Map();

    async placeBooksOnShelf(bookId: string, numberOfBooks: number, shelfId: string): Promise<void> {
        if (!this.warehouse.has(bookId)) {
            this.warehouse.set(bookId, new Map());
        }
        const bookShelves = this.warehouse.get(bookId)!;
        const currentCount = bookShelves.get(shelfId) || 0;
        bookShelves.set(shelfId, currentCount + numberOfBooks);
    }

    async findBookOnShelf(bookId: string): Promise<Array<{ shelf: string; count: number }>> {
        const bookShelves = this.warehouse.get(bookId);
        if (!bookShelves) {
            return [];
        }
        return Array.from(bookShelves.entries()).map(([shelf, count]) => ({ shelf, count }));
    }

    async createOrder(books: string[]): Promise<{ orderId: string }> {
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const bookCounts: Record<string, number> = {};
        books.forEach(bookId => {
            bookCounts[bookId] = (bookCounts[bookId] || 0) + 1;
        });

        this.orders.set(orderId, {
            orderId,
            books: bookCounts,
            status: 'pending'
        });

        return { orderId };
    }

    async listOrders(): Promise<Array<{ orderId: string; books: Record<string, number> }>> {
        return Array.from(this.orders.values()).map(order => ({
            orderId: order.orderId,
            books: order.books
        }));
    }

    async fulfilOrder(orderId: string, booksFulfilled: Array<{
        book: string;
        shelf: string;
        numberOfBooks: number;
    }>): Promise<void> {
        const order = this.orders.get(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Update warehouse inventory
        for (const fulfillment of booksFulfilled) {
            const bookShelves = this.warehouse.get(fulfillment.book);
            if (!bookShelves) {
                throw new Error(`Book ${fulfillment.book} not found in warehouse`);
            }

            const currentCount = bookShelves.get(fulfillment.shelf) || 0;
            if (currentCount < fulfillment.numberOfBooks) {
                throw new Error(`Insufficient stock for book ${fulfillment.book} on shelf ${fulfillment.shelf}`);
            }

            bookShelves.set(fulfillment.shelf, currentCount - fulfillment.numberOfBooks);
        }

        // Mark order as fulfilled
        order.status = 'fulfilled';
    }

    async getOrderById(orderId: string): Promise<{ orderId: string; books: Record<string, number>; status: string } | null> {
        return this.orders.get(orderId) || null;
    }
}

export class InMemoryStockService implements StockService {
    constructor(private warehouseRepository: WarehouseRepository) {}

    async getStockLevel(bookId: string): Promise<number> {
        const locations = await this.warehouseRepository.findBookOnShelf(bookId);
        return locations.reduce((total, location) => total + location.count, 0);
    }

    async getStockLevels(bookIds: string[]): Promise<Record<string, number>> {
        const stockLevels: Record<string, number> = {};
        for (const bookId of bookIds) {
            stockLevels[bookId] = await this.getStockLevel(bookId);
        }
        return stockLevels;
    }
}
