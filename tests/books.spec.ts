import { describe, it, expect } from 'vitest';
import { setupApiTest } from './test-helper';
import { DefaultApi, Configuration } from '../client';

describe('Books API', () => {
    const getTestContext = setupApiTest();

    describe('GET /books', () => {
        it('should return all books with stock information', async () => {
            const context = getTestContext();
            const client = new DefaultApi(new Configuration({ basePath: context.address }));

            const books = await client.getBooks();

            expect(Array.isArray(books)).toBe(true);
            if (books.length > 0) {
                expect(books[0]).toHaveProperty('_id');
                expect(books[0]).toHaveProperty('name');
                expect(books[0]).toHaveProperty('author');
                expect(books[0]).toHaveProperty('description');
                expect(books[0]).toHaveProperty('price');
                expect(books[0]).toHaveProperty('image');
                expect(books[0]).toHaveProperty('stock');
                expect(typeof books[0].stock).toBe('number');
            }
        });

        it('should return books with zero stock when no books are placed', async () => {
            const context = getTestContext();
            const client = new DefaultApi(new Configuration({ basePath: context.address }));

            const books = await client.getBooks();

            expect(Array.isArray(books)).toBe(true);
            books.forEach(book => {
                expect(book.stock).toBe(0);
            });
        });
    });

    describe('GET /books/{id}', () => {
        it('should return book with stock information', async () => {
            const context = getTestContext();
            const client = new DefaultApi(new Configuration({ basePath: context.address }));

            const books = await client.getBooks();
            if (books.length > 0) {
                const bookId = books[0]._id;
                const book = await client.getBookById(bookId);

                expect(book).toHaveProperty('_id');
                expect(book).toHaveProperty('name');
                expect(book).toHaveProperty('author');
                expect(book).toHaveProperty('description');
                expect(book).toHaveProperty('price');
                expect(book).toHaveProperty('image');
                expect(book).toHaveProperty('stock');
                expect(typeof book.stock).toBe('number');
            }
        });

        it('should return 404 for non-existent book', async () => {
            const context = getTestContext();
            const client = new DefaultApi(new Configuration({ basePath: context.address }));

            await expect(
                client.getBookById('non-existent-id')
            ).rejects.toThrow();
        });
    });

    describe('POST /books', () => {
        it('should create a new book', async () => {
            const context = getTestContext();
            const client = new DefaultApi(new Configuration({ basePath: context.address }));

            const result = await client.createBook({
                name: 'Test Book',
                author: 'Test Author',
                description: 'A test book',
                price: 29.99,
                image: 'https://example.com/image.jpg'
            });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('message');
            expect(result.message).toBe('Book created successfully');
        });
    });

    describe('PUT /books/{id}', () => {
        it('should update an existing book', async () => {
            const context = getTestContext();
            const client = new DefaultApi(new Configuration({ basePath: context.address }));

            const books = await client.getBooks();
            if (books.length > 0) {
                const bookId = books[0]._id;
                const result = await client.updateBook(bookId, {
                    name: 'Updated Book Name'
                });

                expect(result).toHaveProperty('message');
                expect(result.message).toBe('Book updated successfully');
            }
        });
    });

    describe('DELETE /books/{id}', () => {
        it('should delete an existing book', async () => {
            const context = getTestContext();
            const client = new DefaultApi(new Configuration({ basePath: context.address }));

            const books = await client.getBooks();
            if (books.length > 0) {
                const bookId = books[0]._id;
                const result = await client.deleteBook(bookId);

                expect(result).toHaveProperty('message');
                expect(result.message).toBe('Book deleted successfully');
            }
        });
    });
});
