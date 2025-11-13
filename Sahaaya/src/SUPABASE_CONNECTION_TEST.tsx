/**
 * ========================================================================
 * SUPABASE CONNECTION TEST COMPONENT
 * ========================================================================
 * This is a test component to verify Supabase client initialization.
 * 
 * USAGE:
 * 1. Temporarily import this component into App.tsx
 * 2. Render it: <SupabaseConnectionTest />
 * 3. Check browser console for test results
 * 4. Remove after verification
 * 
 * DO NOT include this in production builds!
 * ========================================================================
 */

import React, { useEffect, useState } from 'react';
import { supabase } from './utils/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  details?: any;
}

export function SupabaseConnectionTest() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Client Initialization', status: 'pending' },
    { name: 'Authentication Check', status: 'pending' },
    { name: 'Database Query', status: 'pending' },
    { name: 'Community Members Check', status: 'pending' }
  ]);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test));
  };

  const runTests = async () => {
    console.log('🧪 Starting Supabase Connection Tests...\n');

    // Test 1: Client Initialization
    try {
      if (!supabase) {
        throw new Error('Supabase client is undefined');
      }
      console.log('✅ Test 1: Supabase client initialized');
      console.log('   Client:', supabase);
      updateTest(0, {
        status: 'success',
        message: 'Client is properly initialized',
        details: { url: (supabase as any).supabaseUrl }
      });
    } catch (error: any) {
      console.error('❌ Test 1 Failed:', error.message);
      updateTest(0, {
        status: 'error',
        message: error.message
      });
      return; // Stop tests if client isn't initialized
    }

    // Test 2: Authentication Check
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      console.log('✅ Test 2: Authentication working');
      console.log('   User:', user ? `${user.email} (${user.id})` : 'Not logged in');
      updateTest(1, {
        status: 'success',
        message: user ? `Logged in as ${user.email}` : 'No user logged in (this is OK)',
        details: user ? { id: user.id, email: user.email } : null
      });
    } catch (error: any) {
      console.error('❌ Test 2 Failed:', error.message);
      updateTest(1, {
        status: 'error',
        message: error.message
      });
    }

    // Test 3: Database Query
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('id, name')
        .limit(5);
      
      if (error) throw error;
      
      console.log('✅ Test 3: Database query successful');
      console.log('   Found', data?.length || 0, 'communities');
      console.log('   Sample:', data?.[0]);
      updateTest(2, {
        status: 'success',
        message: `Found ${data?.length || 0} communities`,
        details: data?.[0]
      });
    } catch (error: any) {
      console.error('❌ Test 3 Failed:', error.message);
      updateTest(2, {
        status: 'error',
        message: error.message
      });
    }

    // Test 4: Community Members Check
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        updateTest(3, {
          status: 'success',
          message: 'Skipped (no user logged in)'
        });
        return;
      }

      const { data, error } = await supabase
        .from('community_members')
        .select('id, community_id, role')
        .eq('user_id', user.id)
        .limit(5);
      
      if (error) throw error;
      
      console.log('✅ Test 4: Community members query successful');
      console.log('   User is member of', data?.length || 0, 'communities');
      console.log('   Memberships:', data);
      updateTest(3, {
        status: 'success',
        message: `Member of ${data?.length || 0} communities`,
        details: data
      });
    } catch (error: any) {
      console.error('❌ Test 4 Failed:', error.message);
      updateTest(3, {
        status: 'error',
        message: error.message
      });
    }

    console.log('\n🏁 Tests Complete!\n');
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  const allTestsComplete = tests.every(t => t.status !== 'pending');
  const hasErrors = tests.some(t => t.status === 'error');

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-6 w-6" />
          Supabase Connection Test
        </CardTitle>
        <p className="text-sm text-gray-600">
          Testing Supabase client initialization and database connectivity
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {tests.map((test, index) => (
          <div 
            key={index} 
            className="flex items-start gap-3 p-3 rounded-lg border"
            style={{ 
              backgroundColor: test.status === 'success' ? '#f0fdf4' : 
                             test.status === 'error' ? '#fef2f2' : '#f9fafb',
              borderColor: test.status === 'success' ? '#86efac' :
                          test.status === 'error' ? '#fca5a5' : '#e5e7eb'
            }}
          >
            <div className="mt-0.5">
              {getStatusIcon(test.status)}
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{test.name}</h4>
              {test.message && (
                <p className="text-sm text-gray-600 mt-1">{test.message}</p>
              )}
              {test.details && (
                <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify(test.details, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}

        {allTestsComplete && (
          <div className="pt-4 border-t">
            <div className={`p-4 rounded-lg ${hasErrors ? 'bg-red-50' : 'bg-green-50'}`}>
              <h4 className={`font-medium ${hasErrors ? 'text-red-900' : 'text-green-900'}`}>
                {hasErrors ? '❌ Some Tests Failed' : '✅ All Tests Passed'}
              </h4>
              <p className={`text-sm mt-1 ${hasErrors ? 'text-red-700' : 'text-green-700'}`}>
                {hasErrors 
                  ? 'Check the console for error details and verify your Supabase configuration.'
                  : 'Supabase client is properly initialized and connected to the database.'}
              </p>
            </div>
            <Button 
              onClick={runTests} 
              className="w-full mt-4"
              style={{ backgroundColor: '#41695e' }}
            >
              Run Tests Again
            </Button>
          </div>
        )}

        <div className="pt-4 border-t text-xs text-gray-500">
          <p>⚠️ This is a development test component. Remove before deploying to production.</p>
          <p className="mt-1">Check your browser console for detailed test output.</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. In App.tsx, temporarily add:
 *    import { SupabaseConnectionTest } from './SUPABASE_CONNECTION_TEST';
 * 
 * 2. Add to your render:
 *    <SupabaseConnectionTest />
 * 
 * 3. Open browser, navigate to the page
 * 
 * 4. Check console output and UI results
 * 
 * 5. Remove the component and import after verification
 * 
 * Expected Results:
 * - All 4 tests should show green checkmarks
 * - Console should show detailed test results
 * - No errors should appear
 */
