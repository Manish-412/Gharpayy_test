import { useParams } from "wouter";
import { useGetBooking, getGetBookingQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, MapPin, IndianRupee, ShieldCheck, Clock, CalendarDays, CheckCircle2 } from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";
import { formatCurrency } from "@/lib/utils";

export default function TenantBookingDetail() {
  const { id } = useParams();
  const bookingId = Number(id);

  const { data: booking, isLoading, refetch } = useGetBooking(bookingId, { 
    query: { enabled: !!bookingId, queryKey: getGetBookingQueryKey(bookingId), refetchInterval: 10000 } 
  });

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background p-4 sm:p-8 flex justify-center">
        <div className="w-full max-w-md space-y-6">
          <Skeleton className="h-12 w-32 mx-auto" />
          <Skeleton className="h-[200px] w-full rounded-2xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2">Booking not found</h1>
        <p className="text-muted-foreground text-center">The quotation you are looking for does not exist.</p>
      </div>
    );
  }

  const savings = booking.actualRent - booking.discountedRent;

  // States where payment is no longer possible
  if (booking.status === 'paid' || booking.status === 'expired' || booking.status === 'cancelled') {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-lg border p-8 text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6">
            {booking.status === 'paid' ? (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <Clock className="w-10 h-10 text-gray-500" />
              </div>
            )}
          </div>
          
          <h1 className="text-2xl font-bold">
            {booking.status === 'paid' ? 'Payment Received' : 'Offer Unavailable'}
          </h1>
          <p className="text-muted-foreground">
            {booking.status === 'paid' 
              ? 'Your room has been successfully locked in. The property manager will contact you with next steps.' 
              : 'This quotation has expired or been cancelled. Please contact the property manager for a new offer.'}
          </p>
        </div>
      </div>
    );
  }

  // Pending state (admin hasn't approved yet)
  if (booking.status === 'pending') {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
          <h1 className="text-2xl font-bold">Preparing Your Offer</h1>
          <p className="text-muted-foreground">Please wait while the property manager finalizes your quotation.</p>
        </div>
      </div>
    );
  }

  // Approved state - Show full active quote to tenant
  return (
    <div className="min-h-[100dvh] bg-background sm:bg-muted/30 pb-12">
      <div className="max-w-md mx-auto sm:py-8 space-y-6">
        
        {/* Header / Brand */}
        <div className="text-center pt-8 sm:pt-0">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-2xl shadow-sm mb-4">
            G
          </div>
          <h1 className="text-2xl font-bold text-foreground px-4">Hello, {booking.tenantName.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Here is your custom room offer.</p>
        </div>

        {/* Timer Component */}
        <div className="px-4 sm:px-0">
          <CountdownTimer 
            expiresAt={booking.offerExpiresAt} 
            onExpire={() => refetch()} 
            amount={booking.tokenAmount}
          />
        </div>

        {/* Quotation Card */}
        <div className="px-4 sm:px-0">
          <Card className="shadow-lg border-border/60 overflow-hidden">
            
            {/* Property Hero */}
            <div className="bg-primary/5 p-6 border-b">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-primary/10 text-primary shrink-0">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold leading-tight">{booking.propertyName}</h2>
                  {booking.roomNumber && (
                    <p className="text-muted-foreground mt-1 text-sm flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Room {booking.roomNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              
              {/* Pricing Section */}
              <div className="p-6 space-y-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Monthly Rent</h3>
                
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground line-through decoration-muted-foreground/50">Standard: {formatCurrency(booking.actualRent)}</p>
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(booking.discountedRent)}<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                  </div>
                  
                  {savings > 0 && (
                    <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-md border border-green-200">
                      Save {formatCurrency(savings)}/mo
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Maintenance</p>
                    <p className="font-medium text-foreground">{formatCurrency(booking.maintenanceFee)}<span className="text-xs text-muted-foreground">/mo</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Deposit</p>
                    <p className="font-medium text-foreground">{formatCurrency(booking.deposit)}</p>
                  </div>
                </div>
              </div>

              {/* Terms Section */}
              <div className="bg-slate-50 p-6 border-t">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Lease Terms</h3>
                <div className="grid grid-cols-2 gap-y-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Lock-in Period</p>
                      <p className="text-sm font-medium">{booking.stayDurationMonths} Months</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarDays className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Notice Period</p>
                      <p className="text-sm font-medium">{booking.noticePeriodMonths} Months</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Action Section */}
              <div className="p-6 bg-primary text-primary-foreground text-center">
                <h3 className="text-primary-foreground/80 text-sm font-medium mb-1">To lock this room</h3>
                <p className="text-3xl font-bold mb-6">Pay {formatCurrency(booking.tokenAmount)}</p>
                
                <div className="bg-white p-4 rounded-xl shadow-inner max-w-[240px] mx-auto">
                  {/* Placeholder QR Code - Since we don't have a real UPI integration in this task */}
                  <div className="aspect-square bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-slate-500">
                    <IndianRupee className="w-12 h-12 mb-2 text-slate-400" />
                    <p className="text-sm font-medium text-center">Scan with any UPI app</p>
                  </div>
                </div>
                
                <p className="text-xs text-primary-foreground/70 mt-6">
                  Token amount is fully adjusted against your first month's rent.
                </p>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Footer info */}
        <div className="text-center px-6">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure booking via Ghar
          </p>
        </div>

      </div>
    </div>
  );
}
