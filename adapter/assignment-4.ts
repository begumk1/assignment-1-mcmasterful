import previous_assignment from './assignment-3';

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

async function listBooks(filters?: Filter[]): Promise<Book[]> {
    try {
        let url = 'http://localhost:3000/books';
        if (filters && filters.length > 0) {
            const params = new URLSearchParams();
            filters.forEach((filter, index) => {
                if (filter.from !== undefined) {
                    params.append(`filters[${index}][from]`, filter.from.toString());
                }
                if (filter.to !== undefined) {
                    params.append(`filters[${index}][to]`, filter.to.toString());
                }
                if (filter.name !== undefined) {
                    params.append(`filters[${index}][name]`, filter.name);
                }
                if (filter.author !== undefined) {
                    params.append(`filters[${index}][author]`, filter.author);
                }
            });
            url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const books = await response.json() as any[];
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
        const response = await fetch(`http://localhost:3000/books/${book}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Book not found');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const bookData = await response.json() as any;
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
        const response = await fetch('http://localhost:3000/warehouse/place-books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId, numberOfBooks, shelf }),
        });

        if (!response.ok) {
            const errorData = await response.json() as { error?: string };
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error placing books on shelf:', error);
        throw error;
    }
}

async function orderBooks(order: BookID[]): Promise<{ orderId: OrderId }> {
    try {
        const response = await fetch('http://localhost:3000/warehouse/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ books: order }),
        });

        if (!response.ok) {
            const errorData = await response.json() as { error?: string };
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json() as { orderId: string };
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
        const response = await fetch(`http://localhost:3000/warehouse/find-book/${book}`);

        if (!response.ok) {
            const errorData = await response.json() as { error?: string };
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const locations = await response.json() as Array<{ shelf: string; count: number }>;
        return locations;
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
        const response = await fetch('http://localhost:3000/warehouse/fulfil-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: order, booksFulfilled }),
        });

        if (!response.ok) {
            const errorData = await response.json() as { error?: string };
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error fulfilling order:', error);
        throw error;
    }
}

async function listOrders(): Promise<
    Array<{ orderId: OrderId; books: Record<BookID, number> }>
> {
    try {
        const response = await fetch('http://localhost:3000/warehouse/orders');

        if (!response.ok) {
            const errorData = await response.json() as { error?: string };
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const orders = await response.json() as Array<{ orderId: string; books: Record<string, number> }>;
        return orders;
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
