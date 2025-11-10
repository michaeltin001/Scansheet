#!/bin/bash
#
# This script automates the deployment and setup of the Scansheet application
# as per the instructions in README.md.
#
# It should be run from the home directory of the user you configured
# on the Raspberry Pi.
#

set -e

if [ -z "$USER" ]; then
    CURRENT_USER=$(whoami)
else
    CURRENT_USER=$USER
fi

if [ -z "$HOME" ]; then
    USER_HOME=$(eval echo "~$CURRENT_USER")
else
    USER_HOME=$HOME
fi

REPO_URL="https://github.com/michaeltin001/Scansheet.git"
PROJECT_DIR_NAME="Scansheet"
PROJECT_PATH="$USER_HOME/$PROJECT_DIR_NAME"
CLIENT_SCRIPT_PATH="$USER_HOME/scansheet-client.sh"
CLIENT_LOG_FILE="$USER_HOME/scansheet-client.log"
AUTOSTART_FILE_PATH="/etc/xdg/autostart/scansheet-client.desktop"

log() {
    echo "[INFO] $1"
}

warn() {
    echo "-------------------------------------------------------------"
    echo "[WARNING] $1"
    echo "-------------------------------------------------------------"
}

error_exit() {
    echo "[ERROR] $1" 1>&2
    exit 1
}

log "Starting Scansheet Deployment as user: $CURRENT_USER"
log "User home directory: $USER_HOME"

cd "$USER_HOME" || error_exit "Could not navigate to home directory: $USER_HOME"

if [ -d "$PROJECT_PATH" ]; then
    warn "Project directory '$PROJECT_PATH' already exists. Skipping clone."
else
    log "Cloning Scansheet repository..."
    git clone "$REPO_URL" "$PROJECT_PATH" || error_exit "Failed to clone repository."
fi

cd "$PROJECT_PATH" || error_exit "Could not navigate to project directory: $PROJECT_PATH"
log "Entered directory: $(pwd)"

log "Installing server and client dependencies..."
npm run install-all --prefix server || error_exit "Failed to install dependencies."

log "Building the client application..."
npm run build --prefix client || error_exit "Failed to build client."

cd "$PROJECT_PATH/server" || error_exit "Could not change to server directory."
log "Entered directory: $(pwd)"

log "Starting server with PM2..."
pm2 start server.js --name "scansheet-server" || error_exit "Failed to start server with PM2."

log "Setting up PM2 startup..."
pm2 startup

warn "PM2 has generated a command (it probably starts with 'sudo ...').
You MUST copy that command and run it in your terminal right now.
This is required to enable automatic startup on boot.
The script will pause for 20 seconds to allow you to do this."

sleep 20

log "Saving PM2 process list..."
pm2 save || error_exit "Failed to save PM2 process list."

log "Creating Kiosk Mode client script at $CLIENT_SCRIPT_PATH..."

cat << EOF > "$CLIENT_SCRIPT_PATH"
#!/bin/bash

export DISPLAY=:0

LOG_FILE="$CLIENT_LOG_FILE"

echo "--- Script started at \$(date) ---" > \$LOG_FILE

sleep 15

echo "Desktop ready, now waiting for server..." >> \$LOG_FILE

until curl --output /dev/null --silent --head --fail http://localhost:3000; do
    echo "Server is not ready yet. Retrying in 5 seconds..." >> \$LOG_FILE
    sleep 5
done

echo "Server is up! Launching Chromium." >> \$LOG_FILE

chromium --kiosk --disable-infobars --noerrdialogs http://localhost:3000 >> \$LOG_FILE 2>&1
EOF

if [ ! -f "$CLIENT_SCRIPT_PATH" ]; then
    error_exit "Failed to create client script at $CLIENT_SCRIPT_PATH."
fi

log "Making client script executable..."
chmod +x "$CLIENT_SCRIPT_PATH" || error_exit "Failed to make client script executable."

log "Creating autostart .desktop file at $AUTOSTART_FILE_PATH..."
log "You will be prompted for your password for 'sudo'."

cat << EOF | sudo tee "$AUTOSTART_FILE_PATH" > /dev/null
[Desktop Entry]
Name=Scansheet Client
Exec=$CLIENT_SCRIPT_PATH
Type=Application
EOF

if [ ! -f "$AUTOSTART_FILE_PATH" ]; then
    error_exit "Failed to create autostart file. 'sudo' might have failed."
fi

cd "$USER_HOME"

log "The script has finished."
log "Please reboot your Raspberry Pi with 'sudo reboot' to test the full setup."

exit 0
