const fs = require('fs');
const { execSync } = require('child_process');

console.log("Cleaning up old locked dependencies...");
try {
    fs.rmSync('./node_modules/@langchain', { recursive: true, force: true });
    fs.rmSync('./package-lock.json', { force: true });
} catch (e) {
    console.log("Cleanup skipping, files might not exist.");
}

console.log("Running fresh npm install with legacy-peer-deps...");
try {
    const installOutput = execSync('npm.cmd install --legacy-peer-deps').toString();
    fs.writeFileSync('install_fresh.log', installOutput);
    console.log("NPM Install completed successfully!");
} catch (e) {
    let errOut = e.stdout ? e.stdout.toString() + "\n" + e.message : e.message;
    fs.writeFileSync('install_fresh.log', errOut);
    console.log("NPM Install exited with errors. Check install_fresh.log");
}

console.log("Testing server boot...");
try {
    execSync('npm.cmd run server', { timeout: 10000 });
} catch (e) {
    let errOut = e.stdout ? e.stdout.toString() + "\n" + e.message : e.message;
    fs.writeFileSync('server_boot.log', errOut);
    console.log("Server boot threw an error or timed out gracefully. Check server_boot.log");
}
