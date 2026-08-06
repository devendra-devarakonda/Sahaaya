import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { PlaceSearchInput } from './PlaceSearchInput';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { 
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  MapPin,
  Building2,
  Target,
  Calendar as CalendarIcon,
  Users,
  IndianRupee,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
// Format date function
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

interface CampaignCreationFormProps {
  setCurrentPage: (page: string) => void;
  userProfile?: any;
}

export function CampaignCreationForm({ setCurrentPage, userProfile }: CampaignCreationFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    targetAmount: '',
    beneficiaryCount: '',
    duration: '',
    location: '',
    objectives: '',
    impactMeasurement: '',
    organizationRole: ''
  });

  const [endDate, setEndDate] = useState<Date>();
  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const categories = [
    'Emergency Relief',
    'Healthcare',
    'Education',
    'Food Security',
    'Housing & Shelter',
    'Clean Water & Sanitation',
    'Poverty Alleviation',
    'Disaster Management',
    'Environmental Conservation',
    'Community Development',
    'Women Empowerment',
    'Child Welfare',
    'Elderly Care',
    'Skills Development',
    'Infrastructure Development'
  ];

  const durationOptions = [
    { value: '1', label: '1 Month' },
    { value: '3', label: '3 Months' },
    { value: '6', label: '6 Months' },
    { value: '12', label: '1 Year' },
    { value: 'ongoing', label: 'Ongoing Campaign' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setImages(prev => [...prev, ...selectedFiles].slice(0, 5));
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setDocuments(prev => [...prev, ...selectedFiles].slice(0, 3));
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Redirect to dashboard after 3 seconds
    setTimeout(() => {
      setCurrentPage('dashboard');
    }, 3000);
  };

  const isFormValid = formData.title && formData.description && formData.category && 
                     formData.targetAmount && formData.beneficiaryCount && 
                     formData.location && endDate;

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f9fefa' }}>
        <Card className="max-w-md w-full text-center p-8 shadow-lg border-0">
          <CardContent className="space-y-6">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: '#41695e' }}>
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl" style={{ color: '#033b4a' }}>Campaign Created Successfully!</h2>
            <p className="text-gray-600">
              Your campaign has been created and is now under review. It will be live within 24 hours.
            </p>
            <div className="space-y-2">
              <Badge variant="outline" className="text-sm" style={{ borderColor: '#41695e', color: '#41695e' }}>
                Campaign ID: CMP-{Math.random().toString(36).substr(2, 9).toUpperCase()}
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
            Create New Campaign
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create a campaign to raise funds and awareness for your cause. 
            Provide detailed information to help donors understand your mission.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Campaign Overview */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: '#033b4a' }}>
                <Building2 className="h-5 w-5" style={{ color: '#41695e' }} />
                <span>Campaign Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Campaign Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter a compelling campaign title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign category" />
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
                  <Label htmlFor="location">Location *</Label>
                  <PlaceSearchInput
                    value={formData.location}
                    onChange={(location, coordinates) => {
                      handleInputChange('location', location);
                    }}
                    placeholder="Search for campaign location..."
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your campaign, the problem you're addressing, and how the funds will be used..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="min-h-[120px] w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Campaign Goals & Metrics */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: '#033b4a' }}>
                <Target className="h-5 w-5" style={{ color: '#41695e' }} />
                <span>Goals & Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount (₹) *</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    placeholder="500000"
                    value={formData.targetAmount}
                    onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="beneficiaryCount">Expected Beneficiaries *</Label>
                  <Input
                    id="beneficiaryCount"
                    type="number"
                    placeholder="100"
                    value={formData.beneficiaryCount}
                    onChange={(e) => handleInputChange('beneficiaryCount', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Campaign Duration *</Label>
                  <Select onValueChange={(value) => handleInputChange('duration', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Campaign End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? formatDate(endDate) : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="objectives">Campaign Objectives</Label>
                <Textarea
                  id="objectives"
                  placeholder="List specific, measurable objectives for this campaign..."
                  value={formData.objectives}
                  onChange={(e) => handleInputChange('objectives', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="impactMeasurement">How will you measure impact?</Label>
                <Textarea
                  id="impactMeasurement"
                  placeholder="Describe how you will track and report the impact of this campaign..."
                  value={formData.impactMeasurement}
                  onChange={(e) => handleInputChange('impactMeasurement', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Media & Documents */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: '#033b4a' }}>
                <FileText className="h-5 w-5" style={{ color: '#41695e' }} />
                <span>Campaign Media & Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Images */}
              <div className="space-y-4">
                <div>
                  <Label>Campaign Images (up to 5)</Label>
                  <p className="text-sm text-gray-500 mb-2">Upload images that showcase your cause and organization</p>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="image-upload"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">Click to upload images</p>
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG up to 5MB each</p>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <div>
                  <Label>Supporting Documents (up to 3)</Label>
                  <p className="text-sm text-gray-500 mb-2">Upload project proposals, budgets, or other relevant documents</p>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="document-upload"
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx"
                    onChange={handleDocumentUpload}
                  />
                  <label htmlFor="document-upload" className="cursor-pointer">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">Click to upload documents</p>
                    <p className="text-sm text-gray-500 mt-1">PDF, DOC up to 10MB each</p>
                  </label>
                </div>

                {documents.length > 0 && (
                  <div className="space-y-2">
                    {documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(index)}
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

          {/* Organization Information */}
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: '#033b4a' }}>
                <Users className="h-5 w-5" style={{ color: '#41695e' }} />
                <span>Organization Role</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Describe your organization's role in this campaign and how donors can trust your efforts.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="organizationRole">Organization's Role in Campaign</Label>
                <Textarea
                  id="organizationRole"
                  placeholder="Explain your organization's experience with similar campaigns, partnerships, and how you will ensure transparency..."
                  value={formData.organizationRole}
                  onChange={(e) => handleInputChange('organizationRole', e.target.value)}
                  className="min-h-[100px]"
                />
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
                  <span>Creating Campaign...</span>
                </div>
              ) : (
                'Create Campaign'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}