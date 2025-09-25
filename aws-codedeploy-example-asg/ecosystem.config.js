module.exports = {
    apps: [
        {
            name: 'app',
            script: './index.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '200M',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
}
