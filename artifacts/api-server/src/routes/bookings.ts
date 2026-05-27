import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, bookingsTable } from "@workspace/db";
import {
  CreateBookingBody,
  GetBookingParams,
  UpdateBookingBody,
  UpdateBookingParams,
  DeleteBookingParams,
  ApproveBookingParams,
  ReactivateBookingParams,
  GetWhatsappMessageParams,
  ListBookingsResponse,
  GetBookingResponse,
  UpdateBookingResponse,
  ApproveBookingResponse,
  ReactivateBookingResponse,
  GetWhatsappMessageResponse,
  GetBookingStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN").format(amount);
}

function buildBookingResponse(booking: typeof bookingsTable.$inferSelect) {
  return {
    ...booking,
    approvedAt: booking.approvedAt ? booking.approvedAt.toISOString() : null,
    offerExpiresAt: booking.offerExpiresAt ? booking.offerExpiresAt.toISOString() : null,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}

router.get("/bookings", async (req, res): Promise<void> => {
  const bookings = await db
    .select()
    .from(bookingsTable)
    .orderBy(sql`${bookingsTable.createdAt} DESC`);
  const mapped = bookings.map(buildBookingResponse);
  res.json(ListBookingsResponse.parse(mapped));
});

router.get("/bookings/stats", async (req, res): Promise<void> => {
  const bookings = await db.select().from(bookingsTable);
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    approved: bookings.filter((b) => b.status === "approved").length,
    paid: bookings.filter((b) => b.status === "paid").length,
    expired: bookings.filter((b) => b.status === "expired").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    totalRevenue: bookings
      .filter((b) => b.status === "paid")
      .reduce((sum, b) => sum + b.tokenAmount, 0),
  };
  res.json(GetBookingStatsResponse.parse(stats));
});

router.post("/bookings", async (req, res): Promise<void> => {
  try {
    const parsed = CreateBookingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const now = new Date();
    const [booking] = await db
      .insert(bookingsTable)
      .values({
        ...parsed.data,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    res.status(201).json(GetBookingResponse.parse(buildBookingResponse(booking)));
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create booking",
    });
  }
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetBookingParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id));

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

  const [booking] = await db
    .update(bookingsTable)
    .set(parsed.data)
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(UpdateBookingResponse.parse(buildBookingResponse(booking)));
});

router.delete("/bookings/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteBookingParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .delete(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/bookings/:id/approve", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ApproveBookingParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  const [booking] = await db
    .update(bookingsTable)
    .set({ status: "approved", approvedAt: now, offerExpiresAt: expiresAt })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(ApproveBookingResponse.parse(buildBookingResponse(booking)));
});

router.post("/bookings/:id/reactivate", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ReactivateBookingParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  const [booking] = await db
    .update(bookingsTable)
    .set({ status: "approved", approvedAt: now, offerExpiresAt: expiresAt })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(ReactivateBookingResponse.parse(buildBookingResponse(booking)));
});

router.get("/bookings/:id/whatsapp", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetWhatsappMessageParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id));

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
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

  res.json(
    GetWhatsappMessageResponse.parse({
      message,
      url: whatsappUrl,
      phone: booking.tenantPhone,
    }),
  );
});

export default router;
