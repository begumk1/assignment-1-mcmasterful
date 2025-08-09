import { MongoClient, Db, Collection } from 'mongodb';
import { Book } from '../database';

const uri = (global as any).MONGO_URI as string ?? 'mongodb://mongo';
export const client = new MongoClient(uri);

export interface BookDatabaseAccessor {
    bookListingDatabase: Db;
    warehouseDatabase: Db;
    books: Collection<Book>;
}

export function getBookDatabase(dbName?: string): BookDatabaseAccessor {
    const bookListingDatabase = client.db(
        dbName 
            ? `book-listing-${dbName}`
            : (global as any).MONGO_URI !== undefined
                ? `book-listing-${Math.floor(Math.random() * 100000)}`
                : 'mcmasterful-book-listing'
    );
    const warehouseDatabase = client.db(
        dbName
            ? `warehouse-${dbName}`
            : (global as any).MONGO_URI !== undefined
                ? `warehouse-${Math.floor(Math.random() * 100000)}`
                : 'mcmasterful-warehouse'
    );
    const books = bookListingDatabase.collection<Book>('books');
    
    return {
        bookListingDatabase,
        warehouseDatabase,
        books,
    };
}

export async function seedTestDatabase(books: Book[], dbName?: string): Promise<void> {
    const { books: booksCollection } = getBookDatabase(dbName);
    if (books.length > 0) {
        await booksCollection.insertMany(books);
    }
}

export async function clearTestDatabase(dbName?: string): Promise<void> {
    const { books, bookListingDatabase, warehouseDatabase } = getBookDatabase(dbName);
    await books.deleteMany({});
    
    // Clear warehouse collections
    const warehouseCollection = warehouseDatabase.collection('warehouse');
    const ordersCollection = warehouseDatabase.collection('orders');
    await warehouseCollection.deleteMany({});
    await ordersCollection.deleteMany({});
}
