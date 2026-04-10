const { execSync } = require('child_process');

try {
    console.log("Installing LangChain dependencies...");
    const msg = execSync('npm install @langchain/core@latest @langchain/google-genai@latest --legacy-peer-deps', { stdio: 'inherit' });
    console.log("Install completed!");
} catch (e) {
    console.error("Failed", e);
}
