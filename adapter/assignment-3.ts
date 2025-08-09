import previous_assignment from './assignment-2';

export type BookID = string;

export interface Book {
    id?: BookID;
    name: string;
    author: string;
    description: string;
    price: number;
    image: string;
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
                    params.append(
                        `filters[${index}][from]`,
                        filter.from.toString()
                    );
                }
                if (filter.to !== undefined) {
                    params.append(
                        `filters[${index}][to]`,
                        filter.to.toString()
                    );
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

        const books = (await response.json()) as Book[];
        return books;
    } catch (error) {
        console.error('Error fetching books from API:', error);
        throw error;
    }
}

async function createOrUpdateBook(book: Book): Promise<BookID> {
    return await previous_assignment.createOrUpdateBook(book);
}

async function removeBook(book: BookID): Promise<void> {
    await previous_assignment.removeBook(book);
}

const assignment = 'assignment-3';

export default {
    assignment,
    createOrUpdateBook,
    removeBook,
    listBooks,
};
