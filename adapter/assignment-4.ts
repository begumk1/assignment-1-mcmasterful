import previous_assignment from './assignment-3';
import { DefaultApi, Configuration } from '../client';

export type BookID = string;
export type ShelfId = string;
export type OrderId = string;

export interface Book {
    id?: BookID;
    name: string;
    author: string;
    description: string;
    price: number;
    image: string;
    stock?: number;
}

export interface Filter {
    from?: number;
    to?: number;
    name?: string;
    author?: string;
}

// Initialize the API client
const apiClient = new DefaultApi(new Configuration({ basePath: 'http://localhost:3000' }));

async function listBooks(filters?: Filter[]): Promise<Book[]> {
    try {
        const books = await apiClient.getBooks();
        
        return books.map(book => ({
            id: book._id,
            name: book.name,
            author: book.author,
            description: book.description,
            price: book.price,
            image: book.image,
            stock: book.stock,
        }));
    } catch (error) {
        console.error('Error fetching books:', error);
        throw error;
    }
}

async function createOrUpdateBook(book: Book): Promise<BookID> {
    return await previous_assignment.createOrUpdateBook(book);
}

async function removeBook(book: BookID): Promise<void> {
    await previous_assignment.removeBook(book);
}

async function lookupBookById(book: BookID): Promise<Book> {
    try {
        const bookData = await apiClient.getBookById(book);
        
        return {
            id: bookData._id,
            name: bookData.name,
            author: bookData.author,
            description: bookData.description,
            price: bookData.price,
            image: bookData.image,
            stock: bookData.stock,
        };
    } catch (error) {
        console.error('Error fetching book by ID:', error);
        throw error;
    }
}

async function placeBooksOnShelf(
    bookId: BookID,
    numberOfBooks: number,
    shelf: ShelfId
): Promise<void> {
    try {
        await apiClient.placeBooksOnShelf({
            bookId,
            numberOfBooks,
            shelf
        });
    } catch (error) {
        console.error('Error placing books on shelf:', error);
        throw error;
    }
}

async function orderBooks(order: BookID[]): Promise<{ orderId: OrderId }> {
    try {
        const result = await apiClient.orderBooks({
            books: order
        });
        
        return { orderId: result.orderId };
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

async function findBookOnShelf(
    book: BookID
): Promise<Array<{ shelf: ShelfId; count: number }>> {
    try {
        const locations = await apiClient.findBookOnShelf(book);
        
        return locations.map(location => ({
            shelf: location.shelf,
            count: location.count
        }));
    } catch (error) {
        console.error('Error finding book on shelf:', error);
        throw error;
    }
}

async function fulfilOrder(
    order: OrderId,
    booksFulfilled: Array<{
        book: BookID;
        shelf: ShelfId;
        numberOfBooks: number;
    }>
): Promise<void> {
    try {
        await apiClient.fulfilOrder({
            orderId: order,
            booksFulfilled
        });
    } catch (error) {
        console.error('Error fulfilling order:', error);
        throw error;
    }
}

async function listOrders(): Promise<
    Array<{ orderId: OrderId; books: Record<BookID, number> }>
> {
    try {
        const orders = await apiClient.listOrders();
        
        return orders.map(order => ({
            orderId: order.orderId,
            books: order.books
        }));
    } catch (error) {
        console.error('Error listing orders:', error);
        throw error;
    }
}

const assignment = 'assignment-4';

export default {
    assignment,
    createOrUpdateBook,
    removeBook,
    listBooks,
    placeBooksOnShelf,
    orderBooks,
    findBookOnShelf,
    fulfilOrder,
    listOrders,
    lookupBookById,
};
