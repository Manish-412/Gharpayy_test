import { Router, type IRouter } from "express";
import {
  ApproveBookingParams,
  ApproveBookingResponse,
  CreateBookingBody,
  DeleteBookingParams,
  GetBookingParams,
  GetBookingResponse,
  GetBookingStatsResponse,
  GetWhatsappMessageParams,
  GetWhatsappMessageResponse,
  ListBookingsResponse,
  ReactivateBookingParams,
  ReactivateBookingResponse,
  UpdateBookingBody,
  UpdateBookingParams,
  UpdateBookingResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

type BookingStatus = "pending" | "approved" | "paid" | "expired" | "cancelled";

type BookingRecord = {
  id: number;
  tenantName: string;
  tenantPhone: string;
  propertyName: string;
  roomNumber: string | null;
  actualRent: number;
  discountedRent: number;
  deposit: number;
  maintenanceFee: number;
  tokenAmount: number;
  stayDurationMonths: number;
  noticePeriodMonths: number;
  upiId: string | null;
  adminPhone: string | null;
  status: BookingStatus;
  approvedAt: string | null;
  offerExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const bookingsStore: BookingRecord[] = [];
let nextBookingId = 1;

function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN").format(amount);
}

function buildBookingResponse(booking: BookingRecord): BookingRecord {
  return booking;
}

function findBookingById(id: number): BookingRecord | undefined {
  return bookingsStore.find((booking) => booking.id === id);
}

function saveBooking(booking: BookingRecord): void {
  const index = bookingsStore.findIndex((entry) => entry.id === booking.id);
  if (index >= 0) {
    bookingsStore[index] = booking;
    return;
  }

  bookingsStore.unshift(booking);
}

router.get("/bookings", async (_req, res): Promise<void> => {
  const bookings = [...bookingsStore].sort((left, right) => right.id - left.id);
  res.json(ListBookingsResponse.parse(bookings.map(buildBookingResponse)));
});

router.get("/bookings/stats", async (_req, res): Promise<void> => {
  const bookings = [...bookingsStore];
  const stats = {
    total: bookings.length,
    pending: bookings.filter((booking) => booking.status === "pending").length,
    approved: bookings.filter((booking) => booking.status === "approved").length,
    paid: bookings.filter((booking) => booking.status === "paid").length,
    expired: bookings.filter((booking) => booking.status === "expired").length,
    cancelled: bookings.filter((booking) => booking.status === "cancelled").length,
    totalRevenue: bookings
      .filter((booking) => booking.status === "paid")
      .reduce((sum, booking) => sum + booking.tokenAmount, 0),
  };

  res.json(GetBookingStatsResponse.parse(stats));
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const now = new Date().toISOString();
  const booking: BookingRecord = {
    id: nextBookingId++,
    tenantName: parsed.data.tenantName,
    tenantPhone: parsed.data.tenantPhone,
    propertyName: parsed.data.propertyName,
    roomNumber: parsed.data.roomNumber ?? null,
    actualRent: parsed.data.actualRent,
    discountedRent: parsed.data.discountedRent,
    deposit: parsed.data.deposit,
    maintenanceFee: parsed.data.maintenanceFee,
    tokenAmount: parsed.data.tokenAmount,
    stayDurationMonths: parsed.data.stayDurationMonths,
    noticePeriodMonths: parsed.data.noticePeriodMonths,
    upiId: parsed.data.upiId ?? null,
    adminPhone: parsed.data.adminPhone ?? null,
    status: "pending",
    approvedAt: null,
    offerExpiresAt: null,
    createdAt: now,
    updatedAt: now,
  };

  saveBooking(booking);
  res.status(201).json(GetBookingResponse.parse(buildBookingResponse(booking)));
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetBookingParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const booking = findBookingById(params.data.id);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(GetBookingResponse.parse(buildBookingResponse(booking)));
});

router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateBookingParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const booking = findBookingById(params.data.id);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const updatedAt = new Date().toISOString();
  const updatedBooking: BookingRecord = {
    ...booking,
    tenantName: parsed.data.tenantName ?? booking.tenantName,
    tenantPhone: parsed.data.tenantPhone ?? booking.tenantPhone,
    propertyName: parsed.data.propertyName ?? booking.propertyName,
    roomNumber: parsed.data.roomNumber ?? booking.roomNumber,
    actualRent: parsed.data.actualRent ?? booking.actualRent,
    discountedRent: parsed.data.discountedRent ?? booking.discountedRent,
    deposit: parsed.data.deposit ?? booking.deposit,
    maintenanceFee: parsed.data.maintenanceFee ?? booking.maintenanceFee,
    tokenAmount: parsed.data.tokenAmount ?? booking.tokenAmount,
    stayDurationMonths: parsed.data.stayDurationMonths ?? booking.stayDurationMonths,
    noticePeriodMonths: parsed.data.noticePeriodMonths ?? booking.noticePeriodMonths,
    upiId: parsed.data.upiId ?? booking.upiId,
    adminPhone: parsed.data.adminPhone ?? booking.adminPhone,
    updatedAt,
  };

  saveBooking(updatedBooking);
  res.json(UpdateBookingResponse.parse(buildBookingResponse(updatedBooking)));
});

router.delete("/bookings/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteBookingParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const index = bookingsStore.findIndex((booking) => booking.id === params.data.id);
  if (index < 0) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  bookingsStore.splice(index, 1);
  res.sendStatus(204);
});

router.post("/bookings/:id/approve", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ApproveBookingParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const booking = findBookingById(params.data.id);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const updatedBooking: BookingRecord = {
    ...booking,
    status: "approved",
    approvedAt: now,
    offerExpiresAt: expiresAt,
    updatedAt: now,
  };

  saveBooking(updatedBooking);
  res.json(ApproveBookingResponse.parse(buildBookingResponse(updatedBooking)));
});

router.post("/bookings/:id/reactivate", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ReactivateBookingParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const booking = findBookingById(params.data.id);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const updatedBooking: BookingRecord = {
    ...booking,
    status: "approved",
    approvedAt: now,
    offerExpiresAt: expiresAt,
    updatedAt: now,
  };

  saveBooking(updatedBooking);
  res.json(ReactivateBookingResponse.parse(buildBookingResponse(updatedBooking)));
});

router.get("/bookings/:id/whatsapp", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetWhatsappMessageParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const booking = findBookingById(params.data.id);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const domain = process.env.REPLIT_DOMAINS
    ? process.env.REPLIT_DOMAINS.split(",")[0]
    : "localhost:80";

  const bookingUrl = `https://${domain}/bookings/${booking.id}`;
  const savingsAmount = booking.actualRent - booking.discountedRent;
  const roomInfo = booking.roomNumber ? ` (Room ${booking.roomNumber})` : "";

  const message = `Hi ${booking.tenantName}! 🏠

Here is your *exclusive offer* for *${booking.propertyName}*${roomInfo}:

💰 *Rent:* ~~₹${formatIndianCurrency(booking.actualRent)}/mo~~ → *₹${formatIndianCurrency(booking.discountedRent)}/mo*${savingsAmount > 0 ? ` _(Save ₹${formatIndianCurrency(savingsAmount)} every month!)_` : ""}
🔒 *Security Deposit:* ₹${formatIndianCurrency(booking.deposit)}
🔧 *One-time Maintenance:* ₹${formatIndianCurrency(booking.maintenanceFee)}
🕐 *Stay Duration:* ${booking.stayDurationMonths} months
📅 *Notice Period:* ${booking.noticePeriodMonths} month${booking.noticePeriodMonths !== 1 ? "s" : ""}

*To lock this room now, pay a token of ₹${formatIndianCurrency(booking.tokenAmount)}* (adjusted in your first rent).

⏰ *This offer is valid for only 15 minutes* after I activate it. Don't miss it!

Click here to view your offer and pay:
👉 ${bookingUrl}

Once you pay, reply here with your payment screenshot. I'll send your receipt right away.`;

  const phone = booking.tenantPhone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  res.json(
    GetWhatsappMessageResponse.parse({
      message,
      url: whatsappUrl,
      phone: booking.tenantPhone,
    }),
  );
});

export default router;
