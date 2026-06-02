// Default starting data
const DEFAULT_BOOKS = [
    { id: 101, name: "Java Basics", author: "James Gosling", quantity: 5 },
    { id: 102, name: "Python Programming", author: "Guido van Rossum", quantity: 3 },
    { id: 103, name: "HTML and CSS", author: "John Smith", quantity: 4 }
];

const DEFAULT_ISSUES = [
    { id: 1, bookId: 101, bookName: "Java Basics", studentId: "S1001", studentName: "Alice Miller", issueDate: "2026-05-15", dueDate: "2026-06-15", returned: false }
];

// State variables
let books = [];
let issues = [];
let editingBookId = null;

// Initialize app on load
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    loadData();
    setupEventListeners();
    renderAll();
});

// Theme management
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeToggleButton(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeToggleButton(newTheme);
    showToast("Theme changed successfully!");
}

function updateThemeToggleButton(theme) {
    const btn = document.getElementById("themeToggleBtn");
    if (!btn) return;
    if (theme === "dark") {
        btn.innerHTML = `☀️ <span class="theme-text">Light Mode</span>`;
    } else {
        btn.innerHTML = `🌙 <span class="theme-text">Dark Mode</span>`;
    }
}

// LocalStorage operations
function loadData() {
    const storedBooks = localStorage.getItem("library_books");
    const storedIssues = localStorage.getItem("library_issues");
    
    if (storedBooks) {
        books = JSON.parse(storedBooks);
    } else {
        books = [...DEFAULT_BOOKS];
        saveBooks();
    }
    
    if (storedIssues) {
        issues = JSON.parse(storedIssues);
    } else {
        issues = [...DEFAULT_ISSUES];
        saveIssues();
    }
}

function saveBooks() {
    localStorage.setItem("library_books", JSON.stringify(books));
}

function saveIssues() {
    localStorage.setItem("library_issues", JSON.stringify(issues));
}

// Render functions
function renderAll() {
    renderStats();
    renderBooksTable();
    renderIssuesTable();
    populateBookSelect();
}

function renderStats() {
    const totalBooks = books.reduce((acc, book) => acc + parseInt(book.quantity), 0);
    const totalUniqueBooks = books.length;
    
    const activeIssuesCount = issues.filter(issue => !issue.returned).length;
    
    const availableBooksCount = books.reduce((acc, book) => {
        const currentlyIssued = issues.filter(issue => issue.bookId === book.id && !issue.returned).length;
        return acc + Math.max(0, parseInt(book.quantity) - currentlyIssued);
    }, 0);
    
    const outOfStockCount = books.filter(book => {
        const currentlyIssued = issues.filter(issue => issue.bookId === book.id && !issue.returned).length;
        return parseInt(book.quantity) - currentlyIssued <= 0;
    }).length;

    document.getElementById("statTotalBooks").textContent = totalBooks;
    document.getElementById("statActiveIssues").textContent = activeIssuesCount;
    document.getElementById("statAvailableBooks").textContent = availableBooksCount;
    document.getElementById("statOutOfStock").textContent = outOfStockCount;
}

function renderBooksTable(filterText = "") {
    const tableBody = document.getElementById("booksTableBody");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const query = filterText.toLowerCase().trim();
    const filteredBooks = books.filter(book => 
        book.id.toString().includes(query) ||
        book.name.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
    );

    if (filteredBooks.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <span class="empty-icon">📖</span>
                    <div class="empty-title">No books found</div>
                    <div class="empty-desc">${filterText ? "Try adjusting your search criteria" : "Add some books to get started"}</div>
                </td>
            </tr>
        `;
        return;
    }

    filteredBooks.forEach(book => {
        const currentlyIssued = issues.filter(issue => issue.bookId === book.id && !issue.returned).length;
        const available = Math.max(0, book.quantity - currentlyIssued);
        
        let stockBadge = "";
        if (available <= 0) {
            stockBadge = `<span class="badge badge-danger">Out of stock</span>`;
        } else if (available <= 2) {
            stockBadge = `<span class="badge badge-warning">Low stock (${available})</span>`;
        } else {
            stockBadge = `<span class="badge badge-success">${available} Available</span>`;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>#${book.id}</strong></td>
            <td><strong>${escapeHtml(book.name)}</strong></td>
            <td>${escapeHtml(book.author)}</td>
            <td>${escapeHtml(book.quantity.toString())} (Total) / ${stockBadge}</td>
            <td>
                <div class="table-actions">
                    <button class="action-icon-btn edit" onclick="startEditBook(${book.id})" title="Edit Book">✏️</button>
                    <button class="action-icon-btn delete" onclick="deleteBook(${book.id})" title="Delete Book">🗑️</button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderIssuesTable(filterText = "") {
    const tableBody = document.getElementById("issuesTableBody");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const query = filterText.toLowerCase().trim();
    const filteredIssues = issues.filter(issue => 
        issue.studentName.toLowerCase().includes(query) ||
        issue.studentId.toLowerCase().includes(query) ||
        issue.bookName.toLowerCase().includes(query) ||
        issue.bookId.toString().includes(query)
    );

    // Sort issues by active ones first, then return date
    filteredIssues.sort((a, b) => a.returned - b.returned);

    if (filteredIssues.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <span class="empty-icon">🤝</span>
                    <div class="empty-title">No issues found</div>
                    <div class="empty-desc">${filterText ? "Try adjusting your search criteria" : "Issue a book to get started"}</div>
                </td>
            </tr>
        `;
        return;
    }

    filteredIssues.forEach(issue => {
        const isOverdue = !issue.returned && new Date(issue.dueDate) < new Date();
        
        let statusBadge = "";
        if (issue.returned) {
            statusBadge = `<span class="badge badge-success">Returned</span>`;
        } else if (isOverdue) {
            statusBadge = `<span class="badge badge-danger">Overdue</span>`;
        } else {
            statusBadge = `<span class="badge badge-warning">Active</span>`;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>#${issue.bookId}</strong><br><small class="text-secondary">${escapeHtml(issue.bookName)}</small></td>
            <td>${escapeHtml(issue.studentName)}<br><small class="text-secondary">ID: ${escapeHtml(issue.studentId)}</small></td>
            <td>${escapeHtml(issue.issueDate)}</td>
            <td>${escapeHtml(issue.dueDate)}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="table-actions">
                    ${!issue.returned ? 
                        `<button class="action-icon-btn return" onclick="returnBook(${issue.id})" title="Return Book">✅</button>` : 
                        `<span class="text-secondary" style="font-size:12px">Completed</span>`
                    }
                    <button class="action-icon-btn delete" onclick="deleteIssue(${issue.id})" title="Delete Record">🗑️</button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function populateBookSelect() {
    const select = document.getElementById("issueBookId");
    if (!select) return;
    select.innerHTML = '<option value="">-- Select a Book --</option>';
    
    books.forEach(book => {
        const currentlyIssued = issues.filter(issue => issue.bookId === book.id && !issue.returned).length;
        const available = book.quantity - currentlyIssued;
        
        const option = document.createElement("option");
        option.value = book.id;
        option.disabled = available <= 0;
        option.textContent = `${book.name} (ID: ${book.id}) - ${available > 0 ? available + ' left' : 'Out of stock'}`;
        select.appendChild(option);
    });
}

// Event Listeners setup
function setupEventListeners() {
    // Theme Toggle
    document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);
    
    // Tab switching
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
            
            btn.classList.add("active");
            const tabId = btn.getAttribute("data-tab");
            document.getElementById(tabId).classList.add("active");
        });
    });

    // Book Form submission (Add/Edit)
    const bookForm = document.getElementById("bookForm");
    if (bookForm) {
        bookForm.addEventListener("submit", (e) => {
            e.preventDefault();
            saveBookForm();
        });
    }

    // Issue Form submission
    const issueForm = document.getElementById("issueForm");
    if (issueForm) {
        issueForm.addEventListener("submit", (e) => {
            e.preventDefault();
            saveIssueForm();
        });
    }

    // Search inputs
    const bookSearch = document.getElementById("bookSearch");
    if (bookSearch) {
        bookSearch.addEventListener("input", (e) => {
            renderBooksTable(e.target.value);
        });
    }

    const issueSearch = document.getElementById("issueSearch");
    if (issueSearch) {
        issueSearch.addEventListener("input", (e) => {
            renderIssuesTable(e.target.value);
        });
    }
}

// Book operations
function saveBookForm() {
    const idInput = document.getElementById("bookId");
    const nameInput = document.getElementById("bookName");
    const authorInput = document.getElementById("bookAuthor");
    const qtyInput = document.getElementById("bookQuantity");

    const id = parseInt(idInput.value);
    const name = nameInput.value.trim();
    const author = authorInput.value.trim();
    const quantity = parseInt(qtyInput.value);

    if (isNaN(id) || !name || !author || isNaN(quantity) || quantity < 0) {
        showToast("Please fill all fields with valid information.", "error");
        return;
    }

    if (editingBookId === null) {
        // Adding new book
        const exists = books.some(book => book.id === id);
        if (exists) {
            showToast(`A book with ID ${id} already exists.`, "error");
            return;
        }

        books.push({ id, name, author, quantity });
        showToast("Book added successfully!");
    } else {
        // Updating existing book
        const bookIndex = books.findIndex(book => book.id === editingBookId);
        if (bookIndex === -1) return;

        // If the ID is changed, check if the new ID exists
        if (editingBookId !== id) {
            const exists = books.some(book => book.id === id);
            if (exists) {
                showToast(`A book with ID ${id} already exists.`, "error");
                return;
            }
            
            // Also need to update issue records pointing to this book ID
            issues.forEach(issue => {
                if (issue.bookId === editingBookId) {
                    issue.bookId = id;
                }
            });
            saveIssues();
        }

        books[bookIndex] = { id, name, author, quantity };
        showToast("Book updated successfully!");
        cancelEditBook();
    }

    saveBooks();
    resetBookForm();
    renderAll();
}

function startEditBook(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;

    editingBookId = id;
    
    document.getElementById("bookFormTitle").textContent = "Edit Book";
    document.getElementById("bookId").value = book.id;
    document.getElementById("bookName").value = book.name;
    document.getElementById("bookAuthor").value = book.author;
    document.getElementById("bookQuantity").value = book.quantity;
    
    document.getElementById("cancelEditBtn").style.display = "block";
    document.getElementById("bookSubmitBtn").textContent = "Save Changes";
}

function cancelEditBook() {
    editingBookId = null;
    document.getElementById("bookFormTitle").textContent = "Add New Book";
    resetBookForm();
    document.getElementById("cancelEditBtn").style.display = "none";
    document.getElementById("bookSubmitBtn").innerHTML = "➕ Add Book";
}

function resetBookForm() {
    document.getElementById("bookForm").reset();
}

function deleteBook(id) {
    if (!confirm("Are you sure you want to delete this book? This will also remove any issue history for this book.")) {
        return;
    }

    books = books.filter(book => book.id !== id);
    issues = issues.filter(issue => issue.bookId !== id);
    
    saveBooks();
    saveIssues();
    renderAll();
    showToast("Book and related records deleted.");
}

// Issue / Return operations
function saveIssueForm() {
    const bookIdSelect = document.getElementById("issueBookId");
    const studentIdInput = document.getElementById("studentId");
    const studentNameInput = document.getElementById("studentName");
    const issueDateInput = document.getElementById("issueDate");
    const dueDateInput = document.getElementById("dueDate");

    const bookId = parseInt(bookIdSelect.value);
    const studentId = studentIdInput.value.trim();
    const studentName = studentNameInput.value.trim();
    const issueDate = issueDateInput.value;
    const dueDate = dueDateInput.value;

    if (isNaN(bookId) || !studentId || !studentName || !issueDate || !dueDate) {
        showToast("Please fill all fields to issue a book.", "error");
        return;
    }

    // Check available stock
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const currentlyIssued = issues.filter(issue => issue.bookId === bookId && !issue.returned).length;
    if (book.quantity - currentlyIssued <= 0) {
        showToast("This book is currently out of stock.", "error");
        return;
    }

    const nextId = issues.length > 0 ? Math.max(...issues.map(i => i.id)) + 1 : 1;
    
    issues.push({
        id: nextId,
        bookId,
        bookName: book.name,
        studentId,
        studentName,
        issueDate,
        dueDate,
        returned: false
    });

    saveIssues();
    document.getElementById("issueForm").reset();
    
    // Set default dates again
    setDefaultDates();
    
    renderAll();
    showToast("Book issued successfully!");
}

function returnBook(id) {
    const issue = issues.find(i => i.id === id);
    if (!issue) return;

    issue.returned = true;
    saveIssues();
    renderAll();
    showToast("Book returned successfully!");
}

function deleteIssue(id) {
    if (!confirm("Are you sure you want to delete this issue record?")) {
        return;
    }

    issues = issues.filter(issue => issue.id !== id);
    saveIssues();
    renderAll();
    showToast("Issue record deleted.");
}

// Default Dates helper
function setDefaultDates() {
    const issueDateInput = document.getElementById("issueDate");
    const dueDateInput = document.getElementById("dueDate");
    
    if (!issueDateInput || !dueDateInput) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    issueDateInput.value = `${yyyy}-${mm}-${dd}`;

    // Default due date is 14 days later
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 14);
    const dyyyy = dueDate.getFullYear();
    const dmm = String(dueDate.getMonth() + 1).padStart(2, '0');
    const ddd = String(dueDate.getDate()).padStart(2, '0');
    
    dueDateInput.value = `${dyyyy}-${dmm}-${ddd}`;
}

// Data import/export helpers
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ books, issues }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `library_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Backup downloaded successfully!");
}

function triggerImport() {
    document.getElementById("importFileInput").click();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.books && Array.isArray(data.books) && data.issues && Array.isArray(data.issues)) {
                if (confirm("This will overwrite your current library database. Do you want to proceed?")) {
                    books = data.books;
                    issues = data.issues;
                    saveBooks();
                    saveIssues();
                    renderAll();
                    showToast("Database imported successfully!");
                }
            } else {
                showToast("Invalid backup file structure.", "error");
            }
        } catch (err) {
            showToast("Failed to read the file.", "error");
        }
    };
    reader.readAsText(file);
}

// Helper to escape HTML characters (prevent XSS)
function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Toast notification helper
function showToast(message, type = "success") {
    let toast = document.getElementById("toastNotification");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toastNotification";
        toast.className = "toast";
        document.body.appendChild(toast);
    }

    toast.className = `toast toast-${type} show`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✅' : '❌'}</span>
        <span>${escapeHtml(message)}</span>
    `;

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// Set default dates on load
document.addEventListener("DOMContentLoaded", setDefaultDates);
window.startEditBook = startEditBook;
window.cancelEditBook = cancelEditBook;
window.deleteBook = deleteBook;
window.returnBook = returnBook;
window.deleteIssue = deleteIssue;
window.exportData = exportData;
window.triggerImport = triggerImport;
window.importData = importData;
