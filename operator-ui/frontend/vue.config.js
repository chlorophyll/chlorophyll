module.exports = {
    devServer: {
        proxy: {
            '^/api': {
                target: 'http://localhost:3000',
            },
        },
    },
    chainWebpack(config) {
        if (process.env.NODE_ENV === 'production') {
            config.plugins.delete('friendly-errors');
        }
    }
};