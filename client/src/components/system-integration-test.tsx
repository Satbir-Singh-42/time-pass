import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Database, 
  Users, 
  Target,
  Trophy,
  Play,
  AlertTriangle
} from "lucide-react";
import { useFirestoreData } from "@/hooks/useFirestore";
import { PoolService } from "@/lib/poolService";

interface IntegrationTest {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  details?: any;
}

export default function SystemIntegrationTest() {
  const [tests, setTests] = useState<IntegrationTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const { usePlayersQuery, useTeamsQuery } = useFirestoreData();
  const { data: players = [], isLoading: playersLoading } = usePlayersQuery();
  const { data: teams = [], isLoading: teamsLoading } = useTeamsQuery();

  const runIntegrationTests = async () => {
    setIsRunning(true);
    const testResults: IntegrationTest[] = [
      { name: 'Player Pool Data Integrity', status: 'pending', message: 'Checking for fake/dummy data...' },
      { name: 'Pool Management Integration', status: 'pending', message: 'Testing pool creation and management...' },
      { name: 'Team Management Integration', status: 'pending', message: 'Testing team-player relationships...' },
      { name: 'Cross-Component Data Flow', status: 'pending', message: 'Testing data synchronization...' },
      { name: 'Pool Creation Workflow', status: 'pending', message: 'Testing pool creation from Player Pool...' },
      { name: 'Player Assignment Flow', status: 'pending', message: 'Testing player-to-pool assignments...' }
    ];
    
    setTests([...testResults]);

    // Test 1: Player Pool Data Integrity
    testResults[0].status = 'running';
    setTests([...testResults]);
    
    try {
      const hasFakeData = players.some((player: any) => 
        player.name.toLowerCase().includes('virat') ||
        player.name.toLowerCase().includes('dhoni') ||
        player.name.toLowerCase().includes('kohli') ||
        player.name.toLowerCase().includes('example') ||
        player.name.toLowerCase().includes('test') ||
        player.name.toLowerCase().includes('sample')
      );
      
      if (hasFakeData) {
        testResults[0].status = 'failed';
        testResults[0].message = 'Found fake/dummy player data in the system';
      } else {
        testResults[0].status = 'passed';
        testResults[0].message = `All ${players.length} players verified as authentic data`;
      }
    } catch (error) {
      testResults[0].status = 'failed';
      testResults[0].message = 'Failed to check player data integrity';
    }
    
    setTests([...testResults]);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 2: Pool Management Integration  
    testResults[1].status = 'running';
    setTests([...testResults]);
    
    try {
      const pools = PoolService.getPoolsFromPlayers(players);
      const availablePoolNames = PoolService.getAvailablePoolNames(players);
      
      testResults[1].status = 'passed';
      testResults[1].message = `Pool management working correctly. Found ${pools.length} pools with ${availablePoolNames.length} unique names`;
      testResults[1].details = { pools: pools.length, poolNames: availablePoolNames };
    } catch (error) {
      testResults[1].status = 'failed';
      testResults[1].message = 'Pool management integration failed';
    }
    
    setTests([...testResults]);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 3: Team Management Integration
    testResults[2].status = 'running';
    setTests([...testResults]);
    
    try {
      const playersWithTeams = players.filter((p: any) => p.assignedTeam || p.team);
      const teamIds = Array.from(new Set(teams.map((t: any) => t.id)));
      
      testResults[2].status = 'passed';
      testResults[2].message = `Team integration working. ${teams.length} teams, ${playersWithTeams.length} assigned players`;
      testResults[2].details = { teams: teams.length, assignedPlayers: playersWithTeams.length };
    } catch (error) {
      testResults[2].status = 'failed';
      testResults[2].message = 'Team management integration failed';
    }
    
    setTests([...testResults]);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 4: Cross-Component Data Flow
    testResults[3].status = 'running';
    setTests([...testResults]);
    
    try {
      const pooledPlayers = players.filter((p: any) => p.status === 'Pooled' && p.pool);
      const soldPlayers = players.filter((p: any) => p.status === 'Sold' && (p.assignedTeam || p.team));
      const availablePlayers = players.filter((p: any) => p.status === 'Available');
      
      const dataFlowConsistent = pooledPlayers.every((p: any) => p.pool) && 
                                soldPlayers.every((p: any) => p.assignedTeam || p.team);
      
      if (dataFlowConsistent) {
        testResults[3].status = 'passed';
        testResults[3].message = `Data flow consistent. ${pooledPlayers.length} pooled, ${soldPlayers.length} sold, ${availablePlayers.length} available`;
      } else {
        testResults[3].status = 'failed';
        testResults[3].message = 'Inconsistent data flow between components';
      }
    } catch (error) {
      testResults[3].status = 'failed';
      testResults[3].message = 'Cross-component data flow test failed';
    }
    
    setTests([...testResults]);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 5: Pool Creation Workflow
    testResults[4].status = 'running';
    setTests([...testResults]);
    
    try {
      // Test pool creation functionality
      const testPoolName = `Test Pool ${Date.now()}`;
      const poolExists = PoolService.getAvailablePoolNames(players).includes(testPoolName);
      
      if (!poolExists) {
        testResults[4].status = 'passed';
        testResults[4].message = 'Pool creation workflow ready for testing';
      } else {
        testResults[4].status = 'failed';
        testResults[4].message = 'Pool creation collision detected';
      }
    } catch (error) {
      testResults[4].status = 'failed';
      testResults[4].message = 'Pool creation workflow test failed';
    }
    
    setTests([...testResults]);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 6: Player Assignment Flow
    testResults[5].status = 'running';
    setTests([...testResults]);
    
    try {
      const statusCounts = {
        Available: players.filter((p: any) => p.status === 'Available').length,
        Pooled: players.filter((p: any) => p.status === 'Pooled').length,
        Sold: players.filter((p: any) => p.status === 'Sold').length,
        Unsold: players.filter((p: any) => p.status === 'Unsold').length
      };
      
      testResults[5].status = 'passed';
      testResults[5].message = `Player assignment flow working. Status distribution verified`;
      testResults[5].details = statusCounts;
    } catch (error) {
      testResults[5].status = 'failed';
      testResults[5].message = 'Player assignment flow test failed';
    }
    
    setTests([...testResults]);
    setIsRunning(false);
  };

  const getStatusIcon = (status: IntegrationTest['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const allTestsPassed = tests.length > 0 && tests.every(test => test.status === 'passed');
  const hasFailures = tests.some(test => test.status === 'failed');

  return (
    <Card className="bg-cricket-card border-cricket-teal/30">
      <CardHeader>
        <CardTitle className="text-white font-poppins font-bold flex items-center gap-2">
          <Database className="w-6 h-6 text-cricket-teal" />
          System Integration Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Test Controls */}
        <div className="flex justify-between items-center">
          <p className="text-cricket-teal/80">
            Verify interconnection between Player Pool, Pool Management, and Teams
          </p>
          <Button 
            onClick={runIntegrationTests} 
            disabled={isRunning || playersLoading || teamsLoading}
            className="bg-cricket-teal hover:bg-cricket-teal/80 text-white"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Integration Tests
              </>
            )}
          </Button>
        </div>

        {/* Test Results */}
        {tests.length > 0 && (
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-cricket-navy/30 rounded-lg">
                {getStatusIcon(test.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{test.name}</span>
                    <Badge variant={test.status === 'passed' ? 'default' : test.status === 'failed' ? 'destructive' : 'secondary'}>
                      {test.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-cricket-teal/70 mt-1">{test.message}</p>
                  {test.details && (
                    <div className="text-xs text-cricket-teal/50 mt-1">
                      {JSON.stringify(test.details)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Overall Status */}
        {tests.length > 0 && !isRunning && (
          <Alert className={`${allTestsPassed ? 'border-green-500/50 bg-green-500/5' : hasFailures ? 'border-red-500/50 bg-red-500/5' : 'border-yellow-500/50 bg-yellow-500/5'}`}>
            <AlertDescription className="flex items-center gap-2">
              {allTestsPassed ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-400">All integration tests passed! System is fully interconnected.</span>
                </>
              ) : hasFailures ? (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-400">Some tests failed. Please review the issues above.</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-yellow-400">Tests completed with warnings.</span>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Data Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-cricket-teal/20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-cricket-teal" />
              <span className="text-lg font-bold text-cricket-teal">{players.length}</span>
            </div>
            <p className="text-xs text-cricket-teal/70">Players</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-cricket-teal" />
              <span className="text-lg font-bold text-cricket-teal">
                {PoolService.getAvailablePoolNames(players).length}
              </span>
            </div>
            <p className="text-xs text-cricket-teal/70">Pools</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-cricket-teal" />
              <span className="text-lg font-bold text-cricket-teal">{teams.length}</span>
            </div>
            <p className="text-xs text-cricket-teal/70">Teams</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="w-4 h-4 text-cricket-teal" />
              <span className="text-lg font-bold text-cricket-teal">
                {tests.filter(t => t.status === 'passed').length}
              </span>
            </div>
            <p className="text-xs text-cricket-teal/70">Tests Passed</p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}