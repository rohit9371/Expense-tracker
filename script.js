class ExpenseTracker {
    constructor() {
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.monthlyGoal = parseFloat(localStorage.getItem('monthlyGoal')) || 0;
        this.subcategories = {
            food: ['Vegetables', 'Fruits', 'Dry Fruits', 'Fast Food', 'Restaurant', 'Groceries', 'Beverages'],
            transport: ['Fuel', 'Public Transport', 'Taxi/Cab', 'Maintenance', 'Parking', 'Tolls'],
            entertainment: ['Movies', 'Games', 'Sports', 'Books', 'Music', 'Events', 'Subscriptions'],
            utilities: ['Electricity', 'Water', 'Gas', 'Internet', 'Phone', 'Cable TV'],
            healthcare: ['Medicines', 'Doctor Visit', 'Tests', 'Insurance', 'Dental', 'Gym'],
            other: ['Shopping', 'Gifts', 'Charity', 'Education', 'Travel', 'Miscellaneous']
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.displayExpenses();
        this.updateBalance();
        this.updateStats();
        this.updateGoalDisplay();
        this.setDefaultDate();
        this.loadTheme();
    }

    bindEvents() {
        document.getElementById('expenseForm').addEventListener('submit', (e) => this.addExpense(e));
        document.getElementById('categoryFilter').addEventListener('change', (e) => this.filterExpenses(e));
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    loadTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        document.getElementById('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    addExpense(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const subcategory = document.getElementById('subcategory').value;
        const date = document.getElementById('date').value;

        const expense = {
            id: Date.now(),
            amount,
            category,
            subcategory,
            date,
            timestamp: new Date().toISOString()
        };

        this.expenses.unshift(expense);
        this.saveToStorage();
        this.displayExpenses();
        this.updateBalance();
        this.updateStats();
        this.resetForm();
        this.showSuccessMessage();
    }

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(expense => expense.id !== id);
            this.saveToStorage();
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
        const expenseList = document.getElementById('expenseList');
        let expensesToShow = this.expenses;

        if (filterCategory) {
            expensesToShow = this.expenses.filter(expense => expense.category === filterCategory);
        }

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
                    <button class="delete-btn" onclick="tracker.deleteExpense(${expense.id})">
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
        const total = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        document.getElementById('navTotal').textContent = total.toFixed(2);
    }

    updateStats() {
        const total = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        document.getElementById('totalExpenses').textContent = `₹${total.toFixed(2)}`;

        // Average daily
        const uniqueDays = new Set(this.expenses.map(e => e.date)).size;
        const avgDaily = uniqueDays > 0 ? total / uniqueDays : 0;
        document.getElementById('avgDaily').textContent = `₹${avgDaily.toFixed(2)}`;

        // Top category
        const categoryTotals = {};
        this.expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });
        const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a] > categoryTotals[b] ? a : b, 'None');
        document.getElementById('topCategory').textContent = topCategory.charAt(0).toUpperCase() + topCategory.slice(1);

        // This month
        const currentMonth = new Date().toISOString().slice(0, 7);
        const thisMonthTotal = this.expenses
            .filter(expense => expense.date.startsWith(currentMonth))
            .reduce((sum, expense) => sum + expense.amount, 0);
        document.getElementById('thisMonth').textContent = `₹${thisMonthTotal.toFixed(2)}`;

        // Category breakdown
        this.updateCategoryBreakdown(categoryTotals);
    }

    updateCategoryBreakdown(categoryTotals) {
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

    updateGoal() {
        const goal = parseFloat(document.getElementById('monthlyGoal').value) || 0;
        this.monthlyGoal = goal;
        localStorage.setItem('monthlyGoal', goal);
        this.updateGoalDisplay();
    }

    updateGoalDisplay() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const thisMonthTotal = this.expenses
            .filter(expense => expense.date.startsWith(currentMonth))
            .reduce((sum, expense) => sum + expense.amount, 0);

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

    saveToStorage() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
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

function updateSubcategories() {
    const category = document.getElementById('category').value;
    const subcategoryGroup = document.getElementById('subcategoryGroup');
    const subcategorySelect = document.getElementById('subcategory');

    if (category && tracker.subcategories[category]) {
        subcategoryGroup.classList.add('show');
        subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>' +
            tracker.subcategories[category].map(sub => 
                `<option value="${sub}">${sub}</option>`
            ).join('');
        subcategorySelect.required = true;
    } else {
        subcategoryGroup.classList.remove('show');
        subcategorySelect.required = false;
    }
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
        tracker.updateStats();
    }
    // Update goals when showing goals page
    if (pageId === 'goals') {
        tracker.updateGoalDisplay();
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.getElementById('themeIcon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

// Initialize the app
const tracker = new ExpenseTracker();
