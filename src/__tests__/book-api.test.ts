import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getBookDatabase, seedTestDatabase, clearTestDatabase } from './database-utils';
import { Book } from '../database';

describe('Book API', () => {
    beforeEach(async () => {
        await clearTestDatabase();
    });

    afterEach(async () => {
        await clearTestDatabase();
    });

    describe('getBookById', () => {
        it('should return a book when it exists', async () => {
            // Arrange
            const testBook: Book = {
                name: 'Test Book',
                author: 'Test Author',
                description: 'A test book',
                price: 29.99,
                image: 'https://example.com/image.jpg',
            };

            const { books } = getBookDatabase();
            const result = await books.insertOne(testBook);
            const bookId = result.insertedId.toString();

            // Act
            const retrievedBook = await books.findOne({ _id: bookId });

            // Assert
            expect(retrievedBook).toBeDefined();
            expect(retrievedBook?.name).toBe(testBook.name);
            expect(retrievedBook?.author).toBe(testBook.author);
            expect(retrievedBook?.description).toBe(testBook.description);
            expect(retrievedBook?.price).toBe(testBook.price);
            expect(retrievedBook?.image).toBe(testBook.image);
        });

        it('should return null when book does not exist', async () => {
            // Arrange
            const { books } = getBookDatabase();
            const nonExistentId = '507f1f77bcf86cd799439011';

            // Act
            const retrievedBook = await books.findOne({ _id: nonExistentId });

            // Assert
            expect(retrievedBook).toBeNull();
        });
    });
});
