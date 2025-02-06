# Time Machine - Docker Container Time Control Panel

A powerful Node.js application that allows QA teams to manipulate system time and manage Docker containers for testing purposes. This tool provides a modern, intuitive web interface for changing system time and automatically restarting selected Docker containers.

## Features

- 🕒 Real-time system time display and manipulation
- 🐳 Dynamic Docker container management
- 🔄 Selective container restart functionality
- 📊 Real-time logging and status updates
- 🔐 Basic authentication for security
- 🌐 WebSocket-based real-time updates
- 💻 Modern, responsive UI design

## Prerequisites

- Node.js (v14 or higher)
- pnpm (package manager)
- Docker
- Linux-based operating system (for system time manipulation)
- Sudo privileges (for time manipulation commands)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd timeMachine
```

2. Set up configuration:
```bash
cp config.sample.js config.js
```
Then edit `config.js` with your desired username and password.

3. Install dependencies using pnpm:
```bash
pnpm install
```

4. Start the server:
```bash
sudo node server.js
```

The application will be available at `http://localhost:3000`

## Default Credentials
The default credentials in `config.sample.js` are:
- Username: `your_username`
- Password: `your_password`

Make sure to change these in your `config.js` file.

## Usage

1. **Authentication**
   - Access the application through your web browser
   - Enter the provided credentials when prompted

2. **Viewing System Time**
   - The current system time is displayed in real-time at the top of the control panel
   - Updates are pushed through WebSocket connection

3. **Changing System Time**
   - Select your desired date and time using the datetime picker
   - Choose which containers should be restarted after the time change
   - Click "Apply Time Change" to execute

4. **Resetting System Time**
   - Click "Reset System Time" to synchronize with an NTP server
   - Selected containers will be restarted automatically

5. **Container Management**
   - View all running Docker containers in real-time
   - Select specific containers for restart operations
   - Monitor container restart status through the logging panel

## Architecture

### Backend (`server.js`)
- Express.js server with WebSocket support
- Basic authentication middleware
- Docker container management through shell commands
- System time manipulation endpoints
- Real-time event broadcasting

### Frontend
- **HTML (`index.html`)**
  - Modern, responsive layout
  - Split-panel design for controls and logs
  - SVG icons for better visual feedback

- **JavaScript (`script.js`)**
  - WebSocket connection management
  - Real-time updates handling
  - Container selection and management
  - Asynchronous API communication
  - Dynamic logging system

## Security Considerations

- Basic authentication is implemented but should be enhanced for production
- Requires sudo privileges for time manipulation
- Docker commands are executed with proper error handling
- All API endpoints are protected behind authentication

## API Endpoints

- `GET /containers` - Retrieve list of running Docker containers
- `POST /setTime` - Set system time and restart containers
- `POST /resetTime` - Reset system time to current time and restart containers
- `WS /ws` - WebSocket endpoint for real-time updates

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

[Add your license here]

## Support

For support, please [create an issue](repository-issues-url) or contact the development team.
