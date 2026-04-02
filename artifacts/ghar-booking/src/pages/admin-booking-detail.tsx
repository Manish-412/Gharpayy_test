import { useParams, Link } from "wouter";
import {
  useGetBooking,
  getGetBookingQueryKey,
  useApproveBooking,
  useUpdateBooking,
  useDeleteBooking,
  useGetWhatsappMessage,
  getGetWhatsappMessageQueryKey,
  getListBookingsQueryKey,
  getGetBookingStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MessageCircle,
  Link as LinkIcon,
  Trash2,
  IndianRupee,
  Building,
  User,
  Calendar,
  RefreshCw,
  Copy,
  Phone,
  QrCode,
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

// We use the same approve mutation to reactivate (it resets timer regardless of status)
import { useReactivateBooking } from "@workspace/api-client-react";

export default function AdminBookingDetail() {
  const { id } = useParams();
  const bookingId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useGetBooking(bookingId, {
    query: { enabled: !!bookingId, queryKey: getGetBookingQueryKey(bookingId) },
  });

  const { data: whatsappData, refetch: refetchWhatsapp } = useGetWhatsappMessage(bookingId, {
    query: { enabled: !!bookingId, queryKey: getGetWhatsappMessageQueryKey(bookingId) },
  });

  const approveBooking = useApproveBooking();
  const reactivateBooking = useReactivateBooking();
  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(bookingId) });
    queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetBookingStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetWhatsappMessageQueryKey(bookingId) });
  };

  const handleApprove = () => {
    approveBooking.mutate({ id: bookingId }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetBookingQueryKey(bookingId), data);
        invalidate();
        refetchWhatsapp();
        toast({ title: "Offer activated", description: "15-minute countdown started. Share the link with tenant now." });
      },
      onError: () => toast({ title: "Error", description: "Failed to approve booking.", variant: "destructive" }),
    });
  };

  const handleReactivate = () => {
    reactivateBooking.mutate({ id: bookingId }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetBookingQueryKey(bookingId), data);
        invalidate();
        refetchWhatsapp();
        toast({ title: "Offer reactivated", description: "Fresh 15-minute window started. Send the link now." });
      },
      onError: () => toast({ title: "Error", description: "Failed to reactivate.", variant: "destructive" }),
    });
  };

  const handleStatusChange = (status: "paid" | "cancelled") => {
    updateBooking.mutate({ id: bookingId, data: { status } }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetBookingQueryKey(bookingId), data);
        invalidate();
        toast({ title: status === "paid" ? "Payment confirmed" : "Offer cancelled", description: status === "paid" ? "Booking marked as paid. Receipt visible to tenant." : "Booking cancelled." });
      },
      onError: () => toast({ title: "Error", description: "Failed to update status.", variant: "destructive" }),
    });
  };

  const handleDelete = () => {
    deleteBooking.mutate({ id: bookingId }, {
      onSuccess: () => {
        invalidate();
        toast({ title: "Booking deleted" });
        window.location.href = import.meta.env.BASE_URL;
      },
      onError: () => toast({ title: "Error", description: "Failed to delete.", variant: "destructive" }),
    });
  };

  const copyLink = () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}bookings/${bookingId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Tenant link copied", description: "Paste it in WhatsApp or SMS." });
  };

  const openWhatsApp = async () => {
    let data = whatsappData;
    if (!data) {
      const result = await refetchWhatsapp();
      data = result.data;
    }
    if (data?.url) {
      window.open(data.url, "_blank");
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
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (!booking) return null;

  const savings = booking.actualRent - booking.discountedRent;
  const tenantLink = `${window.location.origin}${import.meta.env.BASE_URL}bookings/${bookingId}`;

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="shrink-0 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-base font-semibold text-foreground leading-tight">{booking.tenantName}</h1>
              <p className="text-xs text-muted-foreground">{booking.propertyName}{booking.roomNumber ? ` · Room ${booking.roomNumber}` : ""}</p>
            </div>
          </div>
          <StatusBadge status={booking.status} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Admin Action Panel */}
        <Card className="border-primary/20 shadow-md overflow-hidden">
          <div className="bg-muted/40 border-b px-5 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Controls</span>
          </div>
          <CardContent className="p-5 space-y-5">

            {/* Status-based primary action */}
            {booking.status === "pending" && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Ready to send offer?</h3>
                  <p className="text-sm text-muted-foreground">Approve to start the 15-minute countdown. Then share the link with tenant.</p>
                </div>
                <Button size="lg" onClick={handleApprove} disabled={approveBooking.isPending} className="w-full sm:w-auto gap-2 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  Activate Offer & Start Timer
                </Button>
              </div>
            )}

            {booking.status === "approved" && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <h4 className="font-semibold text-green-800 text-sm">Offer is Live — Share with tenant now</h4>
                </div>
                <p className="text-xs text-green-700/80">
                  Expires: {booking.offerExpiresAt ? new Date(booking.offerExpiresAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={copyLink} className="gap-1.5 bg-white border-green-200 hover:bg-green-50">
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </Button>
                  <Button size="sm" onClick={openWhatsApp} className="gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white">
                    <MessageCircle className="w-3.5 h-3.5" /> Send on WhatsApp
                  </Button>
                </div>
              </div>
            )}

            {(booking.status === "expired" || booking.status === "cancelled") && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div>
                  <h3 className="font-semibold mb-1">
                    {booking.status === "expired" ? "Offer expired — tenant still interested?" : "Offer cancelled"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {booking.status === "expired"
                      ? "Reactivate to give them a fresh 15-minute window. This won't disturb other tenants."
                      : "You can reactivate this offer if you want to give the tenant another chance."}
                  </p>
                </div>
                <Button size="lg" onClick={handleReactivate} disabled={reactivateBooking.isPending} className="w-full sm:w-auto gap-2 shrink-0">
                  <RefreshCw className="w-4 h-4" />
                  Reactivate Offer
                </Button>
              </div>
            )}

            {booking.status === "paid" && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold text-green-800 text-sm">Token payment received</p>
                  <p className="text-xs text-green-700/80">Room is locked. Tenant can see their receipt.</p>
                </div>
              </div>
            )}

            {/* Always visible: share + WhatsApp for any status except paid */}
            {booking.status !== "paid" && (
              <Separator />
            )}

            <div className="flex flex-wrap gap-2">
              {/* Copy link always visible */}
              <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" /> Copy Tenant Link
              </Button>

              {/* WhatsApp always visible */}
              <Button size="sm" onClick={openWhatsApp} className="gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Quotation
              </Button>

              {/* Call tenant */}
              {booking.tenantPhone && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`tel:${booking.tenantPhone}`, "_self")}>
                  <Phone className="w-3.5 h-3.5" /> Call Tenant
                </Button>
              )}

              {/* Mark as paid (for approved) */}
              {booking.status === "approved" && (
                <Button size="sm" onClick={() => handleStatusChange("paid")} disabled={updateBooking.isPending} className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                  <IndianRupee className="w-3.5 h-3.5" /> Mark Paid
                </Button>
              )}

              {/* Cancel (for pending/approved) */}
              {(booking.status === "pending" || booking.status === "approved") && (
                <Button variant="outline" size="sm" onClick={() => handleStatusChange("cancelled")} disabled={updateBooking.isPending}>
                  Cancel Offer
                </Button>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Tenant link card */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Tenant Payment Link</p>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <p className="text-xs font-mono text-foreground truncate flex-1">{tenantLink}</p>
              <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={copyLink}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quotation Details */}
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/20 py-4">
            <CardTitle className="text-base">Quotation Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
              <div className="p-5 space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <User className="w-3.5 h-3.5" />
                    <h3 className="text-xs font-medium uppercase tracking-wider">Tenant</h3>
                  </div>
                  <p className="font-semibold">{booking.tenantName}</p>
                  <p className="text-sm text-muted-foreground">{booking.tenantPhone}</p>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Building className="w-3.5 h-3.5" />
                    <h3 className="text-xs font-medium uppercase tracking-wider">Property</h3>
                  </div>
                  <p className="font-semibold">{booking.propertyName}</p>
                  {booking.roomNumber && <p className="text-sm text-muted-foreground">Room {booking.roomNumber}</p>}
                </div>

                <Separator />

                {booking.upiId && (
                  <>
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <QrCode className="w-3.5 h-3.5" />
                        <h3 className="text-xs font-medium uppercase tracking-wider">Payment UPI ID</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-medium truncate flex-1">{booking.upiId}</p>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                          onClick={() => { navigator.clipboard.writeText(booking.upiId!); toast({ title: "UPI ID copied" }); }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <h3 className="text-xs font-medium uppercase tracking-wider">Terms</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Lock-in</p>
                      <p className="font-semibold text-sm">{booking.stayDurationMonths} Months</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Notice</p>
                      <p className="font-semibold text-sm">{booking.noticePeriodMonths} Month{booking.noticePeriodMonths !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <h3 className="text-xs font-medium uppercase tracking-wider">Financials</h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Standard Rent</span>
                    <span className="line-through">{formatCurrency(booking.actualRent)}/mo</span>
                  </div>
                  <div className="flex justify-between font-semibold text-primary text-base">
                    <span>Offer Rent</span>
                    <span>{formatCurrency(booking.discountedRent)}/mo</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-green-600 bg-green-50 px-2 py-1.5 rounded-md">
                      <span>Tenant saves</span>
                      <span className="font-semibold">{formatCurrency(savings)}/mo</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maintenance</span>
                    <span className="font-medium">{formatCurrency(booking.maintenanceFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Security Deposit</span>
                    <span className="font-medium">{formatCurrency(booking.deposit)}</span>
                  </div>
                  <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-primary">Token to Collect</span>
                      <span className="text-xl font-bold text-primary">{formatCurrency(booking.tokenAmount)}</span>
                    </div>
                    <p className="text-xs text-primary/60">Deducted from first month's rent</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete */}
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
                Delete Booking
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this booking?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone. The tenant's link will stop working.</AlertDialogDescription>
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

      </main>
    </div>
  );
}
