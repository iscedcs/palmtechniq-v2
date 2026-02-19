'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BookOpen, Clock, DollarSign, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createMentorshipOffering, getTutorMentorshipOfferings, getTutorCourses, deleteMentorshipOffering } from '@/actions/mentorship-revenue';
import { useEffect } from 'react';

interface MentorshipOffering {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  price: number;
  courseId: string | null;
  course?: {
    id: string;
    title: string;
    slug: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    sessions: number;
  };
}

interface TutorCourse {
  id: string;
  title: string;
  slug: string | null;
  price: number;
  thumbnail: string | null;
}

export default function MentorshipSchedulePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [offerings, setOfferings] = useState<MentorshipOffering[]>([]);
  const [courses, setCourses] = useState<TutorCourse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('standalone');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '60',
    price: '',
  });

  // Load tutors courses and existing offerings
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [offeringsData, coursesData] = await Promise.all([
          getTutorMentorshipOfferings(),
          getTutorCourses(),
        ]);
        setOfferings(offeringsData);
        setCourses(coursesData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your mentorship offerings',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateOffering = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.duration || !formData.price) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const newOffering = await createMentorshipOffering({
        title: formData.title,
        description: formData.description || undefined,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        courseId: selectedCourse === 'standalone' ? null : selectedCourse,
      });

      setOfferings([...offerings, newOffering]);
      setIsOpen(false);
      setFormData({ title: '', description: '', duration: '60', price: '' });
      setSelectedCourse('standalone');

      toast({
        title: 'Success',
        description: `Mentorship offering "${formData.title}" created successfully!`,
      });
    } catch (error) {
      console.error('Error creating offering:', error);
      toast({
        title: 'Error',
        description: 'Failed to create mentorship offering. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOffering = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mentorship offering?')) {
      return;
    }

    try {
      await deleteMentorshipOffering(id);
      setOfferings(offerings.filter((o) => o.id !== id));
      toast({
        title: 'Success',
        description: 'Mentorship offering deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting offering:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete mentorship offering',
        variant: 'destructive',
      });
    }
  };

  const courseOfferings = offerings.filter((o) => o.courseId);
  const standaloneOfferings = offerings.filter((o) => !o.courseId);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Mentorship Schedule</h1>
        <p className="text-muted-foreground">
          Create and manage mentorship offerings. Link them to your courses to suggest to course
          completers or keep them standalone.
        </p>
      </div>

      {/* Create New Offering Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-fit">
            <Plus className="mr-2 h-4 w-4" />
            Create New Offering
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Mentorship Offering</DialogTitle>
            <DialogDescription>
              Create a new mentorship offering that students can book. You can link it to one of
              your courses or keep it standalone.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOffering} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., React Mastery 1:1 Sessions"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Course Selection */}
            <div className="space-y-2">
              <Label htmlFor="course">Link to Course (Optional)</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standalone">Standalone Mentorship</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Linking to a course will allow you to upsell mentorship to students who complete
                that course.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what you'll cover in these mentorship sessions..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Session Duration (minutes) *</Label>
              <Select value={formData.duration} onValueChange={(v) => setFormData({ ...formData, duration: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes (1 hour)</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">120 minutes (2 hours)</SelectItem>
                  <SelectItem value="180">180 minutes (3 hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Price per Session (₦) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₦
                </span>
                <Input
                  id="price"
                  type="number"
                  placeholder="5000"
                  min="0"
                  step="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="pl-6"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Creating...' : 'Create Offering'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading your mentorship offerings...</p>
          </CardContent>
        </Card>
      )}

      {/* Course-Linked Offerings */}
      {!isLoading && courseOfferings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Course-Linked Mentorship</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {courseOfferings.map((offering) => (
              <Card key={offering.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{offering.title}</CardTitle>
                    {offering.course && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Linked to: {offering.course.title}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {offering.description && (
                    <p className="text-sm text-muted-foreground">{offering.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{offering.duration} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>₦{offering.price.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/tutor/mentorship/offering/${offering.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteOffering(offering.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Standalone Offerings */}
      {!isLoading && standaloneOfferings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Standalone Mentorship</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {standaloneOfferings.map((offering) => (
              <Card key={offering.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{offering.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {offering.description && (
                    <p className="text-sm text-muted-foreground">{offering.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{offering.duration} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>₦{offering.price.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/tutor/mentorship/offering/${offering.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteOffering(offering.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && offerings.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No Mentorship Offerings Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first mentorship offering to start accepting bookings from students.
                </p>
              </div>
              <Button onClick={() => setIsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Offering
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">💡 Mentorship Tip</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Link mentorship offerings to your courses to create an upsell opportunity. When students
            complete a course, they'll see suggestions for mentorship sessions to deepen their
            mastery. This helps you generate additional revenue while providing more value to your
            students.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
