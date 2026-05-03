import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// ============================================
// GET /api/analytics/export?format=csv&period=30d&type=orders|revenue|reservations
// Returns CSV file download
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";
    const period = searchParams.get("period") || "30d";
    const type = searchParams.get("type") || "orders";

    if (format !== "csv") {
      return error("Seul le format CSV est supporte", 400);
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "7d":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate = new Date(0);
    }

    let csvContent = "";
    let filename = "";

    if (type === "orders") {
      const orders = await db.order.findMany({
        where: { createdAt: { gte: startDate } },
        include: { items: true, payments: { take: 1 } },
        orderBy: { createdAt: "desc" },
      });

      const headers = [
        "Numero de commande",
        "Client",
        "Telephone",
        "Type",
        "Statut",
        "Articles",
        "Sous-total",
        "Taxe",
        "Frais livraison",
        "Total",
        "Methode paiement",
        "Date",
      ];

      const rows = orders.map((o) => [
        o.orderNumber,
        `"${o.customerName}"`,
        `"${o.customerPhone || ""}"`,
        o.orderType,
        o.status,
        `"${(o.items || []).map((i) => `${i.quantity}x ${i.itemName}`).join("; ")}"`,
        o.subtotal.toString(),
        o.tax.toString(),
        o.deliveryFee.toString(),
        o.total.toString(),
        o.payments[0]?.method || "N/A",
        o.createdAt.toISOString(),
      ]);

      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      filename = `commandes_${period}.csv`;
    } else if (type === "revenue") {
      const payments = await db.payment.findMany({
        where: {
          createdAt: { gte: startDate },
          status: "PAID",
        },
        include: { order: true },
        orderBy: { createdAt: "desc" },
      });

      const headers = [
        "ID Paiement",
        "Commande",
        "Montant",
        "Methode",
        "Fournisseur",
        "Statut",
        "Date",
      ];

      const rows = payments.map((p) => [
        p.id,
        p.order?.orderNumber || "N/A",
        p.amount.toString(),
        p.method,
        `"${p.provider || ""}"`,
        p.status,
        p.processedAt?.toISOString() || p.createdAt.toISOString(),
      ]);

      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      filename = `revenus_${period}.csv`;
    } else if (type === "reservations") {
      const reservations = await db.reservation.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { date: "desc" },
      });

      const headers = [
        "Invite",
        "Telephone",
        "Email",
        "Date",
        "Heure",
        "Convives",
        "Duree (min)",
        "Statut",
        "Occasion",
        "Demandes speciales",
        "Date creation",
      ];

      const rows = reservations.map((r) => [
        `"${r.guestName}"`,
        `"${r.guestPhone}"`,
        `"${r.guestEmail || ""}"`,
        r.date.toISOString().split("T")[0],
        r.time,
        r.partySize.toString(),
        r.duration.toString(),
        r.status,
        `"${r.occasion || ""}"`,
        `"${(r.specialRequests || "").replace(/"/g, '""')}"`,
        r.createdAt.toISOString(),
      ]);

      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      filename = `reservations_${period}.csv`;
    } else {
      return error("Type invalide. Utilisez: orders, revenue, ou reservations", 400);
    }

    // BOM for UTF-8 in Excel
    const bom = "\uFEFF";

    return new NextResponse(bom + csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[ANALYTICS EXPORT GET]", err);
    return error("Erreur interne du serveur", 500);
  }
}
