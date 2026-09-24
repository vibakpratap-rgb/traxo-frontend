import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Bell, Boxes, ClipboardList, FileBarChart, LayoutDashboard, LogOut, Menu, PackagePlus, PanelLeft, Plus, Search, Settings, ShieldCheck, Truck, Users, Warehouse, ArrowUpRight, AlertTriangle, ChevronRight, X, QrCode, Printer, ScanLine, FileDown, Upload, Paperclip, FileText, FileSpreadsheet, BookOpen, Pencil, Trash2, History, UserRound } from "lucide-react";
import "@/App.css";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
console.log("BACKEND URL =", process.env.REACT_APP_BACKEND_URL);
const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL
});
const chartData = [{month:"Jan", purchase:72, issue:38},{month:"Feb", purchase:98, issue:44},{month:"Mar", purchase:81, issue:56},{month:"Apr", purchase:124, issue:65},{month:"May", purchase:106, issue:78},{month:"Jun", purchase:148, issue:92}];
const nav = [{label:"Overview", icon:LayoutDashboard, id:"overview"},{label:"Inventory", icon:Boxes, id:"inventory"},{label:"Stock Ledger", icon:BookOpen, id:"ledger"},{label:"Purchases", icon:PackagePlus, id:"purchases"},{label:"Issues & Returns", icon:ClipboardList, id:"issues"},{label:"Reports & Analytics", icon:FileBarChart, id:"reports"},{label:"Vendors", icon:Truck, id:"vendors"},{label:"Employees", icon:UserRound, id:"employees"},{label:"Team & Access", icon:Users, id:"team"},{label:"Audit Trail", icon:ShieldCheck, id:"audit"}];

const authToken = () => localStorage.getItem("traxo_token") || "";
const authUrl = (path) => `${API}${path}${path.includes("?") ? "&" : "?"}auth=${encodeURIComponent(authToken())}`;

function formatError(e){const d=e?.response?.data?.detail; if(typeof d === "string") return d; return "Please check the details and try again.";}
async function downloadCsv(kind){const response=await api.get(`/reports/export?kind=${kind}`,{responseType:"blob"});const url=URL.createObjectURL(response.data);const link=document.createElement("a");link.href=url;link.download=`traxo-${kind}-report.csv`;link.click();URL.revokeObjectURL(url)}
function openPdf(kind){window.open(authUrl(`/reports/pdf?kind=${kind}`), "_blank")}
function openXlsx(kind, extra=""){window.open(authUrl(`/reports/xlsx?kind=${kind}${extra}`), "_blank")}

function Login({onLogin}){
  const [email,setEmail]=useState("admin@traxo.in"),[password,setPassword]=useState("Traxo@123"),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const submit=async e=>{e.preventDefault();setLoading(true);setError("");try{const r=await api.post("/auth/login",{email,password});localStorage.setItem("traxo_token",r.data.token);onLogin(r.data.user)}catch(err){setError(formatError(err))}finally{setLoading(false)}};
  return <main className="login-page"><div className="login-art"><div className="brand-mark large"><span>T</span></div><p className="eyebrow">TRAXO INDIA AUTOMATION</p><h1>Inventory, with<br/><em>precision.</em></h1><p className="login-note">A single source of truth for every component, purchase, and production movement.</p><div className="login-art-footer"><span>01</span><span>CONTROL · VISIBILITY · FLOW</span></div></div><section className="login-panel"><div className="login-form-wrap"><div className="brand-lockup"><div className="brand-mark"><span>T</span></div><div><strong>Traxo</strong><small>INDIA AUTOMATION</small></div></div><div className="login-heading"><p className="eyebrow">SECURE WORKSPACE</p><h2>Welcome back.</h2><p>Sign in to your operations console.</p></div><form onSubmit={submit} data-testid="login-form"><label>Email address<input data-testid="login-email-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input data-testid="login-password-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<div className="form-error" data-testid="login-error">{error}</div>}<button className="primary-btn full" data-testid="login-submit-button" disabled={loading}>{loading?"Authenticating…":"Enter workspace"}<ArrowUpRight size={17}/></button></form><p className="login-foot">Protected by role-based access · v2.5.0</p></div></section></main>
}

function App(){
  const [user,setUser]=useState(null),[checking,setChecking]=useState(true);
  useEffect(()=>{const t=localStorage.getItem("traxo_token");if(t){api.defaults.headers.common.Authorization=`Bearer ${t}`;api.get("/auth/me").then(r=>setUser(r.data)).catch(()=>localStorage.removeItem("traxo_token")).finally(()=>setChecking(false))}else setChecking(false)},[]);
  if(checking)return <div className="loading-screen"><div className="spinner"/>Loading workspace</div>;
  return user?<Workspace user={user} onLogout={()=>{localStorage.removeItem("traxo_token");delete api.defaults.headers.common.Authorization;setUser(null)}}/>:<Login onLogin={u=>{api.defaults.headers.common.Authorization=`Bearer ${localStorage.getItem("traxo_token")}`;setUser(u)}}/>
}

function Workspace({user,onLogout}){
  const [page,setPage]=useState("overview"),[sidebar,setSidebar]=useState(true),[query,setQuery]=useState("");
  const [dash,setDash]=useState(null),[components,setComponents]=useState([]),[moves,setMoves]=useState([]),[warehouses,setWarehouses]=useState([]);
  const [modal,setModal]=useState(null),[qrComponent,setQrComponent]=useState(null),[scannerOpen,setScannerOpen]=useState(false),[balancesFor,setBalancesFor]=useState(null),[bulkImportOpen,setBulkImportOpen]=useState(false);
  const load=()=>Promise.all([api.get("/dashboard"),api.get("/components"),api.get("/movements"),api.get("/warehouses")]).then(([d,c,m,w])=>{setDash(d.data);setComponents(c.data);setMoves(m.data);setWarehouses(w.data)}).catch(()=>{});
  useEffect(()=>{load()},[]);
  const title=nav.find(n=>n.id===page)?.label||"Overview";
  return <div className="app-shell">
    <aside className={`sidebar ${sidebar?"":"collapsed"}`}>
      <div className="side-brand"><div className="brand-mark"><span>T</span></div>{sidebar&&<div><strong>Traxo</strong><small>INDIA AUTOMATION</small></div>}<button className="icon-btn side-toggle" data-testid="sidebar-toggle-button" onClick={()=>setSidebar(!sidebar)}><PanelLeft size={17}/></button></div>
      <div className="side-label">{sidebar?"OPERATIONS":"MENU"}</div>
      <nav>{nav.map(n=>{const I=n.icon;return <button key={n.id} className={page===n.id?"active":""} onClick={()=>setPage(n.id)} data-testid={`nav-${n.id}-button`}><I size={18}/>{sidebar&&<span>{n.label}</span>}{n.id==="inventory"&&<b>{dash?.metrics?.low_stock||0}</b>}</button>})}</nav>
      <div className="side-bottom">{sidebar&&<div className="warehouse-chip"><Warehouse size={16}/><span><b>Main Store</b><small>Warehouse · Online</small></span><span className="online-dot"/></div>}<button onClick={onLogout} className="logout-btn" data-testid="logout-button"><LogOut size={17}/>{sidebar&&"Sign out"}</button></div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <div className="mobile-title"><button className="icon-btn" data-testid="mobile-menu-button" onClick={()=>setSidebar(!sidebar)}><Menu size={19}/></button><span>{title}</span></div>
        <div className="crumb"><span>Workspace</span><ChevronRight size={14}/><b>{title}</b></div>
        <div className="top-actions">
          <div className="global-search"><Search size={16}/><input data-testid="global-search-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search anything..."/><kbd>⌘ K</kbd></div>
          <button className="icon-btn" data-testid="scan-button" onClick={()=>setScannerOpen(true)} title="Scan / lookup by QR"><ScanLine size={18}/></button>
          <button className="icon-btn notification" data-testid="notifications-button"><Bell size={18}/><i/></button>
          <div className="user-menu"><div className="avatar">AM</div><div><b>{user.name}</b><small>Super Admin</small></div></div>
        </div>
      </header>
      <div className="content">
        <div className="page-intro">
          <div><p className="eyebrow">{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}).toUpperCase()}</p><h1>{title}</h1><p className="muted">{page==="overview"?"Good morning, Aarav. Here's your stock position today.":`Manage your ${title.toLowerCase()} with clarity and control.`}</p></div>
          {page!=="overview"&&!["ledger","vendors","employees","team","audit","reports"].includes(page)&&<button className="primary-btn" data-testid="new-entry-button" onClick={()=>setModal(page==="inventory"?"component":page==="purchases"?"purchase":"issue")}><Plus size={17}/> New entry</button>}
        </div>
        {page==="overview"&&<Overview dash={dash} components={components} moves={moves} setPage={setPage} setModal={setModal}/>}
        {page==="inventory"&&<Inventory components={components} warehouses={warehouses} query={query} setModal={setModal} onQr={setQrComponent} onBalances={setBalancesFor} onBulk={()=>setBulkImportOpen(true)}/>}
        {page==="ledger"&&<StockLedgerPage components={components} warehouses={warehouses}/>}
        {page==="purchases"&&<Movements kind="purchase" moves={moves} setModal={setModal}/>}
        {page==="issues"&&<Movements kind="issue" moves={moves} setModal={setModal}/>}
        {page==="reports"&&<Reports dash={dash} components={components} moves={moves} warehouses={warehouses}/>}
        {page==="vendors"&&<VendorsPage/>}
        {page==="employees"&&<EmployeesPage/>}
        {page==="team"&&<SimpleList title="Team & access" items={["Aarav Mehta · Super Admin","Sonia Rao · Store Manager","Rohan Kulkarni · Engineer"]} type="user"/>}
        {page==="audit"&&<Audit/>}
      </div>
    </main>
    {modal&&<EntryModal type={modal} components={components} warehouses={warehouses} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load()}}/>}
    {qrComponent&&<QrModal component={qrComponent} onClose={()=>setQrComponent(null)}/>}
    {scannerOpen&&<ScannerModal onClose={()=>setScannerOpen(false)} onFound={c=>{setScannerOpen(false);setQrComponent(c)}}/>}
    {balancesFor&&<BalancesModal component={balancesFor} onClose={()=>setBalancesFor(null)}/>}
    {bulkImportOpen&&<BulkImportModal onClose={()=>setBulkImportOpen(false)} onDone={()=>{setBulkImportOpen(false);load()}}/>}
  </div>
}

function Metric({label,value,sub,icon:Icon,tone,trend}){return <div className="metric" data-testid={`metric-${label.toLowerCase().replaceAll(" ","-")}`}><div className={`metric-icon ${tone}`}><Icon size={18}/></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small className={trend?.startsWith("+")?"up":""}>{trend||sub}</small></div><ArrowUpRight size={16} className="metric-arrow"/></div>}

function Overview({dash,components,moves,setPage,setModal}){
  const m=dash?.metrics||{};
  return <>
    <div className="metric-grid">
      <Metric label="Total components" value={m.components??"—"} sub="Active catalog" icon={Boxes} tone="blue" trend="+8.4% this month"/>
      <Metric label="Stock value" value={m.stock_value?`₹${m.stock_value.toLocaleString("en-IN")}`:"₹—"} sub="Across main store" icon={Warehouse} tone="green" trend="+12.6% this month"/>
      <Metric label="Today's purchases" value={m.purchases??"—"} sub="Units received" icon={PackagePlus} tone="orange" trend="+18.2% today"/>
      <Metric label="Low stock items" value={m.low_stock??"—"} sub="Need attention" icon={AlertTriangle} tone="red" trend="Review now"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel chart-panel"><div className="panel-head"><div><p className="eyebrow">MOVEMENT VELOCITY</p><h3>Stock movement</h3></div><select data-testid="chart-period-select"><option>Last 6 months</option><option>This year</option></select></div><div className="legend"><span><i className="legend-dot purchase"/>Purchases</span><span><i className="legend-dot issue"/>Issues</span></div><ResponsiveContainer width="100%" height={248}><AreaChart data={chartData}><defs><linearGradient id="purchaseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={.2}/><stop offset="100%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#e8edf3"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:"#8290a2",fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:"#8290a2",fontSize:12}}/><Tooltip contentStyle={{border:"1px solid #e2e8f0",borderRadius:8,boxShadow:"0 8px 24px #0f172a12"}}/><Area type="monotone" dataKey="purchase" stroke="#2563eb" strokeWidth={2.5} fill="url(#purchaseFill)"/><Area type="monotone" dataKey="issue" stroke="#f59e0b" strokeWidth={2.5} fill="none"/></AreaChart></ResponsiveContainer></section>
      <section className="panel quick-panel"><div className="panel-head"><div><p className="eyebrow">QUICK ACTIONS</p><h3>Move inventory</h3></div></div><button className="quick-action blue" onClick={()=>setModal("purchase")} data-testid="quick-purchase-button"><span><PackagePlus size={19}/></span><div><b>Record purchase</b><small>Receive new stock</small></div><ChevronRight size={17}/></button><button className="quick-action orange" onClick={()=>setModal("issue")} data-testid="quick-issue-button"><span><ArrowUpRight size={19}/></span><div><b>Issue components</b><small>Allocate to a project</small></div><ChevronRight size={17}/></button><button className="quick-action green" onClick={()=>setPage("inventory")} data-testid="quick-inventory-button"><span><Boxes size={19}/></span><div><b>Browse inventory</b><small>View stock position</small></div><ChevronRight size={17}/></button><div className="quick-note"><ShieldCheck size={16}/><span>All movements are audit logged automatically</span></div></section>
    </div>
    <div className="lower-grid">
      <section className="panel table-panel"><div className="panel-head"><div><p className="eyebrow">STOCK POSITION</p><h3>Inventory watchlist</h3></div><button className="text-btn" onClick={()=>setPage("inventory")} data-testid="view-inventory-button">View all <ArrowUpRight size={15}/></button></div><InventoryTable components={components.slice(0,5)}/></section>
      <section className="panel activity-panel"><div className="panel-head"><div><p className="eyebrow">LIVE LEDGER</p><h3>Recent activity</h3></div><button className="icon-btn" data-testid="activity-filter-button"><Settings size={16}/></button></div>{moves.slice(0,4).map(x=><div className="activity" key={x.id}><div className={`activity-icon ${x.type}`}><ArrowUpRight size={15}/></div><div><b>{x.type==="purchase"?"Stock received":x.type==="issue"?"Components issued":"Stock returned"}</b><small>{x.component_name} · {x.quantity} units</small></div><time>Today</time></div>)}</section>
    </div>
  </>
}

function InventoryTable({components, warehouses, onQr, onBalances}){
  const showActions = onQr || onBalances;
  return <div className="data-table">
    <div className={`table-row table-header ${showActions?"with-actions":""}`}><span>Component</span><span>Category</span><span>Location</span><span>Available</span><span>Status</span>{showActions&&<span>Actions</span>}</div>
    {components.map(c=>{
      const balances = c.warehouse_balances || {};
      const wh_ids = Object.keys(balances).filter(k=>balances[k] > 0);
      return <div className={`table-row ${showActions?"with-actions":""}`} key={c.id} data-testid={`component-row-${c.id}`}>
        <span className="component-cell"><b>{c.name}</b><small>{c.code} · {c.part_number}</small></span>
        <span>{c.category}</span>
        <span>{c.location}</span>
        <span className="stock-cell">
          <b>{c.stock}</b> {c.unit}
          {warehouses && wh_ids.length>0 && <div className="wh-chips">{wh_ids.slice(0,2).map(id=>{const w=warehouses.find(x=>x.id===id);return <span key={id} className="wh-chip" title={w?.name||id}>{w?.code||id.slice(0,4)} · {balances[id]}</span>})}{wh_ids.length>2&&<span className="wh-chip more">+{wh_ids.length-2}</span>}</div>}
        </span>
        <span><Status stock={c.stock} min={c.minimum_stock}/></span>
        {showActions&&<span className="row-actions">
          {onBalances&&<button className="icon-btn" data-testid={`balances-button-${c.id}`} onClick={()=>onBalances(c)} title="Warehouse balances"><Warehouse size={15}/></button>}
          {onQr&&<button className="icon-btn qr-cell-btn" data-testid={`qr-button-${c.id}`} onClick={()=>onQr(c)} title="Show QR label"><QrCode size={16}/></button>}
        </span>}
      </div>
    })}
  </div>
}

function Status({stock,min}){return <span className={`status ${stock<=min?"low":"healthy"}`} data-testid="stock-status">{stock<=min?"Low stock":"Healthy"}</span>}

function Inventory({components,warehouses,query,setModal,onQr,onBalances,onBulk}){
  const filtered=components.filter(c=>`${c.name} ${c.part_number} ${c.category}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="panel table-panel full-panel">
    <div className="panel-head">
      <div><p className="eyebrow">COMPONENT MASTER · {components.length} ITEMS · {warehouses?.length||0} WAREHOUSES</p><h3>Available inventory</h3></div>
      <div className="table-actions">
        <button className="secondary-btn" data-testid="bulk-import-button" onClick={onBulk}><Upload size={14}/> Bulk import</button>
        <button className="secondary-btn" data-testid="export-inventory-button" onClick={()=>downloadCsv("stock")}><FileDown size={14}/> CSV</button>
        <button className="secondary-btn" data-testid="export-inventory-xlsx-button" onClick={()=>openXlsx("stock")}><FileSpreadsheet size={14}/> Excel</button>
        <button className="secondary-btn" data-testid="export-inventory-pdf-button" onClick={()=>openPdf("stock")}><FileText size={14}/> PDF</button>
        <button className="primary-btn" data-testid="add-component-button" onClick={()=>setModal("component")}><Plus size={16}/> Add component</button>
      </div>
    </div>
    <InventoryTable components={filtered} warehouses={warehouses} onQr={onQr} onBalances={onBalances}/>
  </section>
}

function Movements({kind,moves,setModal}){
  const rows=moves.filter(m=>m.type===kind);
  return <section className="panel table-panel full-panel">
    <div className="panel-head">
      <div><p className="eyebrow">TRANSACTION REGISTER · {rows.length} RECORDS</p><h3>{kind==="purchase"?"Purchase entries":"Issue entries"}</h3></div>
      <div className="table-actions">
        <button className="secondary-btn" data-testid={`export-${kind}-csv-button`} onClick={()=>downloadCsv(kind==="purchase"?"purchases":"issues")}><FileDown size={14}/> CSV</button>
        <button className="secondary-btn" data-testid={`export-${kind}-xlsx-button`} onClick={()=>openXlsx(kind==="purchase"?"purchases":"issues")}><FileSpreadsheet size={14}/> Excel</button>
        <button className="secondary-btn" data-testid={`export-${kind}-pdf-button`} onClick={()=>openPdf(kind==="purchase"?"purchases":"issues")}><FileText size={14}/> PDF</button>
        <button className="primary-btn" data-testid={`add-${kind}-button`} onClick={()=>setModal(kind)}><Plus size={16}/> New {kind}</button>
      </div>
    </div>
    <div className="data-table">
      <div className="table-row table-header"><span>Reference</span><span>Component</span><span>{kind==="purchase"?"Vendor":"Issued to"}</span><span>Quantity</span><span>Balance</span></div>
      {rows.map(r=><div className="table-row" key={r.id} data-testid={`movement-row-${r.id}`}><span className="component-cell"><b>{r.reference||"TRX-2024-001"}</b><small>{r.created_at?.slice(0,10)}</small></span><span>{r.component_name}</span><span>{r.party||"—"}</span><span className="quantity">{kind==="purchase"?"+":"−"}{r.quantity}</span><span><b>{r.balance}</b> units</span></div>)}
    </div>
  </section>
}

function Reports({dash,components,moves}){
  const liveMonths=useMemo(()=>{const totals={};moves.forEach(m=>{const key=(m.created_at||"").slice(0,7)||"current";totals[key]??={purchase:0,issue:0};totals[key][m.type]=(totals[key][m.type]||0)+m.quantity});const entries=Object.entries(totals);return entries.length?entries.slice(-6).map(([month,v])=>({month, purchase:v.purchase||0, issue:v.issue||0})):chartData},[moves]);
  const categories=useMemo(()=>{const grouped={};components.forEach(c=>{grouped[c.category]=(grouped[c.category]||0)+c.stock});return Object.entries(grouped).sort((a,b)=>b[1]-a[1]).slice(0,4)},[components]);
  const max=Math.max(...categories.map(x=>x[1]),1);
  return <>
    <div className="report-cards">
      <div className="report-hero">
        <p className="eyebrow">PERFORMANCE SNAPSHOT</p>
        <h2>Inventory intelligence<br/><em>at a glance.</em></h2>
        <p>Make faster decisions with movement, valuation, and consumption visibility.</p>
        <div className="report-hero-actions">
          <button className="secondary-light" data-testid="download-report-button" onClick={()=>downloadCsv("stock")}>Stock CSV <ArrowUpRight size={13}/></button>
          <button className="secondary-light" data-testid="download-report-xlsx-button" onClick={()=>openXlsx("stock")}><FileSpreadsheet size={13}/> Stock Excel</button>
          <button className="secondary-light" data-testid="download-report-pdf-button" onClick={()=>openPdf("stock")}><FileText size={13}/> Stock PDF</button>
          <button className="secondary-light" data-testid="download-monthly-xlsx-button" onClick={()=>openXlsx("monthly")}><FileSpreadsheet size={13}/> Monthly Excel</button>
          <button className="secondary-light" data-testid="download-monthly-pdf-button" onClick={()=>openPdf("monthly")}><FileText size={13}/> Monthly PDF</button>
        </div>
      </div>
      {[{title:"Stock health",value:`${components.filter(c=>c.stock>c.minimum_stock).length}/${components.length}`,note:"items above minimum",color:"green"},{title:"Inventory value",value:`₹${(dash?.metrics?.stock_value||0).toLocaleString("en-IN")}`,note:"current valuation",color:"blue"},{title:"Attention needed",value:dash?.metrics?.low_stock||0,note:"low stock items",color:"orange"}].map(x=><div className={`report-stat ${x.color}`} key={x.title}><span>{x.title}</span><strong>{x.value}</strong><small>{x.note}</small></div>)}
    </div>
    <div className="dashboard-grid">
      <section className="panel chart-panel">
        <div className="panel-head">
          <div><p className="eyebrow">LIVE MOVEMENT REPORT</p><h3>Purchases vs issues</h3></div>
          <div className="table-actions">
            <button className="secondary-btn" data-testid="purchase-export-button" onClick={()=>downloadCsv("purchases")}><FileDown size={13}/> Purchases</button>
            <button className="secondary-btn" data-testid="issue-export-button" onClick={()=>downloadCsv("issues")}><FileDown size={13}/> Issues</button>
            <button className="secondary-btn" data-testid="purchase-xlsx-button" onClick={()=>openXlsx("purchases")}><FileSpreadsheet size={13}/> Excel</button>
            <button className="secondary-btn" data-testid="purchase-pdf-button" onClick={()=>openPdf("purchases")}><FileText size={13}/> PDF</button>
            <button className="secondary-btn" data-testid="print-report-button" onClick={()=>window.print()}><Printer size={13}/> Print</button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}><BarChart data={liveMonths} barGap={8}><CartesianGrid vertical={false} stroke="#e8edf3"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="purchase" fill="#2563eb" radius={[4,4,0,0]}/><Bar dataKey="issue" fill="#f59e0b" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
      </section>
      <section className="panel table-panel"><div className="panel-head"><div><p className="eyebrow">LIVE ANALYSIS</p><h3>Category mix</h3></div></div>{categories.map(([x,value],i)=><div className="category-line" key={x}><span><i className={`category-dot dot-${i}`}/>{x}</span><b>{value} units</b><div className="progress"><i style={{width:`${Math.round(value/max*100)}%`}}/></div></div>)}</section>
    </div>
    <WorkflowCenter/>
  </>
}

function SimpleList({title,items,type}){return <section className="panel table-panel full-panel"><div className="panel-head"><div><p className="eyebrow">MASTER DATA</p><h3>{title}</h3></div><button className="primary-btn" data-testid={`add-${type}-button`}><Plus size={16}/> Add {type}</button></div>{items.map((x)=><div className="master-item" key={x}><div className="avatar soft">{x.slice(0,2).toUpperCase()}</div><div><b>{x}</b><small>{type==="vendor"?"Approved supplier · Active":"Role assigned · Active"}</small></div><ChevronRight size={17}/></div>)}</section>}

function Audit(){
  const [items,setItems]=useState([]);
  useEffect(()=>{api.get("/audit").then(r=>setItems(r.data)).catch(()=>{})},[]);
  return <section className="panel table-panel full-panel">
    <div className="panel-head">
      <div><p className="eyebrow">SYSTEM GOVERNANCE · {items.length} EVENTS</p><h3>Audit trail</h3></div>
      <div className="table-actions">
        <button className="secondary-btn" data-testid="audit-export-button" onClick={()=>openPdf("audit")}><FileText size={14}/> Export PDF</button>
      </div>
    </div>
    {items.length?items.map(x=><div className="audit-line" key={x.id} data-testid={`audit-row-${x.id}`}><span className="audit-time">{x.created_at?.slice(11,16)||"—"}</span><div className="audit-bar"/><div><b>{x.action}</b><small>{x.user} · {x.details||"Main Store"}</small></div><span className="status healthy">Logged</span></div>):<div className="empty-state" data-testid="audit-empty-state">No audit events yet.</div>}
  </section>
}

function EntryModal({type,components,warehouses,onClose,onSaved}){
  const [component_id,setComponent]=useState(components[0]?.id||""),[quantity,setQuantity]=useState(1),[party,setParty]=useState(""),[reference,setReference]=useState(""),[error,setError]=useState(""),[saving,setSaving]=useState(false);
  const [attachment,setAttachment]=useState(null);
  const [warehouseId,setWarehouseId]=useState(warehouses?.[0]?.id||"wh-main");
  const [destWarehouseId,setDestWarehouseId]=useState(warehouses?.[1]?.id||"");
  const title=type==="component"?"Add component":type==="purchase"?"Record purchase":type==="transfer"?"Transfer stock":"Issue components";
  const save=async e=>{
    e.preventDefault();setSaving(true);setError("");
    try{
      let created;
      if(type==="component"){
        const resp = await api.post("/components",{name:party,category:"General",part_number:reference,minimum_stock:10,unit_price:0});
        created = resp.data;
        if(attachment && created?.id){
          const fd=new FormData();fd.append("file",attachment);fd.append("scope","component");fd.append("scope_id",created.id);
          await api.post("/files/upload", fd, {headers:{"Content-Type":"multipart/form-data"}});
        }
      } else {
        const payload={component_id,quantity:Number(quantity),party,reference,warehouse_id:warehouseId};
        if(type==="transfer") payload.destination_warehouse_id = destWarehouseId;
        const resp = await api.post(`/movements/${type}`, payload);
        created = resp.data;
        if(type==="purchase" && attachment && created?.id){
          const fd=new FormData();fd.append("file",attachment);fd.append("scope","purchase");fd.append("scope_id",created.id);
          await api.post("/files/upload", fd, {headers:{"Content-Type":"multipart/form-data"}});
        }
      }
      onSaved();
    }catch(err){setError(formatError(err))}finally{setSaving(false)}
  };
  return <div className="modal-backdrop"><div className="modal" role="dialog" data-testid="entry-modal">
    <div className="modal-head"><div><p className="eyebrow">NEW TRANSACTION</p><h3>{title}</h3></div><button className="icon-btn" onClick={onClose} data-testid="close-modal-button"><X size={18}/></button></div>
    <form onSubmit={save}>
      {type==="component"?<>
        <label>Component name<input data-testid="component-name-input" value={party} onChange={e=>setParty(e.target.value)} required/></label>
        <label>Part number<input data-testid="component-part-number-input" value={reference} onChange={e=>setReference(e.target.value)}/></label>
        <FileField label="Datasheet or image (optional)" file={attachment} setFile={setAttachment} testId="component-attachment-input"/>
      </>:<>
        <label>Component<select data-testid="movement-component-select" value={component_id} onChange={e=>setComponent(e.target.value)}>{components.map(c=><option key={c.id} value={c.id}>{c.name} · {c.stock} available</option>)}</select></label>
        <div className="form-grid">
          <label>Quantity<input data-testid="movement-quantity-input" type="number" min="1" value={quantity} onChange={e=>setQuantity(e.target.value)} required/></label>
          {type!=="transfer" && <label>{type==="purchase"?"Vendor":"Employee / project"}<input data-testid="movement-party-input" value={party} onChange={e=>setParty(e.target.value)} placeholder={type==="purchase"?"Vendor name":"Recipient name"}/></label>}
          {type==="transfer" && warehouses?.length>0 && <label>Destination warehouse<select data-testid="movement-dest-warehouse-select" value={destWarehouseId} onChange={e=>setDestWarehouseId(e.target.value)} required>{warehouses.filter(w=>w.id!==warehouseId).map(w=><option key={w.id} value={w.id}>{w.name} · {w.code}</option>)}</select></label>}
        </div>
        {warehouses?.length>0 && <label>{type==="transfer"?"Source warehouse":"Warehouse"}<select data-testid="movement-warehouse-select" value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name} · {w.code}</option>)}</select></label>}
        <label>Reference<input data-testid="movement-reference-input" value={reference} onChange={e=>setReference(e.target.value)} placeholder="PO-2024-019"/></label>
        {type==="purchase"&&<FileField label="Attach invoice PDF (optional)" file={attachment} setFile={setAttachment} testId="purchase-invoice-input"/>}
      </>}
      {error&&<div className="form-error" data-testid="entry-error">{error}</div>}
      <div className="modal-actions">
        <button type="button" className="secondary-btn" onClick={onClose} data-testid="cancel-modal-button">Cancel</button>
        <button className="primary-btn" disabled={saving} data-testid="save-entry-button">{saving?"Saving…":"Save entry"}<ArrowUpRight size={16}/></button>
      </div>
    </form>
  </div></div>
}

function BalancesModal({component,onClose}){
  const [data,setData]=useState(null),[error,setError]=useState("");
  useEffect(()=>{api.get(`/components/${component.id}/balances`).then(r=>setData(r.data)).catch(e=>setError(formatError(e)))},[component.id]);
  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} data-testid="balances-modal">
    <div className="modal-head"><div><p className="eyebrow">WAREHOUSE STOCK</p><h3>{component.name}</h3></div><button className="icon-btn" onClick={onClose} data-testid="balances-close"><X size={18}/></button></div>
    {error&&<div className="form-error">{error}</div>}
    {!data && !error && <div className="empty-state">Loading balances…</div>}
    {data && <>
      <p className="muted" style={{margin:"-4px 0 16px"}}>Total on hand: <b style={{color:"var(--ink)"}}>{data.total_stock} {component.unit}</b></p>
      <div className="data-table">
        <div className="table-row table-header balance-cols"><span>Warehouse</span><span>Code</span><span>Balance</span></div>
        {data.balances.map(b=><div className="table-row balance-cols" key={b.warehouse_id} data-testid={`balance-row-${b.warehouse_id}`}>
          <span><b>{b.warehouse_name}</b></span>
          <span>{b.warehouse_code}</span>
          <span><b>{b.balance}</b> {component.unit}</span>
        </div>)}
      </div>
    </>}
    <div className="modal-actions"><button className="primary-btn" onClick={onClose} data-testid="balances-done">Close<X size={15}/></button></div>
  </div></div>
}

function BulkImportModal({onClose,onDone}){
  const [file,setFile]=useState(null),[result,setResult]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const inputRef=useRef();
  const submit=async e=>{e.preventDefault();if(!file)return;setLoading(true);setError("");try{const fd=new FormData();fd.append("file",file);const r=await api.post("/components/import", fd, {headers:{"Content-Type":"multipart/form-data"}});setResult(r.data)}catch(err){setError(formatError(err))}finally{setLoading(false)}};
  return <div className="modal-backdrop"><div className="modal" role="dialog" data-testid="bulk-import-modal">
    <div className="modal-head"><div><p className="eyebrow">BULK MASTER DATA</p><h3>Import components CSV</h3></div><button className="icon-btn" onClick={()=>{onClose();if(result)onDone()}} data-testid="bulk-close"><X size={18}/></button></div>
    {!result && <form onSubmit={submit}>
      <p className="muted" style={{marginTop:0}}>Expected columns (case-insensitive): <code>name, code, category, part_number, unit, unit_price, minimum_stock, opening_stock, location, manufacturer, hsn, gst, warehouse_id</code>. Only <code>name</code> is required; opening_stock is loaded into warehouse_id (default wh-main).</p>
      <div className="file-field">
        <button type="button" className="secondary-btn" data-testid="bulk-file-picker" onClick={()=>inputRef.current?.click()}><Upload size={14}/> {file?"Change CSV":"Choose CSV file"}</button>
        {file&&<span className="file-name" data-testid="bulk-file-name"><Paperclip size={12}/> {file.name}</span>}
        <input ref={inputRef} type="file" data-testid="bulk-file-input" accept=".csv" onChange={e=>setFile(e.target.files?.[0]||null)} style={{display:"none"}}/>
      </div>
      {error&&<div className="form-error" style={{marginTop:14}} data-testid="bulk-error">{error}</div>}
      <div className="modal-actions">
        <button type="button" className="secondary-btn" onClick={onClose} data-testid="bulk-cancel">Cancel</button>
        <button className="primary-btn" disabled={!file||loading} data-testid="bulk-submit">{loading?"Importing…":"Import components"}<Upload size={15}/></button>
      </div>
    </form>}
    {result && <>
      <div className="history-totals"><span><b>{result.imported}</b> imported</span><span><b>{result.skipped}</b> skipped</span></div>
      {result.components?.length>0 && <>
        <h4 className="drawer-h">Created components</h4>
        {result.components.slice(0,12).map(c=><div className="drawer-row" key={c.id}><b>{c.code}</b><span>{c.name} · {c.category}</span><time>{c.stock} {c.unit}</time></div>)}
      </>}
      {result.errors?.length>0 && <>
        <h4 className="drawer-h">Skipped rows</h4>
        {result.errors.map((er,i)=><div className="drawer-row" key={i}><b>Row {er.row}</b><span>{er.reason}</span></div>)}
      </>}
      <div className="modal-actions"><button className="primary-btn" onClick={()=>{onClose();onDone()}} data-testid="bulk-done">Done<ArrowUpRight size={15}/></button></div>
    </>}
  </div></div>
}

function FileField({label, file, setFile, testId}){
  const inputRef=useRef();
  return <label>{label}<div className="file-field"><button type="button" className="secondary-btn" data-testid={`${testId}-picker`} onClick={()=>inputRef.current?.click()}><Upload size={14}/> {file?"Change file":"Choose file"}</button>{file&&<span className="file-name" data-testid={`${testId}-name`}><Paperclip size={12}/> {file.name}</span>}<input ref={inputRef} type="file" data-testid={testId} onChange={e=>setFile(e.target.files?.[0]||null)} style={{display:"none"}} accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.txt,.xlsx,.docx"/></div></label>
}

function QrModal({component,onClose}){
  const src = authUrl(`/components/${component.id}/qr`);
  const print = () => {
    const win = window.open("", "_blank", "width=520,height=620");
    if(!win) return;
    win.document.write(`<html><head><title>${component.code} · QR Label</title><style>body{font-family:Arial;text-align:center;padding:32px;color:#0f172a}img{width:280px;height:280px}h2{margin:16px 0 4px}small{color:#475569}</style></head><body><h2>Traxo India Automation</h2><small>Component QR Label</small><div style="margin:24px 0"><img src="${src}"/></div><h3 style="margin:0">${component.name}</h3><p style="margin:4px 0"><strong>${component.code}</strong> · ${component.part_number||"—"}</p><p style="margin:0;color:#475569">${component.category} · ${component.location||""}</p><script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script></body></html>`);
    win.document.close();
  };
  return <div className="modal-backdrop"><div className="modal qr-modal" role="dialog" data-testid="qr-modal">
    <div className="modal-head"><div><p className="eyebrow">SCANNABLE LABEL</p><h3>{component.name}</h3></div><button className="icon-btn" onClick={onClose} data-testid="qr-close-button"><X size={18}/></button></div>
    <div className="qr-body">
      <img src={src} alt={`QR for ${component.name}`} data-testid="qr-image"/>
      <div className="qr-meta"><span><b>Code</b> {component.code}</span><span><b>Part #</b> {component.part_number||"—"}</span><span><b>Location</b> {component.location||"—"}</span><span><b>Available</b> {component.stock} {component.unit}</span></div>
    </div>
    <div className="modal-actions">
      <button className="secondary-btn" onClick={onClose} data-testid="qr-cancel-button">Close</button>
      <button className="primary-btn" onClick={print} data-testid="qr-print-button"><Printer size={15}/> Print label</button>
    </div>
  </div></div>
}

function ScannerModal({onClose,onFound}){
  const [code,setCode]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const submit=async e=>{e.preventDefault();setLoading(true);setError("");try{const r=await api.get(`/components/scan/${encodeURIComponent(code)}`);onFound(r.data)}catch(err){setError(formatError(err))}finally{setLoading(false)}};
  return <div className="modal-backdrop"><div className="modal" role="dialog" data-testid="scanner-modal">
    <div className="modal-head"><div><p className="eyebrow">RAPID LOOKUP</p><h3>Scan or enter code</h3></div><button className="icon-btn" onClick={onClose} data-testid="scanner-close-button"><X size={18}/></button></div>
    <form onSubmit={submit}>
      <label>Component code, part number, or scanned payload<input data-testid="scanner-input" autoFocus value={code} onChange={e=>setCode(e.target.value)} placeholder="CMP-1001 or scanned payload" required/></label>
      <p className="muted" style={{marginTop:-8,marginBottom:14}}>Tip: use a USB barcode scanner - it types the code and Enter submits.</p>
      {error&&<div className="form-error" data-testid="scanner-error">{error}</div>}
      <div className="modal-actions">
        <button type="button" className="secondary-btn" onClick={onClose} data-testid="scanner-cancel-button">Cancel</button>
        <button className="primary-btn" disabled={loading} data-testid="scanner-submit-button">{loading?"Looking up…":"Find component"}<ScanLine size={15}/></button>
      </div>
    </form>
  </div></div>
}

function WorkflowCenter(){
  const [items,setItems]=useState([]),[warehouses,setWarehouses]=useState([]),[components,setComponents]=useState([]);
  const [kind,setKind]=useState("po"),[title,setTitle]=useState(""),[quantity,setQuantity]=useState(1),[componentId,setComponentId]=useState(""),[error,setError]=useState("");
  const [srcWh,setSrcWh]=useState(""),[destWh,setDestWh]=useState(""),[linkedPoId,setLinkedPoId]=useState("");
  const load=()=>Promise.all([api.get("/workflows"),api.get("/warehouses"),api.get("/components")]).then(([w,h,c])=>{setItems(w.data);setWarehouses(h.data);setComponents(c.data);if(!componentId&&c.data[0]?.id)setComponentId(c.data[0].id);if(!srcWh&&h.data[0]?.id)setSrcWh(h.data[0].id);if(!destWh&&h.data[1]?.id)setDestWh(h.data[1].id)}).catch(()=>{});
  useEffect(()=>{load()},[]);
  const pendingPOs = items.filter(x=>x.kind==="po");
  const create=async e=>{
    e.preventDefault();setError("");
    try{
      const body = {title,quantity:Number(quantity),component_id:componentId,warehouse_id:srcWh||"wh-main",destination_warehouse_id:destWh||"",notes:"Created from operations center", linked_po_id: kind==="grn"?linkedPoId:""};
      await api.post(`/workflows/${kind}`, body);
      setTitle("");setLinkedPoId("");load();
    }catch(err){setError(formatError(err))}
  };
  const approve=async(id,status)=>{try{await api.patch(`/workflows/${id}/approval`,{status});load()}catch(err){alert(formatError(err))}};
  return <section className="panel workflow-panel">
    <div className="panel-head"><div><p className="eyebrow">CONTROLLED OPERATIONS</p><h3>PO · GRN · MRS · transfers</h3><p className="muted">Approving a GRN, transfer, or MRS automatically posts the stock movement.</p></div><div className="warehouse-count"><Warehouse size={15}/> {warehouses.length} warehouses</div></div>
    <div className="workflow-layout">
      <form className="workflow-form" onSubmit={create}>
        <label>Workflow<select data-testid="workflow-kind-select" value={kind} onChange={e=>setKind(e.target.value)}><option value="po">Purchase Order (PO)</option><option value="grn">Goods Receipt Note (GRN)</option><option value="mrs">Material Requisition (MRS)</option><option value="return">Component Return</option><option value="opening">Opening Stock</option><option value="transfer">Stock Transfer</option></select></label>
        <label>Title<input data-testid="workflow-title-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. April production replenishment" required/></label>
        {kind==="grn" && <label>Linked Purchase Order<select data-testid="workflow-linked-po-select" value={linkedPoId} onChange={e=>setLinkedPoId(e.target.value)}><option value="">— Manual (no linked PO) —</option>{pendingPOs.map(p=><option key={p.id} value={p.id}>{p.title} · {p.quantity||0} units · {p.status}</option>)}</select></label>}
        {kind!=="grn" || !linkedPoId ? <>
          <label>Component<select data-testid="workflow-component-select" value={componentId} onChange={e=>setComponentId(e.target.value)}>{components.map(c=><option key={c.id} value={c.id}>{c.name} · {c.code}</option>)}</select></label>
          <label>Quantity<input data-testid="workflow-quantity-input" type="number" min="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
        </> : <p className="muted" style={{margin:"-6px 0 12px",fontSize:11}}>Component and quantity will be pulled from the linked PO when this GRN is approved.</p>}
        {warehouses.length>0 && <label>{kind==="transfer"?"Source warehouse":"Warehouse"}<select data-testid="workflow-warehouse-select" value={srcWh} onChange={e=>setSrcWh(e.target.value)}>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name} · {w.code}</option>)}</select></label>}
        {kind==="transfer" && warehouses.length>1 && <label>Destination warehouse<select data-testid="workflow-dest-warehouse-select" value={destWh} onChange={e=>setDestWh(e.target.value)}>{warehouses.filter(w=>w.id!==srcWh).map(w=><option key={w.id} value={w.id}>{w.name} · {w.code}</option>)}</select></label>}
        {error&&<div className="form-error" data-testid="workflow-error">{error}</div>}
        <button className="primary-btn" data-testid="create-workflow-button"><Plus size={15}/> Create for approval</button>
      </form>
      <div className="workflow-list">
        {items.slice(0,8).map(x=><div className="workflow-item" key={x.id} data-testid={`workflow-item-${x.id}`}>
          <div>
            <b>{x.kind.toUpperCase()} · {x.title}</b>
            <small>{x.quantity||0} units · {x.created_by}{x.linked_po_id?" · linked PO":""}{x.executed_movement_id?" · stock updated":""}</small>
          </div>
          <button className={`status ${x.status}`} data-testid={`workflow-status-${x.id}`} onClick={()=>approve(x.id,x.status==="pending"?"approved":"pending")}>{x.status}</button>
        </div>)}
        {!items.length&&<div className="empty-state" data-testid="workflow-empty-state">No workflow records yet.</div>}
      </div>
    </div>
  </section>
}

export default App;

// ---------- Vendors & Employees CRUD ----------
function VendorsPage(){
  const [items,setItems]=useState([]),[editing,setEditing]=useState(null),[history,setHistory]=useState(null),[query,setQuery]=useState("");
  const importRef=useRef();
  const load=()=>api.get("/vendors").then(r=>setItems(r.data)).catch(()=>{});
  useEffect(()=>{load()},[]);
  const remove=async id=>{if(!window.confirm("Remove this vendor?"))return;try{await api.delete(`/vendors/${id}`);load()}catch(e){alert(formatError(e))}};
  const importFile=async e=>{const file=e.target.files?.[0];if(!file)return;const fd=new FormData();fd.append("file",file);try{const r=await api.post("/vendors/import", fd, {headers:{"Content-Type":"multipart/form-data"}});alert(`Imported ${r.data.imported} vendor(s)`);load()}catch(err){alert(formatError(err))}finally{if(importRef.current)importRef.current.value=""}};
  const filtered=items.filter(v=>`${v.name} ${v.contact} ${v.gst}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="panel table-panel full-panel">
    <div className="panel-head">
      <div><p className="eyebrow">MASTER DATA · {items.length} VENDORS</p><h3>Vendor master</h3></div>
      <div className="table-actions">
        <input placeholder="Filter…" data-testid="vendor-search-input" value={query} onChange={e=>setQuery(e.target.value)} className="inline-search"/>
        <button className="secondary-btn" data-testid="vendor-import-button" onClick={()=>importRef.current?.click()}><Upload size={14}/> Import CSV</button>
        <input ref={importRef} type="file" accept=".csv" onChange={importFile} style={{display:"none"}} data-testid="vendor-import-input"/>
        <button className="secondary-btn" data-testid="vendor-xlsx-button" onClick={()=>openXlsx("vendors")}><FileSpreadsheet size={14}/> Excel</button>
        <button className="primary-btn" data-testid="add-vendor-button" onClick={()=>setEditing({})}><Plus size={16}/> Add vendor</button>
      </div>
    </div>
    <div className="data-table master-table">
      <div className="table-row table-header master-cols"><span>Name</span><span>Contact</span><span>Phone</span><span>GST</span><span>Email</span><span>Actions</span></div>
      {filtered.map(v=><div className="table-row master-cols" key={v.id} data-testid={`vendor-row-${v.id}`}>
        <span className="component-cell"><b>{v.name}</b><small>{v.address||"—"}</small></span>
        <span>{v.contact||"—"}</span>
        <span>{v.phone||"—"}</span>
        <span>{v.gst||"—"}</span>
        <span>{v.email||"—"}</span>
        <span className="row-actions">
          <button className="icon-btn" data-testid={`vendor-history-${v.id}`} onClick={()=>setHistory({kind:"vendor",id:v.id,name:v.name})} title="Contact history"><History size={15}/></button>
          <button className="icon-btn" data-testid={`vendor-edit-${v.id}`} onClick={()=>setEditing(v)} title="Edit"><Pencil size={15}/></button>
          <button className="icon-btn danger" data-testid={`vendor-delete-${v.id}`} onClick={()=>remove(v.id)} title="Delete"><Trash2 size={15}/></button>
        </span>
      </div>)}
      {!filtered.length&&<div className="empty-state" data-testid="vendor-empty">No vendors match this filter.</div>}
    </div>
    {editing&&<VendorEditor initial={editing} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);load()}}/>}
    {history&&<HistoryDrawer meta={history} onClose={()=>setHistory(null)}/>}
  </section>
}

function VendorEditor({initial,onClose,onSaved}){
  const [form,setForm]=useState({name:"",contact:"",phone:"",email:"",gst:"",address:"",notes:"",...initial});
  const [saving,setSaving]=useState(false),[error,setError]=useState("");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=async e=>{e.preventDefault();setSaving(true);setError("");try{if(form.id)await api.put(`/vendors/${form.id}`,form);else await api.post("/vendors",form);onSaved()}catch(err){setError(formatError(err))}finally{setSaving(false)}};
  return <div className="modal-backdrop"><div className="modal" role="dialog" data-testid="vendor-editor">
    <div className="modal-head"><div><p className="eyebrow">MASTER DATA</p><h3>{form.id?"Edit vendor":"Add vendor"}</h3></div><button className="icon-btn" onClick={onClose} data-testid="vendor-editor-close"><X size={18}/></button></div>
    <form onSubmit={save}>
      <label>Vendor name<input data-testid="vendor-name-input" value={form.name} onChange={e=>set("name",e.target.value)} required/></label>
      <div className="form-grid">
        <label>Contact person<input data-testid="vendor-contact-input" value={form.contact} onChange={e=>set("contact",e.target.value)}/></label>
        <label>Phone<input data-testid="vendor-phone-input" value={form.phone} onChange={e=>set("phone",e.target.value)}/></label>
      </div>
      <div className="form-grid">
        <label>Email<input data-testid="vendor-email-input" type="email" value={form.email} onChange={e=>set("email",e.target.value)}/></label>
        <label>GST number<input data-testid="vendor-gst-input" value={form.gst} onChange={e=>set("gst",e.target.value)}/></label>
      </div>
      <label>Address<input data-testid="vendor-address-input" value={form.address} onChange={e=>set("address",e.target.value)}/></label>
      <label>Notes<input data-testid="vendor-notes-input" value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="e.g. Preferred supplier for microcontrollers"/></label>
      {error&&<div className="form-error" data-testid="vendor-editor-error">{error}</div>}
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose} data-testid="vendor-editor-cancel">Cancel</button><button className="primary-btn" disabled={saving} data-testid="vendor-editor-save">{saving?"Saving…":form.id?"Save changes":"Add vendor"}<ArrowUpRight size={16}/></button></div>
    </form>
  </div></div>
}

function EmployeesPage(){
  const [items,setItems]=useState([]),[editing,setEditing]=useState(null),[history,setHistory]=useState(null),[query,setQuery]=useState("");
  const importRef=useRef();
  const load=()=>api.get("/employees").then(r=>setItems(r.data)).catch(()=>{});
  useEffect(()=>{load()},[]);
  const remove=async id=>{if(!window.confirm("Remove this employee?"))return;try{await api.delete(`/employees/${id}`);load()}catch(e){alert(formatError(e))}};
  const importFile=async e=>{const file=e.target.files?.[0];if(!file)return;const fd=new FormData();fd.append("file",file);try{const r=await api.post("/employees/import", fd, {headers:{"Content-Type":"multipart/form-data"}});alert(`Imported ${r.data.imported} employee(s)`);load()}catch(err){alert(formatError(err))}finally{if(importRef.current)importRef.current.value=""}};
  const filtered=items.filter(v=>`${v.name} ${v.department} ${v.employee_code}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="panel table-panel full-panel">
    <div className="panel-head">
      <div><p className="eyebrow">MASTER DATA · {items.length} EMPLOYEES</p><h3>Employee master</h3></div>
      <div className="table-actions">
        <input placeholder="Filter…" data-testid="employee-search-input" value={query} onChange={e=>setQuery(e.target.value)} className="inline-search"/>
        <button className="secondary-btn" data-testid="employee-import-button" onClick={()=>importRef.current?.click()}><Upload size={14}/> Import CSV</button>
        <input ref={importRef} type="file" accept=".csv" onChange={importFile} style={{display:"none"}} data-testid="employee-import-input"/>
        <button className="secondary-btn" data-testid="employee-xlsx-button" onClick={()=>openXlsx("employees")}><FileSpreadsheet size={14}/> Excel</button>
        <button className="primary-btn" data-testid="add-employee-button" onClick={()=>setEditing({})}><Plus size={16}/> Add employee</button>
      </div>
    </div>
    <div className="data-table master-table">
      <div className="table-row table-header master-cols"><span>Name</span><span>Code</span><span>Department</span><span>Designation</span><span>Phone</span><span>Actions</span></div>
      {filtered.map(v=><div className="table-row master-cols" key={v.id} data-testid={`employee-row-${v.id}`}>
        <span className="component-cell"><b>{v.name}</b><small>{v.email||"—"}</small></span>
        <span>{v.employee_code||"—"}</span>
        <span>{v.department||"—"}</span>
        <span>{v.designation||"—"}</span>
        <span>{v.phone||"—"}</span>
        <span className="row-actions">
          <button className="icon-btn" data-testid={`employee-history-${v.id}`} onClick={()=>setHistory({kind:"employee",id:v.id,name:v.name})} title="Issue history"><History size={15}/></button>
          <button className="icon-btn" data-testid={`employee-edit-${v.id}`} onClick={()=>setEditing(v)} title="Edit"><Pencil size={15}/></button>
          <button className="icon-btn danger" data-testid={`employee-delete-${v.id}`} onClick={()=>remove(v.id)} title="Delete"><Trash2 size={15}/></button>
        </span>
      </div>)}
      {!filtered.length&&<div className="empty-state" data-testid="employee-empty">No employees match this filter.</div>}
    </div>
    {editing&&<EmployeeEditor initial={editing} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);load()}}/>}
    {history&&<HistoryDrawer meta={history} onClose={()=>setHistory(null)}/>}
  </section>
}

function EmployeeEditor({initial,onClose,onSaved}){
  const [form,setForm]=useState({name:"",department:"",designation:"",phone:"",email:"",employee_code:"",...initial});
  const [saving,setSaving]=useState(false),[error,setError]=useState("");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=async e=>{e.preventDefault();setSaving(true);setError("");try{if(form.id)await api.put(`/employees/${form.id}`,form);else await api.post("/employees",form);onSaved()}catch(err){setError(formatError(err))}finally{setSaving(false)}};
  return <div className="modal-backdrop"><div className="modal" role="dialog" data-testid="employee-editor">
    <div className="modal-head"><div><p className="eyebrow">MASTER DATA</p><h3>{form.id?"Edit employee":"Add employee"}</h3></div><button className="icon-btn" onClick={onClose} data-testid="employee-editor-close"><X size={18}/></button></div>
    <form onSubmit={save}>
      <label>Full name<input data-testid="employee-name-input" value={form.name} onChange={e=>set("name",e.target.value)} required/></label>
      <div className="form-grid">
        <label>Employee code<input data-testid="employee-code-input" value={form.employee_code} onChange={e=>set("employee_code",e.target.value)}/></label>
        <label>Phone<input data-testid="employee-phone-input" value={form.phone} onChange={e=>set("phone",e.target.value)}/></label>
      </div>
      <div className="form-grid">
        <label>Department<input data-testid="employee-department-input" value={form.department} onChange={e=>set("department",e.target.value)}/></label>
        <label>Designation<input data-testid="employee-designation-input" value={form.designation} onChange={e=>set("designation",e.target.value)}/></label>
      </div>
      <label>Email<input data-testid="employee-email-input" type="email" value={form.email} onChange={e=>set("email",e.target.value)}/></label>
      {error&&<div className="form-error" data-testid="employee-editor-error">{error}</div>}
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose} data-testid="employee-editor-cancel">Cancel</button><button className="primary-btn" disabled={saving} data-testid="employee-editor-save">{saving?"Saving…":form.id?"Save changes":"Add employee"}<ArrowUpRight size={16}/></button></div>
    </form>
  </div></div>
}

function HistoryDrawer({meta,onClose}){
  const [data,setData]=useState(null),[error,setError]=useState("");
  useEffect(()=>{api.get(`/${meta.kind}s/${meta.id}/history`).then(r=>setData(r.data)).catch(e=>setError(formatError(e)))},[meta.id, meta.kind]);
  const purchases = data?.purchases || [];
  const workflows = data?.workflows || [];
  const issues = data?.issues || [];
  const returns = data?.returns || [];
  return <div className="modal-backdrop" onClick={onClose}><div className="drawer" onClick={e=>e.stopPropagation()} data-testid="history-drawer">
    <div className="modal-head"><div><p className="eyebrow">CONTACT HISTORY</p><h3>{meta.name}</h3></div><button className="icon-btn" onClick={onClose} data-testid="history-close"><X size={18}/></button></div>
    {error&&<div className="form-error">{error}</div>}
    {!data && !error && <div className="empty-state">Loading history…</div>}
    {data && meta.kind==="vendor" && <>
      <div className="history-totals"><span><b>{data.totals.orders}</b> purchase entries</span><span><b>{data.totals.units}</b> total units received</span><span>₹ <b>{data.totals.value.toLocaleString("en-IN")}</b> lifetime spend</span></div>
      <h4 className="drawer-h">Purchase register</h4>
      {purchases.length?purchases.map(p=><div className="drawer-row" key={p.id}><b>{p.reference||"—"}</b><span>{p.component_name} · {p.quantity} units</span><time>{(p.created_at||"").slice(0,10)}</time></div>):<div className="empty-state">No purchases recorded for this vendor.</div>}
      <h4 className="drawer-h">Related workflows</h4>
      {workflows.length?workflows.slice(0,10).map(w=><div className="drawer-row" key={w.id}><b>{w.kind.toUpperCase()} · {w.title}</b><span className={`status ${w.status}`}>{w.status}</span><time>{(w.created_at||"").slice(0,10)}</time></div>):<div className="empty-state">No linked workflows.</div>}
    </>}
    {data && meta.kind==="employee" && <>
      <div className="history-totals"><span><b>{data.totals.issued}</b> units issued</span><span><b>{data.totals.returned}</b> units returned</span></div>
      <h4 className="drawer-h">Issue register</h4>
      {issues.length?issues.map(p=><div className="drawer-row" key={p.id}><b>{p.reference||"—"}</b><span>{p.component_name} · {p.quantity} units</span><time>{(p.created_at||"").slice(0,10)}</time></div>):<div className="empty-state">No components issued.</div>}
      <h4 className="drawer-h">Returns</h4>
      {returns.length?returns.map(p=><div className="drawer-row" key={p.id}><b>{p.reference||"—"}</b><span>{p.component_name} · {p.quantity} units</span><time>{(p.created_at||"").slice(0,10)}</time></div>):<div className="empty-state">No returns from this employee.</div>}
    </>}
  </div></div>
}

// ---------- Stock Ledger ----------
function StockLedgerPage({components, warehouses}){
  const today = new Date().toISOString().slice(0,10);
  const monthAgo = new Date(Date.now()-30*24*3600*1000).toISOString().slice(0,10);
  const [componentId,setComponentId]=useState(components[0]?.id||"");
  const [warehouseId,setWarehouseId]=useState("");
  const [dateFrom,setDateFrom]=useState(monthAgo);
  const [dateTo,setDateTo]=useState(today);
  const [data,setData]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState("");
  useEffect(()=>{if(!componentId && components[0]?.id) setComponentId(components[0].id)},[components]);
  const load=async ()=>{if(!componentId)return;setLoading(true);setError("");try{const wq=warehouseId?`&warehouse_id=${warehouseId}`:"";const r=await api.get(`/reports/ledger?component_id=${componentId}&date_from=${dateFrom}&date_to=${dateTo}${wq}`);setData(r.data)}catch(e){setError(formatError(e))}finally{setLoading(false)}};
  useEffect(()=>{load()},[componentId, dateFrom, dateTo, warehouseId]);
  const exportLedger=()=>openXlsx("ledger", `&component_id=${componentId}&date_from=${dateFrom}&date_to=${dateTo}${warehouseId?`&warehouse_id=${warehouseId}`:""}`);
  return <section className="panel table-panel full-panel">
    <div className="panel-head">
      <div><p className="eyebrow">TALLY-STYLE LEDGER</p><h3>Stock ledger</h3><p className="muted">Opening balance · daily movement · closing balance for any component and warehouse.</p></div>
      <div className="table-actions">
        <button className="secondary-btn" data-testid="ledger-xlsx-button" onClick={exportLedger} disabled={!componentId}><FileSpreadsheet size={14}/> Excel</button>
      </div>
    </div>
    <div className="ledger-filters">
      <label>Component<select data-testid="ledger-component-select" value={componentId} onChange={e=>setComponentId(e.target.value)}>{components.map(c=><option key={c.id} value={c.id}>{c.name} · {c.code}</option>)}</select></label>
      <label>Warehouse<select data-testid="ledger-warehouse-select" value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}><option value="">All warehouses</option>{(warehouses||[]).map(w=><option key={w.id} value={w.id}>{w.name} · {w.code}</option>)}</select></label>
      <label>From<input data-testid="ledger-date-from" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></label>
      <label>To<input data-testid="ledger-date-to" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/></label>
    </div>
    {error&&<div className="form-error" data-testid="ledger-error">{error}</div>}
    {data && <>
      <div className="ledger-summary">
        <div><span>Opening stock</span><strong data-testid="ledger-opening">{data.opening_stock}</strong></div>
        <div className="in"><span>Inward</span><strong data-testid="ledger-inward">+{data.totals.inward}</strong></div>
        <div className="out"><span>Outward</span><strong data-testid="ledger-outward">−{data.totals.outward}</strong></div>
        <div className="close"><span>Closing balance</span><strong data-testid="ledger-closing">{data.closing_stock}</strong></div>
      </div>
      <div className="data-table ledger-table">
        <div className="table-row table-header ledger-cols"><span>Date</span><span>Type</span><span>Reference</span><span>Party</span><span>Inward</span><span>Outward</span><span>Balance</span></div>
        {data.rows.map((r,idx)=><div className="table-row ledger-cols" key={idx} data-testid={`ledger-row-${idx}`}>
          <span>{r.date}</span>
          <span className={`ledger-type ${r.type}`}>{r.type}</span>
          <span>{r.reference||"—"}</span>
          <span>{r.party||"—"}</span>
          <span className="qty-in">{r.inward?`+${r.inward}`:"—"}</span>
          <span className="qty-out">{r.outward?`−${r.outward}`:"—"}</span>
          <span><b>{r.balance}</b></span>
        </div>)}
        {!data.rows.length&&<div className="empty-state" data-testid="ledger-empty">No movements in the selected range.</div>}
      </div>
    </>}
    {loading&&!data&&<div className="empty-state">Loading ledger…</div>}
  </section>
}

