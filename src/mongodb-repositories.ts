import { MongoClient, Db, Collection } from 'mongodb';
import { BookRepository, WarehouseRepository, StockService } from './ports';
import { Book } from './database';

export class MongoDBBookRepository implements BookRepository {
    private booksCollection: Collection<Book> | null = null;

    constructor(private db: Db) {
        this.booksCollection = db.collection<Book>('books');
    }

    async getBookById(id: string): Promise<Book | null> {
        if (!this.booksCollection) throw new Error('Database not connected');
        return await this.booksCollection.findOne({ _id: id });
    }

    async getAllBooks(): Promise<Book[]> {
        if (!this.booksCollection) throw new Error('Database not connected');
        return await this.booksCollection.find({}).toArray();
    }
}

export interface WarehouseBook {
    _id?: string;
    bookId: string;
    shelfId: string;
    count: number;
}

export interface Order {
    _id?: string;
    orderId: string;
    books: Record<string, number>;
    status: 'pending' | 'fulfilled';
    createdAt: Date;
}

export class MongoDBWarehouseRepository implements WarehouseRepository {
    private warehouseCollection: Collection<WarehouseBook> | null = null;
    private ordersCollection: Collection<Order> | null = null;

    constructor(private db: Db) {
        this.warehouseCollection = db.collection<WarehouseBook>('warehouse');
        this.ordersCollection = db.collection<Order>('orders');
    }

    async placeBooksOnShelf(bookId: string, numberOfBooks: number, shelfId: string): Promise<void> {
        if (!this.warehouseCollection) throw new Error('Database not connected');

        const existingRecord = await this.warehouseCollection.findOne({
            bookId,
            shelfId,
        });

        if (existingRecord) {
            await this.warehouseCollection.updateOne(
                { _id: existingRecord._id },
                { $inc: { count: numberOfBooks } }
            );
        } else {
            await this.warehouseCollection.insertOne({
                bookId,
                shelfId,
                count: numberOfBooks,
            });
        }
    }

    async findBookOnShelf(bookId: string): Promise<Array<{ shelf: string; count: number }>> {
        if (!this.warehouseCollection) throw new Error('Database not connected');

        const records = await this.warehouseCollection
            .find({ bookId })
            .toArray();

        return records.map(record => ({
            shelf: record.shelfId,
            count: record.count,
        }));
    }

    async createOrder(books: string[]): Promise<{ orderId: string }> {
        if (!this.ordersCollection) throw new Error('Database not connected');

        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const bookCounts: Record<string, number> = {};
        books.forEach(bookId => {
            bookCounts[bookId] = (bookCounts[bookId] || 0) + 1;
        });

        await this.ordersCollection.insertOne({
            orderId,
            books: bookCounts,
            status: 'pending',
            createdAt: new Date(),
        });

        return { orderId };
    }

    async listOrders(): Promise<Array<{ orderId: string; books: Record<string, number> }>> {
        if (!this.ordersCollection) throw new Error('Database not connected');

        const orders = await this.ordersCollection.find({}).toArray();
        
        return orders.map(order => ({
            orderId: order.orderId,
            books: order.books,
        }));
    }

    async fulfilOrder(orderId: string, booksFulfilled: Array<{
        book: string;
        shelf: string;
        numberOfBooks: number;
    }>): Promise<void> {
        if (!this.warehouseCollection || !this.ordersCollection) {
            throw new Error('Database not connected');
        }

        // Update warehouse inventory
        for (const fulfillment of booksFulfilled) {
            await this.warehouseCollection.updateOne(
                { bookId: fulfillment.book, shelfId: fulfillment.shelf },
                { $inc: { count: -fulfillment.numberOfBooks } }
            );
        }

        // Mark order as fulfilled
        await this.ordersCollection.updateOne(
            { orderId },
            { $set: { status: 'fulfilled' } }
        );
    }

    async getOrderById(orderId: string): Promise<{ orderId: string; books: Record<string, number>; status: string } | null> {
        if (!this.ordersCollection) throw new Error('Database not connected');
        
        const order = await this.ordersCollection.findOne({ orderId });
        return order ? {
            orderId: order.orderId,
            books: order.books,
            status: order.status
        } : null;
    }
}

export class MongoDBStockService implements StockService {
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
