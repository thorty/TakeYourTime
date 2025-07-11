// Klassen für die App-Logik
class Timer {
    constructor() {
        this.focusTime = 25; // in Minuten
        this.breakTime = 5; // in Minuten
        this.currentTime = 0; // in Sekunden
        this.isRunning = false;
        this.isFocusMode = true;
        this.intervalId = null;
        this.totalTime = 0;
        this.onTick = null;
        this.onComplete = null;
    }

    setFocusTime(minutes) {
        this.focusTime = minutes;
        if (this.isFocusMode && !this.isRunning) {
            this.reset();
        }
    }

    setBreakTime(minutes) {
        this.breakTime = minutes;
        if (!this.isFocusMode && !this.isRunning) {
            this.reset();
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.intervalId = setInterval(() => {
                this.currentTime--;
                if (this.onTick) this.onTick();
                
                if (this.currentTime <= 0) {
                    this.complete();
                }
            }, 1000);
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.intervalId);
        }
    }

    reset() {
        this.pause();
        this.currentTime = (this.isFocusMode ? this.focusTime : this.breakTime) * 60;
        this.totalTime = this.currentTime;
        if (this.onTick) this.onTick();
    }

    complete() {
        this.pause();
        this.isFocusMode = !this.isFocusMode;
        this.reset();
        if (this.onComplete) this.onComplete();
    }

    getFormattedTime() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    getProgress() {
        if (this.totalTime === 0) return 0;
        return ((this.totalTime - this.currentTime) / this.totalTime) * 100;
    }
}

class TodoManager {
    constructor() {
        this.todos = this.loadTodos();
        this.activeTodoId = this.loadActiveTodoId();
        this.nextId = this.getNextId();
    }

    getNextId() {
        // Find the highest existing ID and add 1, or use current timestamp if no todos exist
        if (this.todos.length === 0) {
            return Date.now();
        }
        const maxId = Math.max(...this.todos.map(todo => todo.id));
        return Math.max(maxId + 1, Date.now());
    }

    addTodo(text) {
        const todo = {
            id: this.nextId++,
            text: text.trim(),
            completed: false,
            createdAt: new Date()
        };
        this.todos.push(todo);
        this.saveTodos();
        return todo;
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        if (this.activeTodoId === id) {
            this.activeTodoId = null;
        }
        this.saveTodos();
        this.saveActiveTodoId();
    }

    setActiveTodo(id) {
        this.activeTodoId = id;
        this.saveActiveTodoId();
    }

    getActiveTodo() {
        return this.todos.find(todo => todo.id === this.activeTodoId);
    }

    getAllTodos() {
        return this.todos;
    }

    clearAllTodos() {
        this.todos = [];
        this.activeTodoId = null;
        this.nextId = Date.now();
        this.saveTodos();
        this.saveActiveTodoId();
    }

    saveTodos() {
        localStorage.setItem('focusapp_todos', JSON.stringify(this.todos));
    }

    loadTodos() {
        const stored = localStorage.getItem('focusapp_todos');
        return stored ? JSON.parse(stored) : [];
    }

    saveActiveTodoId() {
        localStorage.setItem('focusapp_active_todo', this.activeTodoId || '');
    }

    loadActiveTodoId() {
        const stored = localStorage.getItem('focusapp_active_todo');
        return stored ? parseInt(stored) : null;
    }
}

class MotivationManager {
    constructor() {
        this.motivationalQuotes = [
            "💪 Ready for productive work? Let's get started! 💪",
            "🚀 Focus is the key to success! 🚀",            
            "🎯 Stay focused, you've got this! 🎯",
            "🌟 Great things happen through small steps! 🌟",
            "🔥 Your concentration is your superpower! 🔥",
            "💎 Quality takes time and focus! 💎",            
            "🌈 After focus comes the reward! 🌈",
            "⭐ You are stronger than your distractions! ⭐",            
            "🎨 Creativity requires concentration! 🎨",                        
            "🎵 Find your work rhythm! 🎵"
        ];
        this.currentQuoteIndex = 0;
    }

    getRandomQuote() {
        const randomIndex = Math.floor(Math.random() * this.motivationalQuotes.length);
        return this.motivationalQuotes[randomIndex];
    }

    getNextQuote() {
        this.currentQuoteIndex = (this.currentQuoteIndex + 1) % this.motivationalQuotes.length;
        return this.motivationalQuotes[this.currentQuoteIndex];
    }
}

// Haupt-App-Klasse
class FocusApp {
    constructor() {
        this.timer = new Timer();
        this.todoManager = new TodoManager();
        this.motivationManager = new MotivationManager();
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadSettings();
        this.updateUI();
        this.startMotivationCycle();
    }

    initializeElements() {
        // Timer Elements
        this.timerText = document.getElementById('timerText');
        this.timerLabel = document.getElementById('timerLabel');
        this.activeTodo = document.getElementById('activeTodo');
        this.activeTodoText = document.getElementById('activeTodoText');
        this.progressFill = document.getElementById('progressFill');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Settings Elements
        this.focusTimeInput = document.getElementById('focusTime');
        this.breakTimeInput = document.getElementById('breakTime');
        
        // Todo Elements
        this.todoInput = document.getElementById('todoInput');
        this.addTodoBtn = document.getElementById('addTodoBtn');
        this.exportTodosBtn = document.getElementById('exportTodosBtn');
        this.importTodosBtn = document.getElementById('importTodosBtn');
        this.todoList = document.getElementById('todoList');
        
        // Motivation Element
        this.motivationText = document.getElementById('motivationText');
    }

    initializeEventListeners() {
        // Timer Callbacks
        this.timer.onTick = () => this.updateTimerDisplay();
        this.timer.onComplete = () => this.handleTimerComplete();
        
        // Timer Controls
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        
        // Settings
        this.focusTimeInput.addEventListener('change', () => this.updateFocusTime());
        this.breakTimeInput.addEventListener('change', () => this.updateBreakTime());
        
        // Todo Management
        this.addTodoBtn.addEventListener('click', () => this.addTodo());
        this.exportTodosBtn.addEventListener('click', () => this.exportTodos());
        this.importTodosBtn.addEventListener('click', () => this.importTodos());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });
    }

    loadSettings() {
        const focusTime = localStorage.getItem('focusapp_focus_time');
        const breakTime = localStorage.getItem('focusapp_break_time');
        
        if (focusTime) {
            this.focusTimeInput.value = focusTime;
            this.timer.setFocusTime(parseInt(focusTime));
        }
        
        if (breakTime) {
            this.breakTimeInput.value = breakTime;
            this.timer.setBreakTime(parseInt(breakTime));
        }
        
        this.timer.reset();
    }

    updateFocusTime() {
        const value = parseInt(this.focusTimeInput.value);
        if (value >= 1 && value <= 120) {
            this.timer.setFocusTime(value);
            localStorage.setItem('focusapp_focus_time', value);
        }
    }

    updateBreakTime() {
        const value = parseInt(this.breakTimeInput.value);
        if (value >= 1 && value <= 60) {
            this.timer.setBreakTime(value);
            localStorage.setItem('focusapp_break_time', value);
        }
    }

    startTimer() {
        this.timer.start();
        this.setRandomProgressBarColor();
        this.updateTimerControls();
    }

    pauseTimer() {
        this.timer.pause();
        this.updateTimerControls();
    }

    resetTimer() {
        this.timer.reset();
        this.updateTimerControls();
        this.updateTimerDisplay();
    }

    setRandomProgressBarColor() {
        const colors = [
            ['#FF6B6B', '#E55353'], // Coral Red
            ['#4ECDC4', '#45B7AA'], // Turquoise
            ['#45B7D1', '#3A9BC1'], // Sky Blue
            ['#96CEB4', '#7FB69A'], // Mint Green
            ['#FFEAA7', '#F1C40F'], // Sunny Yellow
            ['#DDA0DD', '#C39BD3'], // Plum
            ['#FFB347', '#FF9A3C'], // Peach
            ['#87CEEB', '#6BB6D6'], // Light Sky Blue
            ['#98D8C8', '#7FCABC'], // Mint
            ['#FFA07A', '#FF8C69']  // Light Salmon
        ];
        
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        this.progressFill.style.background = `linear-gradient(90deg, ${randomColor[0]}, ${randomColor[1]})`;
    }

    updateTimerControls() {
        this.startBtn.disabled = this.timer.isRunning;
        this.pauseBtn.disabled = !this.timer.isRunning;
    }

    updateTimerDisplay() {
        this.timerText.textContent = this.timer.getFormattedTime();
        this.progressFill.style.width = `${this.timer.getProgress()}%`;
        
        // Update background based on timer mode
        this.updateBackground();
        
        // Update timer label and active todo display
        const activeTodo = this.todoManager.getActiveTodo();
        if (activeTodo) {
            this.timerLabel.style.display = 'none';
            this.activeTodo.style.display = 'block';
            this.activeTodoText.textContent = `🎯 ${activeTodo.text}`;
        } else {
            this.timerLabel.style.display = 'block';
            this.timerLabel.textContent = this.timer.isFocusMode ? 'FOCUS TIME' : 'BREAK TIME';
            this.activeTodo.style.display = 'none';
        }
    }

    updateBackground() {
        const body = document.body;
        if (this.timer.isFocusMode) {
            body.classList.remove('break-mode');
        } else {
            body.classList.add('break-mode');
        }
    }

    handleTimerComplete() {
        this.updateTimerControls();
        this.updateTimerDisplay();
        
        // Zeige Benachrichtigung
        const message = this.timer.isFocusMode ? 
            '🎉 Break is over! Back to work!' : 
            '⏰ Focus time is up! Time for a break!';
        
        this.showNotification(message);
        
        // Spiele einen Sound (falls verfügbar)
        this.playNotificationSound();
        
        // Aktualisiere Motivation
        this.updateMotivation();
    }

    showNotification(message) {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('Time Taker', {
                    body: message,
                    icon: '🎯'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification('Time Taker', {
                            body: message,
                            icon: '🎯'
                        });
                    }
                });
            }
        }
        
        // Fallback: Alert
        alert(message);
    }

    playNotificationSound() {
        // Einfacher Web Audio API Sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio nicht verfügbar');
        }
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (text) {
            this.todoManager.addTodo(text);
            this.todoInput.value = '';
            this.updateTodoList();
        }
    }

    deleteTodo(id) {
        this.todoManager.deleteTodo(id);
        this.updateTodoList();
    }

    setActiveTodo(id) {
        this.todoManager.setActiveTodo(id);
        this.updateTodoList();
        this.updateTimerDisplay();
    }

    deactivateTodo() {
        this.todoManager.setActiveTodo(null);
        this.updateTodoList();
        this.updateTimerDisplay();
    }

    exportTodos() {
        const todos = this.todoManager.getAllTodos();
        
        if (todos.length === 0) {
            alert('No todos to export!');
            return;
        }
        
        // Create simple markdown content with just the todos
        let markdownContent = '';
        todos.forEach(todo => {
            markdownContent += `- ${todo.text}\n`;
        });
        
        // Create and download file
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `todos-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        alert(`Successfully exported ${todos.length} todos to markdown file!`);
    }

    importTodos() {
        // Create file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.md,.txt';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                this.parseAndImportTodos(content);
            };
            reader.readAsText(file);
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    parseAndImportTodos(content) {
        const lines = content.split('\n');
        const todos = [];
        
        // Parse content to extract todos
        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            // Skip empty lines and lines that look like metadata
            if (!trimmedLine || 
                trimmedLine.startsWith('#') || 
                trimmedLine.startsWith('*') || 
                trimmedLine.startsWith('---') ||
                trimmedLine.toLowerCase().includes('exported') ||
                trimmedLine.toLowerCase().includes('generated') ||
                trimmedLine.toLowerCase().includes('total todos')) {
                return;
            }
            
            // Match bullet points (- Todo text)
            const bulletMatch = trimmedLine.match(/^-\s+(.+)$/);
            if (bulletMatch) {
                const todoText = bulletMatch[1].trim();
                // Remove any markdown formatting like **bold** or emojis at the start
                const cleanText = todoText.replace(/^\*\*|\*\*$/g, '').replace(/^🎯\s+/, '').replace(/\s+⭐$/, '');
                if (cleanText) {
                    todos.push(cleanText);
                }
                return;
            }
            
            // Match numbered list items (1. Todo text)
            const numberedMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
            if (numberedMatch) {
                const todoText = numberedMatch[1].trim();
                // Remove any markdown formatting and indicators
                const cleanText = todoText.replace(/^\*\*|\*\*$/g, '').replace(/^🎯\s+/, '').replace(/\s+⭐$/, '');
                if (cleanText) {
                    todos.push(cleanText);
                }
                return;
            }
            
            // If it's just plain text that doesn't look like metadata, treat it as a todo
            if (trimmedLine.length > 0 && 
                !trimmedLine.match(/^(todo|list|export|import|generated|total|currently|active)/i)) {
                todos.push(trimmedLine);
            }
        });
        
        if (todos.length === 0) {
            alert('No todos found in the file! Please make sure your file contains todos in bullet points (- Todo text) or numbered lists (1. Todo text).');
            return;
        }
        
        // Ask user if they want to replace existing todos or append
        const existingTodos = this.todoManager.getAllTodos();
        let shouldReplace = false;
        
        if (existingTodos.length > 0) {
            shouldReplace = confirm(`You have ${existingTodos.length} existing todos. Click OK to replace them, or Cancel to add the imported todos to your existing list.`);
        }
        
        if (shouldReplace) {
            // Clear existing todos
            this.todoManager.clearAllTodos();
        }
        
        // Add imported todos
        let importedCount = 0;
        todos.forEach(todoText => {
            if (todoText.length > 0) {
                this.todoManager.addTodo(todoText);
                importedCount++;
            }
        });
        
        // Update display
        this.updateTodoList();
        this.updateActiveTodoDisplay();
        
        // Show success message
        const action = shouldReplace ? 'replaced' : 'imported';
        alert(`Successfully ${action} ${importedCount} todos!`);
    }

    updateTodoList() {
        const todos = this.todoManager.getAllTodos();
        const activeTodoId = this.todoManager.activeTodoId;
        
        this.todoList.innerHTML = '';
        
        // Aktives Todo zuerst anzeigen
        const activeTodo = todos.find(todo => todo.id === activeTodoId);
        if (activeTodo) {
            this.createTodoElement(activeTodo, true);
        }
        
        // Dann alle anderen Todos
        todos.filter(todo => todo.id !== activeTodoId).forEach(todo => {
            this.createTodoElement(todo, false);
        });
    }

    createTodoElement(todo, isActive) {
        const todoElement = document.createElement('div');
        todoElement.className = `todo-item ${isActive ? 'active' : ''}`;
        
        todoElement.innerHTML = `
            <span class="todo-text">${todo.text}</span>
            <div class="todo-actions">
                ${!isActive ? `<button class="todo-btn activate" onclick="app.setActiveTodo(${todo.id})">Active</button>` : 
                              `<button class="todo-btn deactivate" onclick="app.deactivateTodo()">Deactivate</button>`}
                <button class="todo-btn delete" onclick="app.deleteTodo(${todo.id})">Delete</button>
            </div>
        `;
        
        this.todoList.appendChild(todoElement);
    }

    updateMotivation() {
        this.motivationText.textContent = this.motivationManager.getRandomQuote();
    }

    startMotivationCycle() {
        // Wechsle alle 30 Sekunden das Motivationszitat
        setInterval(() => {
            this.updateMotivation();
        }, 30000);
    }

    updateUI() {
        this.updateTimerDisplay();
        this.updateTimerControls();
        this.updateTodoList();
        this.updateMotivation();
    }
}

// App initialisieren wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FocusApp();
    
    // Benachrichtigungen aktivieren
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});
