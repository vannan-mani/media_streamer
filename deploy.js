// Automated deployment using Node.js and ssh2
// This works cross-platform and doesn't require OpenSSH

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const config = {
    host: '115.112.70.85',
    port: 22,
    username: 'seithigal-youtube',
    password: 'Tech@123',
    remotePath: '/home/seithigal-youtube/dashboard',
    localZip: 'dashboard.zip'
};

const colors = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function build() {
    log('\n=========================================', 'cyan');
    log('🚀 SDI Dashboard Auto-Deployment', 'cyan');
    log('=========================================', 'cyan');
    log('');

    log('📦 Step 1/5: Building production bundle...', 'yellow');
    try {
        await execAsync('npm run build');
        log('✅ Build complete!', 'green');
    } catch (error) {
        log('❌ Build failed!', 'red');
        console.error(error.message);
        process.exit(1);
    }
}

async function createZip() {
    log('\n🗜️  Step 2/5: Creating deployment package...', 'yellow');

    const archiver = require('archiver');
    const output = fs.createWriteStream(config.localZip);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
        output.on('close', () => {
            log(`✅ Package created: ${config.localZip} (${archive.pointer()} bytes)`, 'green');
            resolve();
        });

        archive.on('error', reject);
        archive.pipe(output);
        archive.directory('dist/', false);
        archive.finalize();
    });
}

async function uploadAndDeploy() {
    log('\n📤 Step 3/5: Connecting to remote server...', 'yellow');

    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', () => {
            log('✅ Connected to remote server!', 'green');

            log('\n📂 Step 4/5: Uploading files...', 'yellow');

            conn.sftp((err, sftp) => {
                if (err) return reject(err);

                const localFile = path.join(process.cwd(), config.localZip);
                const remoteFile = `${config.remotePath}/dashboard.zip`;

                // Create remote directory first
                conn.exec(`mkdir -p ${config.remotePath}`, (err) => {
                    if (err) console.warn('Directory might already exist');

                    sftp.fastPut(localFile, remoteFile, {}, (err) => {
                        if (err) return reject(err);

                        log('✅ Upload complete!', 'green');

                        log('\n🎯 Step 5/5: Setting up on remote server...', 'yellow');

                        const commands = [
                            `cd ${config.remotePath}`,
                            'unzip -o dashboard.zip',
                            'rm -f dashboard.zip',
                            "pkill -f 'serve.*5173' || true",
                            'nohup npx serve -s . -l 5173 > server.log 2>&1 &',
                            'sleep 2',
                            'echo "✅ Dashboard is running!"'
                        ].join(' && ');

                        conn.exec(commands, (err, stream) => {
                            if (err) return reject(err);

                            stream.on('close', (code) => {
                                log('✅ Remote setup complete!', 'green');

                                log('\n=========================================', 'cyan');
                                log('🎉 DEPLOYMENT SUCCESSFUL!', 'green');
                                log('=========================================', 'cyan');
                                log('');
                                log(`Dashboard URL: http://${config.host}:5173`, 'green');
                                log('');
                                log('To view server logs, SSH to server and run:', 'yellow');
                                log(`   ssh ${config.username}@${config.host}`, 'yellow');
                                log(`   cat ${config.remotePath}/server.log`, 'yellow');
                                log('');

                                conn.end();
                                resolve();
                            });

                            stream.on('data', (data) => {
                                process.stdout.write(data.toString());
                            });

                            stream.stderr.on('data', (data) => {
                                process.stderr.write(data.toString());
                            });
                        });
                    });
                });
            });
        });

        conn.on('error', (err) => {
            log('❌ Connection failed!', 'red');
            reject(err);
        });

        conn.connect(config);
    });
}

async function cleanup() {
    // Optional: Remove local zip file
    // fs.unlinkSync(config.localZip);
}

async function main() {
    try {
        await build();
        await createZip();
        await uploadAndDeploy();
        await cleanup();
        process.exit(0);
    } catch (error) {
        log('\n❌ Deployment failed!', 'red');
        console.error(error);
        process.exit(1);
    }
}

main();
