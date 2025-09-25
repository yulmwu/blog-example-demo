module.exports = {
    apps: [
        {
            name: 'auth-api',
            script: 'dist/main.js',
            cwd: '/opt/app',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: '3000',
            },
            listen_timeout: 8000,
            kill_timeout: 8000,
        },
    ],
}
