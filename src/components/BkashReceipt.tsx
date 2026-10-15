import { useState, useEffect, useRef, useCallback } from "react";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";
import "./bkash.css";

function getBangladeshTime(): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function getRandomSpeed(): { val: string; unit: string } {
  const isMb = Math.random() < 0.12;
  if (isMb) {
    return {
      val: (Math.random() * 2.5 + 0.4).toFixed(1),
      unit: "MB/S",
    };
  }
  const r = Math.random();
  if (r < 0.45) {
    return {
      val: (Math.random() * 0.9 + 0.05).toFixed(2),
      unit: "KB/S",
    };
  } else if (r < 0.85) {
    return {
      val: (Math.random() * 8.5 + 1.0).toFixed(1),
      unit: "KB/S",
    };
  } else {
    return {
      val: (Math.random() * 45 + 10).toFixed(0),
      unit: "KB/S",
    };
  }
}

function getRandomBattery(): number {
  return Math.floor(Math.random() * (96 - 45 + 1)) + 45;
}

const NETWORK_TYPES = ["4G", "4G", "4G", "5G", "4G+", "LTE"];
function getRandomNetwork(): string {
  return NETWORK_TYPES[Math.floor(Math.random() * NETWORK_TYPES.length)];
}

function getRandomSignal(): number {
  return Math.random() < 0.8 ? 4 : 3;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M27 16H6M15 7l-9 9 9 9" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="6.5" r="2.8" />
      <circle cx="16" cy="16" r="2.8" />
      <circle cx="16" cy="25.5" r="2.8" />
    </svg>
  );
}

function Sim1Icon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M6 3h8l4 4v14H6V3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="11.5"
        y="19"
        fontSize="13"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
      >
        1
      </text>
    </svg>
  );
}

function MicrophoneIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="11" y="3" width="10" height="19" rx="5" />
      <path d="M7 16v1a9 9 0 0 0 18 0v-1M16 26v4" />
    </svg>
  );
}

function SignalBars({ count = 4 }: { count?: number }) {
  return (
    <span className="signal" aria-hidden="true">
      {[1, 2, 3, 4].map((bar) => (
        <i
          key={bar}
          style={{ opacity: bar <= count ? 1 : 0.22 }}
        />
      ))}
    </span>
  );
}

function formatBkashMetaTime(dateStr: string): string {
  try {
    const match = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\s+(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(AM|PM))?/i);
    if (match) {
      let hours = parseInt(match[4], 10);
      const mins = match[5];
      let ampm = match[6] ? match[6].toUpperCase() : "";

      if (!ampm) {
        ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
      }

      return `Today ${hours}:${mins} ${ampm}`;
    }
  } catch {
    // fallback
  }
  return "Today 8:42 AM";
}

function getBangladeshDateTime(): { dateStr: string; timeStr: string; day: string; month: string; year: string } {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const day = parts.find((p) => p.type === "day")?.value || "15";
  const month = parts.find((p) => p.type === "month")?.value || "10";
  const year = parts.find((p) => p.type === "year")?.value || "2026";
  const hour = parts.find((p) => p.type === "hour")?.value || "12";
  const minute = parts.find((p) => p.type === "minute")?.value || "00";

  return {
    dateStr: `${day}/${month}/${year} ${hour}:${minute}`,
    timeStr: `${hour}:${minute}`,
    day,
    month,
    year,
  };
}

const getUrlParams = () => {
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialSpeed = getRandomSpeed();
  const initialBattery = getRandomBattery();
  const nowBd = getBangladeshDateTime();

  const timeParam = searchParams.get("time") || searchParams.get("clock") || "";
  const userDate = searchParams.get("date") || searchParams.get("datetime");

  let dateVal: string;
  if (userDate) {
    dateVal = userDate;
  } else if (timeParam) {
    dateVal = `${nowBd.day}/${nowBd.month}/${nowBd.year} ${timeParam}`;
  } else {
    dateVal = nowBd.dateStr;
  }

  return {
    amount: searchParams.get("amount") || "12,800.00",
    sender: searchParams.get("sender") || "01840172190",
    ref: searchParams.get("ref") || "Black Rock",
    fee: searchParams.get("fee") || "0.00",
    balance: searchParams.get("balance") || "23,426.85",
    trxId: searchParams.get("trxId") || searchParams.get("trxid") || "DJE3VTZ0VN",
    date: dateVal,
    metaTime: searchParams.get("metaTime") || searchParams.get("metatime") || formatBkashMetaTime(dateVal),
    clock: timeParam,
    speedVal: searchParams.get("speed") || initialSpeed.val,
    speedUnit: searchParams.get("unit") || initialSpeed.unit,
    battery: parseInt(searchParams.get("battery") || String(initialBattery), 10),
    signalBars: parseInt(searchParams.get("signal") || String(getRandomSignal()), 10),
    network: searchParams.get("network") || getRandomNetwork(),
  };
};

function MessageCard({ params }: { params: ReturnType<typeof getUrlParams> }) {
  return (
    <section className="message-group">
      <div className="message-card">
        <p>You have received Tk {params.amount}</p>
        <p>
          from <a href={`tel:${params.sender}`}>{params.sender}</a>. Ref. {params.ref}
        </p>
        <p>Fee Tk {params.fee}. Balance Tk</p>
        <p>{params.balance}. TrxID {params.trxId}</p>
        <p>at {params.date}</p>
      </div>
      <div className="message-meta">
        <span>{params.metaTime}</span>
        <Sim1Icon className="sim-meta-icon" />
      </div>
    </section>
  );
}

export default function BkashReceipt({ hideControls = false }: { hideControls?: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [params, setParams] = useState(getUrlParams);
  const [currentTime, setCurrentTime] = useState<string>(() => params.clock || getBangladeshTime());
  const [speed, setSpeed] = useState(() => ({ val: params.speedVal, unit: params.speedUnit }));
  const [signalBars, setSignalBars] = useState(() => params.signalBars);
  const [networkType] = useState(() => params.network);
  const [battery, setBattery] = useState(() => params.battery);

  useEffect(() => {
    if (params.clock) return;
    const updateTime = () => {
      setCurrentTime(getBangladeshTime());
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, [params.clock]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has("speed")) return;
    const speedInterval = setInterval(() => {
      setSpeed(getRandomSpeed());
    }, 2500);
    return () => clearInterval(speedInterval);
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has("signal")) return;
    const signalInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        setSignalBars(getRandomSignal());
      }
    }, 7000);
    return () => clearInterval(signalInterval);
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has("battery")) return;
    const batteryInterval = setInterval(() => {
      setBattery((prev) => (prev > 12 ? prev - 1 : prev));
    }, 120000);
    return () => clearInterval(batteryInterval);
  }, []);

  useEffect(() => {
    const handleUrlChange = () => {
      setParams(getUrlParams());
    };
    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  const handleDownload = useCallback(() => {
    if (cardRef.current === null) return;

    toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `bkash-receipt-${params.trxId}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Failed to download image:", err);
      });
  }, [cardRef, params.trxId]);

  return (
    <div className="bkash-container">
      {!hideControls && (
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-[#e2136e] text-white px-5 py-2.5 rounded-full font-medium shadow-md hover:bg-[#c20d5d] transition-all cursor-pointer active:scale-95 text-sm"
          >
            <Download size={16} />
            <span>Download bKash Receipt</span>
          </button>
        </div>
      )}

      {/* Exact 390px Mobile Frame matching Binance */}
      <main
        className="phone"
        id="receipt-card"
        ref={cardRef}
        style={{ width: 390, minHeight: 844, margin: '0 auto' }}
      >
        <div className="status-bar">
          <time title="Bangladesh Standard Time (BST)">{currentTime}</time>
          <div className="status-right">
            <span className="speed" title={`${speed.val} ${speed.unit}`}>
              <b>{speed.val}</b>
              <small>{speed.unit}</small>
            </span>
            <SignalBars count={signalBars} />
            <strong>{networkType}</strong>
            <span className="battery" title={`Battery: ${battery}%`}>
              <span>{battery}</span>
            </span>
          </div>
        </div>

        <header className="conversation-header">
          <button className="round-button" aria-label="Go back">
            <BackIcon />
          </button>
          <h1>bKash</h1>
          <button className="round-button more-button" aria-label="More options">
            <MoreIcon />
          </button>
        </header>

        <div className="messages">
          <MessageCard params={params} />
        </div>

        <footer className="composer-area">
          <div className="composer">
            <button className="plus-button" aria-label="Add attachment">
              <span />
            </button>
            <span className="placeholder">Message</span>
            <button className="sim-button" aria-label="Choose SIM 1">
              <Sim1Icon className="sim-composer-icon" />
              <span className="caret" aria-hidden="true" />
            </button>
          </div>
          <button className="mic-button" aria-label="Voice message">
            <MicrophoneIcon />
          </button>
          <div className="gesture-bar" />
        </footer>
      </main>
    </div>
  );
}
