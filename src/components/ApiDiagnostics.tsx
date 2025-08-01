import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const ApiDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      environment: window.location.hostname,
      apiUrl: '/api/smartsheet',
      testEndpoint: null,
      smartsheetEndpoint: null,
    };

    try {
      // Test the API test endpoint
      const testResponse = await fetch('/api/test');
      results.testEndpoint = {
        status: testResponse.status,
        ok: testResponse.ok,
        data: testResponse.ok ? await testResponse.json() : await testResponse.text()
      };
    } catch (error) {
      results.testEndpoint = { error: error.message };
    }

    try {
      // Test the Smartsheet endpoint
      const sheetResponse = await fetch('/api/smartsheet/sheets/4968623136264068');
      results.smartsheetEndpoint = {
        status: sheetResponse.status,
        ok: sheetResponse.ok,
        data: sheetResponse.ok ? 'Data received successfully' : await sheetResponse.text()
      };
    } catch (error) {
      results.smartsheetEndpoint = { error: error.message };
    }

    setDiagnostics(results);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>API Diagnostics</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runDiagnostics} disabled={loading} className="mb-4">
          {loading ? 'Running...' : 'Run Diagnostics'}
        </Button>
        
        {diagnostics && (
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};