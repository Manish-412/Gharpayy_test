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
import { ArrowLeft, Loader2 } from "lucide-react";
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
    }
  });

  const onSubmit = (values: FormValues) => {
    createBooking.mutate({ data: values }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBookingStatsQueryKey() });
        toast({
          title: "Booking created",
          description: "The quotation has been generated successfully.",
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
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Tenant Details</CardTitle>
                <CardDescription>Basic information about the prospective tenant.</CardDescription>
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>Which property and room are they booking?</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="propertyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Ghar Residency Kormangala" {...field} />
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

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Financials & Terms</CardTitle>
                <CardDescription>Setup the quotation pricing to lock them in.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="actualRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standard Rent (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountedRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offer Rent (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>The discounted rate if they book now.</FormDescription>
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
                      <FormLabel>Monthly Maintenance (₹)</FormLabel>
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
                      <FormDescription>Amount required to lock the room.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="col-span-full grid gap-6 sm:grid-cols-2 mt-2 pt-6 border-t">
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

            <div className="flex justify-end gap-4">
              <Link href="/">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={createBooking.isPending} className="w-full sm:w-auto min-w-[140px]">
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
