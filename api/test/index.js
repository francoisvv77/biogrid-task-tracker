module.exports = async function (context, req) {
    context.log('Test API endpoint called');
    
    const SMARTSHEET_API_KEY = process.env.SMARTSHEET_API_KEY || "mcQHLLu8W9A0uUtAmgYaFsQE8yH1QWKUYNcoq";
    
    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: {
            message: 'API is working!',
            environment: process.env.NODE_ENV || 'development',
            hasApiKey: !!SMARTSHEET_API_KEY,
            apiKeyPrefix: SMARTSHEET_API_KEY ? SMARTSHEET_API_KEY.substring(0, 8) + '...' : 'NOT SET',
            timestamp: new Date().toISOString()
        }
    };
};