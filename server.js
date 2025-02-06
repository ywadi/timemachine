const express = require('express');
const basicAuth = require('express-basic-auth');
const expressWs = require('express-ws');
const { exec } = require('child_process');
const path = require('path');
const { auth } = require('./config');

const app = express();
const wsInstance = expressWs(app);
const port = 3000;

// Utility function to execute commands with Promise
const execPromise = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve(stdout);
        });
    });
};

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
app.post('/setTime', async (req, res) => {
    const { datetime, containers = [] } = req.body;
    console.log(datetime);

    try {
        // Stop time synchronization
        await execPromise('sudo timedatectl set-ntp false');
        
        // Set system time
        await execPromise(`sudo date -s "${datetime}"`);

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
            for (const container of containers) {
                try {
                    await execPromise(`docker restart ${container}`);
                    
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
    } catch (error) {
        console.error(`Error setting time: ${error}`);
        wsInstance.getWss().clients.forEach(client => {
            client.send(JSON.stringify({
                type: 'error',
                data: `Failed to set time: ${error}`
            }));
        });
        return res.status(500).json({ error: 'Failed to set time' });
    }
});

// Reset to current time
app.post('/resetTime', async (req, res) => {
    const { containers = [] } = req.body;
    
    try {
        // Enable time synchronization and sync
        await execPromise('sudo timedatectl set-ntp true');
        
        // Wait a moment for the time to sync
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Force time sync
        await execPromise('sudo systemctl restart systemd-timesyncd');

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
            for (const container of containers) {
                try {
                    await execPromise(`docker restart ${container}`);
                    
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
    } catch (error) {
        console.error(`Error resetting time: ${error}`);
        wsInstance.getWss().clients.forEach(client => {
            client.send(JSON.stringify({
                type: 'error',
                data: `Failed to reset time: ${error}`
            }));
        });
        return res.status(500).json({ error: 'Failed to reset time' });
    }
});

app.listen(port, () => {
    console.log(`Time Machine server running at http://localhost:${port}`);
});
