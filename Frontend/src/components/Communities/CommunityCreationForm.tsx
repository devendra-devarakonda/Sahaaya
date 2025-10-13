import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { PlaceSearchInput } from '../PlaceSearchInput';
import { 
  ArrowLeft,
  MapPin,
  Upload,
  Users,
  Shield,
  Globe,
  Lock,
  Eye,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  Target
} from 'lucide-react';
import { communitiesApi } from '../../utils/api';

interface CommunityCreationFormProps {
  setCurrentPage: (page: string) => void;
  userProfile?: any;
  userRole: 'individual' | 'ngo' | null;
}

interface FormData {
  name: string;
  description: string;
  category: string;
  location_name: string;
  location_coordinates?: [number, number];
  privacy_type: 'public' | 'private' | 'invite-only';
  rules_accepted: boolean;
  cover_image?: File;
  admin_contact: {
    name: string;
    email: string;
    phone: string;
  };
}

interface SuggestedCommunity {
  id: string;
  name: string;
  description: string;
  member_count: number;
  location_name: string;
  similarity_score: number;
}

export function CommunityCreationForm({ setCurrentPage, userProfile, userRole }: CommunityCreationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: '',
    location_name: '',
    privacy_type: 'public',
    rules_accepted: false,
    admin_contact: {
      name: userProfile?.name || '',
      email: userProfile?.email || '',
      phone: userProfile?.phone || ''
    }
  });
  const [suggestedCommunities, setSuggestedCommunities] = useState<SuggestedCommunity[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [canCreateDirectly, setCanCreateDirectly] = useState(false);

  // Mock suggested communities based on form input
  const mockSuggestions: SuggestedCommunity[] = [
    {
      id: 'comm-suggest-1',
      name: 'Mumbai Health Connect',
      description: 'Community focused on healthcare support and medical assistance in Mumbai',
      member_count: 856,
      location_name: 'Mumbai, Maharashtra',
      similarity_score: 0.85
    },
    {
      id: 'comm-suggest-2',
      name: 'Maharashtra Medical Network',
      description: 'Regional medical support network covering Maharashtra state',
      member_count: 1240,
      location_name: 'Maharashtra',
      similarity_score: 0.72
    }
  ];

  // Check if user can create community directly
  useEffect(() => {
    const checkPermissions = () => {
      if (!userProfile) return false;
      
      // NGOs can always create communities directly
      if (userRole === 'ngo') {
        setCanCreateDirectly(true);
        return;
      }
      
      // For individuals, check verification status or trust score
      // This would normally check against real verification data
      const isVerified = userProfile.verified || userProfile.trust_score >= 4.0;
      setCanCreateDirectly(isVerified);
    };

    checkPermissions();
  }, [userRole, userProfile]);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);
          setFormData(prev => ({ ...prev, location_coordinates: coords }));
          
          // Reverse geocode to get location name (simplified)
          // In real implementation, would use proper geocoding service
          setFormData(prev => ({ 
            ...prev, 
            location_name: 'Current Location (Auto-detected)' 
          }));
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  }, []);

  // Search for similar communities when name/category/location changes
  useEffect(() => {
    const searchSimilar = async () => {
      if (formData.name.length > 3 && formData.category && formData.location_name) {
        try {
          // This would normally call the API to find similar communities
          // For demo, using mock data
          setSuggestedCommunities(mockSuggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error searching similar communities:', error);
        }
      } else {
        setShowSuggestions(false);
        setSuggestedCommunities([]);
      }
    };

    const timeoutId = setTimeout(searchSimilar, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.name, formData.category, formData.location_name]);

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
        if (!formData.location_name.trim()) newErrors.location_name = 'Location is required';
        if (!formData.privacy_type) newErrors.privacy_type = 'Privacy setting is required';
        break;
      case 3:
        if (!formData.admin_contact.name.trim()) newErrors.admin_name = 'Admin name is required';
        if (!formData.admin_contact.email.trim()) newErrors.admin_email = 'Admin email is required';
        if (!formData.admin_contact.phone.trim()) newErrors.admin_phone = 'Admin phone is required';
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
    if (!validateStep(3)) return;

    try {
      setIsSubmitting(true);
      
      // This would normally call the API
      // await communitiesApi.create(formData);
      
      // For demo, just simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Community creation request:', formData);
      
      if (canCreateDirectly) {
        alert('Community created successfully! It will be live shortly.');
        setCurrentPage('communities');
      } else {
        alert('Community creation request submitted! You will be notified once it\'s reviewed.');
        setCurrentPage('communities');
      }
      
    } catch (error) {
      console.error('Error creating community:', error);
      alert('Failed to create community. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinSuggested = (community: SuggestedCommunity) => {
    if (confirm(`Would you like to join "${community.name}" instead of creating a new community?`)) {
      // This would normally call the join API
      console.log('Joining suggested community:', community.name);
      alert(`Successfully joined ${community.name}!`);
      setCurrentPage('communities');
    }
  };

  const privacyOptions = [
    {
      value: 'public',
      label: 'Public',
      description: 'Anyone can see and join this community',
      icon: Globe
    },
    {
      value: 'private',
      label: 'Private',
      description: 'Only members can see community content',
      icon: Lock
    },
    {
      value: 'invite-only',
      label: 'Invite Only',
      description: 'New members must be invited by admins',
      icon: Eye
    }
  ];

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
            <SelectItem value="Medical">Medical & Healthcare</SelectItem>
            <SelectItem value="Educational">Educational Support</SelectItem>
            <SelectItem value="Financial">Financial Assistance</SelectItem>
            <SelectItem value="NGO">NGO Services</SelectItem>
            <SelectItem value="Emotional">Emotional Support</SelectItem>
          </SelectContent>
        </Select>
        {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
      </div>

      {/* Similar Communities Suggestions */}
      {showSuggestions && suggestedCommunities.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-800 mb-2">Similar Communities Found</h4>
              <p className="text-sm text-blue-700 mb-3">
                Consider joining these existing communities instead of creating a new one:
              </p>
              <div className="space-y-2">
                {suggestedCommunities.map((community) => (
                  <div key={community.id} className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium" style={{ color: '#033b4a' }}>{community.name}</h5>
                        <p className="text-sm text-gray-600">{community.description}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>{community.member_count} members</span>
                          <span>{community.location_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(community.similarity_score * 100)}% match
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleJoinSuggested(community)}
                        style={{ backgroundColor: '#41695e' }}
                      >
                        Join Instead
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 style={{ color: '#033b4a' }}>Location & Privacy</h2>
        <p className="text-gray-600 mt-2">Set where your community operates and who can access it</p>
      </div>

      <div>
        <label className="block mb-2">Location *</label>
        <PlaceSearchInput
          value={formData.location_name}
          onChange={(location, coordinates) => {
            setFormData(prev => ({ 
              ...prev, 
              location_name: location,
              location_coordinates: coordinates || undefined
            }));
          }}
          placeholder="Search for community location..."
          className={`w-full ${errors.location_name ? 'border-red-500' : ''}`}
        />
        {errors.location_name && <p className="text-red-500 text-sm mt-1">{errors.location_name}</p>}
      </div>

      <div>
        <label className="block mb-3">Privacy Settings *</label>
        <div className="space-y-3">
          {privacyOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <div
                key={option.value}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  formData.privacy_type === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, privacy_type: option.value as any }))}
              >
                <div className="flex items-start space-x-3">
                  <IconComponent className="h-5 w-5 mt-0.5" style={{ color: '#41695e' }} />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium" style={{ color: '#033b4a' }}>{option.label}</h4>
                      {formData.privacy_type === option.value && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {errors.privacy_type && <p className="text-red-500 text-sm mt-1">{errors.privacy_type}</p>}
      </div>

      <div>
        <label className="block mb-2">Cover Image (Optional)</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 style={{ color: '#033b4a' }}>Admin Contact & Guidelines</h2>
        <p className="text-gray-600 mt-2">Confirm your contact information and accept community guidelines</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2">Admin Name *</label>
          <Input
            value={formData.admin_contact.name}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              admin_contact: { ...prev.admin_contact, name: e.target.value }
            }))}
            className={errors.admin_name ? 'border-red-500' : ''}
          />
          {errors.admin_name && <p className="text-red-500 text-sm mt-1">{errors.admin_name}</p>}
        </div>

        <div>
          <label className="block mb-2">Admin Email *</label>
          <Input
            type="email"
            value={formData.admin_contact.email}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              admin_contact: { ...prev.admin_contact, email: e.target.value }
            }))}
            className={errors.admin_email ? 'border-red-500' : ''}
          />
          {errors.admin_email && <p className="text-red-500 text-sm mt-1">{errors.admin_email}</p>}
        </div>
      </div>

      <div>
        <label className="block mb-2">Admin Phone *</label>
        <Input
          value={formData.admin_contact.phone}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            admin_contact: { ...prev.admin_contact, phone: e.target.value }
          }))}
          placeholder="+91 98765 43210"
          className={errors.admin_phone ? 'border-red-500' : ''}
        />
        {errors.admin_phone && <p className="text-red-500 text-sm mt-1">{errors.admin_phone}</p>}
      </div>

      {!canCreateDirectly && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-800">Admin Approval Required</h4>
              <p className="text-sm text-orange-700 mt-1">
                Since you're not yet a verified user, your community creation request will be reviewed by our admins. 
                This typically takes 1-2 business days.
              </p>
            </div>
          </div>
        </div>
      )}

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
                {canCreateDirectly ? 'Create Community' : 'Request Community Creation'}
              </h1>
              <p className="text-gray-600">
                {canCreateDirectly 
                  ? 'Create a new community to connect with like-minded helpers'
                  : 'Submit a request to create a new community - subject to admin approval'
                }
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center space-x-4 mb-6">
            {[1, 2, 3].map((step) => (
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
                {step < 3 && (
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
            {currentStep === 3 && renderStep3()}

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
                {currentStep < 3 ? (
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
                        {canCreateDirectly ? 'Creating...' : 'Submitting Request...'}
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        {canCreateDirectly ? 'Create Community' : 'Submit Request'}
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