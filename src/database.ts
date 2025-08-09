import { MongoClient, Db, Collection } from 'mongodb';

export interface Book {
    _id?: string;
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

class DatabaseService {
    private client: MongoClient;
    private db: Db | null = null;
    private booksCollection: Collection<Book> | null = null;

    constructor() {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
        this.client = new MongoClient(mongoUri);
    }

    async connect() {
        try {
            await this.client.connect();
            this.db = this.client.db('mcmasterful-books');
            this.booksCollection = this.db.collection<Book>('books');

            await this.initializeBooks();
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }

    async disconnect() {
        await this.client.close();
    }

    private async initializeBooks() {
        if (!this.booksCollection) return;

        const count = await this.booksCollection.countDocuments();
        if (count === 0) {
            const initialBooks = [
                {
                    name: "Giant's Bread",
                    author: 'Agatha Christie',
                    description:
                        "'A satisfying novel.' New York Times 'When Miss Westmacott reaches the world of music, her book suddenly comes alive. The chapters in which Jane appears are worth the rest of the book put together.' New Statesman --This text refers to an out of print or unavailable edition of this title.",
                    price: 21.86,
                    image: 'https://upload.wikimedia.org/wikipedia/en/4/45/Giant%27s_Bread_First_Edition_Cover.jpg',
                },
                {
                    name: 'Appointment with Death',
                    author: 'Agatha Christie',
                    description:
                        'In this exclusive authorized edition from the Queen of Mystery, the unstoppable Hercule Poirot finds himself in the Middle East with only one day to solve a murder..',
                    price: 19.63,
                    image: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Appointment_with_Death_First_Edition_Cover_1938.jpg/220px-Appointment_with_Death_First_Edition_Cover_1938.jpg',
                },
                {
                    name: 'Beowulf: The Monsters and the Critics',
                    author: 'J.R.R Tolkein',
                    description:
                        "J. R. R. Tolkien's essay 'Beowulf: The Monsters and the Critics', initially delivered as the Sir Israel Gollancz Memorial Lecture at the British Academy in 1936, and first published as a paper in the Proceedings of the British Academy that same year, is regarded as a formative work in modern Beowulf studies. In it, Tolkien speaks against critics who play down the monsters in the poem, namely Grendel, Grendel's mother, and the dragon, in favour of using Beowulf solely as a source for Anglo-Saxon history.",
                    price: 19.95,
                    image: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/51/Beowulf_The_Monsters_and_the_Critics_1936_title_page.jpg/220px-Beowulf_The_Monsters_and_the_Critics_1936_title_page.jpg',
                },
                {
                    name: 'The Complete Works of William Shakespeare',
                    author: 'William Shakespeare',
                    description:
                        "No library is complete without the classics! This leather-bound edition includes the complete works of the playwright and poet William Shakespeare, considered by many to be the English language's greatest writer.",
                    price: 39.99,
                    image: 'https://m.media-amazon.com/images/I/71Bd39ofMAL._SL1500_.jpg',
                },
                {
                    name: 'Iliad & Odyssey ',
                    author: 'Homer',
                    description:
                        'No home library is complete without the classics! Iliad & Odyssey brings together the two essential Greek epics from the poet Homer in an elegant, leather-bound, omnibus edition-a keepsake to be read and treasured.',
                    price: 33.99,
                    image: 'https://m.media-amazon.com/images/I/71ZWKmOIpVL._SL1500_.jpg',
                },
                {
                    name: 'Modern Software Engineering: Doing What Works to Build Better Software Faster',
                    author: 'David Farley',
                    description:
                        'In Modern Software Engineering, continuous delivery pioneer David Farley helps software professionals think about their work more effectively, manage it more successfully, and genuinely improve the quality of their applications, their lives, and the lives of their colleagues.',
                    price: 51.56,
                    image: 'https://m.media-amazon.com/images/I/81sji+WquSL._SL1500_.jpg',
                },
                {
                    name: 'Domain-Driven Design: Tackling Complexity in the Heart of Software ',
                    author: 'Eric Evans',
                    description:
                        'Leading software designers have recognized domain modeling and design as critical topics for at least twenty years, yet surprisingly little has been written about what needs to be done or how to do it.',
                    price: 91.99,
                    image: 'https://m.media-amazon.com/images/I/71Qde+ZerdL._SL1500_.jpg',
                },
            ];

            await this.booksCollection.insertMany(initialBooks);
            console.log('Initialized database with sample books');
        }
    }

    async getAllBooks(): Promise<Book[]> {
        if (!this.booksCollection) throw new Error('Database not connected');
        return await this.booksCollection.find({}).toArray();
    }

    async getBooksByFilters(filters: Filter[]): Promise<Book[]> {
        if (!this.booksCollection) throw new Error('Database not connected');

        if (!filters || filters.length === 0) {
            return await this.getAllBooks();
        }

        const query = {
            $or: filters.map((filter) => {
                const conditions: Record<string, unknown> = {};

                if (filter.from !== undefined || filter.to !== undefined) {
                    const priceQuery: Record<string, number> = {};
                    if (filter.from !== undefined)
                        priceQuery.$gte = filter.from;
                    if (filter.to !== undefined) priceQuery.$lte = filter.to;
                    conditions.price = priceQuery;
                }

                if (filter.name !== undefined) {
                    conditions.name = { $regex: filter.name, $options: 'i' };
                }

                if (filter.author !== undefined) {
                    conditions.author = {
                        $regex: filter.author,
                        $options: 'i',
                    };
                }

                return conditions;
            }),
        };

        return await this.booksCollection.find(query).toArray();
    }

    async createBook(book: Omit<Book, '_id'>): Promise<string> {
        if (!this.booksCollection) throw new Error('Database not connected');

        const result = await this.booksCollection.insertOne(book);
        return result.insertedId.toString();
    }

    async updateBook(id: string, book: Partial<Book>): Promise<void> {
        if (!this.booksCollection) throw new Error('Database not connected');

        const result = await this.booksCollection.updateOne(
            { _id: id },
            { $set: book }
        );

        if (result.matchedCount === 0) {
            throw new Error('Book not found');
        }
    }

    async deleteBook(id: string): Promise<void> {
        if (!this.booksCollection) throw new Error('Database not connected');

        const result = await this.booksCollection.deleteOne({ _id: id });

        if (result.deletedCount === 0) {
            throw new Error('Book not found');
        }
    }
}

export const dbService = new DatabaseService();
