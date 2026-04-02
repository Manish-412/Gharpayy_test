import { useParams } from "wouter";
import { useGetBooking, getGetBookingQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Building,
  MapPin,
  IndianRupee,
  ShieldCheck,
  Clock,
  CalendarDays,
  CheckCircle2,
  MessageCircle,
  Copy,
  Phone,
  ArrowRight,
  Sparkles,
  BadgeCheck,
  Receipt,
  Share2,
} from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

function buildUpiUrl(upiId: string, name: string, amount: number, note: string) {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
}

function buildQrUrl(upiUrl: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}&bgcolor=ffffff&color=1a1a2e&margin=10`;
}

export default function TenantBookingDetail() {
  const { id } = useParams();
  const bookingId = Number(id);
  const { toast } = useToast();
  const [paidNotified, setPaidNotified] = useState(false);

  const { data: booking, isLoading, refetch } = useGetBooking(bookingId, {
    query: { enabled: !!bookingId, queryKey: getGetBookingQueryKey(bookingId), refetchInterval: 8000 }
  });

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background p-4 sm:p-8 flex justify-center">
        <div className="w-full max-w-md space-y-6 pt-8">
          <Skeleton className="h-12 w-32 mx-auto" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-[420px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Building className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold">Link not found</h1>
          <p className="text-muted-foreground text-sm">This quotation link is invalid or has been removed. Please contact the property owner for a fresh link.</p>
        </div>
      </div>
    );
  }

  const savings = booking.actualRent - booking.discountedRent;
  const upiNote = `Room token - ${booking.propertyName}${booking.roomNumber ? ` Room ${booking.roomNumber}` : ""}`;
  const upiUrl = booking.upiId ? buildUpiUrl(booking.upiId, booking.propertyName, booking.tokenAmount, upiNote) : null;
  const qrUrl = upiUrl ? buildQrUrl(upiUrl) : null;

  const adminPhone = booking.adminPhone?.replace(/\D/g, "") || "";
  const adminWhatsApp = adminPhone ? `https://wa.me/${adminPhone}` : null;

  // PAID STATE — Show receipt
  if (booking.status === "paid") {
    const paidDate = new Date(booking.updatedAt);
    const receiptNo = `GHR-${booking.id.toString().padStart(4, "0")}`;

    const shareReceipt = () => {
      const text = `*Payment Receipt — ${booking.propertyName}*\n\nReceipt No: ${receiptNo}\nTenant: ${booking.tenantName}\nRoom: ${booking.roomNumber ? `Room ${booking.roomNumber}` : "N/A"}\nToken Paid: ₹${new Intl.NumberFormat("en-IN").format(booking.tokenAmount)}\nDate: ${paidDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}\n\nYour room has been locked. Welcome to ${booking.propertyName}!`;
      if (navigator.share) {
        navigator.share({ title: "Payment Receipt", text }).catch(() => {});
      } else {
        navigator.clipboard.writeText(text);
        toast({ title: "Receipt copied", description: "Paste it anywhere to share." });
      }
    };

    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-green-50 to-background flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-800">Room Locked — You're In!</h1>
            <p className="text-green-700/80 text-sm">Your token payment has been received. The room is officially yours.</p>
          </div>

          {/* Receipt Card */}
          <Card className="shadow-lg border-green-200 overflow-hidden">
            <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Receipt className="w-5 h-5" />
                <span className="font-semibold">Payment Receipt</span>
              </div>
              <span className="text-white/80 text-sm font-mono">{receiptNo}</span>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Tenant</p>
                  <p className="font-semibold">{booking.tenantName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Date</p>
                  <p className="font-semibold">{paidDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Property</p>
                  <p className="font-semibold">{booking.propertyName}</p>
                </div>
                {booking.roomNumber && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Room</p>
                    <p className="font-semibold">Room {booking.roomNumber}</p>
                  </div>
                )}
              </div>
              <div className="border-t border-dashed pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground text-sm">Token Amount Paid</span>
                  <span className="text-2xl font-bold text-green-700">{formatCurrency(booking.tokenAmount)}</span>
                </div>
                <p className="text-xs text-muted-foreground">This amount will be adjusted against your first month's rent of {formatCurrency(booking.discountedRent)}.</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 space-y-2 text-sm border border-green-100">
                <p className="font-semibold text-green-800">What happens next:</p>
                <div className="space-y-1.5 text-green-700/90">
                  <div className="flex items-start gap-2">
                    <span className="font-bold shrink-0">1.</span>
                    <span>The owner will contact you to confirm move-in date and collect remaining documents.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold shrink-0">2.</span>
                    <span>On move-in, pay the security deposit ({formatCurrency(booking.deposit)}) and first month's rent ({formatCurrency(booking.discountedRent - booking.tokenAmount)} remaining after token adjustment).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold shrink-0">3.</span>
                    <span>One-time maintenance fee: {formatCurrency(booking.maintenanceFee)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={shareReceipt} className="flex-1 gap-2" variant="outline">
              <Share2 className="w-4 h-4" />
              Share Receipt
            </Button>
            {adminWhatsApp && (
              <Button
                onClick={() => window.open(`${adminWhatsApp}?text=${encodeURIComponent(`Hi, I'm ${booking.tenantName}. I've paid the token for ${booking.propertyName}${booking.roomNumber ? ` Room ${booking.roomNumber}` : ""}. When can I move in?`)}`, "_blank")}
                className="flex-1 gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white"
              >
                <MessageCircle className="w-4 h-4" />
                Message Owner
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // EXPIRED or CANCELLED STATE — Recovery flow
  if (booking.status === "expired" || booking.status === "cancelled") {
    const requestMsg = encodeURIComponent(
      `Hi, I'm ${booking.tenantName}. My offer for ${booking.propertyName}${booking.roomNumber ? ` Room ${booking.roomNumber}` : ""} has expired. I'm still very interested! Can you please send me a new offer?`
    );

    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-sm space-y-6 text-center animate-in fade-in duration-500">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold mb-2">This Offer Has Expired</h1>
            <p className="text-muted-foreground text-sm">The 15-minute window closed. But don't worry — you can still get this room. Just request a new offer from the owner.</p>
          </div>

          <Card className="text-left border-primary/20 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{booking.propertyName}</p>
                  {booking.roomNumber && <p className="text-sm text-muted-foreground">Room {booking.roomNumber}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <IndianRupee className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm">Offer rent was <strong>{formatCurrency(booking.discountedRent)}/mo</strong> — saving you {formatCurrency(savings)}/mo</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {adminWhatsApp ? (
              <Button
                size="lg"
                className="w-full gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-md"
                onClick={() => window.open(`${adminWhatsApp}?text=${requestMsg}`, "_blank")}
              >
                <MessageCircle className="w-5 h-5" />
                Request New Offer on WhatsApp
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground bg-muted rounded-lg p-4">
                Please contact the property owner directly to request a new offer and lock in this room.
              </p>
            )}
            {adminPhone && (
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={() => window.open(`tel:${adminPhone}`, "_self")}
              >
                <Phone className="w-4 h-4" />
                Call Owner
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Rooms go fast. The sooner you reach out, the better your chances.</p>
        </div>
      </div>
    );
  }

  // PENDING STATE — Waiting for admin to approve
  if (booking.status === "pending") {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-sm text-center space-y-6 animate-in fade-in duration-500">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <h1 className="text-xl font-bold mb-2">Your Offer is Being Prepared</h1>
            <p className="text-muted-foreground text-sm">The property manager is reviewing your details and will activate your personalized offer shortly. This page will update automatically.</p>
          </div>
          <Card className="text-left border-primary/10 bg-primary/5 shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-start gap-3">
                <Building className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{booking.propertyName}</p>
                  {booking.roomNumber && <p className="text-xs text-muted-foreground">Room {booking.roomNumber}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <IndianRupee className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">Offer rent: <strong className="text-foreground">{formatCurrency(booking.discountedRent)}/mo</strong></p>
              </div>
            </CardContent>
          </Card>
          {adminWhatsApp && (
            <p className="text-sm text-muted-foreground">
              In a hurry?{" "}
              <a
                href={`${adminWhatsApp}?text=${encodeURIComponent(`Hi, I'm ${booking.tenantName}. I'm waiting for my offer for ${booking.propertyName}${booking.roomNumber ? ` Room ${booking.roomNumber}` : ""}. Can you please activate it?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 font-medium"
              >
                Message the owner on WhatsApp
              </a>
            </p>
          )}
        </div>
      </div>
    );
  }

  // APPROVED STATE — Active offer with payment
  const notifyOwnerMsg = adminPhone
    ? `https://wa.me/${adminPhone}?text=${encodeURIComponent(`Hi! I'm ${booking.tenantName}. I've just paid ₹${new Intl.NumberFormat("en-IN").format(booking.tokenAmount)} as token for ${booking.propertyName}${booking.roomNumber ? ` Room ${booking.roomNumber}` : ""}. Please confirm my booking. Booking link: ${window.location.href}`)}`
    : null;

  const copyUpiId = () => {
    if (booking.upiId) {
      navigator.clipboard.writeText(booking.upiId);
      toast({ title: "UPI ID copied", description: "Paste it in any UPI app to pay." });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background sm:bg-muted/30 pb-16">
      <div className="max-w-md mx-auto sm:py-8 space-y-5">

        {/* Header */}
        <div className="text-center pt-8 sm:pt-0 px-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-sm mb-3">
            G
          </div>
          <h1 className="text-xl font-bold text-foreground">Hi {booking.tenantName.split(" ")[0]}, your offer is ready</h1>
          <p className="text-muted-foreground text-sm mt-1">Exclusively for you — valid for 15 minutes only</p>
        </div>

        {/* Timer */}
        <div className="px-4 sm:px-0">
          <CountdownTimer expiresAt={booking.offerExpiresAt} onExpire={() => refetch()} amount={booking.tokenAmount} />
        </div>

        {/* Quotation Card */}
        <div className="px-4 sm:px-0">
          <Card className="shadow-lg border-border/60 overflow-hidden">

            {/* Property */}
            <div className="bg-primary/5 p-5 border-b flex gap-4 items-start">
              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-primary/10 text-primary shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold leading-snug">{booking.propertyName}</h2>
                {booking.roomNumber && (
                  <p className="text-muted-foreground mt-0.5 text-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Room {booking.roomNumber}
                  </p>
                )}
              </div>
            </div>

            <CardContent className="p-0">

              {/* Pricing */}
              <div className="p-5 space-y-4">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground line-through decoration-muted-foreground/60">Standard: {formatCurrency(booking.actualRent)}/mo</p>
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(booking.discountedRent)}<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                  </div>
                  {savings > 0 && (
                    <div className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-green-200">
                      Save {formatCurrency(savings)}/mo
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-dashed">
                  <div className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Maintenance (one-time)</p>
                    <p className="font-semibold text-foreground">{formatCurrency(booking.maintenanceFee)}</p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Security Deposit</p>
                    <p className="font-semibold text-foreground">{formatCurrency(booking.deposit)}</p>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="bg-slate-50 p-5 border-t grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Lock-in</p>
                    <p className="text-sm font-semibold">{booking.stayDurationMonths} Months</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarDays className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Notice Period</p>
                    <p className="text-sm font-semibold">{booking.noticePeriodMonths} Month{booking.noticePeriodMonths !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="p-5 space-y-5 border-t">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm mb-1">Pay this token to lock the room</p>
                  <p className="text-4xl font-bold text-primary">{formatCurrency(booking.tokenAmount)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Adjusted against your first month's rent</p>
                </div>

                {/* QR Code */}
                {qrUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white rounded-2xl shadow-md p-4 border border-border/60 inline-block">
                      <img
                        src={qrUrl}
                        alt="UPI QR Code"
                        className="w-[200px] h-[200px] rounded-lg"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                    <p className="text-sm text-center text-muted-foreground">Scan with any UPI app to pay</p>

                    {/* UPI ID */}
                    <div className="w-full bg-muted/50 border rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">UPI ID</p>
                        <p className="font-mono text-sm font-medium truncate">{booking.upiId}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={copyUpiId} className="shrink-0 gap-1.5">
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </Button>
                    </div>

                    {/* UPI App Deep Links */}
                    <div className="w-full space-y-2">
                      <p className="text-xs text-center text-muted-foreground font-medium uppercase tracking-wide">Or tap to open your UPI app directly</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="h-11 gap-2 text-sm font-medium border-purple-200 hover:bg-purple-50"
                          onClick={() => window.open(upiUrl!.replace("upi://", "phonepe://"), "_blank")}
                        >
                          PhonePe
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-11 gap-2 text-sm font-medium border-blue-200 hover:bg-blue-50"
                          onClick={() => window.open(upiUrl!.replace("upi://", "tez://"), "_blank")}
                        >
                          Google Pay
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-11 gap-2 text-sm font-medium border-sky-200 hover:bg-sky-50"
                          onClick={() => window.open(upiUrl!.replace("upi://", "paytmmp://"), "_blank")}
                        >
                          Paytm
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-11 gap-2 text-sm font-medium border-orange-200 hover:bg-orange-50"
                          onClick={() => window.open(upiUrl!, "_blank")}
                        >
                          Other UPI
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/40 rounded-xl p-5 text-center space-y-2">
                    <IndianRupee className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="text-sm font-medium">Pay via UPI / Bank Transfer</p>
                    <p className="text-xs text-muted-foreground">The owner will share payment details. After paying, tap "I've Paid" below.</p>
                  </div>
                )}

                {/* Payment Step Instructions */}
                <div className="bg-primary/5 rounded-xl p-4 space-y-3 border border-primary/10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">How to pay in 3 steps</p>
                  {[
                    { step: "1", text: booking.upiId ? `Copy UPI ID or scan QR above` : "Use the payment details shared by owner" },
                    { step: "2", text: `Enter amount ₹${new Intl.NumberFormat("en-IN").format(booking.tokenAmount)} and complete the payment` },
                    { step: "3", text: "Tap 'I've Paid' below — owner will confirm and send your receipt" },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step}</span>
                      <p className="text-sm text-foreground/80">{text}</p>
                    </div>
                  ))}
                </div>

                {/* I've Paid button */}
                {notifyOwnerMsg && (
                  <div className="space-y-2">
                    <Button
                      size="lg"
                      className={`w-full gap-2 text-base h-12 shadow-md transition-all ${paidNotified ? "bg-green-600 hover:bg-green-700" : "bg-[#25D366] hover:bg-[#20bd5a]"} text-white`}
                      onClick={() => {
                        window.open(notifyOwnerMsg, "_blank");
                        setPaidNotified(true);
                      }}
                    >
                      {paidNotified ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Notified — Awaiting Confirmation
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-5 h-5" />
                          I've Paid — Notify Owner on WhatsApp
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Tapping this opens WhatsApp with your payment details pre-filled. The owner will confirm and send your receipt.
                    </p>
                  </div>
                )}
              </div>

              {/* What You Get Section */}
              <div className="p-5 border-t bg-gradient-to-b from-background to-muted/20 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What you get after paying</p>
                {[
                  { icon: BadgeCheck, text: "Room officially reserved in your name — no one else can book it" },
                  { icon: Receipt, text: `Payment receipt sent to you immediately` },
                  { icon: Sparkles, text: `Token of ${formatCurrency(booking.tokenAmount)} adjusted in first month's rent — you pay only ${formatCurrency(Math.max(0, booking.discountedRent - booking.tokenAmount))} on move-in day` },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/80">{text}</p>
                  </div>
                ))}
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Trust footer */}
        <div className="text-center px-4 pb-4">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure booking — Ghar Room Booking Platform
          </p>
          {adminWhatsApp && !paidNotified && (
            <p className="text-xs text-muted-foreground mt-2">
              Questions?{" "}
              <a
                href={`${adminWhatsApp}?text=${encodeURIComponent(`Hi, I have a question about the offer for ${booking.propertyName}${booking.roomNumber ? ` Room ${booking.roomNumber}` : ""}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                Message the owner
              </a>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
