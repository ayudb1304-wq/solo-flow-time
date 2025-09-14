import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Gift, ArrowLeft } from 'lucide-react';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (reason: string, feedback?: string) => Promise<void>;
  periodEndDate?: string;
  loading?: boolean;
}

const CANCELLATION_REASONS = [
  { value: 'too_expensive', label: "It's too expensive" },
  { value: 'not_using_enough', label: "I'm not using it enough" },
  { value: 'missing_features', label: 'Missing a specific feature' },
  { value: 'switching_service', label: 'Switching to another service' },
  { value: 'temporary_break', label: 'Taking a temporary break' },
  { value: 'other', label: 'Other' },
];

export const CancellationModal = ({ 
  isOpen, 
  onClose, 
  onConfirmCancel, 
  periodEndDate,
  loading = false 
}: CancellationModalProps) => {
  const [step, setStep] = useState<'retention' | 'feedback'>('retention');
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalFeedback, setAdditionalFeedback] = useState('');
  const [showRetentionOffer, setShowRetentionOffer] = useState(true);

  const handleProceedToFeedback = () => {
    setStep('feedback');
  };

  const handleConfirmCancellation = async () => {
    await onConfirmCancel(selectedReason, additionalFeedback);
    handleClose();
  };

  const handleClose = () => {
    setStep('retention');
    setSelectedReason('');
    setAdditionalFeedback('');
    setShowRetentionOffer(true);
    onClose();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'the end of your current billing period';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        {step === 'retention' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                We're sorry to see you go!
              </DialogTitle>
              <DialogDescription>
                Cancel your subscription while keeping access until your billing period ends.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground">
                  Your Pro features will remain active until{' '}
                  <span className="font-semibold text-foreground">
                    {formatDate(periodEndDate)}
                  </span>
                </p>
              </div>

              {showRetentionOffer && (
                <Card className="border-2 border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Gift className="h-8 w-8 text-primary mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">
                          Special Offer: Stay with 20% Off
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          We value your feedback! Continue with Pro at just ₹639/month 
                          for the next 3 months. No commitment required.
                        </p>
                        <div className="flex gap-3">
                          <Button 
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => {
                              // TODO: Implement retention offer
                              handleClose();
                            }}
                          >
                            Accept Offer
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowRetentionOffer(false)}
                          >
                            No thanks, continue canceling
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to cancel your subscription?
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={handleClose}>
                    Keep My Subscription
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleProceedToFeedback}
                  >
                    Yes, Cancel Subscription
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setStep('retention')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                Help us improve
              </DialogTitle>
              <DialogDescription>
                Your feedback helps us make our service better for everyone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Your feedback helps us make our service better. Why are you leaving?
                </p>
                
                <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                  {CANCELLATION_REASONS.map((reason) => (
                    <div key={reason.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={reason.value} id={reason.value} />
                      <Label htmlFor={reason.value} className="cursor-pointer">
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="feedback" className="text-sm font-medium">
                  Additional feedback (optional)
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="Tell us more about your experience or what would make you stay..."
                  value={additionalFeedback}
                  onChange={(e) => setAdditionalFeedback(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setStep('retention')}>
                  Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmCancellation}
                  disabled={loading || !selectedReason}
                >
                  {loading ? 'Processing...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};