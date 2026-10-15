import { useState, useEffect, useRef, useCallback } from "react";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";
import "./nagad.css";

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

interface MessageData {
  amount: string;
  sender: string;
  ref: string;
  trxId: string;
  balance: string;
  date: string;
  metaTime: string;
}

const getUrlParams = () => {
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialSpeed = getRandomSpeed();
  const initialBattery = getRandomBattery();

  // Trigger 2nd message ONLY if explicit 2nd message params or trigger flags are present
  const hasSecondTrigger =
    searchParams.has("amount2") ||
    searchParams.has("trxId2") ||
    searchParams.has("trxid2") ||
    searchParams.has("sender2") ||
    searchParams.has("balance2") ||
    searchParams.has("ref2") ||
    searchParams.has("date2") ||
    searchParams.has("datetime2") ||
    searchParams.get("messages") === "2" ||
    searchParams.get("count") === "2" ||
    searchParams.get("second") === "true" ||
    searchParams.get("showSecond") === "true" ||
    searchParams.get("msg2") === "true";

  return {
    clock: searchParams.get("time") || searchParams.get("clock") || "",
    speedVal: searchParams.get("speed") || initialSpeed.val,
    speedUnit: searchParams.get("unit") || initialSpeed.unit,
    battery: parseInt(searchParams.get("battery") || String(initialBattery), 10),
    signalBars: parseInt(searchParams.get("signal") || String(getRandomSignal()), 10),
    network: searchParams.get("network") || getRandomNetwork(),

    // Second message trigger state
    showSecond: hasSecondTrigger,

    // Message 1 parameters
    amount: searchParams.get("amount") || searchParams.get("amount1") || "5000.00",
    sender: searchParams.get("sender") || searchParams.get("sender1") || "01718727784",
    ref: searchParams.get("ref") || searchParams.get("ref1") || "N/A",
    trxId: searchParams.get("trxId") || searchParams.get("trxid") || searchParams.get("trxId1") || "75X0LHYP",
    balance: searchParams.get("balance") || searchParams.get("balance1") || "5026.59",
    date: searchParams.get("date") || searchParams.get("datetime") || searchParams.get("date1") || "01/09/2026 16:05",
    metaTime1: searchParams.get("metaTime1") || searchParams.get("meta1") || searchParams.get("metaTime") || "9/1 5:47PM",

    // Message 2 parameters (separate and independent)
    amount2: searchParams.get("amount2") || "2000.00",
    sender2: searchParams.get("sender2") || searchParams.get("sender") || "01718727784",
    ref2: searchParams.get("ref2") || "N/A",
    trxId2: searchParams.get("trxId2") || searchParams.get("trxid2") || "86K2MNPQ",
    balance2: searchParams.get("balance2") || "7026.59",
    date2: searchParams.get("date2") || searchParams.get("datetime2") || "01/09/2026 16:15",
    metaTime2: searchParams.get("metaTime2") || searchParams.get("meta2") || "9/1 5:51PM",
  };
};

function MessageCard({ isSecond = false, data }: { isSecond?: boolean; data: MessageData }) {
  return (
    <section className={`message-group ${isSecond ? "second-message" : ""}`}>
      <div className="message-card">
        <p className="headline">Money Received.</p>
        <p>Amount: Tk {data.amount}</p>
        <p>
          Sender: <a href={`tel:${data.sender}`}>{data.sender}</a>
        </p>
        <p>Ref: {data.ref}</p>
        <p>TrxID: {data.trxId}</p>
        <p>Balance: Tk {data.balance}</p>
        <p>{data.date}</p>
      </div>
      <div className="message-meta">
        <span>{data.metaTime}</span>
        <Sim1Icon className="sim-meta-icon" />
      </div>
    </section>
  );
}

export default function NagadReceipt({ hideControls = false }: { hideControls?: boolean }) {
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
        link.download = `nagad-receipt-${params.trxId}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Failed to download image:", err);
      });
  }, [cardRef, params.trxId]);

  const msg1Data: MessageData = {
    amount: params.amount,
    sender: params.sender,
    ref: params.ref,
    trxId: params.trxId,
    balance: params.balance,
    date: params.date,
    metaTime: params.metaTime1,
  };

  const msg2Data: MessageData = {
    amount: params.amount2,
    sender: params.sender2,
    ref: params.ref2,
    trxId: params.trxId2,
    balance: params.balance2,
    date: params.date2,
    metaTime: params.metaTime2,
  };

  return (
    <div className="nagad-container">
      {!hideControls && (
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-[#f6921e] text-white px-5 py-2.5 rounded-full font-medium shadow-md hover:bg-[#e07d0f] transition-all cursor-pointer active:scale-95 text-sm"
          >
            <Download size={16} />
            <span>Download Nagad Receipt</span>
          </button>
          <button
            onClick={() => {
              setParams((prev) => ({ ...prev, showSecond: !prev.showSecond }));
            }}
            className="flex items-center gap-2 bg-white text-[#f6921e] border border-[#f6921e] px-4 py-2.5 rounded-full font-medium shadow-sm hover:bg-[#fff7ee] transition-all cursor-pointer active:scale-95 text-sm"
          >
            {params.showSecond ? "Showing 2 Messages (Click for 1)" : "Showing 1 Message (Click for 2)"}
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
          <h1>NAGAD</h1>
          <button className="round-button more-button" aria-label="More options">
            <MoreIcon />
          </button>
        </header>

        <div className="messages">
          <MessageCard data={msg1Data} />
          {params.showSecond && <MessageCard isSecond data={msg2Data} />}
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
