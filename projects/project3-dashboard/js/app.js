// ==========================================
// PROJECT 3: PERSONAL DATA DASHBOARD
// LAB16: fetch() and JSON Basics
// ==========================================

console.log('Dashboard app loaded!');
console.log('LAB16: Learning fetch() API');

// Function to load weather data
function loadWeather() {
    console.log('🌤️ Loading weather data...');

    fetch('./data/weather.json')
        .then(response => {
            console.log('✅ Got response:', response);
            return response.json();
        })
        .then(data => {
            console.log('✅ Weather data loaded:', data);
            displayWeather(data);
        })
        .catch(error => {
            console.error('❌ Error loading weather:', error);
            displayWeatherError();
        });
}

// Function to display weather data in the DOM
function displayWeather(weather) {
    console.log('📊 Displaying weather data...');

    const weatherDisplay = document.getElementById('weather-display');

    weatherDisplay.innerHTML = `
        <div class="weather-current">
            <div class="weather-icon">${weather.current.icon}</div>
            <div class="weather-temp">${weather.current.temperature}°F</div>
            <div class="weather-location">${weather.current.location}</div>
            <div class="weather-condition">${weather.current.condition}</div>
        </div>
        <div class="weather-details">
            <div class="weather-detail">
                <span>💧 Humidity</span>
                <strong>${weather.current.humidity}%</strong>
            </div>
            <div class="weather-detail">
                <span>💨 Wind Speed</span>
                <strong>${weather.current.windSpeed} mph</strong>
            </div>
            <div class="weather-detail">
                <span>🌡️ Feels Like</span>
                 <strong>${weather.current.feelsLike}°F</strong>
            </div>
        </div>
    `;

    console.log('✅ Weather displayed successfully!');
}

// Function to show error message if weather data fails to load
function displayWeatherError() {
    const weatherDisplay = document.getElementById('weather-display');

    weatherDisplay.innerHTML = `
        <div class="error-message">
            <div class="error-icon">⚠️</div>
            <p>Could not load weather data</p>
            <p class="error-hint">Check console for details</p>
        </div>
    `;
}

// Load weather data when page loads
loadWeather();

// Global variable to store all quotes
let allQuotes = [];
let currentQuoteIndex = -1; // Track current quote to avoid repeats

// Function to load quotes from JSON
function loadQuotes() {
  console.log('Loading quotes...');

  fetch('./data/quotes.json')
    .then(response => {
      console.log('Got quotes response:', response);
      return response.json();
    })
    .then(data => {
      console.log('Quotes data:', data);
      allQuotes = data; // Store quotes in global variable
      displayRandomQuote(); // Show first quote
    })
    .catch(error => {
      console.error('Error loading quotes:', error);
      displayQuotesError();
    });
}

// Function to display a random quote
function displayRandomQuote() {
  // Make sure we have quotes loaded
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

  // Display the quote
  const quotesDisplay = document.getElementById('quotes-display');
  quotesDisplay.innerHTML = `
    <div class="quote-card">
      <div class="quote-text">"${quote.text}"</div>
      <div class="quote-author">— ${quote.author}</div>
    </div>
  `;

  console.log('Displayed quote:', quote);
}

// Update your displayQuote function
function displayQuote(quote) {
    const quotesDisplay = document.getElementById('quotes-display');
    
    // Fade out
    quotesDisplay.style.opacity = '0';
    
    // Wait for fade out, then update content
    setTimeout(() => {
        quotesDisplay.innerHTML = `
            <div class="quote-card">
                <p class="quote-text">"${quote.text}"</p>
                <p class="quote-author">— ${quote.author}</p>
            </div>
        `;
        
        // Fade in
        quotesDisplay.style.opacity = '1';
    }, 300);
}

// Function to show error message
function displayQuotesError() {
  const quotesDisplay = document.getElementById('quotes-display');
  quotesDisplay.innerHTML = `
    <div class="error-message">
      ⚠️ Could not load quotes
    </div>
  `;
}

// Call loadQuotes when page loads
loadQuotes();

// Set up "New Quote" button
function setupQuotesButton() {
  const newQuoteBtn = document.getElementById('new-quote-btn');

  newQuoteBtn.addEventListener('click', () => {
    console.log('New quote button clicked!');
    displayRandomQuote();
  });
}

// Call setupQuotesButton after DOM is loaded
setupQuotesButton();

loadQuotes();
setupQuotesButton();
// ========================================
// TASKS WIDGET (from LAB18)
// ========================================

// Function to load tasks from localStorage
function loadTasks() {
  const tasksJSON = localStorage.getItem('dashboardTasks');

  if (tasksJSON) {
    return JSON.parse(tasksJSON);
  } else {
    return []; // Return empty array if no tasks yet
  }
}

// Function to save tasks to localStorage
function saveTasks(tasks) {
  localStorage.setItem('dashboardTasks', JSON.stringify(tasks));
  console.log('Tasks saved:', tasks);
}
// Function to display all tasks
function displayTasks() {
  const tasks = loadTasks();
  const tasksList = document.getElementById('tasks-list');

  // If no tasks, show message
  if (tasks.length === 0) {
    tasksList.innerHTML = `
      <div class="no-tasks">
        No tasks yet. Add one above! ✨
      </div>
    `;
    updateTaskStats(tasks);
    return;
  }

  // Clear existing tasks
  tasksList.innerHTML = '';

  // Display each task
  tasks.forEach((task, index) => {
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;

    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTask(index));

    // Create task text
    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    taskText.textContent = task.text;

    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteTask(index));

    // Append all elements to task item
    taskItem.appendChild(checkbox);
    taskItem.appendChild(taskText);
    taskItem.appendChild(deleteBtn);

    tasksList.appendChild(taskItem);
  });

  updateTaskStats(tasks);
}

// Function to add a new task
function addTask(taskText) {
  const tasks = loadTasks();

  const newTask = {
    text: taskText,
    completed: false,
    id: Date.now() // Unique ID using timestamp
  };

  tasks.push(newTask);
  saveTasks(tasks);
  displayTasks();

  console.log('Task added:', newTask);
}

// Set up form submission
function setupTaskForm() {
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent page reload

    const taskText = taskInput.value.trim();

    if (taskText) {
      addTask(taskText);
      taskInput.value = ''; // Clear input
      taskInput.focus(); // Focus back on input
    }
  });
}

// Function to toggle task complete/incomplete
function toggleTask(index) {
  const tasks = loadTasks();
  tasks[index].completed = !tasks[index].completed;
  saveTasks(tasks);
  displayTasks();

  console.log('Task toggled:', tasks[index]);
}

// Function to delete a task
function deleteTask(index) {
  const tasks = loadTasks();
  const taskToDelete = tasks[index];

  // Optional: Confirm before deleting
  if (confirm(`Delete task: "${taskToDelete.text}"?`)) {
    tasks.splice(index, 1);
    saveTasks(tasks);
    displayTasks();

    console.log('Task deleted');
  }
}

// Function to update task statistics
function updateTaskStats(tasks) {
  const statsDiv = document.getElementById('task-stats');

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  if (totalTasks === 0) {
    statsDiv.innerHTML = '';
    return;
  }

  const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

  statsDiv.innerHTML = `
    <div class="stat">Total: <strong>${totalTasks}</strong></div>
    <div class="stat">Completed: <strong>${completedTasks}</strong></div>
    <div class="stat">Pending: <strong>${pendingTasks}</strong></div>
    <div class="stat">Progress: <strong>${completionPercentage}%</strong></div>
  `;
}

// Initialize tasks when page loads
displayTasks();
setupTaskForm();

// Theme Management
function initializeTheme() {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('dashboardTheme');

  if (savedTheme === 'dark') {
    document.body.classList.add('theme-dark');
    updateThemeIcon('dark');
  } else {
    updateThemeIcon('light');
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('theme-dark');

  // Save preference
  localStorage.setItem('dashboardTheme', isDark ? 'dark' : 'light');

  // Update icon
  updateThemeIcon(isDark ? 'dark' : 'light');

  console.log('Theme switched to:', isDark ? 'dark' : 'light');
}

function updateThemeIcon(theme) {
  const themeIcon = document.querySelector('.theme-icon');

  if (theme === 'dark') {
    themeIcon.textContent = '☀️'; // Sun for dark mode (to switch to light)
  } else {
    themeIcon.textContent = '🌙'; // Moon for light mode (to switch to dark)
  }
}

function setupThemeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle');

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
}

// Call these when page loads
initializeTheme();
setupThemeToggle();
// ========================================
// NOTES WIDGET
// ========================================

// Simple markdown to HTML converter
function parseMarkdown(text) {
    let html = text
        // Bold: **text** → <strong>text</strong>
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic: *text* → <em>text</em>
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Line breaks
        .replace(/\n/g, '<br>');
    
    return html;
}

// Load notes from localStorage
function loadNotes() {
    const notesJSON = localStorage.getItem('dashboardNotes');
    
    if (notesJSON) {
        return JSON.parse(notesJSON);
    } else {
        return [];
    }
}

// Save notes to localStorage
function saveNotes(notes) {
    localStorage.setItem('dashboardNotes', JSON.stringify(notes));
    console.log('Notes saved:', notes);
}

// Display all notes
function displayNotes() {
    const notes = loadNotes();
    const notesList = document.getElementById('notes-list');
    
    if (notes.length === 0) {
        notesList.innerHTML = '<p class="empty-message">No notes yet. Add one above! 📝</p>';
        return;
    }
    
    notesList.innerHTML = '';
    
    // Display notes in reverse order (newest first)
    notes.reverse().forEach((note, index) => {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        
        const noteDate = new Date(note.date).toLocaleString();
        const noteContent = parseMarkdown(note.text);
        
        noteItem.innerHTML = `
            <div class="note-date">${noteDate}</div>
            <div class="note-content">${noteContent}</div>
            <div class="note-actions">
                <button class="btn-delete" onclick="deleteNote(${notes.length - 1 - index})">Delete</button>
            </div>
        `;
        
        notesList.appendChild(noteItem);
    });
}

// Add a new note
function addNote(noteText) {
    const notes = loadNotes();
    
    const newNote = {
        text: noteText,
        date: new Date().toISOString(),
        id: Date.now()
    };
    
    notes.push(newNote);
    saveNotes(notes);
    displayNotes();
    
    console.log('Note added:', newNote);
}

// Delete a note
function deleteNote(index) {
    const notes = loadNotes();
    
    if (confirm('Delete this note?')) {
        notes.splice(index, 1);
        saveNotes(notes);
        displayNotes();
        console.log('Note deleted');
    }
}

// Set up note form submission
function setupNoteForm() {
    const noteForm = document.getElementById('note-form');
    const noteInput = document.getElementById('note-input');
    
    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const noteText = noteInput.value.trim();
        
        if (noteText) {
            addNote(noteText);
            noteInput.value = '';
            noteInput.focus();
        }
    });
}

// Initialize notes when page loads
displayNotes();
setupNoteForm();