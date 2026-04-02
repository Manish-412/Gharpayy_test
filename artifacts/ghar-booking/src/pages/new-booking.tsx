import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { useCreateBooking, getListBookingsQueryKey, getGetBookingStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, QrCode, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  tenantName: z.string().min(2, "Name is required"),
  tenantPhone: z.string().min(10, "Valid phone number required"),
  propertyName: z.string().min(2, "Property name is required"),
  roomNumber: z.string().optional(),
  actualRent: z.coerce.number().min(1, "Actual rent must be greater than 0"),
  discountedRent: z.coerce.number().min(1, "Discounted rent must be greater than 0"),
  deposit: z.coerce.number().min(0, "Deposit must be 0 or greater"),
  maintenanceFee: z.coerce.number().min(0, "Maintenance fee must be 0 or greater"),
  tokenAmount: z.coerce.number().min(1, "Token amount must be greater than 0"),
  stayDurationMonths: z.coerce.number().min(1, "Stay duration must be at least 1 month"),
  noticePeriodMonths: z.coerce.number().min(0, "Notice period cannot be negative"),
  upiId: z.string().optional(),
  adminPhone: z.string().optional(),
}).refine(data => data.discountedRent <= data.actualRent, {
  message: "Discounted rent cannot be higher than actual rent",
  path: ["discountedRent"]
});

type FormValues = z.infer<typeof formSchema>;

export default function NewBooking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createBooking = useCreateBooking();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenantName: "",
      tenantPhone: "",
      propertyName: "",
      roomNumber: "",
      actualRent: 0,
      discountedRent: 0,
      deposit: 0,
      maintenanceFee: 0,
      tokenAmount: 0,
      stayDurationMonths: 11,
      noticePeriodMonths: 1,
      upiId: "",
      adminPhone: "",
    }
  });

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      roomNumber: values.roomNumber || undefined,
      upiId: values.upiId || undefined,
      adminPhone: values.adminPhone || undefined,
    };
    createBooking.mutate({ data: payload }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBookingStatsQueryKey() });
        toast({
          title: "Quotation created",
          description: "Go to the booking page to activate the offer and share the link.",
        });
        setLocation(`/bookings/${data.id}/admin`);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create booking. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-12">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="shrink-0 -ml-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-foreground">New Booking Quotation</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* Tenant Details */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Tenant Details</CardTitle>
                <CardDescription>Who are you sending this quotation to?</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="tenantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Rahul Sharma" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tenantPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 9876543210" {...field} />
                      </FormControl>
                      <FormDescription>Used to send quotation via WhatsApp.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>Which property and room are they pre-booking?</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="propertyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Ghar Residency Koramangala" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 101-B" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Payment Setup */}
            <Card className="shadow-sm border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  Payment Setup
                </CardTitle>
                <CardDescription>Configure how the tenant will pay the token amount. Adding your UPI ID enables a scannable QR code on the tenant's payment page.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="upiId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your UPI ID (Recommended)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. yourname@upi or 9876543210@ybl" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>Tenants can scan a QR or tap to open PhonePe / GPay / Paytm directly.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adminPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                        Your WhatsApp Number
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 919876543210" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>Tenants tap "I've Paid" to message you directly. Include country code (e.g. 91 for India).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Financials & Terms */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Financials & Terms</CardTitle>
                <CardDescription>Set the pricing to create urgency and lock them in.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="actualRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standard Rent (₹ / month)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>The regular listed rent — shown as strikethrough to highlight savings.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountedRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offer Rent (₹ / month)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>The special rate if they book within 15 minutes.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Security Deposit (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maintenanceFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>One-time Maintenance (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tokenAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Payment (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Amount to lock the room — adjusted against first month's rent.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-full grid gap-6 sm:grid-cols-2 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="stayDurationMonths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lock-in Period (Months)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="noticePeriodMonths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notice Period (Months)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Link href="/">
                <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
              </Link>
              <Button type="submit" disabled={createBooking.isPending} className="w-full sm:w-auto min-w-[160px]">
                {createBooking.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Create Quotation"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
