const { execSync } = require('child_process');

try {
    const output = execSync('netstat -ano | findstr :3001').toString();
    const lines = output.trim().split('\n');

    if (lines.length > 0 && lines[0].includes('3001')) {
        const parts = lines[0].trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== "0") {
            console.log(`Found process on 3001 with PID ${pid}. Killing...`);
            execSync(`taskkill /PID ${pid} /F`);
            console.log("Process successfully terminated.");
        }
    }
} catch (e) {
    console.log("Port 3001 is already free.");
}
