type ReservationContext = {
  salonName: string;
  clientName: string;
  serviceName: string | null;
  areaName: string | null;
  start: Date;
  notes?: string | null;
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-CU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("es-CU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function serviceLine(serviceName: string | null, areaName: string | null) {
  if (serviceName)
    return `💼 ${serviceName}${areaName ? ` (${areaName})` : ""}`;
  if (areaName) return `💼 ${areaName}`;
  return null;
}

export function buildReservationMessage(ctx: ReservationContext): string {
  const lines = [
    `Hola, soy ${ctx.clientName}.`,
    "",
    `Solicito una reserva en *${ctx.salonName}*:`,
    `📅 ${formatDate(ctx.start)}`,
    `🕐 ${formatTime(ctx.start)}`,
  ];
  const svc = serviceLine(ctx.serviceName, ctx.areaName);
  if (svc) lines.push(svc);
  if (ctx.notes) lines.push("", `📝 ${ctx.notes}`);
  lines.push("", "Espero su confirmación. ¡Gracias!");
  return lines.join("\n");
}

// Mensaje genérico owner→cliente (al pulsar "WhatsApp" en agenda).
export function buildOwnerGreetingMessage(ctx: ReservationContext): string {
  const lines = [
    `Hola ${ctx.clientName} 👋`,
    "",
    `Te escribimos desde *${ctx.salonName}* por tu solicitud del ${formatDate(ctx.start)} a las ${formatTime(ctx.start)}.`,
  ];
  return lines.join("\n");
}

export function buildApprovalMessage(ctx: ReservationContext): string {
  const lines = [
    `Hola ${ctx.clientName} 👋`,
    "",
    `Te confirmamos tu reserva en *${ctx.salonName}*:`,
    `📅 ${formatDate(ctx.start)}`,
    `🕐 ${formatTime(ctx.start)}`,
  ];
  const svc = serviceLine(ctx.serviceName, ctx.areaName);
  if (svc) lines.push(svc);
  lines.push("", "¡Te esperamos!");
  return lines.join("\n");
}

export function buildRejectionMessage(
  ctx: ReservationContext & { reason?: string | null },
): string {
  const lines = [
    `Hola ${ctx.clientName},`,
    "",
    `Lamentablemente no podemos atender tu reserva en *${ctx.salonName}* del ${formatDate(ctx.start)} a las ${formatTime(ctx.start)}.`,
  ];
  if (ctx.reason && ctx.reason.trim()) {
    lines.push("", `Motivo: ${ctx.reason.trim()}`);
  }
  lines.push("", "Si lo deseas, escríbenos para coordinar otro horario.");
  return lines.join("\n");
}

export function whatsappLink(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
