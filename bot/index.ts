import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  type WAMessage,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode";
import pino from "pino";
import { authFolder, writeStatus } from "../src/lib/whatsappStatus";
import { handleIncomingMessage, type BotOutgoing } from "./conversation";

const logger = pino({ level: "silent" });

function extractIncomingText(msg: WAMessage): string | undefined {
  const m = msg.message;
  if (!m) return undefined;
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  return undefined;
}

async function sendReply(sock: ReturnType<typeof makeWASocket>, jid: string, reply: BotOutgoing) {
  if (reply.kind === "text") {
    await sock.sendMessage(jid, { text: reply.text });
  } else {
    await sock.sendMessage(jid, { image: { url: reply.url }, caption: reply.caption });
  }
}

async function start() {
  writeStatus({ state: "starting" });

  const { state, saveCreds } = await useMultiFileAuthState(authFolder());
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      const qrDataUrl = await qrcode.toDataURL(qr);
      writeStatus({ state: "qr", qrDataUrl });
      console.log("📱 QR code updated — scan it from /admin in the store's admin dashboard");
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      if (loggedOut) {
        writeStatus({ state: "disconnected", reason: "מנותק מוואטסאפ — יש לסרוק שוב את קוד ה-QR" });
        console.log("Logged out. Delete .wa-session/auth to re-link, then restart the bot.");
      } else {
        writeStatus({ state: "disconnected", reason: "החיבור נסגר, מתחבר מחדש..." });
        console.log("Connection closed, reconnecting...");
        setTimeout(() => start(), 2000);
      }
    } else if (connection === "open") {
      const phone = sock.user?.id?.split(":")[0] ?? sock.user?.id ?? "";
      writeStatus({ state: "connected", phone, connectedAt: new Date().toISOString() });
      console.log(`✅ WhatsApp connected as ${phone}`);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      const jid = msg.key.remoteJid;
      if (!jid || jid.endsWith("@g.us") || jid === "status@broadcast") continue;

      const text = extractIncomingText(msg);
      if (text === undefined) continue;

      const phone = jid.split("@")[0];

      try {
        await sock.readMessages([msg.key]);
        const replies = await handleIncomingMessage(phone, text);
        for (const reply of replies) {
          await sendReply(sock, jid, reply);
        }
      } catch (err) {
        console.error("Error handling message from", phone, err);
        await sock.sendMessage(jid, { text: "משהו השתבש אצלנו, נסי שוב עוד רגע 🙏" }).catch(() => {});
      }
    }
  });
}

start().catch((err) => {
  console.error("Failed to start WhatsApp bot", err);
  writeStatus({ state: "disconnected", reason: String(err?.message ?? err) });
});
