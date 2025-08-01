module.exports = async function (context, req) {
    context.log('Smartsheet API proxy function processed a request.');
    context.log('Request path:', req.params.path);
    context.log('Request method:', req.method);

    // Get the API key from environment variables
    const SMARTSHEET_API_KEY = process.env.SMARTSHEET_API_KEY || "mcQHLLu8W9A0uUtAmgYaFsQE8yH1QWKUYNcoq";
    
    // Log which API key is being used (masked for security)
    context.log('Using API key:', SMARTSHEET_API_KEY ? SMARTSHEET_API_KEY.substring(0, 8) + '...' : 'NOT SET');
    
    // Extract the path from the request
    const path = req.params.path;
    const method = req.method;
    const body = req.body;
    
    // Construct the Smartsheet API URL
    const smartsheetUrl = `https://api.smartsheet.com/2.0/${path}`;
    context.log('Calling Smartsheet URL:', smartsheetUrl);
    
    try {
        // Prepare headers
        const headers = {
            'Authorization': `Bearer ${SMARTSHEET_API_KEY}`,
            'Content-Type': 'application/json',
        };

        // Make the request to Smartsheet API
        const response = await fetch(smartsheetUrl, {
            method: method,
            headers: headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const responseData = await response.text();
        let jsonData;
        
        try {
            jsonData = JSON.parse(responseData);
        } catch {
            jsonData = responseData;
        }

        context.res = {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
            body: jsonData
        };
    } catch (error) {
        context.log.error('Error calling Smartsheet API:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        };
    }
};