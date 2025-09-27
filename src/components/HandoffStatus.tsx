'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface HandoffStatusProps {
  currentTeamId: string;
}

interface HandoffTask {
  id: string;
  title: string;
  from_team: { name: string; color: string };
  to_team: { name: string; color: string };
  handoff_notes?: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export function HandoffStatus({ currentTeamId }: HandoffStatusProps) {
  const [handoffs, setHandoffs] = useState<HandoffTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHandoffs();
  }, [currentTeamId]);

  const fetchHandoffs = async () => {
    try {
      // For now, we'll simulate handoff data since we don't have the full handoff system in place
      // In a real implementation, you would query the handoffs table
      setHandoffs([]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching handoffs:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Recent Handoffs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">Loading handoffs...</div>
        </CardContent>
      </Card>
    );
  }

  if (handoffs.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Recent Handoffs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <ArrowRight className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No recent handoffs</p>
            <p className="text-sm">Tasks handed off to this team will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5" />
          Recent Handoffs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {handoffs.map((handoff) => (
            <div key={handoff.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: handoff.from_team.color }}
                  />
                  <span className="text-sm font-medium">{handoff.from_team.name}</span>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: handoff.to_team.color }}
                  />
                  <span className="text-sm font-medium">{handoff.to_team.name}</span>
                </div>
                <p className="text-sm text-gray-600">{handoff.title}</p>
                {handoff.handoff_notes && (
                  <p className="text-xs text-gray-500 mt-1">{handoff.handoff_notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={handoff.status === 'accepted' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {handoff.status === 'accepted' ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <Clock className="h-3 w-3 mr-1" />
                  )}
                  {handoff.status}
                </Badge>
                <span className="text-xs text-gray-500">
                  {new Date(handoff.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
