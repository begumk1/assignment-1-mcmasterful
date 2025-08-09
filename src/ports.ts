import { Book } from './database';

export interface BookRepository {
    getBookById(id: string): Promise<Book | null>;
    getAllBooks(): Promise<Book[]>;
}

export interface WarehouseRepository {
    placeBooksOnShelf(bookId: string, numberOfBooks: number, shelfId: string): Promise<void>;
    findBookOnShelf(bookId: string): Promise<Array<{ shelf: string; count: number }>>;
    createOrder(books: string[]): Promise<{ orderId: string }>;
    listOrders(): Promise<Array<{ orderId: string; books: Record<string, number> }>>;
    fulfilOrder(orderId: string, booksFulfilled: Array<{
        book: string;
        shelf: string;
        numberOfBooks: number;
    }>): Promise<void>;
    getOrderById(orderId: string): Promise<{ orderId: string; books: Record<string, number>; status: string } | null>;
}

export interface StockService {
    getStockLevel(bookId: string): Promise<number>;
    getStockLevels(bookIds: string[]): Promise<Record<string, number>>;
}
