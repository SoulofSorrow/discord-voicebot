// Dashboard state
let activityChart = null;
let interactionChart = null;
let ws = null;
let reconnectInterval = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    connectWebSocket();
    loadDashboardData();

    // Time range selector
    document.getElementById('timeRange').addEventListener('change', (e) => {
        loadDashboardData(parseInt(e.target.value));
    });
});

// Connect to WebSocket for real-time updates
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket connected');
        updateStatus('connected', 'Connected');
        updateWebSocketStatus('healthy', 'Connected');
        if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
        }
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        updateStatus('disconnected', 'Disconnected');
        updateWebSocketStatus('unhealthy', 'Disconnected');

        // Attempt to reconnect
        if (!reconnectInterval) {
            reconnectInterval = setInterval(() => {
                console.log('Attempting to reconnect...');
                connectWebSocket();
            }, 5000);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Handle WebSocket messages
function handleWebSocketMessage(message) {
    if (message.type === 'init') {
        updateDashboard(message.data);
    } else if (message.type === 'update') {
        updateRealtimeData(message.data);
    }
}

// Load dashboard data
async function loadDashboardData(timeRange = 86400000) {
    try {
        const response = await fetch(`/api/dashboard?timeRange=${timeRange}`);
        const data = await response.json();
        updateDashboard(data);
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

// Update dashboard with data
function updateDashboard(data) {
    // Update stats
    document.getElementById('activeChannels').textContent = data.channels?.active || 0;
    document.getElementById('totalChannels').textContent = data.channels?.total || 0;
    document.getElementById('totalInteractions').textContent = data.interactions?.total || 0;

    // Update uptime
    const uptime = formatUptime(data.performance?.uptime || 0);
    document.getElementById('uptime').textContent = uptime;

    // Update memory
    const memory = data.performance?.memory;
    if (memory) {
        document.getElementById('memory').textContent = `${memory.used}/${memory.total} ${memory.unit}`;
    }

    // Update cache hit rate
    const monitoring = data.performance?.monitoring;
    if (monitoring && monitoring.cacheHits !== undefined) {
        const total = monitoring.cacheHits + monitoring.cacheMisses;
        const hitRate = total > 0 ? ((monitoring.cacheHits / total) * 100).toFixed(1) : 0;
        document.getElementById('cacheHitRate').textContent = `${hitRate}%`;
    }

    // Update rate limits
    const rateLimits = data.performance?.rateLimits;
    if (rateLimits) {
        document.getElementById('rateLimits').textContent = rateLimits.total || 0;
    }

    // Update top creator
    if (data.users?.topCreators && data.users.topCreators.length > 0) {
        const topCreator = data.users.topCreators[0];
        document.getElementById('topCreator').textContent =
            `${truncateId(topCreator.userId)} (${topCreator.channelsCreated})`;
    }

    // Update timeline chart
    if (data.timeline) {
        updateActivityChart(data.timeline);
    }

    // Update interaction chart
    if (data.interactions?.byType) {
        updateInteractionChart(data.interactions.byType);
    }

    // Update top creators table
    if (data.users?.topCreators) {
        updateTopCreatorsTable(data.users.topCreators);
    }

    // Update errors table
    if (data.errors?.byContext) {
        updateErrorsTable(data.errors.byContext);
    }

    // Update health
    updateHealthStatus(data);

    // Update last update time
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
}

// Update real-time data
function updateRealtimeData(data) {
    if (data.channels) {
        document.getElementById('activeChannels').textContent = data.channels.active || 0;
    }

    if (data.health) {
        updateBotStatus(data.health.bot ? 'healthy' : 'unhealthy', data.health.bot ? 'Ready' : 'Not Ready');
        document.getElementById('uptime').textContent = formatUptime(data.health.uptime || 0);
    }

    if (data.performance) {
        const memory = data.performance.memory;
        if (memory) {
            document.getElementById('memory').textContent = `${memory.used}/${memory.total} ${memory.unit}`;
        }
    }

    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
}

// Initialize charts
function initializeCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#c9d1d9' }
            }
        },
        scales: {
            x: {
                ticks: { color: '#8b949e' },
                grid: { color: '#30363d' }
            },
            y: {
                ticks: { color: '#8b949e' },
                grid: { color: '#30363d' }
            }
        }
    };

    // Activity chart
    const activityCtx = document.getElementById('activityChart').getContext('2d');
    activityChart = new Chart(activityCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Created',
                    data: [],
                    borderColor: '#3fb950',
                    backgroundColor: 'rgba(63, 185, 80, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Deleted',
                    data: [],
                    borderColor: '#f85149',
                    backgroundColor: 'rgba(248, 81, 73, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: chartOptions
    });

    // Interaction chart
    const interactionCtx = document.getElementById('interactionChart').getContext('2d');
    interactionChart = new Chart(interactionCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#58a6ff',
                    '#3fb950',
                    '#d29922',
                    '#f85149',
                    '#a371f7',
                    '#ff7b72'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#c9d1d9' }
                }
            }
        }
    });
}

// Update activity chart
function updateActivityChart(timeline) {
    const labels = timeline.map(t => new Date(t.timestamp).toLocaleTimeString());
    const created = timeline.map(t => t.channelsCreated);
    const deleted = timeline.map(t => t.channelsDeleted);

    activityChart.data.labels = labels;
    activityChart.data.datasets[0].data = created;
    activityChart.data.datasets[1].data = deleted;
    activityChart.update();
}

// Update interaction chart
function updateInteractionChart(byType) {
    const labels = Object.keys(byType);
    const data = Object.values(byType);

    interactionChart.data.labels = labels;
    interactionChart.data.datasets[0].data = data;
    interactionChart.update();
}

// Update top creators table
function updateTopCreatorsTable(topCreators) {
    const tbody = document.querySelector('#topCreatorsTable tbody');
    tbody.innerHTML = topCreators.slice(0, 10).map((creator, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><code>${truncateId(creator.userId)}</code></td>
            <td>${creator.channelsCreated}</td>
        </tr>
    `).join('');
}

// Update errors table
function updateErrorsTable(byContext) {
    const tbody = document.querySelector('#errorsTable tbody');
    const entries = Object.entries(byContext);

    if (entries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="loading">No errors 🎉</td></tr>';
        return;
    }

    tbody.innerHTML = entries.slice(0, 10).map(([context, count]) => `
        <tr>
            <td><code>${context}</code></td>
            <td>${count}</td>
        </tr>
    `).join('');
}

// Update health status
function updateHealthStatus(data) {
    // Bot status
    const botReady = data.channels !== undefined;
    updateBotStatus(botReady ? 'healthy' : 'unhealthy', botReady ? 'Ready' : 'Not Ready');

    // Database status
    const dbReady = data.channels?.total !== undefined;
    updateDatabaseStatus(dbReady ? 'healthy' : 'unhealthy', dbReady ? 'Connected' : 'Disconnected');

    // Cache size
    const cacheSize = data.performance?.rateLimits?.total || 0;
    document.getElementById('cacheSize').textContent = cacheSize;
}

// Update status indicator
function updateStatus(status, text) {
    const indicator = document.getElementById('status');
    indicator.className = `status-indicator ${status}`;
    indicator.querySelector('.text').textContent = text;
}

// Update bot status
function updateBotStatus(status, text) {
    const element = document.getElementById('botStatus');
    element.className = `health-value ${status}`;
    element.innerHTML = `<span class="dot"></span> ${text}`;
}

// Update database status
function updateDatabaseStatus(status, text) {
    const element = document.getElementById('dbStatus');
    element.className = `health-value ${status}`;
    element.innerHTML = `<span class="dot"></span> ${text}`;
}

// Update WebSocket status
function updateWebSocketStatus(status, text) {
    const element = document.getElementById('wsStatus');
    element.className = `health-value ${status}`;
    element.innerHTML = `<span class="dot"></span> ${text}`;
}

// Export report
async function exportReport() {
    try {
        const timeRange = document.getElementById('timeRange').value;
        const response = await fetch(`/api/export?timeRange=${timeRange}`);
        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tempvoice-report-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Failed to export report:', error);
        alert('Failed to export report');
    }
}

// Utility functions
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function truncateId(id) {
    if (!id) return 'Unknown';
    return id.length > 18 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;
}
