"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ioredis_1 = __importDefault(require("ioredis"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const redisClient = new ioredis_1.default();
redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => {
    console.log('Connected to Redis server');
    loadSampleBooks();
});
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
function loadSampleBooks() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const existingBooks = yield redisClient.keys('book:*');
            if (existingBooks.length === 0) {
                const sampleData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, "../", 'sample-books.json'), 'utf-8'));
                for (const book of sampleData.books) {
                    yield redisClient.set(`book:${book.id}`, JSON.stringify(book));
                }
                console.log('Sample books loaded into Redis');
            }
            else {
                console.log('Books already exist in Redis, skipping sample data load');
            }
        }
        catch (error) {
            console.error('Error loading sample books:', error);
        }
    });
}
app.get('/books', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const keys = yield redisClient.keys('book:*');
        const books = [];
        for (const key of keys) {
            const book = yield redisClient.get(key);
            if (book)
                books.push(JSON.parse(book));
        }
        res.status(200).json(books);
    }
    catch (error) {
        res.status(500).json({ message: 'Error retrieving books', error });
    }
}));
app.get('/books/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const book = yield redisClient.get(`book:${id}`);
        if (book) {
            res.status(200).json(JSON.parse(book));
        }
        else {
            res.status(404).json({ message: 'Book not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error retrieving the book', error });
    }
}));
app.post('/publish', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, title, author } = req.body;
    if (!id) {
        return res.status(400).json({ message: 'Missing id' });
    }
    if (!title || !author) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    try {
        yield redisClient.set(`book:${id}`, JSON.stringify({ id, title, author }));
        res.status(201).json({ message: 'Book published successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error publishing the book', error });
    }
}));
app.delete('/books/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const deleted = yield redisClient.del(`book:${id}`);
        if (deleted) {
            res.status(200).json({ message: 'Book deleted successfully' });
        }
        else {
            res.status(404).json({ message: 'Book not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting the book', error });
    }
}));
app.put('/book/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { title, author } = req.body;
    try {
        const book = yield redisClient.get(`book:${id}`);
        if (book) {
            const updatedBook = JSON.parse(book);
            if (title)
                updatedBook.title = title;
            if (author)
                updatedBook.author = author;
            yield redisClient.set(`book:${id}`, JSON.stringify(updatedBook));
            res.status(200).json({ message: 'Book updated successfully' });
        }
        else {
            res.status(404).json({ message: 'Book not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating the book', error });
    }
}));
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
