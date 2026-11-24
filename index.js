const seed = [
    ["The Little Prince", "Antoine de Saint-Exupéry", "Fiction", 3],
    ["Atomic Habits", "James Clear", "Education", 2],
    ["A Brief History of Time", "Stephen Hawking", "Science", 1],
    ["The Hobbit", "J. R. R. Tolkien", "Fiction", 4],
    ["Sapiens", "Yuval Noah Harari", "History", 2],
    ["Clean Code", "Robert C. Martin", "Technology", 2]
];

let books = JSON.parse(localStorage.getItem("bcBooks")) ||
    seed.map((x, i) => ({
        id: i + 1,
        title: x[0],
        author: x[1],
        category: x[2],
        total: x[3],
        available: x[3]
    }));

let logs = JSON.parse(localStorage.getItem("bcLogs")) || [];

const $ = id => document.getElementById(id);

const esc = s => String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
}[c]));

// SAVE DATA
function save() {
    localStorage.setItem("bcBooks", JSON.stringify(books));
    localStorage.setItem("bcLogs", JSON.stringify(logs));
}

// NOTIFICATION
function toast(s) {
    $("toast").textContent = s;
    $("toast").classList.add("show");

    setTimeout(() => {
        $("toast").classList.remove("show");
    }, 2400);
}

// DISPLAY BOOKS AND DASHBOARD
function render() {
    let q = $("search").value.toLowerCase();
    let cat = $("filter").value;

    let list = books.filter(b =>
        (cat === "All" || b.category === cat) &&
        (`${b.title} ${b.author} ${b.category}`.toLowerCase().includes(q))
    );

    $("books").innerHTML = list.map(b => `
        <article class="card">
            <div style="font-size:28px">📘</div>
            <h3>${esc(b.title)}</h3>
            <p>by ${esc(b.author)} · ${esc(b.category)}</p>
            <span class="pill ${b.available === 0 ? "out" : ""}">
                ${b.available} available
            </span>
            <button onclick="pick(${b.id})">
                Choose for transaction
            </button>
        </article>
    `).join("") || "No books found";

    $("bookSelect").innerHTML = books.map(b => `
        <option value="${b.id}">
            ${esc(b.title)} (${b.available} available)
        </option>
    `).join("");

    $("titles").textContent = books.length;

    $("copies").textContent =
        books.reduce((a, b) => a + b.total, 0);

    $("available").textContent =
        books.reduce((a, b) => a + b.available, 0);

    $("borrowed").textContent =
        books.reduce((a, b) => a + b.total - b.available, 0);

    let recent = logs.slice(-5).reverse();

    $("recent").innerHTML = recent.map(l => `
        <p>
            ${esc(l.borrower)}
            <b>${l.action.toLowerCase()}</b>
            ${esc(l.title)}
            <br>
            <small>${l.date} · ${l.time}</small>
        </p>
    `).join("") || "<p class='muted'>No transactions yet.</p>";

    renderHistory();
}

// SELECT BOOK
function pick(id) {
    $("bookSelect").value = id;
    $("borrow").scrollIntoView({ behavior: "smooth" });
}

// BORROW AND RETURN
$("transaction").onsubmit = e => {
    e.preventDefault();

    let b = books.find(x => x.id === +$("bookSelect").value);
    let name = $("name").value.trim();
    let act = $("action").value;

    if (!b || !name) return;

    if (act === "borrow" && b.available === 0)
        return toast("No copies available.");

    if (act === "return" && b.available === b.total)
        return toast("All copies are already returned.");

    b.available += act === "borrow" ? -1 : 1;

    let d = new Date();

    logs.push({
        borrower: name,
        title: b.title,
        action: act === "borrow" ? "Borrowed" : "Returned",
        date: d.toLocaleDateString(),
        time: d.toLocaleTimeString(),
        stamp: d.toISOString()
    });

    save();
    render();

    $("name").value = "";

    toast("Transaction saved with date and time!");
};

// ADD BOOK
$("add").onsubmit = e => {
    e.preventDefault();

    let title = $("title").value.trim();
    let author = $("author").value.trim();
    let n = +$("count").value;

    if (!title || !author || n < 1)
        return toast("Enter valid book details.");

    books.push({
        id: Date.now(),
        title,
        author,
        category: $("category").value,
        total: n,
        available: n
    });

    save();
    render();

    e.target.reset();
    $("count").value = 1;

    toast("Book added!");
};

// TRANSACTION HISTORY
function renderHistory() {
    let q = $("histSearch").value.toLowerCase();
    let f = $("histFilter").value;

    let ls = logs.slice().reverse().filter(l =>
        (f === "All" || l.action === f) &&
        (`${l.borrower} ${l.title}`.toLowerCase().includes(q))
    );

    $("rows").innerHTML = ls.map(l => `
        <tr>
            <td>${esc(l.borrower)}</td>
            <td>${esc(l.title)}</td>
            <td>${l.action}</td>
            <td>${l.date}</td>
            <td>${l.time}</td>
        </tr>
    `).join("") ||
    '<tr><td colspan="5">No transactions recorded.</td></tr>';
}

// SEARCH AND FILTER
$("search").oninput = render;
$("filter").onchange = render;
$("histSearch").oninput = renderHistory;
$("histFilter").onchange = renderHistory;

// EXPORT TRANSACTIONS TO CSV
$("export").onclick = () => {
    let rows = [
        ["Borrower", "Book", "Action", "Date", "Time"],
        ...logs.map(l => [
            l.borrower, l.title, l.action, l.date, l.time
        ])
    ];

    let csv = rows.map(r =>
        r.map(v => '"' + String(v).replace(/"/g, '""') + '"')
        .join(",")
    ).join("\n");

    let a = document.createElement("a");

    a.href = URL.createObjectURL(
        new Blob([csv], { type: "text/csv" })
    );

    a.download = "BookCamp-history.csv";
    a.click();
};

// CLEAR HISTORY
$("clear").onclick = () => {
    if (confirm("Clear all transaction history?")) {
        logs = [];
        save();
        render();
        toast("History cleared.");
    }
};

// SHOW TODAY'S DATE
$("today").textContent = new Date().toLocaleDateString(
    undefined,
    {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    }
);

// INITIAL DISPLAY
render();