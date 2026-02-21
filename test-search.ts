import { searchBooks, findGutenbergBook } from './services/BookSearch';

async function test() {
    console.log('Searching for Pride and Prejudice...');
    const books = await searchBooks('Pride and Prejudice');
    console.log(`Found ${books.length} books.`);
    if (books.length > 0) {
        console.log('First book:', books[0]);
        console.log('Checking Gutenberg...');
        const gutenberg = await findGutenbergBook(books[0].title, books[0].author);
        console.log('Gutenberg result:', gutenberg);
    }
}

test();
