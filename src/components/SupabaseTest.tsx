"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test connection by querying teams table
        const { data, error } = await supabase
          .from('teams')
          .select('id, name, type')
          .limit(3);
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
          setError('No data found in teams table');
        }
      } catch (err) {
        setConnectionStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    testConnection();
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Supabase Connection</span>
          {connectionStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {connectionStatus === 'connected' && <CheckCircle className="w-4 h-4 text-green-600" />}
          {connectionStatus === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {connectionStatus === 'loading' && (
          <p className="text-sm text-gray-600">Testing connection...</p>
        )}
        {connectionStatus === 'connected' && (
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              ✅ Connected
            </Badge>
            <p className="text-sm text-gray-600">
              Supabase is connected and ready to use!
            </p>
          </div>
        )}
        {connectionStatus === 'error' && (
          <div className="space-y-2">
            <Badge variant="destructive">❌ Connection Failed</Badge>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
