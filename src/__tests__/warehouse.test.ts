import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { warehouseService } from '../warehouse';

describe('Warehouse Service', () => {
    beforeEach(async () => {
        await warehouseService.connect();
    });

    afterEach(async () => {
        await warehouseService.disconnect();
    });

    describe('placeBooksOnShelf', () => {
        it('should place books on a shelf', async () => {
            const bookId = 'test-book-id';
            const shelfId = 'shelf-a';
            const numberOfBooks = 5;

            await warehouseService.placeBooksOnShelf(bookId, numberOfBooks, shelfId);

            const locations = await warehouseService.findBookOnShelf(bookId);
            expect(locations).toHaveLength(1);
            expect(locations[0].shelf).toBe(shelfId);
            expect(locations[0].count).toBe(numberOfBooks);
        });

        it('should add to existing books on the same shelf', async () => {
            const bookId = 'test-book-id';
            const shelfId = 'shelf-a';

            await warehouseService.placeBooksOnShelf(bookId, 3, shelfId);
            await warehouseService.placeBooksOnShelf(bookId, 2, shelfId);

            const locations = await warehouseService.findBookOnShelf(bookId);
            expect(locations).toHaveLength(1);
            expect(locations[0].count).toBe(5);
        });
    });

    describe('orderBooks', () => {
        it('should create an order with book counts', async () => {
            const books = ['book1', 'book2', 'book1', 'book3'];

            const result = await warehouseService.orderBooks(books);

            expect(result.orderId).toBeDefined();
            expect(result.orderId).toMatch(/^order_\d+_[a-z0-9]+$/);

            const orders = await warehouseService.listOrders();
            const createdOrder = orders.find(order => order.orderId === result.orderId);
            expect(createdOrder).toBeDefined();
            expect(createdOrder?.books).toEqual({
                book1: 2,
                book2: 1,
                book3: 1,
            });
        });
    });
});
