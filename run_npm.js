const fs = require('fs');
const { execSync } = require('child_process');

try {
    let out = execSync('npm.cmd install @langchain/core@latest @langchain/google-genai@latest --legacy-peer-deps').toString();
    fs.writeFileSync('install.log', out || "Success but empty output");
} catch (e) {
    let errorMsg = e.stdout ? e.stdout.toString() + '\n' + e.message : e.message;
    fs.writeFileSync('install.log', errorMsg);
}
