// Book Search Service
// Uses Google Books API (free, no key required for basic search)
// and Project Gutenberg via gutendex.com (free, no key required)

export interface BookSearchResult {
    title: string;
    author: string;
    coverUrl: string | null;
    description: string;
    gutenbergId: string | null;
    totalChapters: number | null;
    googleBooksId: string;
}

export interface Chapter {
    index: number;
    title: string;
    content: string;
}

// Search Google Books for title/author
export async function searchBooks(query: string): Promise<BookSearchResult[]> {
    try {
        const encoded = encodeURIComponent(query);
        const res = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encoded}&maxResults=8&printType=books`
        );
        const data = await res.json();

        if (!data.items) return [];

        return data.items.map((item: any) => {
            const info = item.volumeInfo;
            const cover =
                info.imageLinks?.thumbnail?.replace('http://', 'https://') ||
                info.imageLinks?.smallThumbnail?.replace('http://', 'https://') ||
                null;

            return {
                title: info.title || 'Unknown Title',
                author: info.authors?.[0] || 'Unknown Author',
                coverUrl: cover,
                description: info.description || '',
                gutenbergId: null, // will be enriched below
                totalChapters: null,
                googleBooksId: item.id,
            };
        });
    } catch (e) {
        console.error('Google Books search error:', e);
        return [];
    }
}

// Search Project Gutenberg for a matching book
export async function findGutenbergBook(
    title: string,
    author: string
): Promise<{ id: string; textUrl: string } | null> {
    try {
        // Strip out subtitles (after colon) or annotations in parentheses for better matching
        const cleanTitle = title.split(':')[0].replace(/\(.*?\)/g, '').trim();
        const cleanAuthor = author ? author.split(',')[0].trim() : '';
        const query = encodeURIComponent(`${cleanTitle} ${cleanAuthor}`.trim());

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`https://gutendex.com/books/?search=${query}`, {
            signal: controller.signal,
            headers: { 'User-Agent': 'BookFlowApp/1.0' }
        });
        clearTimeout(timeoutId);

        const data = await res.json();

        if (!data.results || data.results.length === 0) return null;

        // Find best match — prefer books with plain text format
        for (const book of data.results) {
            const textUrl =
                book.formats['text/plain; charset=utf-8'] ||
                book.formats['text/plain; charset=us-ascii'] ||
                book.formats['text/plain'] ||
                null;

            if (textUrl) {
                return { id: String(book.id), textUrl };
            }
        }
        return null;
    } catch (e) {
        console.error('Gutenberg search error:', e);
        return null;
    }
}

// Fetch and cache full text from Gutenberg, split into chapters
export async function fetchAndParseChapters(textUrl: string): Promise<Chapter[]> {
    try {
        const res = await fetch(textUrl);
        const raw = await res.text();

        // Strip Project Gutenberg header/footer
        const startMarkers = ['*** START OF', '***START OF', 'START OF THE PROJECT GUTENBERG'];
        const endMarkers = ['*** END OF', '***END OF', 'END OF THE PROJECT GUTENBERG'];

        let text = raw;
        for (const m of startMarkers) {
            const idx = text.indexOf(m);
            if (idx !== -1) {
                const afterMarker = text.indexOf('\n', idx);
                text = text.slice(afterMarker + 1);
                break;
            }
        }
        for (const m of endMarkers) {
            const idx = text.indexOf(m);
            if (idx !== -1) {
                text = text.slice(0, idx);
                break;
            }
        }

        // Split into chapters using common patterns
        const chapterRegex =
            /^(CHAPTER\s+[IVXLCDM0-9]+\.?|Chapter\s+[IVXLCDM0-9]+\.?|chapter\s+[ivxlcdm0-9]+\.?|PART\s+[IVXLCDM0-9]+|Part\s+[IVXLCDM0-9]+)[^\n]*/gm;

        const matches: { index: number; title: string }[] = [];
        let match;
        while ((match = chapterRegex.exec(text)) !== null) {
            matches.push({ index: match.index, title: match[0].trim() });
        }

        if (matches.length < 2) {
            // No clear chapters found, split into ~5000-char pages
            const pageSize = 5000;
            const pages: Chapter[] = [];
            for (let i = 0; i < text.length; i += pageSize) {
                pages.push({
                    index: pages.length,
                    title: `Section ${pages.length + 1}`,
                    content: text.slice(i, i + pageSize).trim(),
                });
            }
            return pages.slice(0, 50); // cap at 50
        }

        const chapters: Chapter[] = matches.map((m, i) => {
            const start = m.index;
            const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
            return {
                index: i,
                title: m.title,
                content: text.slice(start, end).trim(),
            };
        });

        return chapters;
    } catch (e) {
        console.error('Gutenberg fetch error:', e);
        return [];
    }
}
