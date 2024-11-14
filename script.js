class SudokuGame {
    constructor() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.selectedCell = null;
        this.initializeDOM();
        this.setupEventListeners();
        this.newGame();
    }

    initializeDOM() {
        this.boardElement = document.getElementById('board');
        this.statusElement = document.getElementById('status');
        this.createBoard();
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

    setupEventListeners() {
        // Board cell clicks
        this.boardElement.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;
            
            this.selectCell(cell);
        });

        // Number pad clicks
        document.querySelectorAll('.num-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (!this.selectedCell) return;
                
                const value = button.textContent;
                if (value === '❌') {
                    this.setNumber(0);
                } else {
                    this.setNumber(parseInt(value));
                }
            });
        });

        // Game controls
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('solve').addEventListener('click', () => this.solvePuzzle());
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
        
        this.board[row][col] = num;
        this.selectedCell.textContent = num || '';
        this.selectedCell.classList.remove('invalid');
        
        if (num !== 0 && !this.isValidMove(row, col, num)) {
            this.selectedCell.classList.add('invalid');
        }
        
        if (this.isBoardFull() && this.isBoardValid()) {
            this.showStatus('Congratulations! You solved the puzzle! 🎉');
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
        // Initialize a solved board
        this.solveSudoku(this.solution);
        
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

    solveSudoku(board) {
        const empty = this.findEmpty(board);
        if (!empty) return true;
        
        const [row, col] = empty;
        
        for (let num = 1; num <= 9; num++) {
            if (this.isValidMove(row, col, num)) {
                board[row][col] = num;
                
                if (this.solveSudoku(board)) {
                    return true;
                }
                
                board[row][col] = 0;
            }
        }
        
        return false;
    }

    findEmpty(board) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) return [i, j];
            }
        }
        return null;
    }

    newGame() {
        const difficulty = document.getElementById('difficulty').value;
        this.generatePuzzle(difficulty);
        this.updateBoardDisplay();
        this.showStatus('New game started! Good luck! 🍀');
    }

    solvePuzzle() {
        this.board = this.solution.map(row => [...row]);
        this.updateBoardDisplay();
        this.showStatus('Puzzle solved! Try another one! 🎯');
    }

    updateBoardDisplay() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = this.board[row][col];
            
            cell.textContent = value || '';
            cell.classList.remove('selected', 'invalid');
            
            if (value !== 0) {
                cell.classList.add('given');
            } else {
                cell.classList.remove('given');
            }
        });
    }

    showStatus(message) {
        this.statusElement.textContent = message;
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new SudokuGame();
});
