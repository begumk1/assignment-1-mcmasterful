import { describe, it, expect, beforeEach } from 'vitest';
import { WarehouseService } from '../warehouse-service';
import { InMemoryBookRepository, InMemoryWarehouseRepository, InMemoryStockService } from './in-memory-repositories';
import { Book } from '../database';

describe('WarehouseService', () => {
    let bookRepository: InMemoryBookRepository;
    let warehouseRepository: InMemoryWarehouseRepository;
    let stockService: InMemoryStockService;
    let warehouseService: WarehouseService;

    const testBook: Book = {
        _id: 'book-1',
        name: 'Test Book',
        author: 'Test Author',
        description: 'A test book',
        price: 29.99,
        image: 'https://example.com/image.jpg',
    };

    beforeEach(() => {
        bookRepository = new InMemoryBookRepository([testBook]);
        warehouseRepository = new InMemoryWarehouseRepository();
        stockService = new InMemoryStockService(warehouseRepository);
        warehouseService = new WarehouseService(bookRepository, warehouseRepository, stockService);
    });

    describe('placeBooksOnShelf', () => {
        it('should place books on shelf when book exists', async () => {
            await warehouseService.placeBooksOnShelf('book-1', 5, 'shelf-a');

            const locations = await warehouseService.findBookOnShelf('book-1');
            expect(locations).toHaveLength(1);
            expect(locations[0].shelf).toBe('shelf-a');
            expect(locations[0].count).toBe(5);
        });

        it('should throw error when book does not exist', async () => {
            await expect(
                warehouseService.placeBooksOnShelf('non-existent-book', 5, 'shelf-a')
            ).rejects.toThrow('Book with ID non-existent-book does not exist');
        });
    });

    describe('orderBooks', () => {
        it('should create order when all books exist', async () => {
            const result = await warehouseService.orderBooks(['book-1', 'book-1']);

            expect(result.orderId).toBeDefined();
            expect(result.orderId).toMatch(/^order_\d+_[a-z0-9]+$/);

            const orders = await warehouseService.listOrders();
            const createdOrder = orders.find(order => order.orderId === result.orderId);
            expect(createdOrder).toBeDefined();
            expect(createdOrder?.books).toEqual({ 'book-1': 2 });
        });

        it('should throw error when any book does not exist', async () => {
            await expect(
                warehouseService.orderBooks(['book-1', 'non-existent-book'])
            ).rejects.toThrow('Book with ID non-existent-book does not exist');
        });
    });

    describe('fulfilOrder', () => {
        it('should fulfil order when sufficient stock exists', async () => {
            // Place books on shelf
            await warehouseService.placeBooksOnShelf('book-1', 10, 'shelf-a');

            // Create order
            const orderResult = await warehouseService.orderBooks(['book-1', 'book-1']);

            // Fulfil order
            await warehouseService.fulfilOrder(orderResult.orderId, [{
                book: 'book-1',
                shelf: 'shelf-a',
                numberOfBooks: 2
            }]);

            // Check stock was reduced
            const locations = await warehouseService.findBookOnShelf('book-1');
            expect(locations[0].count).toBe(8);
        });

        it('should throw error when insufficient stock', async () => {
            // Place books on shelf
            await warehouseService.placeBooksOnShelf('book-1', 1, 'shelf-a');

            // Create order
            const orderResult = await warehouseService.orderBooks(['book-1', 'book-1']);

            // Try to fulfil order with insufficient stock
            await expect(
                warehouseService.fulfilOrder(orderResult.orderId, [{
                    book: 'book-1',
                    shelf: 'shelf-a',
                    numberOfBooks: 2
                }])
            ).rejects.toThrow('Insufficient stock for book book-1 on shelf shelf-a');
        });

        it('should throw error when order does not exist', async () => {
            await expect(
                warehouseService.fulfilOrder('non-existent-order', [{
                    book: 'book-1',
                    shelf: 'shelf-a',
                    numberOfBooks: 1
                }])
            ).rejects.toThrow('Order with ID non-existent-order does not exist');
        });
    });

    describe('getBookWithStock', () => {
        it('should return book with stock level', async () => {
            await warehouseService.placeBooksOnShelf('book-1', 5, 'shelf-a');

            const result = await warehouseService.getBookWithStock('book-1');
            expect(result).toBeDefined();
            expect(result?.book).toEqual(testBook);
            expect(result?.stock).toBe(5);
        });

        it('should return null when book does not exist', async () => {
            const result = await warehouseService.getBookWithStock('non-existent-book');
            expect(result).toBeNull();
        });
    });

    describe('getAllBooksWithStock', () => {
        it('should return all books with stock levels', async () => {
            await warehouseService.placeBooksOnShelf('book-1', 3, 'shelf-a');

            const results = await warehouseService.getAllBooksWithStock();
            expect(results).toHaveLength(1);
            expect(results[0].book).toEqual(testBook);
            expect(results[0].stock).toBe(3);
        });
    });
});
