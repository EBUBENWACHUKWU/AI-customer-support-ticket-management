let allTickets = [];

const SUPABASE_URL = "https://txozszkbzmgzpnegacly.supabase.co";

// Keep your existing Supabase publishable key here.
const SUPABASE_KEY = "sb_publishable_bKP1iz4Cz2zmhXSb0YoyAA_vPohj_OE";

// Load tickets from Supabase
async function loadTickets() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/support_tickets?select=*`,
            {
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Supabase error: ${response.status}`);
        }

        allTickets = await response.json();

        console.log("Tickets loaded:", allTickets);

        updateDashboardStats(allTickets);
        updateCharts(allTickets);
        applyTicketFilters();

    } catch (error) {
        console.error("Error loading tickets:", error);
    }
}

// Priority styling
function getPriorityClass(priority) {
    return priority ? `priority-${priority.toLowerCase()}` : "";
}

// Sentiment styling
function getSentimentClass(sentiment) {
    return sentiment ? `sentiment-${sentiment.toLowerCase()}` : "";
}

// Status styling
function getStatusClass(status) {
    return status
        ? `status-${status.toLowerCase().replace(/\s+/g, "-")}`
        : "";
}

// Display tickets in the table
function displayTickets(tickets) {
    const tableBody = document.getElementById("ticketTableBody");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!tickets || tickets.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7">No tickets found.</td>
            </tr>
        `;
        return;
    }

    tickets.forEach(ticket => {
        const row = document.createElement("tr");

        row.className = "ticket-clickable";

        row.addEventListener("click", () => {
            showTicketDetails(ticket);
        });

        row.innerHTML = `
            <td>${ticket.customer_name || "-"}</td>
            <td>${ticket.category || "-"}</td>
            <td>${ticket.intent || "-"}</td>

            <td>
                <span class="${getPriorityClass(ticket.priority)}">
                    ${ticket.priority || "-"}
                </span>
            </td>

            <td>
                <span class="${getSentimentClass(ticket.sentiment)}">
                    ${ticket.sentiment || "-"}
                </span>
            </td>

            <td>
                <span class="${getStatusClass(ticket.status)}">
                    ${ticket.status || "-"}
                </span>
            </td>

            <td>${formatDate(ticket.created_at)}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Update all dashboard summary cards
function updateDashboardStats(tickets) {
    const totalTickets = tickets.length;

    const openTickets = tickets.filter(
        ticket => ticket.status === "Open"
    ).length;

    const inProgressTickets = tickets.filter(
        ticket => ticket.status === "In Progress"
    ).length;

    const resolvedTickets = tickets.filter(
        ticket => ticket.status === "Resolved"
    ).length;

    const highPriorityTickets = tickets.filter(
        ticket =>
            ticket.priority === "High" ||
            ticket.priority === "Critical"
    ).length;

    const humanReviewTickets = tickets.filter(
        ticket => ticket.requires_human === true
    ).length;

    const totalElement = document.getElementById("totalTickets");
    const openElement = document.getElementById("openTickets");
    const inProgressElement =
        document.getElementById("statusInProgressCount");
    const resolvedElement =
        document.getElementById("statusResolvedCount");
    const highElement =
        document.getElementById("highPriorityTickets");
    const humanElement =
        document.getElementById("humanReviewTickets");

    if (totalElement) {
        totalElement.textContent = totalTickets;
    }

    if (openElement) {
        openElement.textContent = openTickets;
    }

    if (inProgressElement) {
        inProgressElement.textContent = inProgressTickets;
    }

    if (resolvedElement) {
        resolvedElement.textContent = resolvedTickets;
    }

    if (highElement) {
        highElement.textContent = highPriorityTickets;
    }

    if (humanElement) {
        humanElement.textContent = humanReviewTickets;
    }
}

// Filter tickets using the dropdown
function filterTickets(filter) {
    if (!filter || filter === "all") {
        return allTickets;
    }

    if (filter === "open") {
        return allTickets.filter(
            ticket => ticket.status === "Open"
        );
    }

    if (filter === "high") {
        return allTickets.filter(
            ticket =>
                ticket.priority === "High" ||
                ticket.priority === "Critical"
        );
    }

    if (filter === "human") {
        return allTickets.filter(
            ticket => ticket.requires_human === true
        );
    }

    return allTickets.filter(
        ticket =>
            ticket.category &&
            ticket.category.toLowerCase() === filter.toLowerCase()
    );
}

// Apply dropdown filter and text search together
function applyTicketFilters() {
    const filterElement = document.getElementById("ticketFilter");
    const searchElement = document.getElementById("ticketSearch");

    const selectedFilter = filterElement
        ? filterElement.value
        : "all";

    const searchTerm = searchElement
        ? searchElement.value.trim().toLowerCase()
        : "";

    const filteredTickets = filterTickets(selectedFilter);

    const searchedTickets = filteredTickets.filter(ticket => {
        const searchableValues = [
            ticket.customer_name,
            ticket.customer_email,
            ticket.message,
            ticket.category,
            ticket.intent,
            ticket.priority,
            ticket.sentiment,
            ticket.status
        ];

        return searchableValues.some(value =>
            String(value ?? "").toLowerCase().includes(searchTerm)
        );
    });

    displayTickets(searchedTickets);
}

// Format dates
function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString();
}

// Update analytics charts
function updateCharts(tickets) {
    updateCategoryChart(tickets);
    updatePriorityChart(tickets);
    updateSentimentChart(tickets);
}

// Category chart
function updateCategoryChart(tickets) {
    const counts = {};

    tickets.forEach(ticket => {
        const category = ticket.category || "Unknown";
        counts[category] = (counts[category] || 0) + 1;
    });

    renderChart("categoryChart", counts);
}

// Priority chart
function updatePriorityChart(tickets) {
    const counts = {};

    tickets.forEach(ticket => {
        const priority = ticket.priority || "Unknown";
        counts[priority] = (counts[priority] || 0) + 1;
    });

    renderChart("priorityChart", counts);
}

// Sentiment chart
function updateSentimentChart(tickets) {
    const counts = {};

    tickets.forEach(ticket => {
        const sentiment = ticket.sentiment || "Unknown";
        counts[sentiment] = (counts[sentiment] || 0) + 1;
    });

    renderChart("sentimentChart", counts);
}

// Render a chart
function renderChart(elementId, data) {
    const container = document.getElementById(elementId);

    if (!container) return;

    container.innerHTML = "";

    const values = Object.values(data);

    if (values.length === 0) {
        container.innerHTML = `
            <p class="chart-empty">No data available.</p>
        `;
        return;
    }

    const maxValue = Math.max(...values);

    Object.entries(data).forEach(([label, value]) => {
        const percentage = (value / maxValue) * 100;
        const row = document.createElement("div");

        row.className = "chart-row";

        row.innerHTML = `
            <div class="chart-label">
                <span>${label}</span>
                <span>${value}</span>
            </div>

            <div class="chart-bar-background">
                <div
                    class="chart-bar"
                    style="width: ${percentage}%"
                ></div>
            </div>
        `;

        container.appendChild(row);
    });
}

// Show ticket details modal
function showTicketDetails(ticket) {
    const modal = document.getElementById("ticketModal");
    const details = document.getElementById("ticketDetails");

    if (!modal || !details) return;

    details.innerHTML = `
        <div class="ticket-details-body">

            <div class="detail-row">
                <span class="detail-label">Customer</span>
                <div class="detail-value">
                    ${ticket.customer_name || "-"}
                </div>
            </div>

            <div class="detail-row">
                <span class="detail-label">Email</span>
                <div class="detail-value">
                    ${ticket.customer_email || "-"}
                </div>
            </div>

            <div class="detail-row">
                <span class="detail-label">Category</span>
                <div class="detail-value">
                    ${ticket.category || "-"}
                </div>
            </div>

            <div class="detail-row">
                <span class="detail-label">Intent</span>
                <div class="detail-value">
                    ${ticket.intent || "-"}
                </div>
            </div>

            <div class="detail-row">
                <span class="detail-label">Priority</span>
                <div class="detail-value">
                    ${ticket.priority || "-"}
                </div>
            </div>

            <div class="detail-row">
                <span class="detail-label">Sentiment</span>
                <div class="detail-value">
                    ${ticket.sentiment || "-"}
                </div>
            </div>

            <div class="detail-row">
                <span class="detail-label">Status</span>

                <select id="ticketStatus" class="status-select">
                    <option value="Open"
                        ${ticket.status === "Open" ? "selected" : ""}>
                        Open
                    </option>

                    <option value="In Progress"
                        ${ticket.status === "In Progress" ? "selected" : ""}>
                        In Progress
                    </option>

                    <option value="Resolved"
                        ${ticket.status === "Resolved" ? "selected" : ""}>
                        Resolved
                    </option>
                </select>

                <button
                    id="saveStatusButton"
                    class="save-status-button"
                    type="button">
                    Save Status
                </button>
            </div>

            <div class="detail-row">
                <span class="detail-label">Human Review Required</span>
                <div class="detail-value">
                    ${ticket.requires_human ? "Yes" : "No"}
                </div>
            </div>

            <div class="detail-row">
                <span class="detail-label">Customer Message</span>
                <div class="customer-message">
                    ${ticket.message || "-"}
                </div>
            </div>

            <div class="detail-row">
                <span class="detail-label">AI Suggested Response</span>
                <div class="ai-response">
                    ${ticket.ai_response || "No AI response available"}
                </div>
            </div>

            <div class="detail-row">
                <span class="detail-label">Created</span>
                <div class="detail-value">
                    ${ticket.created_at
                        ? new Date(ticket.created_at).toLocaleString()
                        : "Date unavailable"}
                </div>
            </div>

        </div>
    `;

    modal.style.display = "block";

    document
        .getElementById("saveStatusButton")
        .addEventListener("click", async () => {
            const newStatus =
                document.getElementById("ticketStatus").value;

            const saved = await updateTicketStatus(
                ticket.id,
                newStatus
            );

            if (saved) {
                modal.style.display = "none";
            }
        });
}

// Save ticket status to Supabase
async function updateTicketStatus(ticketId, newStatus) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/support_tickets?id=eq.${encodeURIComponent(ticketId)}`,
            {
                method: "PATCH",

                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },

                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `Supabase update error: ${response.status}`
            );
        }

        const ticketIndex = allTickets.findIndex(
            ticket => String(ticket.id) === String(ticketId)
        );

        if (ticketIndex !== -1) {
            allTickets[ticketIndex].status = newStatus;
        }

        // Refresh summary counts and filtered table
        updateDashboardStats(allTickets);
        applyTicketFilters();

        alert("Ticket status updated successfully.");

        return true;

    } catch (error) {
        console.error("Status update failed:", error);

        alert(
            "Failed to update ticket status. Check the browser console for details."
        );

        return false;
    }
}

// Initialize dashboard and event listeners
document.addEventListener("DOMContentLoaded", () => {
    loadTickets();

    const refreshButton = document.getElementById("refreshButton");

    if (refreshButton) {
        refreshButton.addEventListener("click", loadTickets);
    }

    const filterElement = document.getElementById("ticketFilter");

    if (filterElement) {
        filterElement.addEventListener("change", applyTicketFilters);
    }

    const searchElement = document.getElementById("ticketSearch");

    if (searchElement) {
        searchElement.addEventListener("input", applyTicketFilters);
    }

    const closeModalButton = document.getElementById("closeModal");

    if (closeModalButton) {
        closeModalButton.addEventListener("click", () => {
            const modal = document.getElementById("ticketModal");

            if (modal) {
                modal.style.display = "none";
            }
        });
    }
});

// Close modal when clicking outside it
window.addEventListener("click", event => {
    const modal = document.getElementById("ticketModal");

    if (modal && event.target === modal) {
        modal.style.display = "none";
    }
});