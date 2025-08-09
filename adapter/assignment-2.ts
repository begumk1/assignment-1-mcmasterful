import assignment1 from "./assignment-1";

export type BookID = string;

export interface Book {
    id?: BookID,
    name: string,
    author: string,
    description: string,
    price: number,
    image: string,
}

async function listBooks(filters?: Array<{from?: number, to?: number}>) : Promise<Book[]>{
    return assignment1.listBooks(filters);
}

async function createOrUpdateBook(book: Book): Promise<BookID> {
    try {
        const url = 'http://localhost:3000/books';
        const method = book.id ? 'PUT' : 'POST';
        const finalUrl = book.id ? `${url}/${book.id}` : url;
        
        const bookData = {
            name: book.name,
            author: book.author,
            description: book.description,
            price: book.price,
            image: book.image
        };

        const response = await fetch(finalUrl, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookData)
        });

        if (!response.ok) {
            const errorData = await response.json() as { error?: string };
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json() as { id: string };
        return book.id || result.id;
    } catch (error) {
        console.error('Error creating/updating book:', error);
        throw error;
    }
}

async function removeBook(book: BookID): Promise<void> {
    try {
        const url = `http://localhost:3000/books/${book}`;
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorData = await response.json() as { error?: string };
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error removing book:', error);
        throw error;
    }
}

const assignment = "assignment-2";

export default {
    assignment,
    createOrUpdateBook,
    removeBook,
    listBooks
};