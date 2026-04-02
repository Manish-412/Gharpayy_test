import { useParams, Link } from "wouter";
import { 
  useGetBooking, 
  getGetBookingQueryKey, 
  useApproveBooking, 
  useUpdateBooking,
  useDeleteBooking,
  useGetWhatsappMessage,
  getListBookingsQueryKey,
  getGetBookingStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  Link as LinkIcon, 
  Trash2, 
  AlertTriangle,
  RefreshCcw,
  IndianRupee,
  Building,
  User,
  Calendar
} from "lucide-react";
import { StatusBadge } from "@/components/booking-status-badge";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminBookingDetail() {
  const { id } = useParams();
  const bookingId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useGetBooking(bookingId, { 
    query: { enabled: !!bookingId, queryKey: getGetBookingQueryKey(bookingId) } 
  });

  const { data: whatsappData } = useGetWhatsappMessage(bookingId, {
    query: { enabled: !!bookingId && booking?.status === 'approved', queryKey: [`/api/bookings/${bookingId}/whatsapp`] }
  });

  const approveBooking = useApproveBooking();
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();

  const handleApprove = () => {
    approveBooking.mutate({ id: bookingId }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetBookingQueryKey(bookingId), data);
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBookingStatsQueryKey() });
        toast({
          title: "Booking Approved",
          description: "15-minute countdown has started for the tenant.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to approve booking.",
          variant: "destructive"
        });
      }
    });
  };

  const handleStatusChange = (status: "paid" | "cancelled") => {
    updateBooking.mutate({ id: bookingId, data: { status } }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetBookingQueryKey(bookingId), data);
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBookingStatsQueryKey() });
        toast({
          title: "Status Updated",
          description: `Booking marked as ${status}.`,
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update status.",
          variant: "destructive"
        });
      }
    });
  };

  const handleDelete = () => {
    deleteBooking.mutate({ id: bookingId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBookingStatsQueryKey() });
        toast({
          title: "Booking Deleted",
          description: "The booking has been removed.",
        });
        window.location.href = import.meta.env.BASE_URL;
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete booking.",
          variant: "destructive"
        });
      }
    });
  };

  const copyLink = () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}bookings/${bookingId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Tenant link copied to clipboard.",
    });
  };

  const openWhatsApp = () => {
    if (whatsappData?.url) {
      window.open(whatsappData.url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background pb-12">
        <header className="bg-card border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
            <Skeleton className="w-8 h-8 rounded-md" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (!booking) return null;

  const savings = booking.actualRent - booking.discountedRent;

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="shrink-0 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-foreground truncate hidden sm:block">Booking #{booking.id}</h1>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={booking.status} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Admin Actions Panel */}
        <Card className="border-primary/20 shadow-md bg-card overflow-hidden">
          <div className="bg-muted/30 border-b px-6 py-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Admin Controls</span>
          </div>
          <CardContent className="p-6">
            {booking.status === "pending" && (
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Ready to send?</h3>
                  <p className="text-sm text-muted-foreground">Approving will start the 15-minute countdown for the tenant.</p>
                </div>
                <Button 
                  size="lg" 
                  onClick={handleApprove} 
                  disabled={approveBooking.isPending}
                  className="w-full sm:w-auto gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Approve & Start Timer
                </Button>
              </div>
            )}

            {booking.status === "approved" && (
              <div className="space-y-6">
                <div className="bg-green-50 text-green-800 p-4 rounded-lg border border-green-200 flex items-start gap-3">
                  <Clock className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
                  <div>
                    <h4 className="font-semibold mb-1">Offer is Live</h4>
                    <p className="text-sm text-green-700/80 mb-3">
                      The countdown timer has started. Share the link with the tenant to collect payment.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={copyLink} variant="outline" className="bg-white border-green-200 hover:bg-green-50 gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Copy Link
                      </Button>
                      <Button onClick={openWhatsApp} disabled={!whatsappData} className="bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Send on WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />
                
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Payment Status</h3>
                    <p className="text-sm text-muted-foreground">Update the status once you receive the token amount.</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      onClick={() => handleStatusChange("cancelled")}
                      disabled={updateBooking.isPending}
                      className="flex-1 sm:flex-none"
                    >
                      Cancel Offer
                    </Button>
                    <Button 
                      onClick={() => handleStatusChange("paid")}
                      disabled={updateBooking.isPending}
                      className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                      <IndianRupee className="w-4 h-4" />
                      Mark as Paid
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {(booking.status === "paid" || booking.status === "expired" || booking.status === "cancelled") && (
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {booking.status === 'paid' ? 'Token Received' : 'Offer Inactive'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This booking quotation is closed.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete Booking
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this booking?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the booking record.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Full Quotation View */}
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>Quotation Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <User className="w-4 h-4" />
                    <h3 className="text-sm font-medium uppercase tracking-wider">Tenant</h3>
                  </div>
                  <p className="text-lg font-medium">{booking.tenantName}</p>
                  <p className="text-muted-foreground">{booking.tenantPhone}</p>
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <Building className="w-4 h-4" />
                    <h3 className="text-sm font-medium uppercase tracking-wider">Property</h3>
                  </div>
                  <p className="text-lg font-medium">{booking.propertyName}</p>
                  {booking.roomNumber && <p className="text-muted-foreground">Room {booking.roomNumber}</p>}
                </div>

                <Separator />
                
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <Calendar className="w-4 h-4" />
                    <h3 className="text-sm font-medium uppercase tracking-wider">Terms</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Lock-in</p>
                      <p className="font-medium">{booking.stayDurationMonths} Months</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notice</p>
                      <p className="font-medium">{booking.noticePeriodMonths} Months</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex items-center gap-2 text-muted-foreground mb-6">
                  <IndianRupee className="w-4 h-4" />
                  <h3 className="text-sm font-medium uppercase tracking-wider">Financials</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Standard Rent</span>
                    <span className="line-through">{formatCurrency(booking.actualRent)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center font-medium text-lg text-primary">
                    <span>Offer Rent</span>
                    <span>{formatCurrency(booking.discountedRent)}</span>
                  </div>
                  
                  {savings > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-600 bg-green-50 p-2 rounded-md">
                      <span>Monthly Savings</span>
                      <span className="font-semibold">{formatCurrency(savings)}</span>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Maintenance</span>
                    <span className="font-medium">{formatCurrency(booking.maintenanceFee)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Security Deposit</span>
                    <span className="font-medium">{formatCurrency(booking.deposit)}</span>
                  </div>

                  <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-primary">Token to Lock</span>
                      <span className="text-xl font-bold text-primary">{formatCurrency(booking.tokenAmount)}</span>
                    </div>
                    <p className="text-xs text-primary/70">Deducted from first month's rent</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
