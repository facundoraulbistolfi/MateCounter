import { useState, useEffect, useCallback } from “react”;

const PEOPLE_KEY = “mate-people”;
const CEBADAS_KEY = “mate-cebadas”;

const MATE_EMOJI = “🧉”;

function generateId() {
return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(iso) {
const d = new Date(iso);
return d.toLocaleDateString(“es-AR”, { day: “2-digit”, month: “2-digit”, year: “numeric” });
}

function formatTime(iso) {
const d = new Date(iso);
return d.toLocaleTimeString(“es-AR”, { hour: “2-digit”, minute: “2-digit” });
}

function formatDateKey(iso) {
const d = new Date(iso);
return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayISO() {
const now = new Date();
return now.toISOString().slice(0, 16);
}

export default function MateCounter() {
const [people, setPeople] = useState([“Taiel”, “Martín”, “Facu”]);
const [cebadas, setCebadas] = useState([]);
const [loading, setLoading] = useState(true);
const [tab, setTab] = useState(“cebar”);
const [selectedPerson, setSelectedPerson] = useState(null);
const [selectedDate, setSelectedDate] = useState(todayISO());
const [newPerson, setNewPerson] = useState(””);
const [showAddPerson, setShowAddPerson] = useState(false);
const [nextPerson, setNextPerson] = useState(null);
const [spinning, setSpinning] = useState(false);
const [flash, setFlash] = useState(null);
const [statsDay, setStatsDay] = useState(formatDateKey(new Date().toISOString()));

// Load data
useEffect(() => {
try {
const p = localStorage.getItem(PEOPLE_KEY);
const c = localStorage.getItem(CEBADAS_KEY);
if (p) setPeople(JSON.parse(p));
if (c) setCebadas(JSON.parse(c));
} catch (e) {
console.log(“First load or no data yet”);
}
setLoading(false);
}, []);

// Save helpers
const savePeople = useCallback((p) => {
setPeople(p);
try { localStorage.setItem(PEOPLE_KEY, JSON.stringify(p)); } catch (e) { console.error(e); }
}, []);

const saveCebadas = useCallback((c) => {
setCebadas(c);
try { localStorage.setItem(CEBADAS_KEY, JSON.stringify(c)); } catch (e) { console.error(e); }
}, []);

// Count per person
const counts = {};
people.forEach((p) => (counts[p] = 0));
cebadas.forEach((c) => {
if (counts[c.person] !== undefined) counts[c.person]++;
});

// Stats by day
const dayStats = {};
cebadas.forEach((c) => {
const dk = formatDateKey(c.date);
if (!dayStats[dk]) dayStats[dk] = {};
if (!dayStats[dk][c.person]) dayStats[dk][c.person] = 0;
dayStats[dk][c.person]++;
});

const sortedDays = Object.keys(dayStats).sort().reverse();

// Pick next
function pickNext() {
setSpinning(true);
const min = Math.min(…people.map((p) => counts[p] || 0));
const candidates = people.filter((p) => (counts[p] || 0) === min);
let i = 0;
const interval = setInterval(() => {
setNextPerson(people[Math.floor(Math.random() * people.length)]);
i++;
if (i > 12) {
clearInterval(interval);
const chosen = candidates[Math.floor(Math.random() * candidates.length)];
setNextPerson(chosen);
setSpinning(false);
}
}, 100);
}

// Register cebada
function registrarCebada() {
if (!selectedPerson) return;
const entry = {
id: generateId(),
person: selectedPerson,
date: new Date(selectedDate).toISOString(),
};
const updated = [entry, …cebadas];
saveCebadas(updated);
setFlash(selectedPerson);
setTimeout(() => setFlash(null), 800);
setSelectedPerson(null);
setSelectedDate(todayISO());
}

// Delete cebada
function deleteCebada(id) {
const updated = cebadas.filter((c) => c.id !== id);
saveCebadas(updated);
}

// Add person
function addPerson() {
const name = newPerson.trim();
if (!name || people.includes(name)) return;
savePeople([…people, name]);
setNewPerson(””);
setShowAddPerson(false);
}

// Remove person
function removePerson(name) {
if (people.length <= 2) return;
savePeople(people.filter((p) => p !== name));
const updated = cebadas.filter((c) => c.person !== name);
saveCebadas(updated);
}

if (loading) {
return (
<div style={styles.loadingContainer}>
<div style={styles.loadingMate}>{MATE_EMOJI}</div>
<p style={styles.loadingText}>Calentando el agua…</p>
</div>
);
}

const totalCebadas = cebadas.length;
const leader = people.reduce((a, b) => ((counts[a] || 0) >= (counts[b] || 0) ? a : b), people[0]);

return (
<div style={styles.container}>
{/* Header */}
<div style={styles.header}>
<div style={styles.headerTop}>
<span style={styles.headerEmoji}>{MATE_EMOJI}</span>
<div>
<h1 style={styles.title}>Matecito Counter</h1>
<p style={styles.subtitle}>
{totalCebadas} cebada{totalCebadas !== 1 ? “s” : “”} registrada{totalCebadas !== 1 ? “s” : “”}
{totalCebadas > 0 && <span> · Lidera <strong>{leader}</strong> con {counts[leader]}</span>}
</p>
</div>
</div>
</div>

```
  {/* Scoreboard */}
  <div style={styles.scoreboard}>
    {people.map((p) => (
      <div
        key={p}
        style={{
          ...styles.scoreCard,
          ...(flash === p ? styles.scoreCardFlash : {}),
        }}
      >
        <div style={styles.scoreCount}>{counts[p] || 0}</div>
        <div style={styles.scoreName}>{p}</div>
      </div>
    ))}
  </div>

  {/* Tabs */}
  <div style={styles.tabs}>
    {[
      ["cebar", "Cebar"],
      ["proximo", "¿Quién sigue?"],
      ["historial", "Historial"],
      ["config", "⚙"],
    ].map(([key, label]) => (
      <button
        key={key}
        onClick={() => setTab(key)}
        style={{
          ...styles.tab,
          ...(tab === key ? styles.tabActive : {}),
        }}
      >
        {label}
      </button>
    ))}
  </div>

  {/* Content */}
  <div style={styles.content}>
    {tab === "cebar" && (
      <div>
        <h2 style={styles.sectionTitle}>Registrar cebada</h2>
        <p style={styles.sectionSub}>¿Quién cebó?</p>
        <div style={styles.personGrid}>
          {people.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPerson(p)}
              style={{
                ...styles.personBtn,
                ...(selectedPerson === p ? styles.personBtnActive : {}),
              }}
            >
              <span style={styles.personBtnEmoji}>{MATE_EMOJI}</span>
              <span>{p}</span>
            </button>
          ))}
        </div>
        <label style={styles.label}>Fecha y hora</label>
        <input
          type="datetime-local"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={styles.dateInput}
        />
        <button
          onClick={registrarCebada}
          disabled={!selectedPerson}
          style={{
            ...styles.primaryBtn,
            ...(!selectedPerson ? styles.primaryBtnDisabled : {}),
          }}
        >
          {MATE_EMOJI} Registrar cebada
        </button>
      </div>
    )}

    {tab === "proximo" && (
      <div style={styles.nextContainer}>
        <h2 style={styles.sectionTitle}>¿A quién le toca?</h2>
        <p style={styles.sectionSub}>
          Se elige aleatoriamente entre los que menos cebaron
        </p>
        <div style={styles.nextDisplay}>
          {nextPerson ? (
            <div style={{
              ...styles.nextName,
              ...(spinning ? styles.nextNameSpinning : {}),
            }}>
              {nextPerson}
            </div>
          ) : (
            <div style={styles.nextPlaceholder}>?</div>
          )}
        </div>
        <button
          onClick={pickNext}
          disabled={spinning}
          style={{
            ...styles.primaryBtn,
            ...(spinning ? styles.primaryBtnDisabled : {}),
          }}
        >
          {spinning ? "Eligiendo..." : "🎲 ¿Quién ceba?"}
        </button>
        {nextPerson && !spinning && (
          <p style={styles.nextHint}>
            ¡Le toca a <strong>{nextPerson}</strong>! Tiene {counts[nextPerson] || 0} cebada{(counts[nextPerson] || 0) !== 1 ? "s" : ""}.
          </p>
        )}
      </div>
    )}

    {tab === "historial" && (
      <div>
        <h2 style={styles.sectionTitle}>Historial</h2>

        {/* Day filter */}
        <div style={styles.dayFilter}>
          <label style={styles.label}>Estadísticas del día</label>
          <input
            type="date"
            value={statsDay}
            onChange={(e) => setStatsDay(e.target.value)}
            style={styles.dateInput}
          />
        </div>

        {dayStats[statsDay] ? (
          <div style={styles.dayStatsBox}>
            <div style={styles.dayStatsTitle}>
              {formatDate(statsDay + "T12:00:00")}
            </div>
            <div style={styles.dayStatsGrid}>
              {Object.entries(dayStats[statsDay])
                .sort((a, b) => b[1] - a[1])
                .map(([person, count]) => (
                  <div key={person} style={styles.dayStatItem}>
                    <span style={styles.dayStatName}>{person}</span>
                    <div style={styles.dayStatBarOuter}>
                      <div
                        style={{
                          ...styles.dayStatBarInner,
                          width: `${Math.min(100, (count / Math.max(...Object.values(dayStats[statsDay]))) * 100)}%`,
                        }}
                      />
                    </div>
                    <span style={styles.dayStatCount}>{count}</span>
                  </div>
                ))}
            </div>
            <div style={styles.dayStatsTotal}>
              Total: {Object.values(dayStats[statsDay]).reduce((a, b) => a + b, 0)} cebadas
            </div>
          </div>
        ) : (
          <p style={styles.emptyText}>No hay cebadas para este día.</p>
        )}

        {/* Days summary */}
        {sortedDays.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={styles.subTitle}>Resumen por día</h3>
            {sortedDays.map((dk) => {
              const total = Object.values(dayStats[dk]).reduce((a, b) => a + b, 0);
              const entries = Object.entries(dayStats[dk]).sort((a, b) => b[1] - a[1]);
              return (
                <button
                  key={dk}
                  onClick={() => setStatsDay(dk)}
                  style={{
                    ...styles.dayRow,
                    ...(statsDay === dk ? styles.dayRowActive : {}),
                  }}
                >
                  <span style={styles.dayRowDate}>{formatDate(dk + "T12:00:00")}</span>
                  <span style={styles.dayRowDetail}>
                    {entries.map(([p, c]) => `${p}: ${c}`).join(" · ")}
                  </span>
                  <span style={styles.dayRowTotal}>{total}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Full log */}
        {cebadas.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={styles.subTitle}>Registro completo</h3>
            <div style={styles.logList}>
              {cebadas.slice(0, 50).map((c) => (
                <div key={c.id} style={styles.logItem}>
                  <div style={styles.logLeft}>
                    <span style={styles.logName}>{c.person}</span>
                    <span style={styles.logDate}>
                      {formatDate(c.date)} {formatTime(c.date)}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteCebada(c.id)}
                    style={styles.deleteBtn}
                    title="Borrar"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {cebadas.length > 50 && (
                <p style={styles.emptyText}>Mostrando las últimas 50 cebadas.</p>
              )}
            </div>
          </div>
        )}

        {cebadas.length === 0 && (
          <p style={styles.emptyText}>Todavía no hay cebadas registradas. ¡A cebar!</p>
        )}
      </div>
    )}

    {tab === "config" && (
      <div>
        <h2 style={styles.sectionTitle}>Configuración</h2>
        <p style={styles.sectionSub}>Personas en la ronda</p>
        <div style={styles.configList}>
          {people.map((p) => (
            <div key={p} style={styles.configItem}>
              <span>{p}</span>
              <button
                onClick={() => removePerson(p)}
                style={styles.configRemove}
                title="Quitar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {showAddPerson ? (
          <div style={styles.addRow}>
            <input
              type="text"
              value={newPerson}
              onChange={(e) => setNewPerson(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPerson()}
              placeholder="Nombre..."
              style={styles.addInput}
              autoFocus
            />
            <button onClick={addPerson} style={styles.addConfirm}>✓</button>
            <button onClick={() => { setShowAddPerson(false); setNewPerson(""); }} style={styles.addCancel}>✕</button>
          </div>
        ) : (
          <button onClick={() => setShowAddPerson(true)} style={styles.addBtn}>
            + Agregar persona
          </button>
        )}
        <div style={{ marginTop: 32 }}>
          <button
            onClick={() => {
              if (confirm("¿Borrar todo el historial de cebadas?")) {
                saveCebadas([]);
              }
            }}
            style={styles.dangerBtn}
          >
            Borrar todo el historial
          </button>
        </div>
      </div>
    )}
  </div>
</div>
```

);
}

/* ─── Styles ─── */

const C = {
bg: “#1a1612”,
card: “#251f1a”,
cardHover: “#2e2620”,
accent: “#c8956c”,
accentDark: “#a07050”,
accentLight: “#e8c4a0”,
text: “#e8ddd0”,
textMuted: “#9a8c7c”,
border: “#3a322a”,
danger: “#c05040”,
green: “#6ab060”,
};

const styles = {
container: {
minHeight: “100vh”,
background: `linear-gradient(180deg, ${C.bg} 0%, #120f0c 100%)`,
color: C.text,
fontFamily: “‘Crimson Pro’, ‘Georgia’, serif”,
maxWidth: 480,
margin: “0 auto”,
paddingBottom: 40,
},
loadingContainer: {
minHeight: “100vh”,
display: “flex”,
flexDirection: “column”,
alignItems: “center”,
justifyContent: “center”,
background: C.bg,
color: C.text,
fontFamily: “‘Georgia’, serif”,
},
loadingMate: { fontSize: 64, animation: “pulse 1.5s infinite” },
loadingText: { marginTop: 16, color: C.textMuted, fontSize: 18 },

header: {
padding: “28px 20px 16px”,
borderBottom: `1px solid ${C.border}`,
},
headerTop: {
display: “flex”,
alignItems: “center”,
gap: 14,
},
headerEmoji: { fontSize: 42 },
title: {
margin: 0,
fontSize: 26,
fontWeight: 700,
color: C.accentLight,
letterSpacing: “-0.5px”,
},
subtitle: {
margin: “4px 0 0”,
fontSize: 14,
color: C.textMuted,
},

scoreboard: {
display: “flex”,
gap: 8,
padding: “16px 20px”,
overflowX: “auto”,
},
scoreCard: {
flex: “1 0 0”,
minWidth: 80,
background: C.card,
borderRadius: 12,
padding: “14px 8px”,
textAlign: “center”,
border: `1px solid ${C.border}`,
transition: “all 0.3s”,
},
scoreCardFlash: {
background: C.accentDark,
borderColor: C.accent,
transform: “scale(1.05)”,
},
scoreCount: {
fontSize: 32,
fontWeight: 700,
color: C.accent,
lineHeight: 1,
},
scoreName: {
fontSize: 13,
color: C.textMuted,
marginTop: 6,
fontWeight: 600,
textTransform: “uppercase”,
letterSpacing: “0.5px”,
},

tabs: {
display: “flex”,
padding: “0 20px”,
gap: 4,
borderBottom: `1px solid ${C.border}`,
},
tab: {
flex: 1,
padding: “12px 6px”,
background: “none”,
border: “none”,
borderBottom: “2px solid transparent”,
color: C.textMuted,
fontSize: 14,
fontFamily: “inherit”,
cursor: “pointer”,
transition: “all 0.2s”,
fontWeight: 600,
},
tabActive: {
color: C.accent,
borderBottomColor: C.accent,
},

content: {
padding: “20px 20px”,
},

sectionTitle: {
fontSize: 20,
fontWeight: 700,
margin: “0 0 4px”,
color: C.accentLight,
},
sectionSub: {
fontSize: 14,
color: C.textMuted,
margin: “0 0 16px”,
},
subTitle: {
fontSize: 16,
fontWeight: 700,
margin: “0 0 10px”,
color: C.text,
},

personGrid: {
display: “grid”,
gridTemplateColumns: “repeat(auto-fill, minmax(120px, 1fr))”,
gap: 8,
marginBottom: 16,
},
personBtn: {
display: “flex”,
alignItems: “center”,
gap: 8,
padding: “12px 14px”,
background: C.card,
border: `1px solid ${C.border}`,
borderRadius: 10,
color: C.text,
fontSize: 15,
fontFamily: “inherit”,
cursor: “pointer”,
transition: “all 0.15s”,
},
personBtnActive: {
background: C.accentDark,
borderColor: C.accent,
color: “#fff”,
},
personBtnEmoji: { fontSize: 20 },

label: {
display: “block”,
fontSize: 13,
color: C.textMuted,
marginBottom: 6,
fontWeight: 600,
textTransform: “uppercase”,
letterSpacing: “0.5px”,
},
dateInput: {
width: “100%”,
padding: “10px 12px”,
background: C.card,
border: `1px solid ${C.border}`,
borderRadius: 8,
color: C.text,
fontSize: 15,
fontFamily: “inherit”,
marginBottom: 16,
boxSizing: “border-box”,
colorScheme: “dark”,
},

primaryBtn: {
width: “100%”,
padding: “14px”,
background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
border: “none”,
borderRadius: 10,
color: “#fff”,
fontSize: 16,
fontWeight: 700,
fontFamily: “inherit”,
cursor: “pointer”,
transition: “all 0.2s”,
letterSpacing: “0.3px”,
},
primaryBtnDisabled: {
opacity: 0.4,
cursor: “not-allowed”,
},

nextContainer: {
textAlign: “center”,
},
nextDisplay: {
margin: “24px 0”,
},
nextName: {
fontSize: 48,
fontWeight: 700,
color: C.accent,
transition: “all 0.1s”,
},
nextNameSpinning: {
opacity: 0.6,
color: C.textMuted,
fontSize: 40,
},
nextPlaceholder: {
fontSize: 64,
fontWeight: 700,
color: C.border,
},
nextHint: {
marginTop: 16,
fontSize: 16,
color: C.textMuted,
},

dayFilter: {
marginBottom: 16,
},
dayStatsBox: {
background: C.card,
border: `1px solid ${C.border}`,
borderRadius: 12,
padding: 16,
},
dayStatsTitle: {
fontSize: 14,
fontWeight: 700,
color: C.accent,
marginBottom: 12,
textTransform: “uppercase”,
letterSpacing: “0.5px”,
},
dayStatsGrid: {
display: “flex”,
flexDirection: “column”,
gap: 8,
},
dayStatItem: {
display: “flex”,
alignItems: “center”,
gap: 10,
},
dayStatName: {
width: 70,
fontSize: 14,
fontWeight: 600,
color: C.text,
flexShrink: 0,
},
dayStatBarOuter: {
flex: 1,
height: 8,
background: C.border,
borderRadius: 4,
overflow: “hidden”,
},
dayStatBarInner: {
height: “100%”,
background: `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`,
borderRadius: 4,
transition: “width 0.4s ease”,
},
dayStatCount: {
fontSize: 14,
fontWeight: 700,
color: C.accent,
width: 28,
textAlign: “right”,
flexShrink: 0,
},
dayStatsTotal: {
marginTop: 12,
fontSize: 13,
color: C.textMuted,
textAlign: “right”,
},

dayRow: {
display: “flex”,
alignItems: “center”,
gap: 10,
width: “100%”,
padding: “10px 12px”,
background: C.card,
border: `1px solid ${C.border}`,
borderRadius: 8,
color: C.text,
fontSize: 14,
fontFamily: “inherit”,
cursor: “pointer”,
marginBottom: 4,
textAlign: “left”,
transition: “all 0.15s”,
},
dayRowActive: {
borderColor: C.accent,
background: C.cardHover,
},
dayRowDate: {
fontWeight: 700,
flexShrink: 0,
fontSize: 13,
},
dayRowDetail: {
flex: 1,
color: C.textMuted,
fontSize: 12,
overflow: “hidden”,
textOverflow: “ellipsis”,
whiteSpace: “nowrap”,
},
dayRowTotal: {
fontWeight: 700,
color: C.accent,
fontSize: 16,
flexShrink: 0,
},

logList: {
display: “flex”,
flexDirection: “column”,
gap: 4,
},
logItem: {
display: “flex”,
alignItems: “center”,
justifyContent: “space-between”,
padding: “10px 12px”,
background: C.card,
border: `1px solid ${C.border}`,
borderRadius: 8,
},
logLeft: {
display: “flex”,
flexDirection: “column”,
gap: 2,
},
logName: {
fontWeight: 700,
fontSize: 15,
},
logDate: {
fontSize: 12,
color: C.textMuted,
},
deleteBtn: {
background: “none”,
border: “none”,
color: C.textMuted,
fontSize: 16,
cursor: “pointer”,
padding: “4px 8px”,
borderRadius: 6,
transition: “all 0.15s”,
},

emptyText: {
fontSize: 14,
color: C.textMuted,
textAlign: “center”,
padding: “20px 0”,
},

configList: {
display: “flex”,
flexDirection: “column”,
gap: 4,
marginBottom: 12,
},
configItem: {
display: “flex”,
alignItems: “center”,
justifyContent: “space-between”,
padding: “10px 14px”,
background: C.card,
border: `1px solid ${C.border}`,
borderRadius: 8,
fontSize: 15,
fontWeight: 600,
},
configRemove: {
background: “none”,
border: “none”,
color: C.textMuted,
fontSize: 16,
cursor: “pointer”,
padding: “4px 8px”,
},
addBtn: {
width: “100%”,
padding: “12px”,
background: “none”,
border: `1px dashed ${C.border}`,
borderRadius: 8,
color: C.textMuted,
fontSize: 14,
fontFamily: “inherit”,
cursor: “pointer”,
fontWeight: 600,
},
addRow: {
display: “flex”,
gap: 6,
},
addInput: {
flex: 1,
padding: “10px 12px”,
background: C.card,
border: `1px solid ${C.border}`,
borderRadius: 8,
color: C.text,
fontSize: 15,
fontFamily: “inherit”,
},
addConfirm: {
padding: “10px 14px”,
background: C.accentDark,
border: “none”,
borderRadius: 8,
color: “#fff”,
fontSize: 16,
cursor: “pointer”,
},
addCancel: {
padding: “10px 14px”,
background: C.card,
border: `1px solid ${C.border}`,
borderRadius: 8,
color: C.textMuted,
fontSize: 16,
cursor: “pointer”,
},
dangerBtn: {
width: “100%”,
padding: “12px”,
background: “none”,
border: `1px solid ${C.danger}`,
borderRadius: 8,
color: C.danger,
fontSize: 14,
fontFamily: “inherit”,
cursor: “pointer”,
fontWeight: 600,
},
};