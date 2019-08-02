module.exports = {
    devServer: {
        proxy: {
            '^/api': {
                target: 'localhost:4000',
            },
        },
    },
};
