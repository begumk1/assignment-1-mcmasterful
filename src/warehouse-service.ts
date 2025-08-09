import { BookRepository, WarehouseRepository, StockService } from './ports';

export class WarehouseService {
    constructor(
        private bookRepository: BookRepository,
        private warehouseRepository: WarehouseRepository,
        private stockService: StockService
    ) {}

    async placeBooksOnShelf(bookId: string, numberOfBooks: number, shelfId: string): Promise<void> {
        // Validate that the book exists
        const book = await this.bookRepository.getBookById(bookId);
        if (!book) {
            throw new Error(`Book with ID ${bookId} does not exist`);
        }

        await this.warehouseRepository.placeBooksOnShelf(bookId, numberOfBooks, shelfId);
    }

    async findBookOnShelf(bookId: string): Promise<Array<{ shelf: string; count: number }>> {
        // Validate that the book exists
        const book = await this.bookRepository.getBookById(bookId);
        if (!book) {
            throw new Error(`Book with ID ${bookId} does not exist`);
        }

        return await this.warehouseRepository.findBookOnShelf(bookId);
    }

    async orderBooks(books: string[]): Promise<{ orderId: string }> {
        // Validate that all books exist
        for (const bookId of books) {
            const book = await this.bookRepository.getBookById(bookId);
            if (!book) {
                throw new Error(`Book with ID ${bookId} does not exist`);
            }
        }

        return await this.warehouseRepository.createOrder(books);
    }

    async listOrders(): Promise<Array<{ orderId: string; books: Record<string, number> }>> {
        return await this.warehouseRepository.listOrders();
    }

    async fulfilOrder(orderId: string, booksFulfilled: Array<{
        book: string;
        shelf: string;
        numberOfBooks: number;
    }>): Promise<void> {
        // Get the order to validate it exists
        const order = await this.warehouseRepository.getOrderById(orderId);
        if (!order) {
            throw new Error(`Order with ID ${orderId} does not exist`);
        }

        // Validate that all books in the fulfillment exist
        for (const fulfillment of booksFulfilled) {
            const book = await this.bookRepository.getBookById(fulfillment.book);
            if (!book) {
                throw new Error(`Book with ID ${fulfillment.book} does not exist`);
            }
        }

        // Check stock levels before fulfilling
        for (const fulfillment of booksFulfilled) {
            const locations = await this.warehouseRepository.findBookOnShelf(fulfillment.book);
            const shelfLocation = locations.find(loc => loc.shelf === fulfillment.shelf);
            
            if (!shelfLocation || shelfLocation.count < fulfillment.numberOfBooks) {
                throw new Error(`Insufficient stock for book ${fulfillment.book} on shelf ${fulfillment.shelf}`);
            }
        }

        await this.warehouseRepository.fulfilOrder(orderId, booksFulfilled);
    }

    async getBookWithStock(bookId: string): Promise<{ book: any; stock: number } | null> {
        const book = await this.bookRepository.getBookById(bookId);
        if (!book) {
            return null;
        }

        const stock = await this.stockService.getStockLevel(bookId);
        return { book, stock };
    }

    async getAllBooksWithStock(): Promise<Array<{ book: any; stock: number }>> {
        const books = await this.bookRepository.getAllBooks();
        const stockLevels = await this.stockService.getStockLevels(books.map(b => b._id!).filter(Boolean));

        return books.map(book => ({
            book,
            stock: stockLevels[book._id!] || 0
        }));
    }
}
