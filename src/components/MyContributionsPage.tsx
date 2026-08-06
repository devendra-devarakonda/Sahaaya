import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { getUserDashboardContributions, reportHelpOffer, subscribeToDashboardContributions, unsubscribeChannel } from '../utils/supabaseService';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Heart, MapPin, Calendar, DollarSign, MessageSquare, AlertTriangle, Flag, CheckCircle2, XCircle, Shield } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface Contribution {
  id: string;
  user_id: string;
  request_id: string;
  request_title: string;
  category: string;
  amount: number;
  urgency: string;
  status: string;
  request_status: string;
  report_count: number;
  contribution_type: string;
  source_type: 'global' | 'community';
  community_id?: string;
  message?: string;
  created_at: string;
}

export function MyContributionsPage() {
  const { user } = useAuth();
  const [allContributions, setAllContributions] = useState<Contribution[]>([]);
  const [filteredContributions, setFilteredContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matched' | 'completed' | 'fraud'>('matched');
  const [reportingOfferId, setReportingOfferId] = useState<string | null>(null);

  useEffect(() => {
    fetchContributions();
    
    // Subscribe to real-time updates
    let subscription: any;
    if (user) {
      subscription = subscribeToDashboardContributions(
        user.id,
        () => fetchContributions()
      );
    }

    return () => {
      if (subscription) {
        unsubscribeChannel(subscription);
      }
    };
  }, [user]);

  useEffect(() => {
    // Filter contributions based on active tab
    if (activeTab === 'matched') {
      setFilteredContributions(allContributions.filter(c => 
        c.status === 'matched' || c.status === 'pending' || c.status === 'accepted'
      ));
    } else if (activeTab === 'completed') {
      setFilteredContributions(allContributions.filter(c => c.status === 'completed'));
    } else if (activeTab === 'fraud') {
      setFilteredContributions(allContributions.filter(c => c.status === 'fraud'));
    }
  }, [activeTab, allContributions]);

  async function fetchContributions() {
    setLoading(true);
    const result = await getUserDashboardContributions();
    
    if (result.success && result.data) {
      setAllContributions(result.data as Contribution[]);
    } else {
      toast.error(result.error || 'Failed to load contributions');
    }
    setLoading(false);
  }

  async function handleReportOffer(offerId: string, sourceType: 'global' | 'community') {
    const result = await reportHelpOffer(offerId, sourceType);
    
    if (result.success) {
      toast.success(result.message || 'Help offer reported successfully');
      setReportingOfferId(null);
      fetchContributions(); // Refresh the list
    } else {
      toast.error(result.error || 'Failed to report help offer');
    }
  }

  function getStatusBadge(status: string, reportCount: number) {
    if (status === 'fraud') {
      return (
        <Badge className="bg-red-100 text-red-800 border border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Fraud
        </Badge>
      );
    }
    
    if (status === 'completed') {
      return (
        <Badge className="bg-green-100 text-green-800 border border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
        <Heart className="w-3 h-3 mr-1" />
        Matched
      </Badge>
    );
  }

  function getCategoryIcon(category: string) {
    const icons: { [key: string]: React.ReactNode } = {
      'Medical': '🏥',
      'Education': '📚',
      'Food': '🍽️',
      'Shelter': '🏠',
      'Emergency': '🚨',
      'Other': '💙'
    };
    return icons[category] || '💙';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#41695e] mx-auto"></div>
          <p className="mt-4 text-[#033b4a]">Loading your contributions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fefa] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[#033b4a] mb-2">My Contributions</h1>
          <p className="text-gray-600">Track your help offers and their status</p>
        </div>

        {/* Tabs for filtering */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="matched" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Matched
              <Badge className="ml-1 bg-yellow-100 text-yellow-800">
                {allContributions.filter(c => 
                  c.status === 'matched' || c.status === 'pending' || c.status === 'accepted'
                ).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completed
              <Badge className="ml-1 bg-green-100 text-green-800">
                {allContributions.filter(c => c.status === 'completed').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="fraud" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Fraud
              <Badge className="ml-1 bg-red-100 text-red-800">
                {allContributions.filter(c => c.status === 'fraud').length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Matched Tab Content */}
          <TabsContent value="matched" className="mt-6">
            {filteredContributions.length === 0 ? (
              <Card className="p-12 text-center">
                <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-[#033b4a] mb-2">No Matched Contributions</h3>
                <p className="text-gray-600">
                  Your active help offers will appear here
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredContributions.map((contribution) => (
                  <ContributionCard
                    key={contribution.id}
                    contribution={contribution}
                    onReport={() => setReportingOfferId(contribution.id)}
                    getStatusBadge={getStatusBadge}
                    getCategoryIcon={getCategoryIcon}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Tab Content */}
          <TabsContent value="completed" className="mt-6">
            {filteredContributions.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-[#033b4a] mb-2">No Completed Contributions</h3>
                <p className="text-gray-600">
                  Completed help requests will appear here
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredContributions.map((contribution) => (
                  <ContributionCard
                    key={contribution.id}
                    contribution={contribution}
                    onReport={() => setReportingOfferId(contribution.id)}
                    getStatusBadge={getStatusBadge}
                    getCategoryIcon={getCategoryIcon}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Fraud Tab Content */}
          <TabsContent value="fraud" className="mt-6">
            {filteredContributions.length === 0 ? (
              <Card className="p-12 text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-[#033b4a] mb-2">No Fraud Reports</h3>
                <p className="text-gray-600">
                  Help offers flagged as fraud will appear here
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredContributions.map((contribution) => (
                  <ContributionCard
                    key={contribution.id}
                    contribution={contribution}
                    onReport={() => setReportingOfferId(contribution.id)}
                    getStatusBadge={getStatusBadge}
                    getCategoryIcon={getCategoryIcon}
                    isFraud={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Report Confirmation Dialog */}
        <AlertDialog open={!!reportingOfferId} onOpenChange={() => setReportingOfferId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-600" />
                Report This Help Offer?
              </AlertDialogTitle>
              <AlertDialogDescription>
                You are about to report this help contribution as fraudulent or suspicious. 
                This action cannot be undone. If 10 or more users report this contribution, 
                it will be automatically marked as fraud.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const contribution = allContributions.find(c => c.id === reportingOfferId);
                  if (contribution) {
                    handleReportOffer(contribution.id, contribution.source_type);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Report as Fraud
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// Contribution Card Component
function ContributionCard({
  contribution,
  onReport,
  getStatusBadge,
  getCategoryIcon,
  isFraud = false
}: {
  contribution: Contribution;
  onReport: () => void;
  getStatusBadge: (status: string, reportCount: number) => React.ReactNode;
  getCategoryIcon: (category: string) => React.ReactNode;
  isFraud?: boolean;
}) {
  return (
    <Card className={`p-6 hover:shadow-lg transition-shadow ${isFraud ? 'border-red-200 bg-red-50' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{getCategoryIcon(contribution.category)}</div>
          <div>
            <h3 className="text-[#033b4a] mb-1">{contribution.request_title}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {contribution.category}
              </Badge>
              {contribution.source_type === 'community' && contribution.community_name && (
                <Badge variant="outline" className="text-xs bg-[#e8f5f0] text-[#41695e] border-[#41695e]">
                  {contribution.community_name}
                </Badge>
              )}
              {getStatusBadge(contribution.status, contribution.report_count)}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        {contribution.amount && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>Amount Needed: ₹{contribution.amount.toLocaleString()}</span>
          </div>
        )}
        
        {(contribution.city || contribution.state) && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>
              {contribution.city && contribution.state 
                ? `${contribution.city}, ${contribution.state}`
                : contribution.city || contribution.state}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Offered on {new Date(contribution.created_at).toLocaleDateString()}</span>
        </div>

        {contribution.message && (
          <div className="flex items-start gap-2 mt-3 p-3 bg-gray-50 rounded-lg">
            <MessageSquare className="w-4 h-4 mt-0.5" />
            <p className="text-sm text-gray-700 italic">"{contribution.message}"</p>
          </div>
        )}
      </div>

      {/* Report Count Warning */}
      {contribution.report_count > 0 && contribution.status !== 'fraud' && (
        <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded mb-3">
          <AlertTriangle className="w-4 h-4" />
          <span>Reported {contribution.report_count} time(s)</span>
        </div>
      )}

      {/* Fraud Warning */}
      {isFraud && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-100 p-3 rounded mb-3 border border-red-200">
          <Shield className="w-5 h-5" />
          <div>
            <p className="font-semibold">Flagged as Fraud</p>
            <p className="text-xs">This contribution was reported by multiple users</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-xs text-gray-500">
          {contribution.source_type === 'global' ? 'Global Help' : 'Community Help'}
        </div>
        
        {contribution.status !== 'fraud' && contribution.status !== 'completed' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReport}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Flag className="w-4 h-4 mr-2" />
            Report
          </Button>
        )}
      </div>
    </Card>
  );
}