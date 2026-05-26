import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login({ onDemoMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      // Beautiful human readable errors
      if (err.code === "auth/invalid-credential") {
        setError("AUTHENTICATION INVALID: ACCESS DENIED");
      } else if (err.code === "auth/email-already-in-use") {
        setError("YEARLY OVERVIEW REGISTERED: CHOOSE NEW IDENTITY");
      } else if (err.code === "auth/weak-password") {
        setError("PASSCODE WEAK: MINIMUM 6 CHARACTERS REQUIRED");
      } else {
        setError(err.message.replace("Firebase:", "").toUpperCase());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        maxWidth: "500px",
        margin: "0 auto",
        perspective: "1000px"
      }}
    >
      <div 
        className="tactile-card"
        style={{
          width: "100%",
          backgroundColor: "var(--color-manila-light)",
          border: "2px solid var(--color-ink-dark)",
          borderRadius: "12px",
          padding: "36px 30px",
          boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
          position: "relative",
          overflow: "visible",
          transform: "rotate(-0.5deg)"
        }}
      >
        {/* Binder Spine line aesthetic */}
        <div 
          style={{
            position: "absolute",
            top: 0, bottom: 0, left: "20px",
            width: "3px",
            borderLeft: "2px dashed rgba(32,30,28,0.15)",
            pointerEvents: "none"
          }}
        />

        {/* Top Ledger Headers */}
        <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: "2px double var(--color-ink-dark)", paddingBottom: "16px" }}>
          <span 
            className="stamp stamp-red" 
            style={{ 
              fontSize: "10px", 
              position: "absolute", 
              top: "20px", 
              right: "20px", 
              transform: "rotate(12deg)",
              letterSpacing: "2px"
            }}
          >
            CONFIDENTIAL
          </span>
          <h2 style={{ fontFamily: "var(--font-typewriter)", fontSize: "22px", margin: 0, color: "var(--color-ink-dark)", letterSpacing: "-0.5px" }}>
            TREASURY LEDGER SIGN-IN
          </h2>
          <p style={{ fontFamily: "var(--font-ledger)", fontSize: "11px", color: "rgba(32,30,28,0.7)", margin: "4px 0 0 0", textTransform: "uppercase" }}>
            COVE FINANCIAL HUB
          </p>
        </div>

        {/* Auth Toggle Vouchers */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          <button
            type="button"
            onClick={() => { setIsRegistering(false); setError(""); }}
            style={{
              flex: 1,
              padding: "8px",
              fontFamily: "var(--font-accent)",
              fontSize: "11px",
              fontWeight: "bold",
              textTransform: "uppercase",
              border: "1.5px solid var(--color-ink-dark)",
              borderRadius: "4px",
              cursor: "pointer",
              backgroundColor: !isRegistering ? "var(--color-ink-blue)" : "transparent",
              color: !isRegistering ? "var(--color-paper-light)" : "var(--color-ink-dark)",
              transition: "all 0.2s ease"
            }}
          >
            Authorized Login
          </button>
          <button
            type="button"
            onClick={() => { setIsRegistering(true); setError(""); }}
            style={{
              flex: 1,
              padding: "8px",
              fontFamily: "var(--font-accent)",
              fontSize: "11px",
              fontWeight: "bold",
              textTransform: "uppercase",
              border: "1.5px solid var(--color-ink-dark)",
              borderRadius: "4px",
              cursor: "pointer",
              backgroundColor: isRegistering ? "var(--color-ink-blue)" : "transparent",
              color: isRegistering ? "var(--color-paper-light)" : "var(--color-ink-dark)",
              transition: "all 0.2s ease"
            }}
          >
            New Yearly Overview
          </button>
        </div>

        {/* Main form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontFamily: "var(--font-accent)", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "rgba(32,30,28,0.8)" }}>
              Yearly Overview Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ivan@office.general"
              style={{
                padding: "10px 12px 10px 24px",
                fontFamily: "var(--font-ledger)",
                fontSize: "13px",
                border: "1px solid var(--color-paper-grid)",
                borderBottom: "2px solid var(--color-ink-dark)",
                borderRadius: "4px",
                backgroundColor: "var(--color-paper-light)",
                color: "var(--color-ink-dark)"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontFamily: "var(--font-accent)", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "rgba(32,30,28,0.8)" }}>
              Authorization Passcode
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                padding: "10px 12px 10px 24px",
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                border: "1px solid var(--color-paper-grid)",
                borderBottom: "2px solid var(--color-ink-dark)",
                borderRadius: "4px",
                backgroundColor: "var(--color-paper-light)",
                color: "var(--color-ink-dark)",
                letterSpacing: "2px"
              }}
            />
          </div>

          {error && (
            <div 
              style={{ 
                margin: "10px 0 0 0", 
                padding: "10px 12px", 
                backgroundColor: "rgba(158, 42, 43, 0.08)", 
                border: "1.5px dashed var(--color-stamp-red)", 
                borderRadius: "4px", 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center",
                position: "relative"
              }}
            >
              <span className="stamp stamp-red" style={{ fontSize: "8px", marginBottom: "4px", transform: "rotate(-2deg)" }}>REJECTED</span>
              <span style={{ fontFamily: "var(--font-ledger)", fontSize: "11px", color: "var(--color-stamp-red)", fontWeight: "bold", textAlign: "center" }}>
                {error}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px",
              fontFamily: "var(--font-accent)",
              fontSize: "12px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "var(--color-paper-light)",
              backgroundColor: "var(--color-ink-dark)",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(0,0,0,0.15)",
              transition: "all 0.2s ease",
              marginTop: "8px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
            onMouseOver={(e) => { if (!loading) e.target.style.backgroundColor = "var(--color-ink-blue)"; }}
            onMouseOut={(e) => { if (!loading) e.target.style.backgroundColor = "var(--color-ink-dark)"; }}
          >
            {loading ? "AUTHENTICATING LEDGERS..." : isRegistering ? "Authorize Credentials & Open" : "Authenticate Access & Unlock"}
          </button>
        </form>

        {/* Vintage Desk Divider */}
        <div style={{ display: "flex", alignItems: "center", margin: "24px 0", gap: "10px" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-paper-grid)" }}></div>
          <span style={{ fontFamily: "var(--font-ledger)", fontSize: "9px", color: "rgba(32,30,28,0.4)", textTransform: "uppercase" }}>OR GUEST AUDIT</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-paper-grid)" }}></div>
        </div>

        {/* Skeuomorphic Demo Mode Access */}
        <button
          type="button"
          onClick={onDemoMode}
          style={{
            width: "100%",
            padding: "12px",
            fontFamily: "var(--font-typewriter)",
            fontSize: "13px",
            fontWeight: "bold",
            textTransform: "uppercase",
            color: "var(--color-stamp-green)",
            backgroundColor: "rgba(37, 96, 70, 0.05)",
            border: "3px double var(--color-stamp-green)",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            transform: "rotate(-1deg)"
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "rgba(37, 96, 70, 0.12)"; e.currentTarget.style.transform = "rotate(-1deg) scale(1.02)"; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "rgba(37, 96, 70, 0.05)"; e.currentTarget.style.transform = "rotate(-1deg)"; }}
        >
          <span>[ AUTHORIZED DEMO ACCESS ]</span>
          <span style={{ fontSize: "9px", fontFamily: "var(--font-ledger)", color: "rgba(37, 96, 70, 0.7)", marginTop: "2px", fontWeight: "normal" }}>
            Generates rich random transaction histories dynamically
          </span>
        </button>

        {/* Vintage stamps & Signature line */}
        <div 
          style={{ 
            marginTop: "30px", 
            paddingTop: "20px", 
            borderTop: "1px dashed var(--color-paper-grid)", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "flex-end" 
          }}
        >
          <div className="barcode-stamp" style={{ opacity: 0.6 }}>
            <div className="barcode-stripes" style={{ width: "80px", height: "18px" }}></div>
            <span className="barcode-text" style={{ fontSize: "7px" }}>COM-AUTH-992</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span 
              style={{ 
                fontFamily: "var(--font-typewriter)", 
                fontSize: "16px", 
                color: "var(--color-ink-blue)", 
                fontStyle: "italic",
                height: "22px",
                marginBottom: "-4px"
              }}
            >
              Ivan Alier-Reyes
            </span>
            <div style={{ width: "120px", height: "1px", backgroundColor: "var(--color-ink-dark)" }} />
            <span style={{ fontFamily: "var(--font-ledger)", fontSize: "8px", color: "rgba(32,30,28,0.5)", marginTop: "4px" }}>
              Account Owner
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
