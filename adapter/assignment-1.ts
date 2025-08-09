export interface Book {
    name: string,
    author: string,
    description: string,
    price: number,
    image: string,
}

async function listBooks(filters?: Array<{from?: number, to?: number}>) : Promise<Book[]>{
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
            });
            url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const books = await response.json() as Book[];
        return books;
    } catch (error) {
        console.error('Error fetching books from API:', error);
        throw error;
    }
}

const assignment = "assignment-1";

export default {
    assignment,
    listBooks
};
