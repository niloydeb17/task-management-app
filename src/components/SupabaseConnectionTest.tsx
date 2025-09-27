"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [testData, setTestData] = useState<any>(null);

  const testConnection = async () => {
    try {
      setConnectionStatus('loading');
      setError(null);
      
      console.log('Testing Supabase connection...');
      console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      // Test 1: Simple connection test
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .limit(1);
      
      console.log('Supabase response:', { data, error });
      
      if (error) {
        throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`);
      }
      
      if (data && data.length > 0) {
        setConnectionStatus('connected');
        setTestData(data[0]);
      } else {
        setConnectionStatus('error');
        setError('No data returned from Supabase');
      }
    } catch (err) {
      console.error('Connection test failed:', err);
      setConnectionStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Supabase Connection Test</span>
          {connectionStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {connectionStatus === 'connected' && <CheckCircle className="w-4 h-4 text-green-600" />}
          {connectionStatus === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectionStatus === 'loading' && (
          <p className="text-sm text-gray-600">Testing connection...</p>
        )}
        
        {connectionStatus === 'connected' && (
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              ✅ Connected Successfully
            </Badge>
            <p className="text-sm text-gray-600">
              Supabase is connected and working!
            </p>
            {testData && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                <strong>Test Data:</strong> {testData.name} (ID: {testData.id})
              </div>
            )}
          </div>
        )}
        
        {connectionStatus === 'error' && (
          <div className="space-y-2">
            <Badge variant="destructive">❌ Connection Failed</Badge>
            <p className="text-sm text-red-600">{error}</p>
            <div className="mt-2 p-2 bg-red-50 rounded text-xs">
              <strong>Debug Info:</strong><br/>
              URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}<br/>
              Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}
            </div>
          </div>
        )}
        
        <Button 
          onClick={testConnection} 
          variant="outline" 
          size="sm"
          disabled={connectionStatus === 'loading'}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Test Again
        </Button>
      </CardContent>
    </Card>
  );
}
