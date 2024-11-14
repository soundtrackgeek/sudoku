class SudokuGame {
    constructor() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.selectedCell = null;
        this.numberCounts = Array(10).fill(0);
        this.timerInterval = null;
        this.seconds = 0;
        this.leaderboard = this.loadLeaderboard();
        this.initializeDOM();
        this.setupEventListeners();
        this.newGame();
    }

    initializeDOM() {
        this.boardElement = document.getElementById('board');
        this.statusElement = document.getElementById('status');
        this.timerElement = document.getElementById('timer');
        this.namePopup = document.getElementById('name-popup');
        this.leaderboardPopup = document.getElementById('leaderboard-popup');
        this.createBoard();
    }

    setupEventListeners() {
        // Board cell clicks
        this.boardElement.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;
            
            this.selectCell(cell);
        });

        // Number pad clicks
        document.querySelectorAll('.num-btn').forEach(button => {
            // Skip if it's the erase button
            if (button.classList.contains('erase')) {
                button.addEventListener('click', () => {
                    if (!this.selectedCell) return;
                    this.setNumber(0);
                });
                return;
            }
            
            // Add data-number attribute and count display
            const number = parseInt(button.textContent);
            button.setAttribute('data-number', number);
            
            // Add count display
            const countSpan = document.createElement('span');
            countSpan.className = 'count';
            countSpan.textContent = '9';
            button.appendChild(countSpan);
            
            button.addEventListener('click', () => {
                if (!this.selectedCell || button.disabled) return;
                this.setNumber(number);
            });
        });

        // Game controls
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('solve').addEventListener('click', () => this.solvePuzzle());
        
        // Leaderboard controls
        document.getElementById('show-leaderboard').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('close-leaderboard').addEventListener('click', () => this.hideLeaderboard());
        document.getElementById('submit-score').addEventListener('click', () => this.submitScore());
        
        // Leaderboard tabs
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.displayLeaderboard(e.target.dataset.difficulty);
            });
        });
    }

    selectCell(cell) {
        document.querySelectorAll('.cell').forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');
        this.selectedCell = cell;
    }

    setNumber(num) {
        if (!this.selectedCell) return;
        
        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);
        
        if (this.selectedCell.classList.contains('given')) return;
        
        // Decrease count for previous number if it existed
        const previousNum = this.board[row][col];
        if (previousNum !== 0) {
            this.numberCounts[previousNum]--;
            this.updateNumberButton(previousNum);
        }
        
        // Increase count for new number
        if (num !== 0) {
            this.numberCounts[num]++;
            this.updateNumberButton(num);
        }
        
        this.board[row][col] = num;
        this.selectedCell.textContent = num || '';
        this.selectedCell.classList.remove('invalid');
        
        if (num !== 0 && !this.isValidMove(row, col, num)) {
            this.selectedCell.classList.add('invalid');
        }
        
        if (this.isBoardFull() && this.isBoardValid()) {
            this.stopTimer();
            this.showStatus(`Congratulations! You solved the puzzle in ${this.formatTime(this.seconds)}! 🎉`);
            this.showNamePopup();
        }
    }

    updateNumberButton(num) {
        if (num === 0) return;
        
        const button = document.querySelector(`.num-btn[data-number="${num}"]`);
        if (!button) return;
        
        if (this.numberCounts[num] >= 9) {
            button.classList.add('completed');
            button.disabled = true;
        } else {
            button.classList.remove('completed');
            button.disabled = false;
        }
        
        // Update the count display
        const countSpan = button.querySelector('.count');
        if (countSpan) {
            countSpan.textContent = 9 - this.numberCounts[num];
        }
    }

    isValidMove(row, col, num) {
        // Check row
        for (let i = 0; i < 9; i++) {
            if (i !== col && this.board[row][i] === num) return false;
        }
        
        // Check column
        for (let i = 0; i < 9; i++) {
            if (i !== row && this.board[i][col] === num) return false;
        }
        
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = boxRow; i < boxRow + 3; i++) {
            for (let j = boxCol; j < boxCol + 3; j++) {
                if (i !== row && j !== col && this.board[i][j] === num) return false;
            }
        }
        
        return true;
    }

    isBoardFull() {
        return this.board.every(row => row.every(cell => cell !== 0));
    }

    isBoardValid() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const num = this.board[i][j];
                if (num !== 0) {
                    this.board[i][j] = 0;
                    if (!this.isValidMove(i, j, num)) {
                        this.board[i][j] = num;
                        return false;
                    }
                    this.board[i][j] = num;
                }
            }
        }
        return true;
    }

    generatePuzzle(difficulty) {
        // Clear the boards
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        
        // Generate a valid solved board
        this.generateSolvedBoard();
        
        // Copy solution to current board
        this.board = this.solution.map(row => [...row]);
        
        // Remove numbers based on difficulty
        const cellsToRemove = {
            'easy': 40,
            'medium': 50,
            'hard': 60
        }[difficulty];

        let removed = 0;
        while (removed < cellsToRemove) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            
            if (this.board[row][col] !== 0) {
                this.board[row][col] = 0;
                removed++;
            }
        }
    }

    generateSolvedBoard() {
        // Fill diagonal 3x3 boxes first (they are independent of each other)
        for (let i = 0; i < 9; i += 3) {
            this.fillBox(i, i);
        }
        
        // Fill the rest of the board
        this.solveSudoku(this.solution);
    }

    fillBox(row, col) {
        const numbers = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        let index = 0;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                this.solution[row + i][col + j] = numbers[index];
                index++;
            }
        }
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    solveSudoku(board) {
        const empty = this.findEmpty(board);
        if (!empty) return true;
        
        const [row, col] = empty;
        const numbers = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        
        for (let num of numbers) {
            if (this.isValidPlacement(board, row, col, num)) {
                board[row][col] = num;
                
                if (this.solveSudoku(board)) {
                    return true;
                }
                
                board[row][col] = 0;
            }
        }
        
        return false;
    }

    isValidPlacement(board, row, col, num) {
        // Check row
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) return false;
        }
        
        // Check column
        for (let i = 0; i < 9; i++) {
            if (board[i][col] === num) return false;
        }
        
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }
        
        return true;
    }

    findEmpty(board) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) return [i, j];
            }
        }
        return null;
    }

    startTimer() {
        // Clear any existing timer
        this.stopTimer();
        this.seconds = 0;
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.seconds++;
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerElement.classList.add('paused');
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.seconds / 60);
        const remainingSeconds = this.seconds % 60;
        this.timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        this.timerElement.classList.remove('paused');
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    newGame() {
        const difficulty = document.getElementById('difficulty').value;
        // Reset number counts
        this.numberCounts = Array(10).fill(0);
        this.generatePuzzle(difficulty);
        this.updateBoardDisplay();
        this.startTimer();
        this.showStatus('New game started! Good luck! 🍀');
    }

    solvePuzzle() {
        this.board = this.solution.map(row => [...row]);
        this.updateBoardDisplay();
        this.stopTimer();
        this.showStatus('Puzzle solved! Try another one! 🎯');
    }

    updateBoardDisplay() {
        const cells = document.querySelectorAll('.cell');
        // Reset number counts
        this.numberCounts = Array(10).fill(0);
        
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = this.board[row][col];
            
            cell.textContent = value || '';
            cell.classList.remove('selected', 'invalid');
            
            if (value !== 0) {
                cell.classList.add('given');
                this.numberCounts[value]++;
            } else {
                cell.classList.remove('given');
            }
        });
        
        // Update all number buttons
        for (let i = 1; i <= 9; i++) {
            this.updateNumberButton(i);
        }
    }

    showStatus(message) {
        this.statusElement.textContent = message;
    }

    loadLeaderboard() {
        const saved = localStorage.getItem('sudokuLeaderboard');
        return saved ? JSON.parse(saved) : {
            easy: [],
            medium: [],
            hard: []
        };
    }

    saveLeaderboard() {
        localStorage.setItem('sudokuLeaderboard', JSON.stringify(this.leaderboard));
    }

    showNamePopup() {
        const difficulty = document.getElementById('difficulty').value;
        const completionMessage = document.getElementById('completion-message');
        completionMessage.textContent = `You completed the ${difficulty} puzzle in ${this.formatTime(this.seconds)}!`;
        this.namePopup.classList.add('active');
        document.getElementById('player-name').focus();
    }

    hideNamePopup() {
        this.namePopup.classList.remove('active');
        document.getElementById('player-name').value = '';
    }

    showLeaderboard() {
        this.leaderboardPopup.classList.add('active');
        const activeTab = document.querySelector('.tab-btn.active');
        this.displayLeaderboard(activeTab.dataset.difficulty);
    }

    hideLeaderboard() {
        this.leaderboardPopup.classList.remove('active');
    }

    submitScore() {
        const name = document.getElementById('player-name').value.trim();
        if (!name) {
            alert('Please enter your name!');
            return;
        }

        const difficulty = document.getElementById('difficulty').value;
        const score = {
            name,
            time: this.seconds,
            date: new Date().toISOString()
        };

        this.leaderboard[difficulty].push(score);
        this.leaderboard[difficulty].sort((a, b) => a.time - b.time);
        this.leaderboard[difficulty] = this.leaderboard[difficulty].slice(0, 10); // Keep top 10
        
        this.saveLeaderboard();
        this.hideNamePopup();
        this.showLeaderboard();
    }

    displayLeaderboard(difficulty) {
        const leaderboardList = document.querySelector('.leaderboard-list');
        const scores = this.leaderboard[difficulty];
        
        leaderboardList.innerHTML = scores.length ? scores.map((score, index) => `
            <div class="leaderboard-entry">
                <div class="rank">${index + 1}</div>
                <div class="name">${score.name}</div>
                <div class="time">${this.formatTime(score.time)}</div>
            </div>
        `).join('') : '<div class="no-scores">No scores yet!</div>';
    }

    createBoard() {
        this.boardElement.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = i;
                cell.dataset.col = j;
                this.boardElement.appendChild(cell);
            }
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new SudokuGame();
});
