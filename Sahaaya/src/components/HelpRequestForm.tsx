import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { PlaceSearchInput } from './PlaceSearchInput';
import { 
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  MapPin,
  Phone,
  User,
  Heart,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../utils/auth';

interface HelpRequestFormProps {
  setCurrentPage: (page: string) => void;
}

export function HelpRequestForm({ setCurrentPage }: HelpRequestFormProps) {
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    urgency: '',
    amount: '',
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    fullLocation: ''
  });
  const [locationCoordinates, setLocationCoordinates] = useState<[number, number] | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'individual' | 'ngo' | null>(null);

  const categories = [
    'Food & Nutrition',
    'Medical & Healthcare',
    'Education',
    'Shelter & Housing',
    'Employment',
    'Financial Assistance',
    'Clothing',
    'Transportation',
    'Emergency Relief',
    'Other'
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low - Can wait a few weeks', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium - Needed within a week', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High - Urgent, needed within 2-3 days', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical - Emergency, needed immediately', color: 'bg-red-100 text-red-800' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Check if user is authenticated and get role
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const role = user.user_metadata?.role as 'individual' | 'ngo';
        setUserRole(role || 'individual');
      }
    };
    checkUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to submit a request.');
        setIsSubmitting(false);
        return;
      }

      // Check if user role is individual
      if (userRole !== 'individual') {
        setError('Only Individual Users can submit help requests. NGO users should create campaigns instead.');
        setIsSubmitting(false);
        return;
      }

      // Submit to Supabase
      const { data, error } = await supabase
        .from('help_requests')
        .insert([
          {
            user_id: user.id,
            category: formData.category,
            title: formData.title,
            description: formData.description,
            urgency: formData.urgency,
            amount_needed: formData.amount ? Math.round(parseFloat(formData.amount)) : null,
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            full_location: formData.fullLocation,
            latitude: locationCoordinates?.[0],
            longitude: locationCoordinates?.[1],
            status: 'pending',
            supporters: 0
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        setError(`Failed to submit request: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      // Success! Show the request ID
      setSubmittedRequestId(data.id);
      setIsSubmitted(true);

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        setCurrentPage('dashboard');
      }, 3000);
    } catch (err: any) {
      console.error('Error submitting request:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.category && formData.title && formData.description && 
                     formData.urgency && formData.name && formData.phone && 
                     (formData.fullLocation || (formData.address && formData.city)) && userRole === 'individual';

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f9fefa' }}>
        <Card className="max-w-md w-full text-center p-8 shadow-lg border-0">
          <CardContent className="space-y-6">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: '#41695e' }}>
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl" style={{ color: '#033b4a' }}>Request Submitted Successfully!</h2>
            <p className="text-gray-600">
              Your help request has been submitted and will be reviewed within 24 hours. 
              You'll receive updates on your dashboard.
            </p>
            <div className="space-y-2">
              <Badge variant="outline" className="text-sm" style={{ borderColor: '#41695e', color: '#41695e' }}>
                Request ID: {submittedRequestId ? submittedRequestId.substring(0, 12).toUpperCase() : 'PENDING'}
              </Badge>
            </div>
            <Button 
              onClick={() => setCurrentPage('dashboard')}
              className="w-full"
              style={{ backgroundColor: '#41695e' }}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f9fefa' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl mb-4" style={{ color: '#033b4a' }}>
            Submit Help Request
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Fill out this form to request assistance. Please provide accurate information 
            and supporting documents to help us process your request quickly.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <Alert className={`mb-6 ${
            error.includes('Individual Users') || error.includes('log in') 
              ? 'border-red-200 bg-red-50' 
              : 'border-yellow-200 bg-yellow-50'
          }`}>
            <AlertCircle className={`h-4 w-4 ${
              error.includes('Individual Users') || error.includes('log in') 
                ? 'text-red-600' 
                : 'text-yellow-600'
            }`} />
            <AlertDescription className={`${
              error.includes('Individual Users') || error.includes('log in') 
                ? 'text-red-800' 
                : 'text-yellow-800'
            }`}>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Request Details */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: '#033b4a' }}>
                <Heart className="h-5 w-5" style={{ color: '#41695e' }} />
                <span>Request Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select help category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category.toLowerCase().replace(/\s+/g, '-')}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency Level *</Label>
                  <Select onValueChange={(value) => handleInputChange('urgency', value)}>
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
                  placeholder="Brief title describing your need (e.g., 'Medical assistance for surgery')"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about your situation, what kind of help you need, and any relevant background information..."
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
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: '#033b4a' }}>
                <User className="h-5 w-5" style={{ color: '#41695e' }} />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location-search">Location *</Label>
                  <PlaceSearchInput
                    value={formData.fullLocation}
                    onChange={(location, coordinates, place) => {
                      setFormData(prev => ({ ...prev, fullLocation: location }));
                      setLocationCoordinates(coordinates || null);
                      
                      // Extract city/state from place if available
                      if (place?.address_components) {
                        setFormData(prev => ({
                          ...prev,
                          city: place.address_components.city || '',
                          state: place.address_components.state || ''
                        }));
                      }
                    }}
                    placeholder="Search for your city, area, or address..."
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500">
                    Start typing to search for places, or click the location icon to use your current location
                  </p>
                </div>

                {/* Optional detailed address fields */}
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm text-gray-600">Additional Address Details (Optional)</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Textarea
                        id="address"
                        placeholder="House/Building number, street name, area..."
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="min-h-[60px]"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pincode">PIN Code</Label>
                        <Input
                          id="pincode"
                          placeholder="XXXXXX"
                          value={formData.pincode}
                          onChange={(e) => handleInputChange('pincode', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-500">Selected Location</Label>
                        <div className="p-2 bg-gray-50 rounded text-sm text-gray-600">
                          {formData.fullLocation || 'No location selected'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supporting Documents */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: '#033b4a' }}>
                <FileText className="h-5 w-5" style={{ color: '#41695e' }} />
                <span>Supporting Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please upload relevant documents (ID proof, medical bills, income certificate, etc.) 
                  to help verify your request. Maximum 5 files, 10MB each.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Click to upload files or drag and drop</p>
                    <p className="text-sm text-gray-500 mt-2">
                      PDF, JPG, PNG, DOC up to 10MB each
                    </p>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm" style={{ color: '#033b4a' }}>Uploaded Files:</h4>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {file.type.startsWith('image/') ? (
                            <ImageIcon className="h-4 w-4 text-gray-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentPage('dashboard')}
              className="order-2 sm:order-1"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="order-1 sm:order-2 px-8"
              style={{ backgroundColor: isFormValid ? '#41695e' : undefined }}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}