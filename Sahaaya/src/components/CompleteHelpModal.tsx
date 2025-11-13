import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, Users, Phone, Mail, MessageSquare, AlertCircle } from 'lucide-react';
import { getRequestHelpers, completeHelpRequest } from '../utils/supabaseService';

interface Helper {
  id: string;
  helper_id: string;
  helper_name?: string;
  helper_email?: string;
  helper_phone?: string;
  message?: string;
  status: string;
  created_at: string;
}

interface CompleteHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: {
    id: string;
    title: string;
    category: string;
    amount_needed?: number;
    amount?: number;
    description?: string;
    source_type: 'global' | 'community';
    status: string;
  };
  onComplete: () => void;
}

export function CompleteHelpModal({
  isOpen,
  onClose,
  request,
  onComplete
}: CompleteHelpModalProps) {
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && request) {
      loadHelpers();
    }
  }, [isOpen, request]);

  const loadHelpers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getRequestHelpers(request.id, request.source_type);
      
      if (response.success && response.data) {
        setHelpers(response.data);
      } else {
        setError(response.error || 'Failed to load helpers');
      }
    } catch (err) {
      console.error('Error loading helpers:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    setError(null);

    try {
      const response = await completeHelpRequest(request.id, request.source_type);
      
      if (response.success) {
        onComplete();
        onClose();
      } else {
        setError(response.error || 'Failed to complete help request');
      }
    } catch (err) {
      console.error('Error completing request:', err);
      setError('An unexpected error occurred');
    } finally {
      setCompleting(false);
      setShowConfirm(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: '#033b4a' }}>
            Complete Help Request
          </DialogTitle>
          <DialogDescription>
            Review the helpers who offered assistance and mark this request as completed
          </DialogDescription>
        </DialogHeader>

        {/* Request Details */}
        <div className="border rounded-lg p-4 mb-4" style={{ backgroundColor: '#f9fefa' }}>
          <h3 className="mb-2" style={{ color: '#033b4a' }}>{request.title}</h3>
          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            <span>Category: <strong>{request.category}</strong></span>
            {(request.amount_needed || request.amount) && (
              <span>Amount: <strong>₹{Math.round(request.amount_needed || request.amount || 0).toLocaleString()}</strong></span>
            )}
            <Badge className={request.source_type === 'community' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
              {request.source_type === 'community' ? '🏘️ Community' : '🌐 Global'}
            </Badge>
          </div>
          {request.description && (
            <p className="text-sm text-gray-600 mt-2">{request.description}</p>
          )}
        </div>

        {/* Helpers List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5" style={{ color: '#41695e' }} />
            <h4 style={{ color: '#033b4a' }}>
              Helpers ({helpers.length})
            </h4>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading helpers...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          ) : helpers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No helpers have offered assistance yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {helpers.map((helper) => (
                <div
                  key={helper.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                  style={{ backgroundColor: '#f9fefa' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: '#033b4a' }}>
                          {helper.helper_name || 'Anonymous Helper'}
                        </span>
                        <Badge className={getStatusColor(helper.status)}>
                          {helper.status}
                        </Badge>
                      </div>
                      
                      {/* Contact Info */}
                      <div className="space-y-1 text-sm text-gray-600">
                        {helper.helper_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <a href={`mailto:${helper.helper_email}`} className="hover:underline">
                              {helper.helper_email}
                            </a>
                          </div>
                        )}
                        {helper.helper_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${helper.helper_phone}`} className="hover:underline">
                              {helper.helper_phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {new Date(helper.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Helper's Message */}
                  {helper.message && (
                    <div className="mt-2 p-2 bg-white rounded border-l-4" style={{ borderLeftColor: '#41695e' }}>
                      <div className="flex items-start gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#41695e' }} />
                        <p className="text-gray-700 italic">&quot;{helper.message}&quot;</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completion Section */}
        {!showConfirm ? (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg mb-4">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="mb-1">
                  Once you mark this request as completed:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>All helpers will be notified</li>
                  <li>The request will be hidden from others</li>
                  <li>It will remain visible only in your dashboard</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={completing}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowConfirm(true)}
                disabled={completing || helpers.length === 0}
                style={{ backgroundColor: '#41695e' }}
                className="text-white hover:opacity-90"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Completed
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="border-t pt-4 mt-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
              <p className="text-sm text-green-800">
                <strong>Are you sure you want to mark this help request as completed?</strong>
              </p>
              <p className="text-sm text-green-700 mt-2">
                This will notify all {helpers.length} helper(s) and hide the request from public view.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 mb-4">
                {error}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={completing}
              >
                Go Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={completing}
                style={{ backgroundColor: '#41695e' }}
                className="text-white hover:opacity-90"
              >
                {completing ? 'Completing...' : 'Yes, Complete Now'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}