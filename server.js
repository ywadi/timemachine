const express = require('express');
const basicAuth = require('express-basic-auth');
const expressWs = require('express-ws');
const { exec } = require('child_process');
const path = require('path');
const { auth } = require('./config');

const app = express();
const wsInstance = expressWs(app);
const port = 3000;

// Basic authentication configuration
app.use(basicAuth({
    users: auth.users,
    challenge: true
}));

app.use(express.static('public'));
app.use(express.json());

// Get list of running containers
app.get('/containers', (req, res) => {
    exec('docker ps --format "{{.Names}}"', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error getting containers: ${error}`);
            return res.status(500).json({ error: 'Failed to get containers' });
        }
        const containers = stdout.trim().split('\n');
        res.json({ containers });
    });
});

// WebSocket connection handling
app.ws('/ws', (ws, req) => {
    // Send current time every second
    const timeInterval = setInterval(() => {
        ws.send(JSON.stringify({ type: 'time', data: new Date().toISOString() }));
    }, 1000);

    ws.on('close', () => {
        clearInterval(timeInterval);
    });
});

// Set system time
app.post('/setTime', (req, res) => {
    const { datetime, containers = [] } = req.body;
    console.log(datetime);
    // Set system time
    exec(`sudo date -s "${datetime}"`, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Error setting time: ${error}`);
            wsInstance.getWss().clients.forEach(client => {
                client.send(JSON.stringify({
                    type: 'error',
                    data: `Failed to set time: ${error}`
                }));
            });
            return res.status(500).json({ error: 'Failed to set time' });
        }

        // Notify time change success
        wsInstance.getWss().clients.forEach(client => {
            client.send(JSON.stringify({
                type: 'timeChange',
                data: `System time successfully set to: ${datetime}`
            }));
        });

        // Send success response immediately
        res.json({ success: true });

        // Only restart containers if any were selected
        if (containers.length > 0) {
            // Start container restarts asynchronously
            for (const container of containers) {
                try {
                    await new Promise((resolve, reject) => {
                        exec(`docker restart ${container}`, (error, stdout, stderr) => {
                            if (error) reject(error);
                            else resolve(stdout);
                        });
                    });
                    
                    // Broadcast each container restart immediately
                    wsInstance.getWss().clients.forEach(client => {
                        client.send(JSON.stringify({
                            type: 'containerRestart',
                            data: `Container "${container}" restarted successfully`
                        }));
                    });
                } catch (error) {
                    wsInstance.getWss().clients.forEach(client => {
                        client.send(JSON.stringify({
                            type: 'error',
                            data: `Failed to restart container "${container}": ${error}`
                        }));
                    });
                }
            }
        }
    });
});

// Reset to current time
app.post('/resetTime', (req, res) => {
    const { containers = [] } = req.body;
    // Get current time from NTP server and set it
    exec('sudo date -s "$(curl -s --head http://google.com | grep ^Date: | sed "s/Date: //g")"', async (error, stdout, stderr) => {
        if (error) {
            console.error(`Error resetting time: ${error}`);
            wsInstance.getWss().clients.forEach(client => {
                client.send(JSON.stringify({
                    type: 'error',
                    data: `Failed to reset time: ${error}`
                }));
            });
            return res.status(500).json({ error: 'Failed to reset time' });
        }

        // Notify time reset success
        wsInstance.getWss().clients.forEach(client => {
            client.send(JSON.stringify({
                type: 'timeChange',
                data: 'System time successfully reset to current time'
            }));
        });

        // Send success response immediately
        res.json({ success: true });

        // Only restart containers if any were selected
        if (containers.length > 0) {
            // Start container restarts asynchronously
            for (const container of containers) {
                try {
                    await new Promise((resolve, reject) => {
                        exec(`docker restart ${container}`, (error, stdout, stderr) => {
                            if (error) reject(error);
                            else resolve(stdout);
                        });
                    });
                    
                    // Broadcast each container restart immediately
                    wsInstance.getWss().clients.forEach(client => {
                        client.send(JSON.stringify({
                            type: 'containerRestart',
                            data: `Container "${container}" restarted successfully`
                        }));
                    });
                } catch (error) {
                    wsInstance.getWss().clients.forEach(client => {
                        client.send(JSON.stringify({
                            type: 'error',
                            data: `Failed to restart container "${container}": ${error}`
                        }));
                    });
                }
            }
        }
    });
});

app.listen(port, () => {
    console.log(`Time Machine server running at http://localhost:${port}`);
});
