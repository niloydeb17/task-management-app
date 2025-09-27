"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export function DebugKanban() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        setLoading(true);
        
        // Test 1: Check Supabase connection
        const { data: connectionTest, error: connectionError } = await supabase
          .from('teams')
          .select('count')
          .limit(1);
        
        if (connectionError) throw connectionError;
        
        // Test 2: Get teams
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, board_template')
          .limit(3);
        
        if (teamsError) throw teamsError;
        
        // Test 3: Get tasks
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, team_id, column_id')
          .limit(5);
        
        if (tasksError) throw tasksError;
        
        setDebugInfo({
          connection: connectionTest,
          teams: teams,
          tasks: tasks,
          teamCount: teams?.length || 0,
          taskCount: tasks?.length || 0
        });
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDebugInfo();
  }, []);

  if (loading) {
    return <div>Loading debug info...</div>;
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-red-600">Debug Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Connection Test:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(debugInfo?.connection, null, 2)}
          </pre>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Teams ({debugInfo?.teamCount}):</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm max-h-40 overflow-auto">
            {JSON.stringify(debugInfo?.teams, null, 2)}
          </pre>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Tasks ({debugInfo?.taskCount}):</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm max-h-40 overflow-auto">
            {JSON.stringify(debugInfo?.tasks, null, 2)}
          </pre>
        </div>
        
        <Button onClick={() => window.location.reload()}>
          Refresh Debug Info
        </Button>
      </CardContent>
    </Card>
  );
}
