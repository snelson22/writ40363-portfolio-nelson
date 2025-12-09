// ==========================================
// FAVORITES PAGE - Interactive Features
// ==========================================

console.log('Favorites page loaded!');

// ==========================================
// QUOTES SECTION
// ==========================================

let allQuotes = [];
let currentQuoteIndex = -1;

// Load quotes from JSON
function loadQuotes() {
  console.log('📖 Loading quotes...');

  fetch('./projects/project3-dashboard/data/quotes.json')
    .then(response => response.json())
    .then(data => {
      console.log('✅ Quotes loaded:', data);
      allQuotes = data;
      displayRandomQuote();
    })
    .catch(error => {
      console.error('❌ Error loading quotes:', error);
      displayQuotesError();
    });
}

// Display a random quote with fade transition
function displayRandomQuote() {
  if (allQuotes.length === 0) {
    console.error('No quotes available');
    return;
  }

  // Get random index (different from current)
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * allQuotes.length);
  } while (randomIndex === currentQuoteIndex && allQuotes.length > 1);

  currentQuoteIndex = randomIndex;
  const quote = allQuotes[randomIndex];

  const quoteText = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');

  // Fade out
  quoteText.style.opacity = '0';
  quoteAuthor.style.opacity = '0';

  // Wait for fade out, then update content
  setTimeout(() => {
    quoteText.textContent = `"${quote.text}"`;
    quoteAuthor.textContent = `— ${quote.author}`;

    // Fade in
    quoteText.style.opacity = '1';
    quoteAuthor.style.opacity = '1';
  }, 300);

  console.log('✅ Displayed quote:', quote);
}

// Show error message
function displayQuotesError() {
  const quoteText = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');
  
  quoteText.textContent = 'Could not load quotes';
  quoteAuthor.textContent = '';
}

// ==========================================
// BOOK CAROUSEL SECTION
// ==========================================

const books = [
  { image: 'images/book1.jpg', title: 'A Court of Thorns and Roses by Sarah J. Maas' },
  { image: 'images/book2.jpg', title: 'The Invisible Life of Addie LaRue by V.E. Schwab' },
  { image: 'images/book3.jpg', title: 'Pride and Prejudice by Jane Austen' },
  { image: 'images/book4.jpg', title: 'The Bell Jar by Sylvia Plath' },
  { image: 'images/book5.jpg', title: 'Crying in H Mart by Michelle Zauner' },
  { image: 'images/book6.jpg', title: 'The Song of Achilles by Madeline Miller' }
];

let currentBookIndex = 0;

// Display current book
function displayBook() {
  const bookImage = document.getElementById('bookImage');
  const bookTitle = document.getElementById('bookTitle');

  // Fade out
  bookImage.style.opacity = '0';
  bookTitle.style.opacity = '0';

  setTimeout(() => {
    bookImage.src = books[currentBookIndex].image;
    bookImage.alt = books[currentBookIndex].title;
    bookTitle.textContent = books[currentBookIndex].title;

    // Fade in
    bookImage.style.opacity = '1';
    bookTitle.style.opacity = '1';
  }, 300);
}

// Navigate to previous book
function previousBook() {
  currentBookIndex = (currentBookIndex - 1 + books.length) % books.length;
  displayBook();
  console.log('📚 Previous book:', books[currentBookIndex].title);
}

// Navigate to next book
function nextBook() {
  currentBookIndex = (currentBookIndex + 1) % books.length;
  displayBook();
  console.log('📚 Next book:', books[currentBookIndex].title);
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// New Quote button
document.getElementById('newQuoteBtn').addEventListener('click', () => {
  console.log('🔄 Getting new quote...');
  displayRandomQuote();
});

// Previous book button
document.getElementById('prevBtn').addEventListener('click', () => {
  previousBook();
});

// Next book button
document.getElementById('nextBtn').addEventListener('click', () => {
  nextBook();
});

// ==========================================
// INITIALIZE ON PAGE LOAD
// ==========================================

// Load quotes when page loads
loadQuotes();

// Display first book
displayBook();

console.log('✅ Favorites page initialized!');
