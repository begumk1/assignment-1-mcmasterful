import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MongoDBBookRepository, MongoDBWarehouseRepository, MongoDBStockService } from '../mongodb-repositories';
import { InMemoryBookRepository, InMemoryWarehouseRepository, InMemoryStockService } from './in-memory-repositories';
import { getBookDatabase, seedTestDatabase, clearTestDatabase } from './database-utils';
import { Book } from '../database';

describe('Database Adapter Tests', () => {
    let mongoBookRepo: MongoDBBookRepository;
    let mongoWarehouseRepo: MongoDBWarehouseRepository;
    let mongoStockService: MongoDBStockService;
    let inMemoryBookRepo: InMemoryBookRepository;
    let inMemoryWarehouseRepo: InMemoryWarehouseRepository;
    let inMemoryStockService: InMemoryStockService;

    const testBook: Book = {
        _id: 'test-book-1',
        name: 'Test Book',
        author: 'Test Author',
        description: 'A test book',
        price: 29.99,
        image: 'https://example.com/image.jpg',
    };

    beforeEach(async () => {
        // Clear test database
        await clearTestDatabase();

        // Setup MongoDB repositories with separate databases
        const { bookListingDatabase, warehouseDatabase } = getBookDatabase();
        mongoBookRepo = new MongoDBBookRepository(bookListingDatabase);
        mongoWarehouseRepo = new MongoDBWarehouseRepository(warehouseDatabase);
        mongoStockService = new MongoDBStockService(mongoWarehouseRepo);

        // Setup in-memory repositories
        inMemoryBookRepo = new InMemoryBookRepository([testBook]);
        inMemoryWarehouseRepo = new InMemoryWarehouseRepository();
        inMemoryStockService = new InMemoryStockService(inMemoryWarehouseRepo);

        // Seed test database
        await seedTestDatabase([testBook]);
    });

    afterEach(async () => {
        await clearTestDatabase();
    });

    describe('BookRepository', () => {
        it('should return the same book by ID as in-memory repository', async () => {
            const mongoBook = await mongoBookRepo.getBookById('test-book-1');
            const inMemoryBook = await inMemoryBookRepo.getBookById('test-book-1');

            expect(mongoBook).toEqual(inMemoryBook);
        });

        it('should return null for non-existent book (both repositories)', async () => {
            const mongoBook = await mongoBookRepo.getBookById('non-existent');
            const inMemoryBook = await inMemoryBookRepo.getBookById('non-existent');

            expect(mongoBook).toBeNull();
            expect(inMemoryBook).toBeNull();
        });

        it('should return the same books list as in-memory repository', async () => {
            const mongoBooks = await mongoBookRepo.getAllBooks();
            const inMemoryBooks = await inMemoryBookRepo.getAllBooks();

            expect(mongoBooks).toEqual(inMemoryBooks);
        });
    });

    describe('WarehouseRepository', () => {
        it('should place books on shelf identically to in-memory repository', async () => {
            // Place books using both repositories
            await mongoWarehouseRepo.placeBooksOnShelf('test-book-1', 5, 'shelf-a');
            await inMemoryWarehouseRepo.placeBooksOnShelf('test-book-1', 5, 'shelf-a');

            // Check results
            const mongoLocations = await mongoWarehouseRepo.findBookOnShelf('test-book-1');
            const inMemoryLocations = await inMemoryWarehouseRepo.findBookOnShelf('test-book-1');

            expect(mongoLocations).toEqual(inMemoryLocations);
        });

        it('should add to existing books on the same shelf identically', async () => {
            // Initial placement
            await mongoWarehouseRepo.placeBooksOnShelf('test-book-1', 3, 'shelf-a');
            await inMemoryWarehouseRepo.placeBooksOnShelf('test-book-1', 3, 'shelf-a');

            // Add more books
            await mongoWarehouseRepo.placeBooksOnShelf('test-book-1', 2, 'shelf-a');
            await inMemoryWarehouseRepo.placeBooksOnShelf('test-book-1', 2, 'shelf-a');

            // Check results
            const mongoLocations = await mongoWarehouseRepo.findBookOnShelf('test-book-1');
            const inMemoryLocations = await inMemoryWarehouseRepo.findBookOnShelf('test-book-1');

            expect(mongoLocations).toEqual(inMemoryLocations);
            expect(mongoLocations[0].count).toBe(5);
        });

        it('should create orders identically to in-memory repository', async () => {
            const books = ['test-book-1', 'test-book-1', 'test-book-1'];

            const mongoOrder = await mongoWarehouseRepo.createOrder(books);
            const inMemoryOrder = await inMemoryWarehouseRepo.createOrder(books);

            expect(mongoOrder.orderId).toMatch(/^order_\d+_[a-z0-9]+$/);
            expect(inMemoryOrder.orderId).toMatch(/^order_\d+_[a-z0-9]+$/);

            const mongoOrders = await mongoWarehouseRepo.listOrders();
            const inMemoryOrders = await inMemoryWarehouseRepo.listOrders();

            // Find the created orders
            const mongoCreatedOrder = mongoOrders.find(o => o.orderId === mongoOrder.orderId);
            const inMemoryCreatedOrder = inMemoryOrders.find(o => o.orderId === inMemoryOrder.orderId);

            expect(mongoCreatedOrder?.books).toEqual(inMemoryCreatedOrder?.books);
            expect(mongoCreatedOrder?.books).toEqual({ 'test-book-1': 3 });
        });

        it('should fulfil orders identically to in-memory repository', async () => {
            // Place books
            await mongoWarehouseRepo.placeBooksOnShelf('test-book-1', 10, 'shelf-a');
            await inMemoryWarehouseRepo.placeBooksOnShelf('test-book-1', 10, 'shelf-a');

            // Create orders
            const mongoOrder = await mongoWarehouseRepo.createOrder(['test-book-1', 'test-book-1']);
            const inMemoryOrder = await inMemoryWarehouseRepo.createOrder(['test-book-1', 'test-book-1']);

            // Fulfil orders
            await mongoWarehouseRepo.fulfilOrder(mongoOrder.orderId, [{
                book: 'test-book-1',
                shelf: 'shelf-a',
                numberOfBooks: 2
            }]);
            await inMemoryWarehouseRepo.fulfilOrder(inMemoryOrder.orderId, [{
                book: 'test-book-1',
                shelf: 'shelf-a',
                numberOfBooks: 2
            }]);

            // Check stock levels
            const mongoLocations = await mongoWarehouseRepo.findBookOnShelf('test-book-1');
            const inMemoryLocations = await inMemoryWarehouseRepo.findBookOnShelf('test-book-1');

            expect(mongoLocations).toEqual(inMemoryLocations);
            expect(mongoLocations[0].count).toBe(8);
        });

        it('should handle insufficient stock identically', async () => {
            // Place insufficient books
            await mongoWarehouseRepo.placeBooksOnShelf('test-book-1', 1, 'shelf-a');
            await inMemoryWarehouseRepo.placeBooksOnShelf('test-book-1', 1, 'shelf-a');

            // Create orders
            const mongoOrder = await mongoWarehouseRepo.createOrder(['test-book-1', 'test-book-1']);
            const inMemoryOrder = await inMemoryWarehouseRepo.createOrder(['test-book-1', 'test-book-1']);

            // Try to fulfil orders with insufficient stock
            await expect(
                mongoWarehouseRepo.fulfilOrder(mongoOrder.orderId, [{
                    book: 'test-book-1',
                    shelf: 'shelf-a',
                    numberOfBooks: 2
                }])
            ).rejects.toThrow('Insufficient stock for book test-book-1 on shelf shelf-a');

            await expect(
                inMemoryWarehouseRepo.fulfilOrder(inMemoryOrder.orderId, [{
                    book: 'test-book-1',
                    shelf: 'shelf-a',
                    numberOfBooks: 2
                }])
            ).rejects.toThrow('Insufficient stock for book test-book-1 on shelf shelf-a');
        });
    });

    describe('StockService', () => {
        it('should calculate stock levels identically to in-memory repository', async () => {
            // Place books on multiple shelves
            await mongoWarehouseRepo.placeBooksOnShelf('test-book-1', 3, 'shelf-a');
            await mongoWarehouseRepo.placeBooksOnShelf('test-book-1', 2, 'shelf-b');
            await inMemoryWarehouseRepo.placeBooksOnShelf('test-book-1', 3, 'shelf-a');
            await inMemoryWarehouseRepo.placeBooksOnShelf('test-book-1', 2, 'shelf-b');

            const mongoStock = await mongoStockService.getStockLevel('test-book-1');
            const inMemoryStock = await inMemoryStockService.getStockLevel('test-book-1');

            expect(mongoStock).toBe(inMemoryStock);
            expect(mongoStock).toBe(5);
        });

        it('should calculate multiple stock levels identically', async () => {
            // Add another book to the repository
            const secondBook: Book = {
                _id: 'test-book-2',
                name: 'Second Book',
                author: 'Second Author',
                description: 'Another test book',
                price: 19.99,
                image: 'https://example.com/image2.jpg',
            };

            await seedTestDatabase([testBook, secondBook]);
            inMemoryBookRepo.addBook(secondBook);

            // Place books
            await mongoWarehouseRepo.placeBooksOnShelf('test-book-1', 3, 'shelf-a');
            await mongoWarehouseRepo.placeBooksOnShelf('test-book-2', 4, 'shelf-b');
            await inMemoryWarehouseRepo.placeBooksOnShelf('test-book-1', 3, 'shelf-a');
            await inMemoryWarehouseRepo.placeBooksOnShelf('test-book-2', 4, 'shelf-b');

            const mongoStockLevels = await mongoStockService.getStockLevels(['test-book-1', 'test-book-2']);
            const inMemoryStockLevels = await inMemoryStockService.getStockLevels(['test-book-1', 'test-book-2']);

            expect(mongoStockLevels).toEqual(inMemoryStockLevels);
            expect(mongoStockLevels).toEqual({
                'test-book-1': 3,
                'test-book-2': 4
            });
        });
    });
});
