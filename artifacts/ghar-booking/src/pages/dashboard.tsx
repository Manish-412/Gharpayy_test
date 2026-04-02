import { Link } from "wouter";
import { useListBookings, useGetBookingStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, IndianRupee, Users, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/booking-status-badge";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetBookingStats();
  const { data: bookings, isLoading: bookingsLoading } = useListBookings();

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg leading-none">G</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Ghar</h1>
          </div>
          <Link href="/bookings/new">
            <Button size="sm" className="gap-2 shadow-sm hover-elevate">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Booking</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Grid */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {statsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
                )}
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Deals</CardTitle>
                <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                  <Users className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.total || 0}</div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                <div className="p-2 bg-yellow-50 rounded-full text-yellow-600">
                  <Clock className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.pending || 0}</div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Locked In</CardTitle>
                <div className="p-2 bg-green-50 rounded-full text-green-600">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.paid || 0}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Bookings List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent Bookings</h2>
          </div>
          
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            {bookingsLoading ? (
              <div className="divide-y">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 sm:p-6 flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : bookings?.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium mb-1">No bookings yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">Create your first booking to generate a quotation and lock in a tenant.</p>
                <Link href="/bookings/new">
                  <Button className="hover-elevate">Create Booking</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {bookings?.map((booking, i) => (
                  <Link key={booking.id} href={`/bookings/${booking.id}/admin`}>
                    <div 
                      className="p-4 sm:p-6 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-base font-medium text-foreground truncate">{booking.tenantName}</h3>
                          <StatusBadge status={booking.status} />
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {booking.propertyName} {booking.roomNumber ? `• Room ${booking.roomNumber}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Token: {formatCurrency(booking.tokenAmount)} • Rent: {formatCurrency(booking.discountedRent)}/mo
                        </p>
                      </div>
                      <div className="shrink-0 text-muted-foreground">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
