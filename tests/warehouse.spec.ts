import { describe, it, expect } from 'vitest';
import { setupApiTest } from './test-helper';
import { DefaultApi, Configuration } from '../client';

describe('Warehouse API', () => {
    const getTestContext = setupApiTest();

    describe('POST /warehouse/place-books', () => {
        it('should place books on shelf successfully', async () => {
            const context = getTestContext();
            const client = new DefaultApi(new Configuration({ basePath: context.address }));

            const result = await client.placeBooksOnShelf({
                bookId: 'test-book-1',
                numberOfBooks: 5,
                shelf: 'shelf-a'
            });

            expect(result.message).toBe('Books placed on shelf successfully');
        });

        it('should reject placing books for non-existent book', async () => {
            const context = getTestContext();
            const client = new DefaultApi(new Configuration({ basePath: context.address }));

            await expect(
                client.placeBooksOnShelf({
                    bookId: 'non-existent-book',
                    numberOfBooks: 5,
                    shelf: 'shelf-a'
                })
            ).rejects.toThrow();
        });
    });

    describe('GET /warehouse/find-book/{bookId}', () => {
        it('should find book locations', async () => {
            const context = getTestContext();
            const client = new DefaultApi(new Configuration({ basePath: context.address }));

            await client.placeBooksOnShelf({
                bookId: 'test-book-1',
                numberOfBooks: 3,
                shelf: 'shelf-a'
            });

            const locations = await client.findBookOnShelf('test-book-1');

            expect(locations).toHaveLength(1);
            expect(locations[0].shelf).toBe('shelf-a');
            expect(locations[0].count).toBe(3);
        });

        it('should return empty array for non-existent book', async () => {
            const context = getTestContext();
            const client = new DefaultApi(new Configuration({ basePath: context.address }));

            const locations = await client.findBookOnShelf('non-existent-book');

            expect(locations).toHaveLength(0);
        });
    });

    describe('POST /warehouse/order', () => {
        it('should create order successfully', async () => {
            const context = getTestContext();
            const client = new DefaultApi(new Configuration({ basePath: context.address }));

            const result = await client.orderBooks({
                books: ['test-book-1', 'test-book-1', 'test-book-2']
            });

            expect(result.orderId).toBeDefined();
            expect(result.orderId).toMatch(/^order_\d+_[a-z0-9]+$/);
        });

        it('should reject order with non-existent books', async () => {
            const context = getTestContext();
            const client = new DefaultApi(new Configuration({ basePath: context.address }));

            await expect(
                client.orderBooks({
                    books: ['non-existent-book']
                })
            ).rejects.toThrow();
        });
    });

    describe('GET /warehouse/orders', () => {
        it('should list all orders', async () => {
            const context = getTestContext();
            const client = new DefaultApi(new Configuration({ basePath: context.address }));

            await client.orderBooks({
                books: ['test-book-1', 'test-book-2']
            });

            const orders = await client.listOrders();

            expect(Array.isArray(orders)).toBe(true);
            expect(orders.length).toBeGreaterThan(0);
            expect(orders[0]).toHaveProperty('orderId');
            expect(orders[0]).toHaveProperty('books');
        });
    });

    describe('POST /warehouse/fulfil-order', () => {
        it('should fulfil order successfully', async () => {
            const context = getTestContext();
            const client = new DefaultApi(new Configuration({ basePath: context.address }));

            await client.placeBooksOnShelf({
                bookId: 'test-book-1',
                numberOfBooks: 5,
                shelf: 'shelf-a'
            });

            const orderResult = await client.orderBooks({
                books: ['test-book-1', 'test-book-1']
            });

            const result = await client.fulfilOrder({
                orderId: orderResult.orderId,
                booksFulfilled: [{
                    book: 'test-book-1',
                    shelf: 'shelf-a',
                    numberOfBooks: 2
                }]
            });

            expect(result.message).toBe('Order fulfilled successfully');
        });

        it('should reject fulfilment with insufficient stock', async () => {
            const context = getTestContext();
            const client = new DefaultApi(new Configuration({ basePath: context.address }));

            await client.placeBooksOnShelf({
                bookId: 'test-book-1',
                numberOfBooks: 1,
                shelf: 'shelf-a'
            });

            const orderResult = await client.orderBooks({
                books: ['test-book-1', 'test-book-1']
            });

            await expect(
                client.fulfilOrder({
                    orderId: orderResult.orderId,
                    booksFulfilled: [{
                        book: 'test-book-1',
                        shelf: 'shelf-a',
                        numberOfBooks: 2
                    }]
                })
            ).rejects.toThrow();
        });
    });
});
