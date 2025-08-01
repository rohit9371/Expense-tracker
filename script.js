// Storage Manager - Handles all localStorage operations
class StorageManager {
    static getExpenses() {
        return JSON.parse(localStorage.getItem('expenses')) || [];
    }

    static saveExpenses(expenses) {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }

    static getMonthlyGoal() {
        return parseFloat(localStorage.getItem('monthlyGoal')) || 0;
    }

    static saveMonthlyGoal(goal) {
        localStorage.setItem('monthlyGoal', goal);
    }

    static getTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    static saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }
}

// Expense Manager - Handles expense CRUD operations
class ExpenseManager {
    constructor() {
        this.expenses = StorageManager.getExpenses();
        this.subcategories = {
            food: ['Vegetables', 'Fruits', 'Dry Fruits', 'Fast Food', 'Restaurant', 'Groceries', 'Beverages'],
            transport: ['Fuel', 'Public Transport', 'Taxi/Cab', 'Maintenance', 'Parking', 'Tolls'],
            entertainment: ['Movies', 'Games', 'Sports', 'Books', 'Music', 'Events', 'Subscriptions'],
            utilities: ['Electricity', 'Water', 'Gas', 'Internet', 'Phone', 'Cable TV'],
            healthcare: ['Medicines', 'Doctor Visit', 'Tests', 'Insurance', 'Dental', 'Gym'],
            other: ['Shopping', 'Gifts', 'Charity', 'Education', 'Travel', 'Miscellaneous']
        };
    }

    addExpense(amount, category, subcategory, date) {
        const expense = {
            id: Date.now(),
            amount: parseFloat(amount),
            category,
            subcategory,
            date,
            timestamp: new Date().toISOString()
        };

        this.expenses.unshift(expense);
        StorageManager.saveExpenses(this.expenses);
        return expense;
    }

    deleteExpense(id) {
        this.expenses = this.expenses.filter(expense => expense.id !== id);
        StorageManager.saveExpenses(this.expenses);
        return this.expenses;
    }

    getExpenses(filterCategory = null) {
        if (!filterCategory) {
            return this.expenses;
        }
        return this.expenses.filter(expense => expense.category === filterCategory);
    }

    getSubcategories(category) {
        return this.subcategories[category] || [];
    }

    refreshExpenses() {
        this.expenses = StorageManager.getExpenses();
    }
}

// UI Manager - Handles DOM manipulation and rendering
class UIManager {
    constructor() {
        this.categoryIcons = {
            food: '🍕',
            transport: '🚗',
            entertainment: '🎬',
            utilities: '💡',
            healthcare: '🏥',
            other: '📦'
        };
    }

    getCategoryIcon(category) {
        return this.categoryIcons[category] || '📦';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    displayExpenses(expenses, filterCategory = null) {
        const expenseList = document.getElementById('expenseList');
        
        if (expenses.length === 0) {
            expenseList.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;">📊</div>
                    <p>${filterCategory ? 'No expenses in this category.' : 'No expenses yet. Add your first expense above!'}</p>
                </div>
            `;
            return;
        }

        expenseList.innerHTML = expenses.map(expense => `
            <div class="expense-item">
                <div class="expense-info">
                    <div class="expense-category">
                        ${this.getCategoryIcon(expense.category)} ${expense.category.toUpperCase()}
                    </div>
                    <div class="expense-subcategory">${expense.subcategory}</div>
                    <div class="expense-date">${this.formatDate(expense.date)}</div>
                </div>
                <div style="display: flex; align-items: center;">
                    <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
                    <button class="delete-btn" onclick="app.deleteExpense(${expense.id})">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateBalance(total) {
        document.getElementById('navTotal').textContent = total.toFixed(2);
    }

    updateSubcategories(category, subcategories) {
        const subcategoryGroup = document.getElementById('subcategoryGroup');
        const subcategorySelect = document.getElementById('subcategory');

        if (category && subcategories.length > 0) {
            subcategoryGroup.classList.add('show');
            subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>' +
                subcategories.map(sub => 
                    `<option value="${sub}">${sub}</option>`
                ).join('');
            subcategorySelect.required = true;
        } else {
            subcategoryGroup.classList.remove('show');
            subcategorySelect.required = false;
        }
    }

    resetForm() {
        document.getElementById('expenseForm').reset();
        document.getElementById('subcategoryGroup').classList.remove('show');
        this.setDefaultDate();
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    showSuccessMessage() {
        const btn = document.querySelector('.btn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Added!';
        btn.style.background = '#27ae60';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = 'var(--gradient)';
        }, 1500);
    }

    displayStats(stats) {
        document.getElementById('totalExpenses').textContent = `₹${stats.total.toFixed(2)}`;
        document.getElementById('avgDaily').textContent = `₹${stats.avgDaily.toFixed(2)}`;
        document.getElementById('topCategory').textContent = stats.topCategory;
        document.getElementById('thisMonth').textContent = `₹${stats.thisMonth.toFixed(2)}`;
    }

    displayCategoryBreakdown(categoryTotals) {
        const breakdown = document.getElementById('categoryBreakdown');
        const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
        
        breakdown.innerHTML = Object.entries(categoryTotals)
            .map(([category, amount]) => {
                const percentage = total > 0 ? (amount / total * 100).toFixed(1) : 0;
                return `
                    <div class="expense-item">
                        <div class="expense-info">
                            <div class="expense-category">${this.getCategoryIcon(category)} ${category.toUpperCase()}</div>
                            <div class="expense-subcategory">${percentage}% of total</div>
                        </div>
                        <div class="expense-amount">₹${amount.toFixed(2)}</div>
                    </div>
                `;
            }).join('');
    }
}

// Stats Calculator - Handles all statistics calculations
class StatsCalculator {
    static calculateStats(expenses) {
        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        // Average daily
        const uniqueDays = new Set(expenses.map(e => e.date)).size;
        const avgDaily = uniqueDays > 0 ? total / uniqueDays : 0;

        // Top category
        const categoryTotals = this.getCategoryTotals(expenses);
        const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a] > categoryTotals[b] ? a : b, 'None');
        const formattedTopCategory = topCategory.charAt(0).toUpperCase() + topCategory.slice(1);

        // This month
        const currentMonth = new Date().toISOString().slice(0, 7);
        const thisMonth = expenses
            .filter(expense => expense.date.startsWith(currentMonth))
            .reduce((sum, expense) => sum + expense.amount, 0);

        return {
            total,
            avgDaily,
            topCategory: formattedTopCategory,
            thisMonth,
            categoryTotals
        };
    }

    static getCategoryTotals(expenses) {
        const categoryTotals = {};
        expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });
        return categoryTotals;
    }

    static getMonthlyTotal(expenses, month = null) {
        const targetMonth = month || new Date().toISOString().slice(0, 7);
        return expenses
            .filter(expense => expense.date.startsWith(targetMonth))
            .reduce((sum, expense) => sum + expense.amount, 0);
    }
}

// Goal Manager - Handles budget goal functionality
class GoalManager {
    constructor() {
        this.monthlyGoal = StorageManager.getMonthlyGoal();
    }

    updateGoal(goal) {
        this.monthlyGoal = parseFloat(goal) || 0;
        StorageManager.saveMonthlyGoal(this.monthlyGoal);
    }

    updateGoalDisplay(expenses) {
        const thisMonthTotal = StatsCalculator.getMonthlyTotal(expenses);
        
        const goalProgress = document.getElementById('goalProgress');
        const goalText = document.getElementById('goalText');
        const monthlyGoalInput = document.getElementById('monthlyGoal');

        if (monthlyGoalInput) {
            monthlyGoalInput.value = this.monthlyGoal || '';
        }

        if (this.monthlyGoal > 0) {
            const percentage = Math.min((thisMonthTotal / this.monthlyGoal) * 100, 100);
            goalProgress.style.width = percentage + '%';
            goalText.textContent = `₹${thisMonthTotal.toFixed(2)} of ₹${this.monthlyGoal.toFixed(2)} (${percentage.toFixed(1)}%)`;
        } else {
            goalProgress.style.width = '0%';
            goalText.textContent = 'Set a monthly budget to track your progress';
        }
    }

    getMonthlyGoal() {
        return this.monthlyGoal;
    }
}

// Theme Manager - Handles theme switching
class ThemeManager {
    constructor() {
        this.currentTheme = StorageManager.getTheme();
        this.loadTheme();
    }

    loadTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        document.getElementById('themeIcon').textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        StorageManager.saveTheme(this.currentTheme);
        document.getElementById('themeIcon').textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
    }
}

// Main Application Class - Coordinates all features
class ExpenseTrackerApp {
    constructor() {
        this.expenseManager = new ExpenseManager();
        this.uiManager = new UIManager();
        this.goalManager = new GoalManager();
        this.themeManager = new ThemeManager();
        this.init();
    }

    init() {
        this.bindEvents();
        this.displayExpenses();
        this.updateBalance();
        this.updateStats();
        this.updateGoalDisplay();
        this.uiManager.setDefaultDate();
    }

    bindEvents() {
        document.getElementById('expenseForm').addEventListener('submit', (e) => this.addExpense(e));
        document.getElementById('categoryFilter').addEventListener('change', (e) => this.filterExpenses(e));
    }

    addExpense(e) {
        e.preventDefault();
        
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        const subcategory = document.getElementById('subcategory').value;
        const date = document.getElementById('date').value;

        this.expenseManager.addExpense(amount, category, subcategory, date);
        this.displayExpenses();
        this.updateBalance();
        this.updateStats();
        this.uiManager.resetForm();
        this.uiManager.showSuccessMessage();
    }

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenseManager.deleteExpense(id);
            this.displayExpenses();
            this.updateBalance();
            this.updateStats();
        }
    }

    filterExpenses(e) {
        const category = e.target.value;
        this.displayExpenses(category === 'all' ? null : category);
    }

    displayExpenses(filterCategory = null) {
        const expenses = this.expenseManager.getExpenses(filterCategory);
        this.uiManager.displayExpenses(expenses, filterCategory);
    }

    updateBalance() {
        const total = this.expenseManager.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        this.uiManager.updateBalance(total);
    }

    updateStats() {
        const stats = StatsCalculator.calculateStats(this.expenseManager.expenses);
        this.uiManager.displayStats(stats);
        this.uiManager.displayCategoryBreakdown(stats.categoryTotals);
    }

    updateGoal() {
        const goal = document.getElementById('monthlyGoal').value;
        this.goalManager.updateGoal(goal);
        this.updateGoalDisplay();
    }

    updateGoalDisplay() {
        this.goalManager.updateGoalDisplay(this.expenseManager.expenses);
    }

    updateSubcategories() {
        const category = document.getElementById('category').value;
        const subcategories = this.expenseManager.getSubcategories(category);
        this.uiManager.updateSubcategories(category, subcategories);
    }

    toggleTheme() {
        this.themeManager.toggleTheme();
    }
}

// Global functions for HTML event handlers
function updateSubcategories() {
    app.updateSubcategories();
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu a').forEach(link => link.classList.remove('active'));
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    document.getElementById(pageId + 'Link').classList.add('active');

    // Update stats when showing stats page
    if (pageId === 'stats') {
        app.updateStats();
    }
    // Update goals when showing goals page
    if (pageId === 'goals') {
        app.updateGoalDisplay();
    }
}

function toggleTheme() {
    app.toggleTheme();
}

function updateGoal() {
    app.updateGoal();
}

// Initialize the app
const app = new ExpenseTrackerApp();
