import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { Heart, CheckCircle, Loader2, AlertCircle, Tag } from 'lucide-react';
import { createCommunityHelpRequest } from '../../utils/supabaseService';
import { supabase } from '../../utils/auth';

interface CommunityHelpRequestFormProps {
  communityId: string;
  communityName: string;
  communityCategory: string;
  onRequestCreated?: () => void;
}

export function CommunityHelpRequestForm({ communityId, communityName, communityCategory, onRequestCreated }: CommunityHelpRequestFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    urgency: '',
    amount: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const urgencyLevels = [
    { value: 'low', label: 'Low - Can wait a few weeks' },
    { value: 'medium', label: 'Medium - Needed within a week' },
    { value: 'high', label: 'High - Urgent, needed within 2-3 days' },
    { value: 'critical', label: 'Critical - Emergency, needed immediately' }
  ];

  const categoryLabels: Record<string, string> = {
    'medical': 'Medical & Healthcare',
    'education': 'Education',
    'financial': 'Financial Assistance',
    'food': 'Food & Nutrition',
    'shelter': 'Shelter & Housing',
    'emergency': 'Emergency Relief',
    'other': 'Other'
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error getting user:', userError);
        toast.error('You must be logged in to submit a help request.');
        setIsSubmitting(false);
        return;
      }

      // Verify that the user is a member of the community
      const { data: memberCheck, error: memberError } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberError) {
        console.error('Error checking membership:', memberError);
        toast.error('Unable to verify community membership. Please try again.');
        setIsSubmitting(false);
        return;
      }

      if (!memberCheck) {
        toast.error('You must be a member of this community to post help requests.');
        setIsSubmitting(false);
        return;
      }

      // Prepare amount - ensure it's a whole integer to avoid precision issues
      const amount_needed = formData.amount 
        ? Math.round(parseFloat(formData.amount)) 
        : undefined;

      console.log('Submitting help request with amount:', amount_needed);

      // Proceed with creating the help request
      const response = await createCommunityHelpRequest({
        community_id: communityId,
        title: formData.title,
        description: formData.description,
        urgency: formData.urgency,
        amount_needed: amount_needed
        // category is auto-filled by database trigger from community's category
      });

      if (response.success) {
        setIsSubmitted(true);
        toast.success('Help request submitted successfully!');
        
        // Reset form after 2 seconds and call callback
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({
            title: '',
            description: '',
            urgency: '',
            amount: ''
          });
          if (onRequestCreated) {
            onRequestCreated();
          }
        }, 2000);
      } else {
        toast.error(response.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.title && formData.description && formData.urgency;

  if (isSubmitted) {
    return (
      <Card className="shadow-sm border-0">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: '#41695e' }}>
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl mb-2" style={{ color: '#033b4a' }}>Request Submitted!</h3>
          <p className="text-gray-600">
            Your help request has been posted to the community and members will be able to see it and offer assistance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2" style={{ color: '#033b4a' }}>
          <Heart className="h-5 w-5" style={{ color: '#41695e' }} />
          <span>Request Help from {communityName}</span>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Post a help request that will be visible only to members of this community. Community members can offer to help.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Badge className="bg-gray-200 text-gray-800 px-2 py-1 rounded">
                {categoryLabels[communityCategory.toLowerCase()] || 'Other'}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level *</Label>
              <Select onValueChange={(value) => handleInputChange('urgency', value)} value={formData.urgency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency level" />
                </SelectTrigger>
                <SelectContent>
                  {urgencyLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Request Title *</Label>
            <Input
              id="title"
              placeholder="Brief title describing your need (e.g., 'Need food assistance for family')"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about your situation and what kind of help you need..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="min-h-[120px] w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Estimated Amount (if applicable)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount in ₹"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="w-full"
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This request will be visible only to members of this community. Community members can offer to help directly.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end space-x-3">
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              style={{ backgroundColor: isFormValid ? '#41695e' : undefined }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}