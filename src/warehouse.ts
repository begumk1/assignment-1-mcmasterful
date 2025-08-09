import { MongoClient, Db, Collection } from 'mongodb';

export interface WarehouseBook {
    _id?: string;
    bookId: string;
    shelfId: string;
    count: number;
}

export interface Order {
    _id?: string;
    orderId: string;
    books: Record<string, number>; // bookId -> quantity
    status: 'pending' | 'fulfilled';
    createdAt: Date;
}

export interface OrderFulfillment {
    orderId: string;
    book: string;
    shelf: string;
    numberOfBooks: number;
}

class WarehouseService {
    private client: MongoClient;
    private db: Db | null = null;
    private warehouseCollection: Collection<WarehouseBook> | null = null;
    private ordersCollection: Collection<Order> | null = null;

    constructor() {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
        this.client = new MongoClient(mongoUri);
    }

    async connect() {
        try {
            await this.client.connect();
            this.db = this.client.db('mcmasterful-books');
            this.warehouseCollection = this.db.collection<WarehouseBook>('warehouse');
            this.ordersCollection = this.db.collection<Order>('orders');
            console.log('Connected to Warehouse MongoDB');
        } catch (error) {
            console.error('Failed to connect to Warehouse MongoDB:', error);
            throw error;
        }
    }

    async disconnect() {
        await this.client.close();
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

    async orderBooks(books: string[]): Promise<{ orderId: string }> {
        if (!this.ordersCollection) throw new Error('Database not connected');

        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Count books by ID
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

    async fulfilOrder(orderId: string, booksFulfilled: OrderFulfillment[]): Promise<void> {
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
}

export const warehouseService = new WarehouseService();
