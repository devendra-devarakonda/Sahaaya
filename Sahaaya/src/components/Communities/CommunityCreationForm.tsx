import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner@2.0.3';
import { 
  ArrowLeft,
  Users,
  CheckCircle,
  Target
} from 'lucide-react';
import { createCommunity } from '../../utils/supabaseService';

interface CommunityCreationFormProps {
  setCurrentPage: (page: string) => void;
  userProfile?: any;
  userRole: 'individual' | 'ngo' | null;
}

interface FormData {
  name: string;
  description: string;
  category: string;
  location: string;
  rules_accepted: boolean;
}

export function CommunityCreationForm({ setCurrentPage, userProfile, userRole }: CommunityCreationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: '',
    location: '',
    rules_accepted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Community name is required';
        if (formData.name.length < 3) newErrors.name = 'Community name must be at least 3 characters';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (formData.description.length < 20) newErrors.description = 'Description must be at least 20 characters';
        if (!formData.category) newErrors.category = 'Category is required';
        break;
      case 2:
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (!formData.rules_accepted) newErrors.rules_accepted = 'You must accept the community guidelines';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setIsSubmitting(true);
    
    try {
      const response = await createCommunity({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        location: formData.location
      });

      if (response.success) {
        toast.success('Community created successfully!', {
          description: 'Your community is now live and visible to all users'
        });
        setCurrentPage('communities');
      } else {
        toast.error(response.error || 'Failed to create community');
      }
    } catch (error) {
      console.error('Error creating community:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 style={{ color: '#033b4a' }}>Basic Information</h2>
        <p className="text-gray-600 mt-2">Tell us about your community and its purpose</p>
      </div>

      <div>
        <label className="block mb-2">Community Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Mumbai Medical Support Network"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block mb-2">Description *</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the purpose and goals of your community..."
          rows={4}
          className={errors.description ? 'border-red-500' : ''}
        />
        <p className="text-sm text-gray-500 mt-1">{formData.description.length}/500 characters</p>
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      <div>
        <label className="block mb-2">Category *</label>
        <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
          <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="medical">Medical & Healthcare</SelectItem>
            <SelectItem value="education">Educational Support</SelectItem>
            <SelectItem value="financial">Financial Assistance</SelectItem>
            <SelectItem value="food">Food Support</SelectItem>
            <SelectItem value="shelter">Shelter & Housing</SelectItem>
            <SelectItem value="emergency">Emergency Relief</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 style={{ color: '#033b4a' }}>Location & Guidelines</h2>
        <p className="text-gray-600 mt-2">Set where your community operates and accept guidelines</p>
      </div>

      <div>
        <label className="block mb-2">Location *</label>
        <Input
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          placeholder="e.g., Mumbai, Maharashtra"
          className={errors.location ? 'border-red-500' : ''}
        />
        {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium mb-3" style={{ color: '#033b4a' }}>Community Guidelines</h4>
        <div className="space-y-2 text-sm text-gray-600 max-h-40 overflow-y-auto">
          <p>• Communities must have a clear, legitimate purpose focused on helping others</p>
          <p>• All community content must be respectful and appropriate</p>
          <p>• Spam, misleading information, or harmful content is prohibited</p>
          <p>• Community admins are responsible for moderating their communities</p>
          <p>• Communities must comply with all applicable laws and regulations</p>
          <p>• Platform moderators may intervene if community guidelines are violated</p>
          <p>• Communities may be suspended or removed for violations</p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="rules-accepted"
            checked={formData.rules_accepted}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, rules_accepted: checked as boolean }))}
          />
          <label htmlFor="rules-accepted" className={`text-sm ${errors.rules_accepted ? 'text-red-500' : 'text-gray-700'}`}>
            I agree to follow the community guidelines and platform terms *
          </label>
        </div>
        {errors.rules_accepted && <p className="text-red-500 text-sm mt-1">{errors.rules_accepted}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f9fefa' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage('communities')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Communities
          </Button>
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#41695e' }}>
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 style={{ color: '#033b4a' }}>
                Create Community
              </h1>
              <p className="text-gray-600">
                Create a new community to connect with like-minded helpers
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center space-x-4 mb-6">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  style={step <= currentStep ? { backgroundColor: '#41695e' } : {}}
                >
                  {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < 2 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step < currentStep ? 'bg-primary' : 'bg-gray-200'
                    }`}
                    style={step < currentStep ? { backgroundColor: '#41695e' } : {}}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>
              
              <div className="flex space-x-3">
                {currentStep < 2 ? (
                  <Button
                    onClick={handleNext}
                    style={{ backgroundColor: '#41695e' }}
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{ backgroundColor: '#41695e' }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        Create Community
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
