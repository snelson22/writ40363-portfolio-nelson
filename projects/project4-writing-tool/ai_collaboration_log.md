Tools Used:** Which AI assistants did you use? (Claude, ChatGPT, Copilot, etc.)
I used ChatGPT5 and Claude Sonnet 4.5.

Learning Moments:** 3-5 key things AI taught you


Challenges:** What didn't work? When did AI mislead you?
AI was misleading when I wanted to make the CSSmore creative and add modern finishes as it liked to complelty remove code. AI was also misleading when I wanted to connect content across my seperate pages. I found that I had o go in manually to do so especially regarding my word count tracker. 

Process Evolution:** How did your prompting improve over the project?
My prompting became more about copying a small section of code and asking AI to creativly enhance the widget, debug the program, or even begin my app.js. 

One debugging session:
"Ahh — I see EXACTLY why everything is breaking now.
You have two conflicting definitions of the same selector inside your CSS:
❌ Problem
You define:
.header-left h1 { … }
TWICE
— once near the top (inside your upgraded nav styles)
— and again at the very bottom in the MISC section.
Because CSS reads top → bottom, the bottom version overwrites the good version and destroys the alignment, spacing, and sizing of your title."

This was when I allowed AI to have freedom to enhance my CSS and I quickly became annoyed. 


At least one "teach me a concept" conversation:

"Smooth transitions" and how CSS transitions work. It explained:
- How CSS transition timing functions work.
- Why animation might feel abrupt.
- How fade duration impacts perceived smoothness.
This was teaching a foundational CSS animation concept.

.quote-text {
    opacity: 1;
    transition: opacity 0.6s ease-in-out; 
}

function updateQuote() {
    const quoteBox = document.getElementById("quote-text");

    // fade out
    quoteBox.style.opacity = 0;

    setTimeout(() => {
        quoteBox.textContent = getNewQuote();
        // fade back in
        quoteBox.style.opacity = 1;
    }, 600); // matches transition duration
}


At least one code review or refactoring session:

At one point the notes section was causing major bug issues so I asked it what caused the bugs. Then asked it to look into the following:

DOM structure
state management
CSS cascading order
script execution timing
possible selector conflicts
event listener propagation issues