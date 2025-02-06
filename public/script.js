document.addEventListener('DOMContentLoaded', () => {
    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    const currentTimeElement = document.getElementById('currentTime');
    const newDateTimeInput = document.getElementById('newDateTime');
    const setTimeButton = document.getElementById('setTime');
    const resetTimeButton = document.getElementById('resetTime');
    const logsElement = document.getElementById('logs');
    const containerListElement = document.getElementById('containerList');

    function addLog(message, type = 'success') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        logsElement.insertBefore(logEntry, logsElement.firstChild);
    }

    // Fetch and populate container list
    async function loadContainers() {
        try {
            const response = await fetch('/containers');
            const data = await response.json();
            containerListElement.innerHTML = '';

            data.containers.forEach(container => {
                const containerItem = document.createElement('div');
                containerItem.className = 'container-item';
                containerItem.innerHTML = `
                    <input type="checkbox" id="container-${container}" value="${container}">
                    <label for="container-${container}">${container}</label>
                `;
                containerListElement.appendChild(containerItem);
            });
        } catch (error) {
            addLog('Error loading containers: ' + error.message, 'error');
        }
    }

    // Get selected containers
    function getSelectedContainers() {
        const checkboxes = containerListElement.querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
            case 'time':
                currentTimeElement.textContent = new Date(data.data).toLocaleString();
                break;
            case 'timeChange':
                addLog(data.data, 'success');
                break;
            case 'containerRestart':
                addLog(data.data, 'info');
                break;
            case 'error':
                addLog(data.data, 'error');
                break;
        }
    };

    setTimeButton.addEventListener('click', async () => {
        const newDateTime = newDateTimeInput.value;
        if (!newDateTime) {
            addLog('Please select a date and time', 'error');
            return;
        }

        const selectedContainers = getSelectedContainers();
        try {
            const response = await fetch('/setTime', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    datetime: newDateTime,
                    containers: selectedContainers
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to set time');
            }
        } catch (error) {
            addLog(error.message, 'error');
        }
    });

    resetTimeButton.addEventListener('click', async () => {
        const selectedContainers = getSelectedContainers();
        try {
            const response = await fetch('/resetTime', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ containers: selectedContainers })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to reset time');
            }
        } catch (error) {
            addLog(error.message, 'error');
        }
    });

    ws.onopen = () => {
        addLog('Connected to server');
        loadContainers(); // Load containers when connection is established
    };

    ws.onclose = () => {
        addLog('Disconnected from server', 'error');
    };

    ws.onerror = (error) => {
        addLog('WebSocket error: ' + error.message, 'error');
    };
});
