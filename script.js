// Storage Management Class
class StorageManager {
    constructor() {
        this.storageKey = 'expenseTracker';
    }

    save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    load(key, defaultValue = null) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    }

    saveExpenses(expenses) {
        this.save('expenses', expenses);
    }

    loadExpenses() {
        return this.load('expenses', []);
    }

    saveMonthlyGoal(goal) {
        this.save('monthlyGoal', goal);
    }

    loadMonthlyGoal() {
        return this.load('monthlyGoal', 0);
    }

    saveTheme(theme) {
        this.save('theme', theme);
    }

    loadTheme() {
        return this.load('theme', 'light');
    }
}

// Theme Management Class
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.init();
    }

    init() {
        this.currentTheme = storageManager.loadTheme();
        this.applyTheme();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        document.getElementById('themeIcon').textContent = 
            this.currentTheme === 'dark' ? '☀️' : '🌙';
    }

    toggle() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        storageManager.saveTheme(this.currentTheme);
    }
}

// Expense Data Management Class
class ExpenseDataManager {
    constructor() {
        this.expenses = storageManager.loadExpenses();
        this.subcategories = {
            food: ['Vegetables', 'Fruits', 'Dry Fruits', 'Fast Food', 'Restaurant', 'Groceries', 'Beverages'],
            transport: ['Fuel', 'Public Transport', 'Taxi/Cab', 'Maintenance', 'Parking', 'Tolls'],
            entertainment: ['Movies', 'Games', 'Sports', 'Books', 'Music', 'Events', 'Subscriptions'],
            utilities: ['Electricity', 'Water', 'Gas', 'Internet', 'Phone', 'Cable TV'],
            healthcare: ['Medicines', 'Doctor Visit', 'Tests', 'Insurance', 'Dental', 'Gym'],
            other: ['Shopping', 'Gifts', 'Charity', 'Education', 'Travel', 'Miscellaneous']
        };
    }

    addExpense(expenseData) {
        const expense = {
            id: Date.now(),
            ...expenseData,
            timestamp: new Date().toISOString()
        };
        this.expenses.unshift(expense);
        this.save();
        return expense;
    }

    deleteExpense(id) {
        this.expenses = this.expenses.filter(expense => expense.id !== id);
        this.save();
    }

    getExpenses(filterCategory = null) {
        if (filterCategory) {
            return this.expenses.filter(expense => expense.category === filterCategory);
        }
        return this.expenses;
    }

    getTotalExpenses() {
        return this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    }

    getCategoryTotals() {
        const categoryTotals = {};
        this.expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });
        return categoryTotals;
    }

    getThisMonthTotal() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        return this.expenses
            .filter(expense => expense.date.startsWith(currentMonth))
            .reduce((sum, expense) => sum + expense.amount, 0);
    }

    getAverageDaily() {
        const total = this.getTotalExpenses();
        const uniqueDays = new Set(this.expenses.map(e => e.date)).size;
        return uniqueDays > 0 ? total / uniqueDays : 0;
    }

    getTopCategory() {
        const categoryTotals = this.getCategoryTotals();
        if (Object.keys(categoryTotals).length === 0) return 'None';
        
        return Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a] > categoryTotals[b] ? a : b);
    }

    save() {
        storageManager.saveExpenses(this.expenses);
    }

    getSubcategories(category) {
        return this.subcategories[category] || [];
    }
}

// UI Management Class
class UIManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.setDefaultDate();
    }

    bindEvents() {
        document.getElementById('expenseForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        document.getElementById('categoryFilter').addEventListener('change', (e) => this.handleFilterChange(e));
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            subcategory: document.getElementById('subcategory').value,
            date: document.getElementById('date').value
        };

        expenseManager.addExpense(formData);
        this.updateAllDisplays();
        this.resetForm();
        this.showSuccessMessage();
    }

    handleFilterChange(e) {
        const category = e.target.value;
        this.displayExpenses(category === 'all' ? null : category);
    }

    displayExpenses(filterCategory = null) {
        const expenseList = document.getElementById('expenseList');
        const expensesToShow = expenseManager.getExpenses(filterCategory);

        if (expensesToShow.length === 0) {
            expenseList.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;">📊</div>
                    <p>${filterCategory ? 'No expenses in this category.' : 'No expenses yet. Add your first expense above!'}</p>
                </div>
            `;
            return;
        }

        expenseList.innerHTML = expensesToShow.map(expense => `
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
                    <button class="delete-btn" onclick="uiManager.deleteExpense(${expense.id})">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    getCategoryIcon(category) {
        const icons = {
            food: '🍕',
            transport: '🚗',
            entertainment: '🎬',
            utilities: '💡',
            healthcare: '🏥',
            other: '📦'
        };
        return icons[category] || '📦';
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

    updateBalance() {
        const total = expenseManager.getTotalExpenses();
        document.getElementById('navTotal').textContent = total.toFixed(2);
    }

    updateStats() {
        const total = expenseManager.getTotalExpenses();
        document.getElementById('totalExpenses').textContent = `₹${total.toFixed(2)}`;

        const avgDaily = expenseManager.getAverageDaily();
        document.getElementById('avgDaily').textContent = `₹${avgDaily.toFixed(2)}`;

        const topCategory = expenseManager.getTopCategory();
        document.getElementById('topCategory').textContent = 
            topCategory.charAt(0).toUpperCase() + topCategory.slice(1);

        const thisMonthTotal = expenseManager.getThisMonthTotal();
        document.getElementById('thisMonth').textContent = `₹${thisMonthTotal.toFixed(2)}`;

        this.updateCategoryBreakdown();
    }

    updateCategoryBreakdown() {
        const breakdown = document.getElementById('categoryBreakdown');
        const categoryTotals = expenseManager.getCategoryTotals();
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

    updateAllDisplays() {
        this.displayExpenses();
        this.updateBalance();
        this.updateStats();
        goalManager.updateGoalDisplay();
    }

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            expenseManager.deleteExpense(id);
            this.updateAllDisplays();
        }
    }

    resetForm() {
        document.getElementById('expenseForm').reset();
        document.getElementById('subcategoryGroup').classList.remove('show');
        this.setDefaultDate();
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
}

// Goal Management Class
class GoalManager {
    constructor() {
        this.monthlyGoal = storageManager.loadMonthlyGoal();
    }

    updateGoal() {
        const goal = parseFloat(document.getElementById('monthlyGoal').value) || 0;
        this.monthlyGoal = goal;
        storageManager.saveMonthlyGoal(goal);
        this.updateGoalDisplay();
    }

    updateGoalDisplay() {
        const thisMonthTotal = expenseManager.getThisMonthTotal();
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
}

// Navigation Management Class
class NavigationManager {
    static showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.querySelectorAll('.sidebar-menu a').forEach(link => link.classList.remove('active'));
        
        // Show selected page
        document.getElementById(pageId).classList.add('active');
        document.getElementById(pageId + 'Link').classList.add('active');

        // Update stats when showing stats page
        if (pageId === 'stats') {
            uiManager.updateStats();
        }
        // Update goals when showing goals page
        if (pageId === 'goals') {
            goalManager.updateGoalDisplay();
        }
    }
}

// Utility Functions
function updateSubcategories() {
    const category = document.getElementById('category').value;
    const subcategoryGroup = document.getElementById('subcategoryGroup');
    const subcategorySelect = document.getElementById('subcategory');

    if (category && expenseManager.getSubcategories(category).length > 0) {
        subcategoryGroup.classList.add('show');
        subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>' +
            expenseManager.getSubcategories(category).map(sub => 
                `<option value="${sub}">${sub}</option>`
            ).join('');
        subcategorySelect.required = true;
    } else {
        subcategoryGroup.classList.remove('show');
        subcategorySelect.required = false;
    }
}

function showPage(pageId) {
    NavigationManager.showPage(pageId);
}

function toggleTheme() {
    themeManager.toggle();
}

function updateGoal() {
    goalManager.updateGoal();
}

// Initialize all managers
const storageManager = new StorageManager();
const themeManager = new ThemeManager();
const expenseManager = new ExpenseDataManager();
const uiManager = new UIManager();
const goalManager = new GoalManager();

// Initialize the app
uiManager.updateAllDisplays();
