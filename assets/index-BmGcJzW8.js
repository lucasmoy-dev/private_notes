(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))t(i);new MutationObserver(i=>{for(const a of i)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&t(r)}).observe(document,{childList:!0,subtree:!0});function o(i){const a={};return i.integrity&&(a.integrity=i.integrity),i.referrerPolicy&&(a.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?a.credentials="include":i.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function t(i){if(i.ep)return;i.ep=!0;const a=o(i);fetch(i.href,a)}})();class N{static async hashPassword(e){const t=new TextEncoder().encode(e+"salt_cloud_notes_2026"),i=await crypto.subtle.digest("SHA-512",t);return Array.from(new Uint8Array(i)).map(r=>r.toString(16).padStart(2,"0")).join("")}static async deriveKey(e,o){const t=new TextEncoder,i=await crypto.subtle.importKey("raw",t.encode(e),{name:"PBKDF2"},!1,["deriveKey"]);return await crypto.subtle.deriveKey({name:"PBKDF2",salt:t.encode(o),iterations:25e4,hash:"SHA-512"},i,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}static async encrypt(e,o){try{const t=crypto.getRandomValues(new Uint8Array(16)),i=crypto.getRandomValues(new Uint8Array(12)),a=await this.deriveKey(o,this.bufToHex(t)),r=new TextEncoder,s=await crypto.subtle.encrypt({name:"AES-GCM",iv:i},a,r.encode(typeof e=="string"?e:JSON.stringify(e)));return{payload:this.bufToHex(new Uint8Array(s)),iv:this.bufToHex(i),salt:this.bufToHex(t)}}catch(t){throw console.error("Encryption failed",t),t}}static async decrypt(e,o){try{const{payload:t,iv:i,salt:a}=e,r=await this.deriveKey(o,a),s=await crypto.subtle.decrypt({name:"AES-GCM",iv:this.hexToBuf(i)},r,this.hexToBuf(t)),d=new TextDecoder().decode(s);try{return JSON.parse(d)}catch{return d}}catch(t){throw console.error("Decryption failed. Wrong password?",t),t}}static bufToHex(e){return Array.from(new Uint8Array(e)).map(o=>o.toString(16).padStart(2,"0")).join("")}static hexToBuf(e){return new Uint8Array(e.match(/.{1,2}/g).map(o=>parseInt(o,16)))}}const u={notes:[],categories:[],settings:{theme:"dark",drivePath:"/backup/notes/",algo:"aes-256-gcm"},currentView:"all",editingNoteId:null,unlockedNotes:new Set,unlockedCategories:new Set,gapiLoaded:!1,tokenClient:null};async function X(){const n=sessionStorage.getItem("cn_pass_plain_v3");if(n){const e=await N.encrypt(u.notes,n),o=await N.encrypt(u.categories,n);localStorage.setItem("cn_notes_v3_enc",JSON.stringify(e)),localStorage.setItem("cn_categories_v3_enc",JSON.stringify(o)),localStorage.removeItem("cn_notes_v3"),localStorage.removeItem("cn_categories_v3")}localStorage.setItem("cn_settings_v3",JSON.stringify(u.settings))}async function Kt(n){try{const e=localStorage.getItem("cn_notes_v3_enc"),o=localStorage.getItem("cn_categories_v3_enc");if(e)u.notes=await N.decrypt(JSON.parse(e),n);else{const t=localStorage.getItem("cn_notes_v3");t&&(u.notes=JSON.parse(t))}if(o)u.categories=await N.decrypt(JSON.parse(o),n);else{const t=localStorage.getItem("cn_categories_v3");t&&(u.categories=JSON.parse(t))}}catch(e){throw console.error("Failed to load encrypted data",e),e}}function In(){const n=localStorage.getItem("cn_settings_v3");n&&(u.settings={...u.settings,...JSON.parse(n)})}const kn="v3.6.0",Re=[{id:"default",light:"#ffffff",dark:"#09090b"},{id:"red",light:"#fef2f2",dark:"#450a0a"},{id:"orange",light:"#fff7ed",dark:"#431407"},{id:"yellow",light:"#fefce8",dark:"#422006"},{id:"green",light:"#f0fdf4",dark:"#064e3b"},{id:"teal",light:"#f0fdfa",dark:"#134e4a"},{id:"blue",light:"#eff6ff",dark:"#1e3a8a"},{id:"darkblue",light:"#eef2ff",dark:"#1e1b4b"},{id:"purple",light:"#faf5ff",dark:"#3b0764"},{id:"pink",light:"#fdf2f8",dark:"#500724"},{id:"brown",light:"#fffaf5",dark:"#2d1a10"},{id:"gray",light:"#f8fafc",dark:"#0f172a"}],Zt=["#ffffff","#f28b82","#fbbc04","#fff475","#ccff90","#a7ffeb","#cbf0f8","#aecbfa","#d7aefb","#fdcfe8","#e6c9a8","#e8eaed","#1e293b","#450a0a","#422006","#064e3b","#134e4a","#1e3a8a","#1e1b4b","#4c1d95","#500724","#27272a","#09090b","#000000"],_n=["😊","😂","🥰","😎","🤔","😴","🔥","✨","🚀","🎉","❤️","👍","💡","📅","✅","❌","🔒","🔑","📌","🎨","📁","🏠","🌟","🌍","💻","📱","🍎","🍕","🍺","🌈","☀️","🌙","⚡","💎","🎁","🎈","🎵","📷","🔍","🛸","👾","🤖","👻","🦄","🐾","🏀","⚽","🚗","✈️","🕹️","🎮","🎲","🧩","🎭","🎬","🎤","🎧","🎹","🎸","🎻","🎺","🎷","🥁","🏹","🎣","🚵","🧗","🧘","🛁","🛌","🗝️","🛡️","⚔️","🗺️","🕯️","⌛","⚖️","⚙️","⚒️","🛠️","⛏️","⛓️","🔭","🔬","💊","💉","🧬","🩸","🧪","🌡️","🧴","🧹","🧺","🧼","🧽","🪣","🪒","🧻","🛀","🚿","🚽"];function S(n,e=3e3){const o=document.getElementById("toast");o&&(o.querySelector("div").innerText=n,o.classList.add("show"),setTimeout(()=>o.classList.remove("show"),e))}function te(n,e,o=!0){return new Promise(t=>{const i=document.getElementById("prompt-modal"),a=document.getElementById("prompt-input");if(!i||!a)return t(null);document.getElementById("prompt-title").innerText=n,document.getElementById("prompt-desc").innerText=e,a.type=o?"password":"text",a.value="",i.classList.remove("hidden"),R(),a.focus();const r=()=>{i.classList.add("hidden"),window.removeEventListener("keydown",s)},s=p=>{p.key==="Enter"&&l(),p.key==="Escape"&&d()};window.addEventListener("keydown",s);const l=()=>{const p=a.value;r(),t(p)},d=()=>{r(),t(null)};document.getElementById("prompt-confirm").onclick=l,document.getElementById("prompt-cancel").onclick=d})}function Cn(n){if(!n)return!0;const e=n.replace("#",""),o=parseInt(e.substr(0,2),16),t=parseInt(e.substr(2,2),16),i=parseInt(e.substr(4,2),16);return isNaN(o)||isNaN(t)||isNaN(i)?!0:(o*299+t*587+i*114)/1e3<128}function R(){typeof lucide<"u"&&lucide.createIcons&&lucide.createIcons()}class Qt{constructor(e="chunk_",o="/backup/notes/"){this.basePath=o,this.dbPrefix=e,this.chunkSizeLimit=100*1024}async getOrCreateFolder(e){const o=e.split("/").filter(i=>i);let t="root";for(const i of o){const a=`name = '${i}' and mimeType = 'application/vnd.google-apps.folder' and '${t}' in parents and trashed = false`,s=(await gapi.client.drive.files.list({q:a,fields:"files(id, name)"})).result.files;if(s.length>0)t=s[0].id;else{const l={name:i,mimeType:"application/vnd.google-apps.folder",parents:[t]};t=(await gapi.client.drive.files.create({resource:l,fields:"id"})).result.id}}return t}async saveChunks(e,o){const t=JSON.stringify(e),i=[];for(let a=0;a<t.length;a+=this.chunkSizeLimit)i.push(t.substring(a,a+this.chunkSizeLimit));for(let a=0;a<i.length;a++){const r=`${this.dbPrefix}${a}.json`;await this.uploadFile(r,i[a],o)}return i.length}async uploadFile(e,o,t){const i=`name = '${e}' and '${t}' in parents and trashed = false`,r=(await gapi.client.drive.files.list({q:i,fields:"files(id)"})).result.files,s=r.length>0?r[0].id:null,l={name:e,parents:s?[]:[t]},d=new Blob([o],{type:"application/json"}),p=gapi.auth.getToken().access_token,c=s?"PATCH":"POST",v=s?`https://www.googleapis.com/upload/drive/v3/files/${s}?uploadType=media`:"https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";if(s)await fetch(v,{method:c,headers:{Authorization:`Bearer ${p}`},body:d});else{const f=new FormData;f.append("metadata",new Blob([JSON.stringify(l)],{type:"application/json"})),f.append("file",d),await fetch(v,{method:c,headers:{Authorization:`Bearer ${p}`},body:f})}}async loadChunks(e){const o=`name contains '${this.dbPrefix}' and '${e}' in parents and trashed = false`,i=(await gapi.client.drive.files.list({q:o,fields:"files(id, name)",orderBy:"name"})).result.files;let a="";for(const r of i){const s=await gapi.client.drive.files.get({fileId:r.id,alt:"media"});a+=typeof s.result=="string"?s.result:JSON.stringify(s.result)}return a?JSON.parse(a):null}}function Tn(){return`
    <div id="auth-shield" class="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-300">
        <div class="w-full max-w-sm p-8 space-y-6 bg-card border rounded-lg shadow-lg">
            <div class="text-center space-y-2">
                <div class="mx-auto w-10 h-10 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
                    <i data-lucide="lock" class="w-5 h-5"></i>
                </div>
                <h1 class="text-2xl font-semibold tracking-tight" id="auth-title">Bóveda Protegida</h1>
                <p class="text-sm text-muted-foreground" id="auth-desc">Ingresa tu contraseña maestra para continuar</p>
            </div>
            <div class="space-y-4">
                <div class="relative group">
                    <input type="password" id="master-password" placeholder="Tu contraseña" class="h-11 w-full pl-4 pr-12 text-base">
                    <button type="button" class="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground toggle-pass" data-target="master-password">
                        <i data-lucide="eye" class="w-4 h-4 icon-show"></i>
                    </button>
                </div>
                <div class="relative group hidden" id="confirm-password-wrapper">
                    <input type="password" id="confirm-password" placeholder="Repite la contraseña" class="h-11 w-full pl-4 pr-12 text-base">
                    <button type="button" class="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground toggle-pass" data-target="confirm-password">
                        <i data-lucide="eye" class="w-4 h-4 icon-show"></i>
                    </button>
                </div>
                <button id="auth-submit" class="btn-shad btn-shad-primary w-full h-11 font-bold">Desbloquear</button>
            </div>
        </div>
    </div>`}async function Dn(n){const e=document.getElementById("auth-shield"),o=!localStorage.getItem("cn_master_hash_v3"),t=sessionStorage.getItem("cn_pass_plain_v3");o?Ln():t?await N.hashPassword(t)===localStorage.getItem("cn_master_hash_v3")?(e.classList.add("opacity-0","pointer-events-none"),setTimeout(()=>e.style.display="none",300),document.getElementById("app").classList.remove("opacity-0"),await Kt(t),n()):(sessionStorage.removeItem("cn_pass_plain_v3"),Pt()):Pt()}function Ln(){const n=document.getElementById("auth-title"),e=document.getElementById("auth-desc"),o=document.getElementById("confirm-password-wrapper"),t=document.getElementById("auth-submit");n&&(n.innerText="Configura tu Bóveda"),e&&(e.innerText="Crea una contraseña maestra. Introduce la contraseña dos veces para asegurar que es correcta."),o&&o.classList.remove("hidden"),t&&(t.innerText="Crear mi Bóveda",t.classList.remove("btn-shad-primary"),t.classList.add("btn-shad-success"))}function Pt(){const n=document.getElementById("auth-title"),e=document.getElementById("auth-desc"),o=document.getElementById("confirm-password-wrapper"),t=document.getElementById("auth-submit");n&&(n.innerText="Bóveda Protegida"),e&&(e.innerText="Ingresa tu contraseña maestra para continuar"),o&&o.classList.add("hidden"),t&&(t.innerText="Desbloquear",t.classList.add("btn-shad-primary"),t.classList.remove("btn-shad-success"))}async function Ot(n){const e=document.getElementById("master-password").value,o=document.getElementById("confirm-password").value,t=!localStorage.getItem("cn_master_hash_v3");if(!e)return S("Ingresa una contraseña");if(t){if(!o)return S("Confirma tu contraseña");if(e!==o)return S("⚠️ ¡Las contraseñas no coinciden!");if(e.length<4)return S("La contraseña debe tener al menos 4 caracteres")}const i=await N.hashPassword(e),a=localStorage.getItem("cn_master_hash_v3");if(!a)localStorage.setItem("cn_master_hash_v3",i),sessionStorage.setItem("cn_pass_plain_v3",e),S("✅ Bóveda creada con éxito");else if(a===i)sessionStorage.setItem("cn_pass_plain_v3",e),S("Bóveda abierta");else return S("❌ Contraseña incorrecta");const r=document.getElementById("auth-shield");r.classList.add("opacity-0","pointer-events-none"),setTimeout(()=>r.style.display="none",300),document.getElementById("app").classList.remove("opacity-0"),await Kt(e),n()}function Bn(){return`
    <div id="app" class="flex h-screen overflow-hidden opacity-100 transition-opacity duration-300">
        <!-- Sidebar Desktop -->
        <aside class="w-64 hidden md:flex flex-col border-r bg-sidebar">
            <style>
                @keyframes logo-rainbow {
                    0% { color: #6366f1; filter: drop-shadow(0 0 2px #6366f1); }
                    33% { color: #ec4899; filter: drop-shadow(0 0 2px #ec4899); }
                    66% { color: #10b981; filter: drop-shadow(0 0 2px #10b981); }
                    100% { color: #6366f1; filter: drop-shadow(0 0 2px #6366f1); }
                }
                .logo-animate { animation: logo-rainbow 8s infinite linear; }
            </style>
            <div class="p-6 flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-2 flex items-center justify-center border border-primary/20 shadow-inner">
                    <svg viewBox="0 0 24 24" fill="none" class="w-full h-full logo-animate" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                </div>
                <div>
                    <h1 class="text-sm font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Private Notes</h1>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto px-4 space-y-8">
                <div class="space-y-1">
                    <button class="nav-link active w-full" data-view="all">
                        <i data-lucide="layout-grid" class="w-4 h-4"></i> Todas las notas
                    </button>
                </div>

                <div class="space-y-4">
                    <div class="flex items-center justify-between px-4" id="sidebar-categories-header">
                        <h3 class="sidebar-section-title text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Etiquetas</h3>
                    </div>
                    <div id="sidebar-categories" class="space-y-1"></div>
                </div>
            </div>

            <div class="p-6 space-y-2 mt-auto">
                <button id="sidebar-manage-cats" class="nav-link w-full text-xs opacity-60 hover:opacity-100">
                    <i data-lucide="tag" class="w-3.5 h-3.5"></i> Gestionar Etiquetas
                </button>
                <button id="settings-trigger" class="nav-link w-full text-xs opacity-60 hover:opacity-100">
                    <i data-lucide="settings" class="w-3.5 h-3.5"></i> Configuración
                </button>
                <button id="sidebar-pwa-install-btn" class="hidden nav-link w-full text-xs opacity-60 hover:opacity-100">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i> Instalar Aplicación
                </button>
                <div class="mt-auto pt-4 border-t border-border/20 px-4">
                    <div id="app-version" class="text-[9px] text-muted-foreground font-mono opacity-50">v3.6.0</div>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 flex flex-col bg-background relative overflow-hidden h-full">
            <!-- Desktop Header -->
            <header class="hidden md:flex h-16 items-center justify-between px-8 border-b">
                <div class="flex items-center gap-4 flex-1">
                    <div class="relative w-full max-w-sm">
                        <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"></i>
                        <input type="text" id="search-input" placeholder="Buscar notas..." class="pl-12 h-9 w-full" autocomplete="off">
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button id="sync-btn" class="p-2 hover:bg-accent rounded-md text-muted-foreground transition-colors" title="Sincronizar ahora">
                        <i data-lucide="refresh-cw" class="w-5 h-5" id="sync-icon"></i>
                    </button>
                    <button id="pwa-install-btn" class="hidden btn-shad btn-shad-outline h-9 px-3">
                        <i data-lucide="download" class="w-4 h-4 mr-2"></i> Instalar
                    </button>
                    <button id="add-note-btn" class="btn-shad btn-shad-primary h-9">
                        <i data-lucide="plus" class="w-4 h-4 mr-2"></i> Nueva Nota
                    </button>
                </div>
            </header>

            <!-- Mobile Top Bar -->
            <div class="md:hidden h-14 border-b flex items-center justify-between px-4 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div class="flex items-center gap-3">
                    <button id="mobile-sidebar-trigger" class="p-2 -ml-2 hover:bg-accent rounded-md">
                        <i data-lucide="menu" class="w-5 h-5"></i>
                    </button>
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                            <i data-lucide="shield-check" class="text-primary-foreground w-4 h-4"></i>
                        </div>
                        <span class="font-bold tracking-tight text-lg">Bóveda</span>
                    </div>
                </div>
                <div class="flex items-center gap-1">
                    <button id="mobile-search-btn" class="p-2 hover:bg-accent rounded-md">
                        <i data-lucide="search" class="w-5 h-5"></i>
                    </button>
                </div>
                <div id="mobile-search-bar" class="absolute inset-0 bg-background flex items-center px-4 gap-2 hidden animate-in slide-in-from-top duration-200">
                    <i data-lucide="search" class="w-4 h-4 text-muted-foreground"></i>
                    <input type="text" id="mobile-search-input-top" placeholder="Buscar en tus notas..." class="flex-1 bg-transparent border-none outline-none text-sm h-full" autocomplete="off">
                    <button id="close-mobile-search" class="p-2 hover:bg-accent rounded-md">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <!-- Grid -->
            <div id="notes-viewport" class="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
                <div class="max-w-7xl mx-auto space-y-8">
                    <div class="flex items-end justify-between">
                        <div>
                            <h1 id="view-title" class="text-3xl font-bold tracking-tight">Todas las notas</h1>
                        </div>
                    </div>
                    <div id="notes-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"></div>
                </div>
            </div>

            <!-- Mobile Bottom Nav -->
            <nav class="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-2xl border-t flex items-center justify-around z-40 pb-safe">
                <button class="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground active:text-primary transition-colors" id="mobile-sidebar-trigger-bottom">
                    <i data-lucide="menu" class="w-5 h-5"></i>
                    <span class="text-[10px] font-medium">Menú</span>
                </button>
                <button class="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground active:text-primary transition-colors nav-link-mobile" data-view="all">
                    <i data-lucide="home" class="w-5 h-5"></i>
                    <span class="text-[10px] font-medium">Inicio</span>
                </button>
                <button class="flex flex-col items-center justify-center gap-1 w-full h-content text-muted-foreground active:text-primary transition-colors relative" id="mobile-add-btn">
                    <div class="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform -translate-y-4 border-4 border-background">
                        <i data-lucide="plus" class="w-6 h-6"></i>
                    </div>
                    <span class="text-[10px] font-medium absolute -bottom-1">Crear</span>
                </button>
                <button class="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground active:text-primary transition-colors" id="mobile-sync-btn-bottom">
                    <i data-lucide="refresh-cw" class="w-5 h-5"></i>
                    <span class="text-[10px] font-medium">Sincronizar</span>
                </button>
                <button class="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground active:text-primary transition-colors" id="mobile-search-trigger">
                    <i data-lucide="search" class="w-5 h-5"></i>
                    <span class="text-[10px] font-medium">Buscar</span>
                </button>
            </nav>
        </main>

        <!-- Mobile Sidebar Drawer -->
        <div id="mobile-sidebar-overlay" class="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] hidden">
            <div id="mobile-sidebar-drawer" class="w-[80vw] h-full bg-card border-r flex flex-col animate-in slide-in-from-left duration-300">
                <div class="p-6 flex items-center justify-between border-b">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <i data-lucide="shield-check" class="text-primary-foreground w-4 h-4"></i>
                        </div>
                        <span class="font-bold tracking-tight">Bóveda</span>
                    </div>
                    <button id="close-mobile-sidebar" class="p-2 hover:bg-accent rounded-md">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-8">
                    <div class="space-y-1">
                        <button class="nav-link-mobile-drawer active w-full" data-view="all">
                            <i data-lucide="layout-grid" class="w-4 h-4"></i> Todas las notas
                        </button>
                    </div>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between px-2" id="mobile-sidebar-categories-header">
                            <h3 class="sidebar-section-title">Etiquetas</h3>
                        </div>
                        <div id="mobile-sidebar-categories" class="space-y-1 px-2"></div>
                    </div>
                </div>
                <div class="p-6 border-t space-y-2">
                    <button id="mobile-pwa-install-btn" class="hidden flex items-center gap-3 w-full p-3 rounded-md bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                        <i data-lucide="download" class="w-4 h-4"></i> Instalar Aplicación
                    </button>
                    <button id="mobile-manage-cats" class="flex items-center gap-3 w-full p-3 rounded-md hover:bg-accent text-sm">
                        <i data-lucide="tag" class="w-4 h-4"></i> Gestionar Etiquetas
                    </button>
                    <button id="mobile-settings-btn" class="flex items-center gap-3 w-full p-3 rounded-md hover:bg-accent text-sm">
                        <i data-lucide="settings" class="w-4 h-4"></i> Configuración
                    </button>
                    <div class="pt-4 border-t space-y-3">
                        <div class="flex items-center justify-between px-3">
                            <span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Sistema</span>
                            <span class="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">v3.6.0</span>
                        </div>
                        <button id="mobile-force-reload-btn" class="flex items-center gap-3 w-full p-3 rounded-md bg-destructive/5 text-destructive text-sm font-medium border border-destructive/10">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i> Forzar Limpieza y Recarga
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>`}let Et=null;function An(){return`
    <div id="editor-modal" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-background/80 backdrop-blur-sm dialog-overlay"></div>
        <div class="dialog-content max-w-2xl h-[80vh] flex flex-col">
            <div class="flex items-center gap-2 border-b pb-2">
                <button id="close-editor" class="text-muted-foreground hover:text-foreground p-2 -ml-2" title="Volver">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i>
                </button>
                <input type="text" id="edit-title" placeholder="Título de la nota"
                    class="bg-transparent text-xl font-bold outline-none border-none placeholder:text-muted-foreground w-full">
                
                <div class="flex items-center gap-1">
                    <button id="toggle-fullscreen" class="hidden md:flex editor-tool" title="Modo Pantalla Completa">
                        <i data-lucide="maximize-2" class="w-4 h-4"></i>
                    </button>
                    <div class="relative">
                        <button id="note-options-btn" class="editor-tool" title="Más opciones">
                            <i data-lucide="more-vertical" class="w-5 h-5"></i>
                        </button>
                        <div id="note-options-menu" class="hidden absolute right-0 top-full mt-1 bg-popover border shadow-2xl rounded-xl p-1 z-[120] min-w-[160px]">
                            <button id="opt-copy-all" class="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors">
                                <i data-lucide="copy" class="w-4 h-4"></i> Copiar todo
                            </button>
                            <button id="opt-download" class="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors">
                                <i data-lucide="download" class="w-4 h-4"></i> Descargar .txt
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex-1 py-4 overflow-y-auto">
                <div class="flex items-center gap-3 w-full md:w-auto">
                    <!-- Mobile Menu Trigger -->
                    <div class="relative md:hidden">
                        <button id="mobile-format-trigger" class="editor-tool bg-primary/10 text-primary border border-primary/20" title="Formato">
                            <div class="flex flex-col items-center">
                                <i data-lucide="type" class="w-5 h-5"></i>
                                <div class="w-4 h-[2px] bg-primary rounded-full -mt-1"></div>
                            </div>
                        </button>
                        <div id="mobile-tools-menu" class="hidden absolute left-0 top-full mt-1 bg-popover border shadow-2xl rounded-xl p-1 z-[120] min-w-[160px] flex flex-col gap-1">
                            <button data-command="bold" class="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors" title="Negrita"><i data-lucide="bold" class="w-4 h-4"></i> Negrita</button>
                            <button data-command="italic" class="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors" title="Cursiva"><i data-lucide="italic" class="w-4 h-4"></i> Cursiva</button>
                            <button data-command="underline" class="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors" title="Subrayado"><i data-lucide="underline" class="w-4 h-4"></i> Subrayado</button>
                            <button data-command="insertUnorderedList" class="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors" title="Lista"><i data-lucide="list" class="w-4 h-4"></i> Lista</button>
                            <button data-command="insertOrderedList" class="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors" title="Enumeración"><i data-lucide="list-ordered" class="w-4 h-4"></i> Enumeración</button>
                            <button id="mobile-link-btn" class="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors" title="Hipervínculo"><i data-lucide="link" class="w-4 h-4"></i> Hipervínculo</button>
                            <button id="mobile-text-color-btn" class="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors" title="Color de texto">
                                <div class="flex flex-col items-center">
                                    <i data-lucide="type" class="w-4 h-4"></i>
                                    <div class="w-3 h-[2px] bg-red-500 rounded-full -mt-0.5"></div>
                                </div>
                                Color de texto
                            </button>
                        </div>
                    </div>

                    <div class="editor-toolbar-container flex-1 justify-start md:flex-initial hidden md:flex items-center gap-1 p-1 border rounded-md bg-muted/30 w-fit shrink-0">
                        <button class="editor-tool" data-cmd="bold" title="Negrita (Ctrl+B)">
                            <i data-lucide="bold" class="w-4 h-4"></i>
                        </button>
                        <button class="editor-tool" data-cmd="italic" title="Cursiva (Ctrl+I)">
                            <i data-lucide="italic" class="w-4 h-4"></i>
                        </button>
                        <button class="editor-tool" data-cmd="underline" title="Subrayado (Ctrl+U)">
                            <i data-lucide="underline" class="w-4 h-4"></i>
                        </button>
                        <div class="w-px h-4 bg-border mx-1"></div>
                        <button class="editor-tool" data-cmd="insertUnorderedList" title="Lista de viñetas">
                            <i data-lucide="list" class="w-4 h-4"></i>
                        </button>
                        <button class="editor-tool" data-cmd="insertOrderedList" title="Lista numerada">
                            <i data-lucide="list-ordered" class="w-4 h-4"></i>
                        </button>
                        <button id="checklist-btn" class="editor-tool" title="Checklist">
                            <i data-lucide="check-square" class="w-4 h-4"></i>
                        </button>
                        <div class="w-px h-4 bg-border mx-1"></div>
                        <button id="add-link" class="editor-tool" title="Hipervínculo">
                            <i data-lucide="link" class="w-4 h-4"></i>
                        </button>
                        <button id="open-text-colors" class="editor-tool relative" title="Color de texto">
                            <div class="flex flex-col items-center">
                                <i data-lucide="type" class="w-4 h-4"></i>
                                <div class="w-3 h-[2px] bg-red-500 rounded-full -mt-0.5"></div>
                            </div>
                        </button>
                        <button id="open-emojis" class="editor-tool" title="Emojis"><i data-lucide="smile" class="w-4 h-4"></i></button>
                    </div>
                </div>

                <div id="edit-content" contenteditable="true"
                    class="min-h-[200px] outline-none text-sm leading-relaxed prose prose-slate dark:prose-invert max-w-none"
                    placeholder="Empieza a escribir..."></div>
            </div>

            <div class="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 editor-bottom-bar overflow-y-auto max-h-[30vh]">
                <div class="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <div class="flex items-center bg-muted/30 p-1 rounded-md border shrink-0">
                        <button id="open-colors" class="editor-tool relative" title="Color de fondo">
                            <div class="flex flex-col items-center">
                                <i data-lucide="palette" class="w-4 h-4"></i>
                                <div class="w-3 h-[2px] bg-blue-500 rounded-full -mt-0.5"></div>
                            </div>
                        </button>
                    </div>

                    <div class="relative group" id="cat-select-wrapper">
                        <button id="cat-dropdown-trigger"
                            class="h-9 px-3 rounded-md border border-input bg-background/50 text-[10px] md:text-xs flex items-center gap-2 hover:bg-accent transition-all truncate max-w-[120px]">
                            <span id="selected-cat-label" class="truncate">Sin categoría</span>
                            <i data-lucide="chevron-down" class="w-3 h-3 text-muted-foreground shrink-0"></i>
                        </button>
                        <div id="cat-dropdown-menu"
                            class="absolute bottom-full mb-2 left-0 w-48 bg-popover border rounded-md shadow-xl hidden z-50 py-1 overflow-hidden">
                        </div>
                        <select id="edit-category" class="hidden">
                            <option value="">Sin categoría</option>
                        </select>
                    </div>
                    <button id="toggle-pin" class="editor-tool border border-input bg-background/50 transition-all shrink-0">
                        <i data-lucide="pin" class="w-4 h-4"></i>
                    </button>
                    <button id="toggle-lock" class="editor-tool border border-input bg-background/50 transition-all shrink-0">
                        <i data-lucide="lock" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex gap-2 w-full sm:w-auto">
                    <button id="delete-note" class="flex-1 sm:flex-none btn-shad bg-destructive/10 text-destructive hover:bg-destructive hover:text-white h-9 px-3" title="Eliminar nota">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                    <button id="save-note" class="flex-[2] sm:flex-none btn-shad btn-shad-primary h-9">Guardar</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Popovers -->
    <div id="color-popover" class="fixed z-[60] hidden popover-content">
        <div class="grid grid-cols-6 gap-2" id="bg-color-grid"></div>
    </div>
    <div id="text-color-popover" class="fixed z-[60] hidden popover-content">
        <div class="grid grid-cols-6 gap-2" id="text-color-grid"></div>
    </div>
    <div id="emoji-popover" class="fixed z-[60] hidden popover-content w-80">
        <div class="grid grid-cols-8 gap-2 h-64 overflow-y-auto" id="emoji-grid"></div>
    </div>`}function Nn(n){const e=document.getElementById("editor-modal");document.getElementById("edit-title");const o=document.getElementById("edit-content"),t=document.getElementById("close-editor"),i=document.getElementById("save-note"),a=document.getElementById("delete-note");t.onclick=()=>We(),i.onclick=async()=>{await We(),n()},a.onclick=async()=>{u.editingNoteId&&confirm("¿Eliminar esta nota?")&&(u.notes=u.notes.filter(f=>f.id!==u.editingNoteId),await X(),en(),n())},document.querySelectorAll(".editor-tool[data-cmd]").forEach(f=>{f.dataset.cmd&&(f.onmousedown=g=>{g.preventDefault(),he(),document.execCommand(f.dataset.cmd,!1,f.dataset.val||null),fe()})}),On(),o.onkeyup=()=>{Me(),fe()},o.onmouseup=()=>{Me(),fe()},o.onfocus=()=>{Me(),fe()};const r=document.getElementById("edit-title");r.onfocus=()=>r.select(),r.onclick=()=>r.select(),document.getElementById("toggle-fullscreen").onclick=()=>{const f=document.getElementById("editor-modal").querySelector(".dialog-content"),g=f.classList.contains("max-w-none");document.getElementById("toggle-fullscreen").querySelector("i"),g?(f.classList.remove("max-w-none","h-screen","w-screen","fixed","inset-0","z-[60]","rounded-none"),f.classList.add("max-w-2xl","h-[80vh]"),R()):(f.classList.remove("max-w-2xl","h-[80vh]"),f.classList.add("max-w-none","h-screen","w-screen","fixed","inset-0","z-[60]","rounded-none")),R()};const s=document.getElementById("mobile-format-trigger"),l=document.getElementById("mobile-tools-menu");s&&(s.onclick=f=>{f.stopPropagation(),l.classList.toggle("hidden")}),l.querySelectorAll("button[data-command]").forEach(f=>{f.onclick=()=>{execCommand(f.dataset.command),l.classList.add("hidden")}}),document.getElementById("mobile-link-btn").onclick=()=>{c(),l.classList.add("hidden")},document.getElementById("mobile-text-color-btn").onclick=f=>{he(),Qe(f,"text-color-popover"),l.classList.add("hidden")};const d=document.getElementById("note-options-btn"),p=document.getElementById("note-options-menu");d.onclick=f=>{f.stopPropagation(),p.classList.toggle("hidden")},document.getElementById("opt-copy-all").onclick=()=>{const f=document.getElementById("edit-content").innerText;navigator.clipboard.writeText(f).then(()=>{S("✅ Contenido copiado"),p.classList.add("hidden")})},document.getElementById("opt-download").onclick=()=>{const f=document.getElementById("edit-title").value||"nota",g=document.getElementById("edit-content").innerText,h=new Blob([g],{type:"text/plain"}),k=URL.createObjectURL(h),B=document.createElement("a");B.href=k,B.download=`${f}.txt`,B.click(),p.classList.add("hidden")},document.addEventListener("click",()=>{l&&l.classList.add("hidden"),p&&p.classList.add("hidden")});const c=async()=>{const f=await te("Insertar Enlace","Ingresa la URL:",!1);f&&(he(),document.execCommand("createLink",!1,f.startsWith("http")?f:"https://"+f),o.querySelectorAll("a").forEach(h=>h.target="_blank"))};document.getElementById("add-link").onclick=c,document.getElementById("checklist-btn").onclick=()=>v();const v=()=>{he(),document.execCommand("insertUnorderedList");const f=window.getSelection();if(f.rangeCount>0){let g=f.focusNode;for(;g&&g.nodeName!=="UL";)g=g.parentNode;g&&(g.classList.add("checklist"),g.querySelectorAll("li").forEach(h=>h.dataset.checked="false"))}fe()};o.onkeydown=f=>{f.key==="Tab"&&(f.preventDefault(),f.shiftKey?document.execCommand("outdent"):document.execCommand("indent"))},o.addEventListener("click",f=>{const g=f.target.closest(".checklist li");if(g){const h=g.getBoundingClientRect();f.clientX-h.left<35&&(f.preventDefault(),g.dataset.checked=g.dataset.checked==="true"?"false":"true",We(),fe())}}),document.getElementById("add-checklist").onclick=()=>{he(),document.execCommand("insertUnorderedList");const f=window.getSelection();if(f.rangeCount>0){let g=f.focusNode;for(;g&&g.nodeName!=="UL";)g=g.parentNode;g&&(g.classList.add("checklist"),g.querySelectorAll("li").forEach(h=>h.dataset.checked="false"))}fe()},e.querySelector(".dialog-overlay").onclick=()=>{We()}}function fe(){document.querySelectorAll(".editor-tool[data-cmd]").forEach(n=>{const e=n.dataset.cmd;try{const o=document.queryCommandState(e);n.classList.toggle("active",o)}catch{}})}function Oe(n=null){const e=document.getElementById("editor-modal"),o=document.getElementById("edit-title"),t=document.getElementById("edit-content"),i=document.getElementById("edit-category"),a=e.querySelector(".dialog-content");u.editingNoteId=n?n.id:null,o.value=(n==null?void 0:n.title)||"",t.innerHTML=(n==null?void 0:n.content)===void 0||(n==null?void 0:n.content)==="undefined"?"":(n==null?void 0:n.content)||"";let r="";!n&&u.currentView!=="all"&&(r=u.currentView),i.value=n?n.categoryId||"":r;const s=Re.find(c=>c.id===(n?n.themeId:"default"))||Re[0],l=u.settings.theme==="dark"?s.dark:s.light,d=s.id==="default"?u.settings.theme==="dark":Cn(l);a.style.backgroundColor=l,a.style.color=d?"rgba(255,255,255,0.95)":"rgba(0,0,0,0.9)",a.dataset.themeId=s.id,o.style.color=d?"rgba(255,255,255,0.95)":"rgba(0,0,0,0.9)",t.style.color=d?"rgba(255,255,255,0.95)":"rgba(0,0,0,0.9)",e.querySelectorAll(".editor-tool, #cat-dropdown-trigger, #toggle-pin, #toggle-lock").forEach(c=>{c.style.color=d?"rgba(255,255,255,0.7)":"rgba(0,0,0,0.7)",c.style.borderColor=d?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)",c.style.backgroundColor=d?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"}),tn(n?n.pinned:!1),St(n?!!n.passwordHash:!1),Pn(),e.classList.remove("hidden"),t.focus()}function en(){u.editingNoteId=null,document.getElementById("editor-modal").classList.add("hidden"),document.getElementById("toggle-lock").dataset.tempHash="",document.getElementById("edit-title").value="",document.getElementById("edit-content").innerHTML="",window.refreshUI&&window.refreshUI()}async function We(){let n=document.getElementById("edit-title").value.trim();const e=document.getElementById("edit-content").innerHTML,o=document.getElementById("edit-category").value,t=document.getElementById("toggle-pin").dataset.active==="true",i=document.getElementById("toggle-lock").dataset.active==="true",a=document.querySelector("#editor-modal .dialog-content").dataset.themeId;if(!n){const d=new Date;n=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")+", "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+":"+String(d.getSeconds()).padStart(2,"0")}if(e===void 0||e==="undefined"||e.trim()==="")return S("La nota está vacía");const r=u.notes.findIndex(d=>d.id===u.editingNoteId),s=document.getElementById("toggle-lock").dataset.tempHash,l={id:u.editingNoteId||Date.now().toString(),title:n,content:e,categoryId:o||null,pinned:t,themeId:a||"default",passwordHash:i?s||(r>=0?u.notes[r].passwordHash:null):null,updatedAt:Date.now()};if(i&&!l.passwordHash){const d=await te("Seguridad","Establece una contraseña para esta nota:");if(d)l.passwordHash=await N.hashPassword(d);else return}r>=0?u.notes[r]=l:u.notes.unshift(l),window.refreshUI&&window.refreshUI(),await X(),en(),window.triggerAutoSync&&window.triggerAutoSync()}function Me(){const n=window.getSelection();n.rangeCount>0&&(Et=n.getRangeAt(0))}function he(){if(Et){const n=window.getSelection();n.removeAllRanges(),n.addRange(Et)}}function Pn(){const n=document.getElementById("edit-category").value,e=u.categories.find(o=>o.id===n);document.getElementById("selected-cat-label")&&(document.getElementById("selected-cat-label").innerText=e?e.name:"Sin categoría")}function tn(n){const e=document.getElementById("toggle-pin");e.dataset.active=n,e.classList.toggle("active",n)}function St(n){const e=document.getElementById("toggle-lock");e.dataset.active=n,e.classList.toggle("active",n);const o=e.querySelector("[data-lucide]");o&&(o.setAttribute("data-lucide",n?"lock":"lock-open"),R())}function On(){document.getElementById("open-colors").onclick=i=>Qe(i,"color-popover"),document.getElementById("open-text-colors").onmousedown=i=>{i.preventDefault(),Me()},document.getElementById("open-text-colors").onclick=i=>Qe(i,"text-color-popover"),document.getElementById("open-emojis").onmousedown=i=>{i.preventDefault(),Me()},document.getElementById("open-emojis").onclick=i=>Qe(i,"emoji-popover");const n=document.getElementById("bg-color-grid");Re.forEach(i=>{const a=document.createElement("div");a.className="w-8 h-8 rounded-full cursor-pointer border hover:scale-110 transition-transform",a.style.backgroundColor=u.settings.theme==="dark"?i.dark:i.light,a.onclick=()=>{const r=document.querySelector("#editor-modal .dialog-content");r.style.backgroundColor=u.settings.theme==="dark"?i.dark:i.light,r.dataset.themeId=i.id,Be()},n.appendChild(a)});const e=document.getElementById("text-color-grid");Zt.forEach(i=>{const a=document.createElement("div");a.className="w-8 h-8 rounded-full cursor-pointer border hover:scale-110 transition-transform",a.style.backgroundColor=i,a.onmousedown=r=>r.preventDefault(),a.onclick=()=>{he(),document.execCommand("foreColor",!1,i),Be()},e.appendChild(a)});const o=document.getElementById("emoji-grid");_n.forEach(i=>{const a=document.createElement("span");a.className="cursor-pointer hover:bg-accent p-2 rounded text-xl text-center",a.innerText=i,a.onclick=()=>{he(),document.execCommand("insertHTML",!1,i),Be()},o.appendChild(a)}),document.getElementById("toggle-pin").onclick=function(){const i=this.dataset.active!=="true";tn(i)},document.getElementById("toggle-lock").onclick=async function(){if(this.dataset.active==="true"){if(confirm("¿Quitar la protección de contraseña de esta nota?")){const a=u.notes.find(r=>r.id===u.editingNoteId);a&&(a.passwordHash=null),delete this.dataset.tempHash,St(!1),S("🔓 Protección quitada")}}else{const a=await te("Proteger Nota","Establece una contraseña para esta nota (déjala vacía para cancelar):");if(a){const r=u.notes.find(l=>l.id===u.editingNoteId),s=await N.hashPassword(a);r&&(r.passwordHash=s),this.dataset.tempHash=s,St(!0),S("🔑 Contraseña establecida")}}},document.addEventListener("click",i=>{!i.target.closest(".editor-tool")&&!i.target.closest(".popover-content")&&!i.target.closest("#cat-dropdown-trigger")&&Be()});const t=document.getElementById("cat-dropdown-trigger");t.onclick=i=>{i.stopPropagation(),document.getElementById("cat-dropdown-menu").classList.toggle("hidden")}}function Qe(n,e){n.stopPropagation();const o=document.getElementById(e),t=n.currentTarget.getBoundingClientRect();Be(e),o.classList.remove("hidden"),o.style.top=`${t.bottom+8}px`,o.style.left=`${Math.min(t.left,window.innerWidth-300)}px`}function Be(n=null){["color-popover","text-color-popover","emoji-popover","cat-dropdown-menu"].forEach(e=>{const o=document.getElementById(e);e!==n&&o&&o.classList.add("hidden")})}function Mn(){return`
    <div id="categories-modal" class="fixed inset-0 z-[70] hidden">
        <div class="dialog-overlay"></div>
        <div class="dialog-content max-w-lg p-0 overflow-hidden h-[500px] flex flex-col">
            <div class="p-6 flex justify-between items-center border-b">
                <div>
                    <h2 class="text-lg font-semibold text-foreground">Gestionar Etiquetas</h2>
                    <p class="text-xs text-muted-foreground">Organiza tus notas con categorías personalizadas</p>
                </div>
                <button class="close-categories p-2 hover:bg-accent rounded-md transition-colors"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>

            <div class="p-4 bg-muted/30 border-b">
                <div class="flex items-center gap-2">
                    <div class="relative flex-1">
                        <i data-lucide="tag" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"></i>
                        <input type="text" id="new-cat-name" placeholder="Nueva etiqueta..." 
                               class="pl-12 h-10 w-full bg-background" autocomplete="off">
                    </div>
                    <button id="add-cat-btn" class="btn-shad btn-shad-primary h-10 px-6">Crear</button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-2" id="cat-manager-list">
                <!-- Items injected here -->
            </div>
        </div>
        <!-- Color Picker Popover -->
        <div id="cat-color-picker" class="fixed z-[80] hidden popover-content p-2">
            <div class="grid grid-cols-5 gap-2" id="cat-palette-grid"></div>
        </div>
    </div>`}function Ge(n,e=null){const o=document.getElementById("cat-manager-list");o&&(o.innerHTML="",e&&(u.categories=e),u.categories.forEach(t=>{const i=document.createElement("div");i.className="flex items-center gap-3 p-2 rounded-lg border bg-card/50 hover:bg-accent/30 transition-all group",i.innerHTML=`
            <div class="w-8 h-8 rounded-md cursor-pointer hover:scale-110 transition-transform shadow-sm flex-shrink-0 flex items-center justify-center border" 
                 style="background-color: ${t.color};"
                 id="cp-${t.id}" title="Cambiar color">
            </div>
            
            <input type="text" value="${t.name}" 
                   class="bg-transparent border-none outline-none font-medium text-sm flex-1 focus:ring-0 transition-colors h-9 px-2 rounded hover:bg-background/50 focus:bg-background"
                   id="cn-${t.id}" autocomplete="off">
            
            <div class="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <button class="p-2 rounded-md hover:bg-background border border-transparent hover:border-border transition-all ${t.passwordHash?"text-primary":"text-muted-foreground"}"
                        id="lock-${t.id}" title="${t.passwordHash?"Protegido":"Protección"}">
                    <i data-lucide="${t.passwordHash?"lock":"unlock"}" class="w-4 h-4"></i>
                </button>
                <button class="p-2 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
                        id="del-${t.id}" title="Eliminar">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `,o.appendChild(i),document.getElementById(`cp-${t.id}`).onclick=r=>{r.stopPropagation(),Hn(t.id,n,r.currentTarget)};const a=document.getElementById(`cn-${t.id}`);a.oninput=r=>{t.name=r.target.value,n()},a.onchange=async()=>{await X(),n(),window.triggerAutoSync&&window.triggerAutoSync()},document.getElementById(`lock-${t.id}`).onclick=()=>qn(t.id,n),document.getElementById(`del-${t.id}`).onclick=()=>jn(t.id,n)}),R())}async function Hn(n,e,o){const t=u.categories.find(l=>l.id===n);if(!t)return;const i=document.getElementById("cat-color-picker"),a=document.getElementById("cat-palette-grid");a.innerHTML="",Zt.forEach(l=>{const d=document.createElement("div");d.className="w-6 h-6 rounded-md cursor-pointer border hover:scale-110 transition-transform",d.style.backgroundColor=l,d.onclick=async()=>{t.color=l,await X(),Ge(e),e(),i.classList.add("hidden"),window.triggerAutoSync&&window.triggerAutoSync()},a.appendChild(d)});const r=o.getBoundingClientRect();i.style.top=`${r.bottom+8}px`,i.style.left=`${r.left}px`,i.classList.remove("hidden");const s=l=>{!i.contains(l.target)&&l.target!==o&&(i.classList.add("hidden"),document.removeEventListener("click",s))};setTimeout(()=>document.addEventListener("click",s),10)}async function jn(n,e){const o=u.categories.find(t=>t.id===n);if(o){if(o.passwordHash){const t=await te("Seguridad","Etiqueta protegida. Ingresa contraseña para eliminar:");if(!t)return;if(await N.hashPassword(t)!==o.passwordHash)return S("❌ Error: Contraseña incorrecta")}confirm(`¿Eliminar la etiqueta "${o.name}"? Las notas no se borrarán.`)&&(u.categories=u.categories.filter(t=>t.id!==n),u.notes.forEach(t=>{t.categoryId===n&&(t.categoryId=null)}),u.currentView===n&&(u.currentView="all"),await X(),Ge(e),e(),window.triggerAutoSync&&window.triggerAutoSync())}}async function qn(n,e){const o=u.categories.find(t=>t.id===n);if(o){if(o.passwordHash){const t=await te("Seguridad","Ingresa la contraseña para quitar la protección:");if(!t)return;if(await N.hashPassword(t)!==o.passwordHash)return S("❌ Error: Contraseña incorrecta");o.passwordHash=null,S("🔓 Protección quitada")}else{const t=await te("Seguridad","Define una contraseña para proteger esta etiqueta:");t&&(o.passwordHash=await N.hashPassword(t),S("🔒 Etiqueta protegida"))}await X(),Ge(e),e(),window.triggerAutoSync&&window.triggerAutoSync()}}function zn(){return`
    <div id="settings-modal" class="fixed inset-0 z-[80] hidden">
        <div class="dialog-overlay"></div>
        <div class="dialog-content max-w-2xl p-0 overflow-hidden flex flex-col md:flex-row h-[500px]">
            <!-- Sidebar Settings -->
            <div id="settings-sidebar" class="w-full md:w-48 bg-muted/50 border-b md:border-b-0 md:border-r p-4 flex flex-col gap-1 overflow-y-auto">
                <button class="settings-tab" data-tab="appearance">
                    <i data-lucide="palette" class="w-4 h-4"></i> General
                </button>
                <button class="settings-tab" data-tab="sync">
                    <i data-lucide="refresh-cw" class="w-4 h-4"></i> Sincronización
                </button>
                <button class="settings-tab" data-tab="security">
                    <i data-lucide="shield" class="w-4 h-4"></i> Seguridad
                </button>
                <button class="settings-tab text-destructive mt-auto" data-tab="danger">
                    <i data-lucide="alert-triangle" class="w-4 h-4"></i> Zona Peligrosa
                </button>
            </div>

            <!-- Content Area -->
            <div class="flex-1 flex flex-col min-w-0" id="settings-content-area">
                <div class="p-4 border-b flex items-center gap-3">
                    <button class="md:hidden p-2 hover:bg-accent rounded-md group" id="settings-back-btn">
                        <i data-lucide="arrow-left" class="w-5 h-5 text-muted-foreground group-hover:text-foreground"></i>
                    </button>
                    <h2 id="settings-tab-title" class="font-bold flex-1">Configuración</h2>
                    <button class="close-settings p-2 hover:bg-accent rounded-md group">
                        <i data-lucide="x" class="w-5 h-5 text-muted-foreground group-hover:text-foreground"></i>
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-6" id="settings-panels">
                    <!-- Panel: Apariencia -->
                    <div id="panel-appearance" class="settings-panel space-y-6">
                        <section class="space-y-4">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tema Visual</h3>
                            <div class="grid grid-cols-2 gap-3">
                                <button id="theme-light" class="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-all group">
                                    <div class="w-full aspect-video bg-zinc-100 rounded border flex items-center justify-center">
                                         <div class="w-1/2 h-2 bg-zinc-300 rounded"></div>
                                    </div>
                                    <span class="text-xs font-medium">Claro</span>
                                </button>
                                <button id="theme-dark" class="flex flex-col items-center gap-2 p-4 rounded-lg border bg-zinc-950 hover:bg-zinc-900 transition-all group ring-primary">
                                    <div class="w-full aspect-video bg-zinc-800 rounded border border-zinc-700 flex items-center justify-center">
                                         <div class="w-1/2 h-2 bg-zinc-600 rounded"></div>
                                    </div>
                                    <span class="text-xs font-medium text-white">Oscuro</span>
                                </button>
                            </div>
                        </section>

                        <section class="space-y-4 pt-4 border-t">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mantenimiento</h3>
                            <div class="p-4 rounded-lg border bg-primary/5 space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-medium">Versión Instalada</span>
                                    <span class="text-xs font-bold font-mono text-primary" id="settings-version-display">v3.6.0</span>
                                </div>
                                <p class="text-[10px] text-muted-foreground">Si la aplicación no se actualiza o ves errores visuales, usa el botón de abajo para forzar una limpieza del sistema.</p>
                                <button id="force-reload-btn" class="btn-shad btn-shad-outline w-full h-10 flex items-center justify-center gap-2 group">
                                    <i data-lucide="refresh-cw" class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500"></i>
                                    Forzar Actualización Completa
                                </button>
                            </div>
                        </section>
                    </div>

                    <!-- Panel: Sincronización -->
                    <div id="panel-sync" class="settings-panel hidden space-y-6">
                        <section class="space-y-4">
                            <div class="flex items-center justify-between">
                                <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Google Drive</h3>
                                <div id="drive-status" class="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold uppercase">Desconectado</div>
                            </div>
                            <div class="space-y-2">
                                <label class="text-xs font-medium">Nombre de carpeta en Drive</label>
                                <input type="text" id="config-drive-path" class="h-10 px-4 w-full" placeholder="p.ej. CloudNotesV3" autocomplete="off">
                                <p class="text-[10px] text-muted-foreground">Las notas se guardarán encriptadas dentro de esta carpeta.</p>
                            </div>
                            <button id="connect-drive-btn" class="btn-shad btn-shad-outline w-full h-10 flex items-center justify-center gap-2">
                                <i data-lucide="link" class="w-4 h-4"></i> Conectar con Google Drive
                            </button>
                            <button id="save-sync-config" class="btn-shad btn-shad-primary w-full h-10">Guardar Cambios</button>
                        </section>
                    </div>

                    <!-- Panel: Seguridad -->
                    <div id="panel-security" class="settings-panel hidden space-y-6">
                        <section class="space-y-4">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Seguridad de la Sesión</h3>
                            <div class="p-4 rounded-lg border bg-muted/20 space-y-3">
                                <p class="text-xs text-muted-foreground">Cerrar la sesión actual eliminará la clave de acceso de la memoria y te llevará a la pantalla de desbloqueo.</p>
                                <button id="logout-btn" class="btn-shad bg-destructive/10 text-destructive hover:bg-destructive hover:text-white w-full h-10 flex items-center justify-center gap-2 transition-all">
                                    <i data-lucide="log-out" class="w-4 h-4"></i> Cerrar Sesión
                                </button>
                            </div>
                        </section>
                        
                        <section class="space-y-4 pt-4 border-t">
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Encriptación</h3>
                            <div class="space-y-2">
                                <label class="text-xs font-medium">Algoritmo preferido</label>
                                <select id="config-algo" class="h-10 w-full px-3">
                                    <option value="aes-256-gcm">AES-256-GCM (Recomendado)</option>
                                    <option value="kyber">CRYSTALS-Kyber (Experimental)</option>
                                </select>
                            </div>
                             <button id="save-security-config" class="btn-shad btn-shad-primary w-full h-10">Actualizar Algoritmo</button>
                        </section>
                    </div>

                    <!-- Panel: Danger Zone -->
                    <div id="panel-danger" class="settings-panel hidden space-y-6">
                        <section class="p-4 rounded-lg border border-destructive/20 bg-destructive/5 space-y-4">
                            <h3 class="text-sm font-semibold text-destructive uppercase tracking-wider">Restablecer Aplicación</h3>
                            <p class="text-xs text-muted-foreground underline">Esta acción borrará permanentemente todas las notas y categorías almacenadas localmente en este navegador.</p>
                            <div class="space-y-2">
                                <label class="text-[10px] uppercase font-bold text-destructive/70">Para confirmar, escribe "confirmar" a continuación:</label>
                                <input type="text" id="factory-reset-confirm" class="h-10 px-4 mt-1 w-full border rounded-md" placeholder="Escribe la palabra..." autocomplete="off">
                            </div>
                            <button id="factory-reset" class="btn-shad bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full h-10 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                                <i data-lucide="trash-2" class="w-4 h-4 mr-2"></i> Eliminar todos los datos locales
                            </button>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    </div>`}function Fn(){const n=document.querySelectorAll(".settings-panel"),e=document.querySelectorAll(".settings-tab"),o=document.getElementById("settings-tab-title"),t=document.getElementById("settings-sidebar"),i=t.nextElementSibling,a=document.getElementById("settings-back-btn"),r=l=>{e.forEach(p=>p.classList.toggle("active",p.dataset.tab===l)),n.forEach(p=>p.classList.toggle("hidden",p.id!==`panel-${l}`));const d={appearance:"General",sync:"Sincronización Cloud",security:"Seguridad y Sesión",danger:"Zona Peligrosa"};o.innerText=d[l]||"Configuración",window.innerWidth<768&&(t.classList.add("hidden"),i.classList.remove("hidden"),a.classList.remove("hidden")),R()};e.forEach(l=>{l.onclick=()=>r(l.dataset.tab)}),a.onclick=()=>{t.classList.remove("hidden"),i.classList.add("hidden"),a.classList.add("hidden"),o.innerText="Configuración"},window.innerWidth<768?(i.classList.add("hidden"),a.classList.add("hidden")):r("appearance");const s=document.getElementById("force-reload-btn");s&&(s.onclick=nn)}async function nn(){if(confirm("Esto reiniciará la aplicación, limpiará la caché y eliminará el Service Worker para forzar la última versión. ¿Continuar?"))try{if("serviceWorker"in navigator){const e=await navigator.serviceWorker.getRegistrations();for(const o of e)await o.unregister()}if("caches"in window){const e=await caches.keys();for(const o of e)await caches.delete(o)}sessionStorage.clear();const n=new URL(window.location.href);n.searchParams.set("t",Date.now()),window.location.href=n.toString()}catch(n){console.error("Error clearing cache:",n),window.location.reload()}}function $n(){return`
    <!-- Prompt Modal -->
    <div id="prompt-modal" class="fixed inset-0 z-[200] hidden">
        <div class="absolute inset-0 bg-background/90 backdrop-blur-xl"></div>
        <div class="dialog-content max-w-sm">
            <h2 id="prompt-title" class="text-lg font-bold mb-2">Seguridad</h2>
            <p id="prompt-desc" class="text-sm text-muted-foreground mb-6">Ingresa la contraseña para continuar</p>
            <div class="space-y-4">
                <div class="relative">
                    <input type="password" id="prompt-input" placeholder="Tu contraseña"
                        class="text-center tracking-widest outline-none pr-10">
                    <button type="button"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground toggle-pass"
                        data-target="prompt-input">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex gap-2">
                    <button id="prompt-cancel" class="btn-shad btn-shad-outline flex-1">Cancelar</button>
                    <button id="prompt-confirm" class="btn-shad btn-shad-primary flex-1">Confirmar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast">
        <div class="border">
            ¡Acción completada!
        </div>
    </div>`}function on(n,e=null){const o=document.getElementById("sidebar-categories"),t=document.getElementById("mobile-sidebar-categories"),i=document.getElementById("edit-category"),a=document.getElementById("cat-dropdown-menu");e&&(u.categories=e),o&&(o.innerHTML=""),t&&(t.innerHTML=""),i&&(i.innerHTML='<option value="">Sin categoría</option>'),a&&(a.innerHTML='<div class="px-3 py-1.5 text-xs hover:bg-accent cursor-pointer border-b" data-id="">Sin categoría</div>');const r=u.categories.length>0,s=document.getElementById("sidebar-categories-header"),l=document.getElementById("mobile-sidebar-categories-header");s&&s.classList.toggle("hidden",!r),l&&l.classList.toggle("hidden",!r),document.querySelectorAll('.nav-link[data-view="all"], .nav-link-mobile[data-view="all"], .nav-link-mobile-drawer[data-view="all"]').forEach(c=>{c.classList.toggle("active",u.currentView==="all")});const d=(c,v,f)=>{if(!a)return;const g=document.createElement("div");g.className="px-3 py-1.5 text-xs hover:bg-accent cursor-pointer flex items-center gap-2",g.innerHTML=`<div class="w-2 h-2 rounded-full" style="background-color: ${f}"></div> ${v}`,g.onclick=()=>{i&&(i.value=c),p(),a.classList.add("hidden")},a.appendChild(g)},p=()=>{const c=document.getElementById("edit-category").value,v=u.categories.find(f=>f.id===c);document.getElementById("selected-cat-label").innerText=v?v.name:"Sin categoría"};if(a){const c=a.querySelector('[data-id=""]');c&&(c.onclick=()=>{i&&(i.value=""),p(),a.classList.add("hidden")})}u.categories.forEach(c=>{const v=(f=!1)=>{const g=document.createElement("button");g.className=f?"nav-link-mobile-drawer w-full group":"nav-link w-full group",u.currentView===c.id&&g.classList.add("active"),g.onclick=async()=>{if(c.passwordHash){const k=await te("Acceso Restringido",`Ingresa la contraseña para "${c.name}":`);if(!k)return;if(await N.hashPassword(k)!==c.passwordHash){S("Contraseña incorrecta");return}}document.querySelectorAll(".nav-link, .nav-link-mobile-drawer").forEach(k=>k.classList.remove("active")),g.classList.add("active"),n(c.id,c.name),f&&document.getElementById("mobile-sidebar-overlay").classList.add("hidden")};const h=u.settings.theme==="dark"?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)";return g.innerHTML=`
                <div class="flex items-center gap-3">
                    <div class="w-2.5 h-2.5 rounded-full shadow-sm" style="background-color: ${c.color}; border: 1px solid ${h}"></div>
                    <span class="truncate">${c.name}</span>
                </div>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${c.passwordHash?'<i data-lucide="lock" class="w-3 h-3 text-muted-foreground"></i>':""}
                </div>
            `,g};if(o&&o.appendChild(v(!1)),t&&t.appendChild(v(!0)),i){const f=document.createElement("option");f.value=c.id,f.innerText=c.name,i.appendChild(f)}d(c.id,c.name,c.color)}),R()}/**!
 * Sortable 1.15.6
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */function Mt(n,e){var o=Object.keys(n);if(Object.getOwnPropertySymbols){var t=Object.getOwnPropertySymbols(n);e&&(t=t.filter(function(i){return Object.getOwnPropertyDescriptor(n,i).enumerable})),o.push.apply(o,t)}return o}function K(n){for(var e=1;e<arguments.length;e++){var o=arguments[e]!=null?arguments[e]:{};e%2?Mt(Object(o),!0).forEach(function(t){Rn(n,t,o[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(n,Object.getOwnPropertyDescriptors(o)):Mt(Object(o)).forEach(function(t){Object.defineProperty(n,t,Object.getOwnPropertyDescriptor(o,t))})}return n}function et(n){"@babel/helpers - typeof";return typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?et=function(e){return typeof e}:et=function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},et(n)}function Rn(n,e,o){return e in n?Object.defineProperty(n,e,{value:o,enumerable:!0,configurable:!0,writable:!0}):n[e]=o,n}function ne(){return ne=Object.assign||function(n){for(var e=1;e<arguments.length;e++){var o=arguments[e];for(var t in o)Object.prototype.hasOwnProperty.call(o,t)&&(n[t]=o[t])}return n},ne.apply(this,arguments)}function Gn(n,e){if(n==null)return{};var o={},t=Object.keys(n),i,a;for(a=0;a<t.length;a++)i=t[a],!(e.indexOf(i)>=0)&&(o[i]=n[i]);return o}function Xn(n,e){if(n==null)return{};var o=Gn(n,e),t,i;if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(n);for(i=0;i<a.length;i++)t=a[i],!(e.indexOf(t)>=0)&&Object.prototype.propertyIsEnumerable.call(n,t)&&(o[t]=n[t])}return o}var Yn="1.15.6";function Q(n){if(typeof window<"u"&&window.navigator)return!!navigator.userAgent.match(n)}var oe=Q(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i),Xe=Q(/Edge/i),Ht=Q(/firefox/i),He=Q(/safari/i)&&!Q(/chrome/i)&&!Q(/android/i),Tt=Q(/iP(ad|od|hone)/i),an=Q(/chrome/i)&&Q(/android/i),rn={capture:!1,passive:!1};function E(n,e,o){n.addEventListener(e,o,!oe&&rn)}function x(n,e,o){n.removeEventListener(e,o,!oe&&rn)}function at(n,e){if(e){if(e[0]===">"&&(e=e.substring(1)),n)try{if(n.matches)return n.matches(e);if(n.msMatchesSelector)return n.msMatchesSelector(e);if(n.webkitMatchesSelector)return n.webkitMatchesSelector(e)}catch{return!1}return!1}}function sn(n){return n.host&&n!==document&&n.host.nodeType?n.host:n.parentNode}function W(n,e,o,t){if(n){o=o||document;do{if(e!=null&&(e[0]===">"?n.parentNode===o&&at(n,e):at(n,e))||t&&n===o)return n;if(n===o)break}while(n=sn(n))}return null}var jt=/\s+/g;function F(n,e,o){if(n&&e)if(n.classList)n.classList[o?"add":"remove"](e);else{var t=(" "+n.className+" ").replace(jt," ").replace(" "+e+" "," ");n.className=(t+(o?" "+e:"")).replace(jt," ")}}function b(n,e,o){var t=n&&n.style;if(t){if(o===void 0)return document.defaultView&&document.defaultView.getComputedStyle?o=document.defaultView.getComputedStyle(n,""):n.currentStyle&&(o=n.currentStyle),e===void 0?o:o[e];!(e in t)&&e.indexOf("webkit")===-1&&(e="-webkit-"+e),t[e]=o+(typeof o=="string"?"":"px")}}function Ee(n,e){var o="";if(typeof n=="string")o=n;else do{var t=b(n,"transform");t&&t!=="none"&&(o=t+" "+o)}while(!e&&(n=n.parentNode));var i=window.DOMMatrix||window.WebKitCSSMatrix||window.CSSMatrix||window.MSCSSMatrix;return i&&new i(o)}function ln(n,e,o){if(n){var t=n.getElementsByTagName(e),i=0,a=t.length;if(o)for(;i<a;i++)o(t[i],i);return t}return[]}function J(){var n=document.scrollingElement;return n||document.documentElement}function L(n,e,o,t,i){if(!(!n.getBoundingClientRect&&n!==window)){var a,r,s,l,d,p,c;if(n!==window&&n.parentNode&&n!==J()?(a=n.getBoundingClientRect(),r=a.top,s=a.left,l=a.bottom,d=a.right,p=a.height,c=a.width):(r=0,s=0,l=window.innerHeight,d=window.innerWidth,p=window.innerHeight,c=window.innerWidth),(e||o)&&n!==window&&(i=i||n.parentNode,!oe))do if(i&&i.getBoundingClientRect&&(b(i,"transform")!=="none"||o&&b(i,"position")!=="static")){var v=i.getBoundingClientRect();r-=v.top+parseInt(b(i,"border-top-width")),s-=v.left+parseInt(b(i,"border-left-width")),l=r+a.height,d=s+a.width;break}while(i=i.parentNode);if(t&&n!==window){var f=Ee(i||n),g=f&&f.a,h=f&&f.d;f&&(r/=h,s/=g,c/=g,p/=h,l=r+p,d=s+c)}return{top:r,left:s,bottom:l,right:d,width:c,height:p}}}function qt(n,e,o){for(var t=le(n,!0),i=L(n)[e];t;){var a=L(t)[o],r=void 0;if(r=i>=a,!r)return t;if(t===J())break;t=le(t,!1)}return!1}function Se(n,e,o,t){for(var i=0,a=0,r=n.children;a<r.length;){if(r[a].style.display!=="none"&&r[a]!==y.ghost&&(t||r[a]!==y.dragged)&&W(r[a],o.draggable,n,!1)){if(i===e)return r[a];i++}a++}return null}function Dt(n,e){for(var o=n.lastElementChild;o&&(o===y.ghost||b(o,"display")==="none"||e&&!at(o,e));)o=o.previousElementSibling;return o||null}function G(n,e){var o=0;if(!n||!n.parentNode)return-1;for(;n=n.previousElementSibling;)n.nodeName.toUpperCase()!=="TEMPLATE"&&n!==y.clone&&(!e||at(n,e))&&o++;return o}function zt(n){var e=0,o=0,t=J();if(n)do{var i=Ee(n),a=i.a,r=i.d;e+=n.scrollLeft*a,o+=n.scrollTop*r}while(n!==t&&(n=n.parentNode));return[e,o]}function Un(n,e){for(var o in n)if(n.hasOwnProperty(o)){for(var t in e)if(e.hasOwnProperty(t)&&e[t]===n[o][t])return Number(o)}return-1}function le(n,e){if(!n||!n.getBoundingClientRect)return J();var o=n,t=!1;do if(o.clientWidth<o.scrollWidth||o.clientHeight<o.scrollHeight){var i=b(o);if(o.clientWidth<o.scrollWidth&&(i.overflowX=="auto"||i.overflowX=="scroll")||o.clientHeight<o.scrollHeight&&(i.overflowY=="auto"||i.overflowY=="scroll")){if(!o.getBoundingClientRect||o===document.body)return J();if(t||e)return o;t=!0}}while(o=o.parentNode);return J()}function Wn(n,e){if(n&&e)for(var o in e)e.hasOwnProperty(o)&&(n[o]=e[o]);return n}function ft(n,e){return Math.round(n.top)===Math.round(e.top)&&Math.round(n.left)===Math.round(e.left)&&Math.round(n.height)===Math.round(e.height)&&Math.round(n.width)===Math.round(e.width)}var je;function dn(n,e){return function(){if(!je){var o=arguments,t=this;o.length===1?n.call(t,o[0]):n.apply(t,o),je=setTimeout(function(){je=void 0},e)}}}function Vn(){clearTimeout(je),je=void 0}function cn(n,e,o){n.scrollLeft+=e,n.scrollTop+=o}function un(n){var e=window.Polymer,o=window.jQuery||window.Zepto;return e&&e.dom?e.dom(n).cloneNode(!0):o?o(n).clone(!0)[0]:n.cloneNode(!0)}function fn(n,e,o){var t={};return Array.from(n.children).forEach(function(i){var a,r,s,l;if(!(!W(i,e.draggable,n,!1)||i.animated||i===o)){var d=L(i);t.left=Math.min((a=t.left)!==null&&a!==void 0?a:1/0,d.left),t.top=Math.min((r=t.top)!==null&&r!==void 0?r:1/0,d.top),t.right=Math.max((s=t.right)!==null&&s!==void 0?s:-1/0,d.right),t.bottom=Math.max((l=t.bottom)!==null&&l!==void 0?l:-1/0,d.bottom)}}),t.width=t.right-t.left,t.height=t.bottom-t.top,t.x=t.left,t.y=t.top,t}var j="Sortable"+new Date().getTime();function Jn(){var n=[],e;return{captureAnimationState:function(){if(n=[],!!this.options.animation){var t=[].slice.call(this.el.children);t.forEach(function(i){if(!(b(i,"display")==="none"||i===y.ghost)){n.push({target:i,rect:L(i)});var a=K({},n[n.length-1].rect);if(i.thisAnimationDuration){var r=Ee(i,!0);r&&(a.top-=r.f,a.left-=r.e)}i.fromRect=a}})}},addAnimationState:function(t){n.push(t)},removeAnimationState:function(t){n.splice(Un(n,{target:t}),1)},animateAll:function(t){var i=this;if(!this.options.animation){clearTimeout(e),typeof t=="function"&&t();return}var a=!1,r=0;n.forEach(function(s){var l=0,d=s.target,p=d.fromRect,c=L(d),v=d.prevFromRect,f=d.prevToRect,g=s.rect,h=Ee(d,!0);h&&(c.top-=h.f,c.left-=h.e),d.toRect=c,d.thisAnimationDuration&&ft(v,c)&&!ft(p,c)&&(g.top-c.top)/(g.left-c.left)===(p.top-c.top)/(p.left-c.left)&&(l=Zn(g,v,f,i.options)),ft(c,p)||(d.prevFromRect=p,d.prevToRect=c,l||(l=i.options.animation),i.animate(d,g,c,l)),l&&(a=!0,r=Math.max(r,l),clearTimeout(d.animationResetTimer),d.animationResetTimer=setTimeout(function(){d.animationTime=0,d.prevFromRect=null,d.fromRect=null,d.prevToRect=null,d.thisAnimationDuration=null},l),d.thisAnimationDuration=l)}),clearTimeout(e),a?e=setTimeout(function(){typeof t=="function"&&t()},r):typeof t=="function"&&t(),n=[]},animate:function(t,i,a,r){if(r){b(t,"transition",""),b(t,"transform","");var s=Ee(this.el),l=s&&s.a,d=s&&s.d,p=(i.left-a.left)/(l||1),c=(i.top-a.top)/(d||1);t.animatingX=!!p,t.animatingY=!!c,b(t,"transform","translate3d("+p+"px,"+c+"px,0)"),this.forRepaintDummy=Kn(t),b(t,"transition","transform "+r+"ms"+(this.options.easing?" "+this.options.easing:"")),b(t,"transform","translate3d(0,0,0)"),typeof t.animated=="number"&&clearTimeout(t.animated),t.animated=setTimeout(function(){b(t,"transition",""),b(t,"transform",""),t.animated=!1,t.animatingX=!1,t.animatingY=!1},r)}}}}function Kn(n){return n.offsetWidth}function Zn(n,e,o,t){return Math.sqrt(Math.pow(e.top-n.top,2)+Math.pow(e.left-n.left,2))/Math.sqrt(Math.pow(e.top-o.top,2)+Math.pow(e.left-o.left,2))*t.animation}var ve=[],pt={initializeByDefault:!0},Ye={mount:function(e){for(var o in pt)pt.hasOwnProperty(o)&&!(o in e)&&(e[o]=pt[o]);ve.forEach(function(t){if(t.pluginName===e.pluginName)throw"Sortable: Cannot mount plugin ".concat(e.pluginName," more than once")}),ve.push(e)},pluginEvent:function(e,o,t){var i=this;this.eventCanceled=!1,t.cancel=function(){i.eventCanceled=!0};var a=e+"Global";ve.forEach(function(r){o[r.pluginName]&&(o[r.pluginName][a]&&o[r.pluginName][a](K({sortable:o},t)),o.options[r.pluginName]&&o[r.pluginName][e]&&o[r.pluginName][e](K({sortable:o},t)))})},initializePlugins:function(e,o,t,i){ve.forEach(function(s){var l=s.pluginName;if(!(!e.options[l]&&!s.initializeByDefault)){var d=new s(e,o,e.options);d.sortable=e,d.options=e.options,e[l]=d,ne(t,d.defaults)}});for(var a in e.options)if(e.options.hasOwnProperty(a)){var r=this.modifyOption(e,a,e.options[a]);typeof r<"u"&&(e.options[a]=r)}},getEventProperties:function(e,o){var t={};return ve.forEach(function(i){typeof i.eventProperties=="function"&&ne(t,i.eventProperties.call(o[i.pluginName],e))}),t},modifyOption:function(e,o,t){var i;return ve.forEach(function(a){e[a.pluginName]&&a.optionListeners&&typeof a.optionListeners[o]=="function"&&(i=a.optionListeners[o].call(e[a.pluginName],t))}),i}};function Qn(n){var e=n.sortable,o=n.rootEl,t=n.name,i=n.targetEl,a=n.cloneEl,r=n.toEl,s=n.fromEl,l=n.oldIndex,d=n.newIndex,p=n.oldDraggableIndex,c=n.newDraggableIndex,v=n.originalEvent,f=n.putSortable,g=n.extraEventProperties;if(e=e||o&&o[j],!!e){var h,k=e.options,B="on"+t.charAt(0).toUpperCase()+t.substr(1);window.CustomEvent&&!oe&&!Xe?h=new CustomEvent(t,{bubbles:!0,cancelable:!0}):(h=document.createEvent("Event"),h.initEvent(t,!0,!0)),h.to=r||o,h.from=s||o,h.item=i||o,h.clone=a,h.oldIndex=l,h.newIndex=d,h.oldDraggableIndex=p,h.newDraggableIndex=c,h.originalEvent=v,h.pullMode=f?f.lastPutMode:void 0;var O=K(K({},g),Ye.getEventProperties(t,e));for(var Y in O)h[Y]=O[Y];o&&o.dispatchEvent(h),k[B]&&k[B].call(e,h)}}var eo=["evt"],H=function(e,o){var t=arguments.length>2&&arguments[2]!==void 0?arguments[2]:{},i=t.evt,a=Xn(t,eo);Ye.pluginEvent.bind(y)(e,o,K({dragEl:m,parentEl:T,ghostEl:w,rootEl:_,nextEl:ge,lastDownEl:tt,cloneEl:C,cloneHidden:se,dragStarted:Ae,putSortable:A,activeSortable:y.active,originalEvent:i,oldIndex:xe,oldDraggableIndex:qe,newIndex:$,newDraggableIndex:re,hideGhostForTarget:hn,unhideGhostForTarget:vn,cloneNowHidden:function(){se=!0},cloneNowShown:function(){se=!1},dispatchSortableEvent:function(s){M({sortable:o,name:s,originalEvent:i})}},a))};function M(n){Qn(K({putSortable:A,cloneEl:C,targetEl:m,rootEl:_,oldIndex:xe,oldDraggableIndex:qe,newIndex:$,newDraggableIndex:re},n))}var m,T,w,_,ge,tt,C,se,xe,$,qe,re,Ve,A,ye=!1,rt=!1,st=[],pe,U,mt,gt,Ft,$t,Ae,be,ze,Fe=!1,Je=!1,nt,P,ht=[],It=!1,lt=[],ut=typeof document<"u",Ke=Tt,Rt=Xe||oe?"cssFloat":"float",to=ut&&!an&&!Tt&&"draggable"in document.createElement("div"),pn=function(){if(ut){if(oe)return!1;var n=document.createElement("x");return n.style.cssText="pointer-events:auto",n.style.pointerEvents==="auto"}}(),mn=function(e,o){var t=b(e),i=parseInt(t.width)-parseInt(t.paddingLeft)-parseInt(t.paddingRight)-parseInt(t.borderLeftWidth)-parseInt(t.borderRightWidth),a=Se(e,0,o),r=Se(e,1,o),s=a&&b(a),l=r&&b(r),d=s&&parseInt(s.marginLeft)+parseInt(s.marginRight)+L(a).width,p=l&&parseInt(l.marginLeft)+parseInt(l.marginRight)+L(r).width;if(t.display==="flex")return t.flexDirection==="column"||t.flexDirection==="column-reverse"?"vertical":"horizontal";if(t.display==="grid")return t.gridTemplateColumns.split(" ").length<=1?"vertical":"horizontal";if(a&&s.float&&s.float!=="none"){var c=s.float==="left"?"left":"right";return r&&(l.clear==="both"||l.clear===c)?"vertical":"horizontal"}return a&&(s.display==="block"||s.display==="flex"||s.display==="table"||s.display==="grid"||d>=i&&t[Rt]==="none"||r&&t[Rt]==="none"&&d+p>i)?"vertical":"horizontal"},no=function(e,o,t){var i=t?e.left:e.top,a=t?e.right:e.bottom,r=t?e.width:e.height,s=t?o.left:o.top,l=t?o.right:o.bottom,d=t?o.width:o.height;return i===s||a===l||i+r/2===s+d/2},oo=function(e,o){var t;return st.some(function(i){var a=i[j].options.emptyInsertThreshold;if(!(!a||Dt(i))){var r=L(i),s=e>=r.left-a&&e<=r.right+a,l=o>=r.top-a&&o<=r.bottom+a;if(s&&l)return t=i}}),t},gn=function(e){function o(a,r){return function(s,l,d,p){var c=s.options.group.name&&l.options.group.name&&s.options.group.name===l.options.group.name;if(a==null&&(r||c))return!0;if(a==null||a===!1)return!1;if(r&&a==="clone")return a;if(typeof a=="function")return o(a(s,l,d,p),r)(s,l,d,p);var v=(r?s:l).options.group.name;return a===!0||typeof a=="string"&&a===v||a.join&&a.indexOf(v)>-1}}var t={},i=e.group;(!i||et(i)!="object")&&(i={name:i}),t.name=i.name,t.checkPull=o(i.pull,!0),t.checkPut=o(i.put),t.revertClone=i.revertClone,e.group=t},hn=function(){!pn&&w&&b(w,"display","none")},vn=function(){!pn&&w&&b(w,"display","")};ut&&!an&&document.addEventListener("click",function(n){if(rt)return n.preventDefault(),n.stopPropagation&&n.stopPropagation(),n.stopImmediatePropagation&&n.stopImmediatePropagation(),rt=!1,!1},!0);var me=function(e){if(m){e=e.touches?e.touches[0]:e;var o=oo(e.clientX,e.clientY);if(o){var t={};for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i]);t.target=t.rootEl=o,t.preventDefault=void 0,t.stopPropagation=void 0,o[j]._onDragOver(t)}}},io=function(e){m&&m.parentNode[j]._isOutsideThisEl(e.target)};function y(n,e){if(!(n&&n.nodeType&&n.nodeType===1))throw"Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(n));this.el=n,this.options=e=ne({},e),n[j]=this;var o={group:null,sort:!0,disabled:!1,store:null,handle:null,draggable:/^[uo]l$/i.test(n.nodeName)?">li":">*",swapThreshold:1,invertSwap:!1,invertedSwapThreshold:null,removeCloneOnHide:!0,direction:function(){return mn(n,this.options)},ghostClass:"sortable-ghost",chosenClass:"sortable-chosen",dragClass:"sortable-drag",ignore:"a, img",filter:null,preventOnFilter:!0,animation:0,easing:null,setData:function(r,s){r.setData("Text",s.textContent)},dropBubble:!1,dragoverBubble:!1,dataIdAttr:"data-id",delay:0,delayOnTouchOnly:!1,touchStartThreshold:(Number.parseInt?Number:window).parseInt(window.devicePixelRatio,10)||1,forceFallback:!1,fallbackClass:"sortable-fallback",fallbackOnBody:!1,fallbackTolerance:0,fallbackOffset:{x:0,y:0},supportPointer:y.supportPointer!==!1&&"PointerEvent"in window&&(!He||Tt),emptyInsertThreshold:5};Ye.initializePlugins(this,n,o);for(var t in o)!(t in e)&&(e[t]=o[t]);gn(e);for(var i in this)i.charAt(0)==="_"&&typeof this[i]=="function"&&(this[i]=this[i].bind(this));this.nativeDraggable=e.forceFallback?!1:to,this.nativeDraggable&&(this.options.touchStartThreshold=1),e.supportPointer?E(n,"pointerdown",this._onTapStart):(E(n,"mousedown",this._onTapStart),E(n,"touchstart",this._onTapStart)),this.nativeDraggable&&(E(n,"dragover",this),E(n,"dragenter",this)),st.push(this.el),e.store&&e.store.get&&this.sort(e.store.get(this)||[]),ne(this,Jn())}y.prototype={constructor:y,_isOutsideThisEl:function(e){!this.el.contains(e)&&e!==this.el&&(be=null)},_getDirection:function(e,o){return typeof this.options.direction=="function"?this.options.direction.call(this,e,o,m):this.options.direction},_onTapStart:function(e){if(e.cancelable){var o=this,t=this.el,i=this.options,a=i.preventOnFilter,r=e.type,s=e.touches&&e.touches[0]||e.pointerType&&e.pointerType==="touch"&&e,l=(s||e).target,d=e.target.shadowRoot&&(e.path&&e.path[0]||e.composedPath&&e.composedPath()[0])||l,p=i.filter;if(po(t),!m&&!(/mousedown|pointerdown/.test(r)&&e.button!==0||i.disabled)&&!d.isContentEditable&&!(!this.nativeDraggable&&He&&l&&l.tagName.toUpperCase()==="SELECT")&&(l=W(l,i.draggable,t,!1),!(l&&l.animated)&&tt!==l)){if(xe=G(l),qe=G(l,i.draggable),typeof p=="function"){if(p.call(this,e,l,this)){M({sortable:o,rootEl:d,name:"filter",targetEl:l,toEl:t,fromEl:t}),H("filter",o,{evt:e}),a&&e.preventDefault();return}}else if(p&&(p=p.split(",").some(function(c){if(c=W(d,c.trim(),t,!1),c)return M({sortable:o,rootEl:c,name:"filter",targetEl:l,fromEl:t,toEl:t}),H("filter",o,{evt:e}),!0}),p)){a&&e.preventDefault();return}i.handle&&!W(d,i.handle,t,!1)||this._prepareDragStart(e,s,l)}}},_prepareDragStart:function(e,o,t){var i=this,a=i.el,r=i.options,s=a.ownerDocument,l;if(t&&!m&&t.parentNode===a){var d=L(t);if(_=a,m=t,T=m.parentNode,ge=m.nextSibling,tt=t,Ve=r.group,y.dragged=m,pe={target:m,clientX:(o||e).clientX,clientY:(o||e).clientY},Ft=pe.clientX-d.left,$t=pe.clientY-d.top,this._lastX=(o||e).clientX,this._lastY=(o||e).clientY,m.style["will-change"]="all",l=function(){if(H("delayEnded",i,{evt:e}),y.eventCanceled){i._onDrop();return}i._disableDelayedDragEvents(),!Ht&&i.nativeDraggable&&(m.draggable=!0),i._triggerDragStart(e,o),M({sortable:i,name:"choose",originalEvent:e}),F(m,r.chosenClass,!0)},r.ignore.split(",").forEach(function(p){ln(m,p.trim(),vt)}),E(s,"dragover",me),E(s,"mousemove",me),E(s,"touchmove",me),r.supportPointer?(E(s,"pointerup",i._onDrop),!this.nativeDraggable&&E(s,"pointercancel",i._onDrop)):(E(s,"mouseup",i._onDrop),E(s,"touchend",i._onDrop),E(s,"touchcancel",i._onDrop)),Ht&&this.nativeDraggable&&(this.options.touchStartThreshold=4,m.draggable=!0),H("delayStart",this,{evt:e}),r.delay&&(!r.delayOnTouchOnly||o)&&(!this.nativeDraggable||!(Xe||oe))){if(y.eventCanceled){this._onDrop();return}r.supportPointer?(E(s,"pointerup",i._disableDelayedDrag),E(s,"pointercancel",i._disableDelayedDrag)):(E(s,"mouseup",i._disableDelayedDrag),E(s,"touchend",i._disableDelayedDrag),E(s,"touchcancel",i._disableDelayedDrag)),E(s,"mousemove",i._delayedDragTouchMoveHandler),E(s,"touchmove",i._delayedDragTouchMoveHandler),r.supportPointer&&E(s,"pointermove",i._delayedDragTouchMoveHandler),i._dragStartTimer=setTimeout(l,r.delay)}else l()}},_delayedDragTouchMoveHandler:function(e){var o=e.touches?e.touches[0]:e;Math.max(Math.abs(o.clientX-this._lastX),Math.abs(o.clientY-this._lastY))>=Math.floor(this.options.touchStartThreshold/(this.nativeDraggable&&window.devicePixelRatio||1))&&this._disableDelayedDrag()},_disableDelayedDrag:function(){m&&vt(m),clearTimeout(this._dragStartTimer),this._disableDelayedDragEvents()},_disableDelayedDragEvents:function(){var e=this.el.ownerDocument;x(e,"mouseup",this._disableDelayedDrag),x(e,"touchend",this._disableDelayedDrag),x(e,"touchcancel",this._disableDelayedDrag),x(e,"pointerup",this._disableDelayedDrag),x(e,"pointercancel",this._disableDelayedDrag),x(e,"mousemove",this._delayedDragTouchMoveHandler),x(e,"touchmove",this._delayedDragTouchMoveHandler),x(e,"pointermove",this._delayedDragTouchMoveHandler)},_triggerDragStart:function(e,o){o=o||e.pointerType=="touch"&&e,!this.nativeDraggable||o?this.options.supportPointer?E(document,"pointermove",this._onTouchMove):o?E(document,"touchmove",this._onTouchMove):E(document,"mousemove",this._onTouchMove):(E(m,"dragend",this),E(_,"dragstart",this._onDragStart));try{document.selection?ot(function(){document.selection.empty()}):window.getSelection().removeAllRanges()}catch{}},_dragStarted:function(e,o){if(ye=!1,_&&m){H("dragStarted",this,{evt:o}),this.nativeDraggable&&E(document,"dragover",io);var t=this.options;!e&&F(m,t.dragClass,!1),F(m,t.ghostClass,!0),y.active=this,e&&this._appendGhost(),M({sortable:this,name:"start",originalEvent:o})}else this._nulling()},_emulateDragOver:function(){if(U){this._lastX=U.clientX,this._lastY=U.clientY,hn();for(var e=document.elementFromPoint(U.clientX,U.clientY),o=e;e&&e.shadowRoot&&(e=e.shadowRoot.elementFromPoint(U.clientX,U.clientY),e!==o);)o=e;if(m.parentNode[j]._isOutsideThisEl(e),o)do{if(o[j]){var t=void 0;if(t=o[j]._onDragOver({clientX:U.clientX,clientY:U.clientY,target:e,rootEl:o}),t&&!this.options.dragoverBubble)break}e=o}while(o=sn(o));vn()}},_onTouchMove:function(e){if(pe){var o=this.options,t=o.fallbackTolerance,i=o.fallbackOffset,a=e.touches?e.touches[0]:e,r=w&&Ee(w,!0),s=w&&r&&r.a,l=w&&r&&r.d,d=Ke&&P&&zt(P),p=(a.clientX-pe.clientX+i.x)/(s||1)+(d?d[0]-ht[0]:0)/(s||1),c=(a.clientY-pe.clientY+i.y)/(l||1)+(d?d[1]-ht[1]:0)/(l||1);if(!y.active&&!ye){if(t&&Math.max(Math.abs(a.clientX-this._lastX),Math.abs(a.clientY-this._lastY))<t)return;this._onDragStart(e,!0)}if(w){r?(r.e+=p-(mt||0),r.f+=c-(gt||0)):r={a:1,b:0,c:0,d:1,e:p,f:c};var v="matrix(".concat(r.a,",").concat(r.b,",").concat(r.c,",").concat(r.d,",").concat(r.e,",").concat(r.f,")");b(w,"webkitTransform",v),b(w,"mozTransform",v),b(w,"msTransform",v),b(w,"transform",v),mt=p,gt=c,U=a}e.cancelable&&e.preventDefault()}},_appendGhost:function(){if(!w){var e=this.options.fallbackOnBody?document.body:_,o=L(m,!0,Ke,!0,e),t=this.options;if(Ke){for(P=e;b(P,"position")==="static"&&b(P,"transform")==="none"&&P!==document;)P=P.parentNode;P!==document.body&&P!==document.documentElement?(P===document&&(P=J()),o.top+=P.scrollTop,o.left+=P.scrollLeft):P=J(),ht=zt(P)}w=m.cloneNode(!0),F(w,t.ghostClass,!1),F(w,t.fallbackClass,!0),F(w,t.dragClass,!0),b(w,"transition",""),b(w,"transform",""),b(w,"box-sizing","border-box"),b(w,"margin",0),b(w,"top",o.top),b(w,"left",o.left),b(w,"width",o.width),b(w,"height",o.height),b(w,"opacity","0.8"),b(w,"position",Ke?"absolute":"fixed"),b(w,"zIndex","100000"),b(w,"pointerEvents","none"),y.ghost=w,e.appendChild(w),b(w,"transform-origin",Ft/parseInt(w.style.width)*100+"% "+$t/parseInt(w.style.height)*100+"%")}},_onDragStart:function(e,o){var t=this,i=e.dataTransfer,a=t.options;if(H("dragStart",this,{evt:e}),y.eventCanceled){this._onDrop();return}H("setupClone",this),y.eventCanceled||(C=un(m),C.removeAttribute("id"),C.draggable=!1,C.style["will-change"]="",this._hideClone(),F(C,this.options.chosenClass,!1),y.clone=C),t.cloneId=ot(function(){H("clone",t),!y.eventCanceled&&(t.options.removeCloneOnHide||_.insertBefore(C,m),t._hideClone(),M({sortable:t,name:"clone"}))}),!o&&F(m,a.dragClass,!0),o?(rt=!0,t._loopId=setInterval(t._emulateDragOver,50)):(x(document,"mouseup",t._onDrop),x(document,"touchend",t._onDrop),x(document,"touchcancel",t._onDrop),i&&(i.effectAllowed="move",a.setData&&a.setData.call(t,i,m)),E(document,"drop",t),b(m,"transform","translateZ(0)")),ye=!0,t._dragStartId=ot(t._dragStarted.bind(t,o,e)),E(document,"selectstart",t),Ae=!0,window.getSelection().removeAllRanges(),He&&b(document.body,"user-select","none")},_onDragOver:function(e){var o=this.el,t=e.target,i,a,r,s=this.options,l=s.group,d=y.active,p=Ve===l,c=s.sort,v=A||d,f,g=this,h=!1;if(It)return;function k(Te,En){H(Te,g,K({evt:e,isOwner:p,axis:f?"vertical":"horizontal",revert:r,dragRect:i,targetRect:a,canSort:c,fromSortable:v,target:t,completed:O,onMove:function(Nt,Sn){return Ze(_,o,m,i,Nt,L(Nt),e,Sn)},changed:Y},En))}function B(){k("dragOverAnimationCapture"),g.captureAnimationState(),g!==v&&v.captureAnimationState()}function O(Te){return k("dragOverCompleted",{insertion:Te}),Te&&(p?d._hideClone():d._showClone(g),g!==v&&(F(m,A?A.options.ghostClass:d.options.ghostClass,!1),F(m,s.ghostClass,!0)),A!==g&&g!==y.active?A=g:g===y.active&&A&&(A=null),v===g&&(g._ignoreWhileAnimating=t),g.animateAll(function(){k("dragOverAnimationComplete"),g._ignoreWhileAnimating=null}),g!==v&&(v.animateAll(),v._ignoreWhileAnimating=null)),(t===m&&!m.animated||t===o&&!t.animated)&&(be=null),!s.dragoverBubble&&!e.rootEl&&t!==document&&(m.parentNode[j]._isOutsideThisEl(e.target),!Te&&me(e)),!s.dragoverBubble&&e.stopPropagation&&e.stopPropagation(),h=!0}function Y(){$=G(m),re=G(m,s.draggable),M({sortable:g,name:"change",toEl:o,newIndex:$,newDraggableIndex:re,originalEvent:e})}if(e.preventDefault!==void 0&&e.cancelable&&e.preventDefault(),t=W(t,s.draggable,o,!0),k("dragOver"),y.eventCanceled)return h;if(m.contains(e.target)||t.animated&&t.animatingX&&t.animatingY||g._ignoreWhileAnimating===t)return O(!1);if(rt=!1,d&&!s.disabled&&(p?c||(r=T!==_):A===this||(this.lastPutMode=Ve.checkPull(this,d,m,e))&&l.checkPut(this,d,m,e))){if(f=this._getDirection(e,t)==="vertical",i=L(m),k("dragOverValid"),y.eventCanceled)return h;if(r)return T=_,B(),this._hideClone(),k("revert"),y.eventCanceled||(ge?_.insertBefore(m,ge):_.appendChild(m)),O(!0);var q=Dt(o,s.draggable);if(!q||lo(e,f,this)&&!q.animated){if(q===m)return O(!1);if(q&&o===e.target&&(t=q),t&&(a=L(t)),Ze(_,o,m,i,t,a,e,!!t)!==!1)return B(),q&&q.nextSibling?o.insertBefore(m,q.nextSibling):o.appendChild(m),T=o,Y(),O(!0)}else if(q&&so(e,f,this)){var de=Se(o,0,s,!0);if(de===m)return O(!1);if(t=de,a=L(t),Ze(_,o,m,i,t,a,e,!1)!==!1)return B(),o.insertBefore(m,de),T=o,Y(),O(!0)}else if(t.parentNode===o){a=L(t);var V=0,ce,Ie=m.parentNode!==o,z=!no(m.animated&&m.toRect||i,t.animated&&t.toRect||a,f),ke=f?"top":"left",ie=qt(t,"top","top")||qt(m,"top","top"),_e=ie?ie.scrollTop:void 0;be!==t&&(ce=a[ke],Fe=!1,Je=!z&&s.invertSwap||Ie),V=co(e,t,a,f,z?1:s.swapThreshold,s.invertedSwapThreshold==null?s.swapThreshold:s.invertedSwapThreshold,Je,be===t);var Z;if(V!==0){var ue=G(m);do ue-=V,Z=T.children[ue];while(Z&&(b(Z,"display")==="none"||Z===w))}if(V===0||Z===t)return O(!1);be=t,ze=V;var Ce=t.nextElementSibling,ae=!1;ae=V===1;var Ue=Ze(_,o,m,i,t,a,e,ae);if(Ue!==!1)return(Ue===1||Ue===-1)&&(ae=Ue===1),It=!0,setTimeout(ro,30),B(),ae&&!Ce?o.appendChild(m):t.parentNode.insertBefore(m,ae?Ce:t),ie&&cn(ie,0,_e-ie.scrollTop),T=m.parentNode,ce!==void 0&&!Je&&(nt=Math.abs(ce-L(t)[ke])),Y(),O(!0)}if(o.contains(m))return O(!1)}return!1},_ignoreWhileAnimating:null,_offMoveEvents:function(){x(document,"mousemove",this._onTouchMove),x(document,"touchmove",this._onTouchMove),x(document,"pointermove",this._onTouchMove),x(document,"dragover",me),x(document,"mousemove",me),x(document,"touchmove",me)},_offUpEvents:function(){var e=this.el.ownerDocument;x(e,"mouseup",this._onDrop),x(e,"touchend",this._onDrop),x(e,"pointerup",this._onDrop),x(e,"pointercancel",this._onDrop),x(e,"touchcancel",this._onDrop),x(document,"selectstart",this)},_onDrop:function(e){var o=this.el,t=this.options;if($=G(m),re=G(m,t.draggable),H("drop",this,{evt:e}),T=m&&m.parentNode,$=G(m),re=G(m,t.draggable),y.eventCanceled){this._nulling();return}ye=!1,Je=!1,Fe=!1,clearInterval(this._loopId),clearTimeout(this._dragStartTimer),kt(this.cloneId),kt(this._dragStartId),this.nativeDraggable&&(x(document,"drop",this),x(o,"dragstart",this._onDragStart)),this._offMoveEvents(),this._offUpEvents(),He&&b(document.body,"user-select",""),b(m,"transform",""),e&&(Ae&&(e.cancelable&&e.preventDefault(),!t.dropBubble&&e.stopPropagation()),w&&w.parentNode&&w.parentNode.removeChild(w),(_===T||A&&A.lastPutMode!=="clone")&&C&&C.parentNode&&C.parentNode.removeChild(C),m&&(this.nativeDraggable&&x(m,"dragend",this),vt(m),m.style["will-change"]="",Ae&&!ye&&F(m,A?A.options.ghostClass:this.options.ghostClass,!1),F(m,this.options.chosenClass,!1),M({sortable:this,name:"unchoose",toEl:T,newIndex:null,newDraggableIndex:null,originalEvent:e}),_!==T?($>=0&&(M({rootEl:T,name:"add",toEl:T,fromEl:_,originalEvent:e}),M({sortable:this,name:"remove",toEl:T,originalEvent:e}),M({rootEl:T,name:"sort",toEl:T,fromEl:_,originalEvent:e}),M({sortable:this,name:"sort",toEl:T,originalEvent:e})),A&&A.save()):$!==xe&&$>=0&&(M({sortable:this,name:"update",toEl:T,originalEvent:e}),M({sortable:this,name:"sort",toEl:T,originalEvent:e})),y.active&&(($==null||$===-1)&&($=xe,re=qe),M({sortable:this,name:"end",toEl:T,originalEvent:e}),this.save()))),this._nulling()},_nulling:function(){H("nulling",this),_=m=T=w=ge=C=tt=se=pe=U=Ae=$=re=xe=qe=be=ze=A=Ve=y.dragged=y.ghost=y.clone=y.active=null,lt.forEach(function(e){e.checked=!0}),lt.length=mt=gt=0},handleEvent:function(e){switch(e.type){case"drop":case"dragend":this._onDrop(e);break;case"dragenter":case"dragover":m&&(this._onDragOver(e),ao(e));break;case"selectstart":e.preventDefault();break}},toArray:function(){for(var e=[],o,t=this.el.children,i=0,a=t.length,r=this.options;i<a;i++)o=t[i],W(o,r.draggable,this.el,!1)&&e.push(o.getAttribute(r.dataIdAttr)||fo(o));return e},sort:function(e,o){var t={},i=this.el;this.toArray().forEach(function(a,r){var s=i.children[r];W(s,this.options.draggable,i,!1)&&(t[a]=s)},this),o&&this.captureAnimationState(),e.forEach(function(a){t[a]&&(i.removeChild(t[a]),i.appendChild(t[a]))}),o&&this.animateAll()},save:function(){var e=this.options.store;e&&e.set&&e.set(this)},closest:function(e,o){return W(e,o||this.options.draggable,this.el,!1)},option:function(e,o){var t=this.options;if(o===void 0)return t[e];var i=Ye.modifyOption(this,e,o);typeof i<"u"?t[e]=i:t[e]=o,e==="group"&&gn(t)},destroy:function(){H("destroy",this);var e=this.el;e[j]=null,x(e,"mousedown",this._onTapStart),x(e,"touchstart",this._onTapStart),x(e,"pointerdown",this._onTapStart),this.nativeDraggable&&(x(e,"dragover",this),x(e,"dragenter",this)),Array.prototype.forEach.call(e.querySelectorAll("[draggable]"),function(o){o.removeAttribute("draggable")}),this._onDrop(),this._disableDelayedDragEvents(),st.splice(st.indexOf(this.el),1),this.el=e=null},_hideClone:function(){if(!se){if(H("hideClone",this),y.eventCanceled)return;b(C,"display","none"),this.options.removeCloneOnHide&&C.parentNode&&C.parentNode.removeChild(C),se=!0}},_showClone:function(e){if(e.lastPutMode!=="clone"){this._hideClone();return}if(se){if(H("showClone",this),y.eventCanceled)return;m.parentNode==_&&!this.options.group.revertClone?_.insertBefore(C,m):ge?_.insertBefore(C,ge):_.appendChild(C),this.options.group.revertClone&&this.animate(m,C),b(C,"display",""),se=!1}}};function ao(n){n.dataTransfer&&(n.dataTransfer.dropEffect="move"),n.cancelable&&n.preventDefault()}function Ze(n,e,o,t,i,a,r,s){var l,d=n[j],p=d.options.onMove,c;return window.CustomEvent&&!oe&&!Xe?l=new CustomEvent("move",{bubbles:!0,cancelable:!0}):(l=document.createEvent("Event"),l.initEvent("move",!0,!0)),l.to=e,l.from=n,l.dragged=o,l.draggedRect=t,l.related=i||e,l.relatedRect=a||L(e),l.willInsertAfter=s,l.originalEvent=r,n.dispatchEvent(l),p&&(c=p.call(d,l,r)),c}function vt(n){n.draggable=!1}function ro(){It=!1}function so(n,e,o){var t=L(Se(o.el,0,o.options,!0)),i=fn(o.el,o.options,w),a=10;return e?n.clientX<i.left-a||n.clientY<t.top&&n.clientX<t.right:n.clientY<i.top-a||n.clientY<t.bottom&&n.clientX<t.left}function lo(n,e,o){var t=L(Dt(o.el,o.options.draggable)),i=fn(o.el,o.options,w),a=10;return e?n.clientX>i.right+a||n.clientY>t.bottom&&n.clientX>t.left:n.clientY>i.bottom+a||n.clientX>t.right&&n.clientY>t.top}function co(n,e,o,t,i,a,r,s){var l=t?n.clientY:n.clientX,d=t?o.height:o.width,p=t?o.top:o.left,c=t?o.bottom:o.right,v=!1;if(!r){if(s&&nt<d*i){if(!Fe&&(ze===1?l>p+d*a/2:l<c-d*a/2)&&(Fe=!0),Fe)v=!0;else if(ze===1?l<p+nt:l>c-nt)return-ze}else if(l>p+d*(1-i)/2&&l<c-d*(1-i)/2)return uo(e)}return v=v||r,v&&(l<p+d*a/2||l>c-d*a/2)?l>p+d/2?1:-1:0}function uo(n){return G(m)<G(n)?1:-1}function fo(n){for(var e=n.tagName+n.className+n.src+n.href+n.textContent,o=e.length,t=0;o--;)t+=e.charCodeAt(o);return t.toString(36)}function po(n){lt.length=0;for(var e=n.getElementsByTagName("input"),o=e.length;o--;){var t=e[o];t.checked&&lt.push(t)}}function ot(n){return setTimeout(n,0)}function kt(n){return clearTimeout(n)}ut&&E(document,"touchmove",function(n){(y.active||ye)&&n.cancelable&&n.preventDefault()});y.utils={on:E,off:x,css:b,find:ln,is:function(e,o){return!!W(e,o,e,!1)},extend:Wn,throttle:dn,closest:W,toggleClass:F,clone:un,index:G,nextTick:ot,cancelNextTick:kt,detectDirection:mn,getChild:Se,expando:j};y.get=function(n){return n[j]};y.mount=function(){for(var n=arguments.length,e=new Array(n),o=0;o<n;o++)e[o]=arguments[o];e[0].constructor===Array&&(e=e[0]),e.forEach(function(t){if(!t.prototype||!t.prototype.constructor)throw"Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(t));t.utils&&(y.utils=K(K({},y.utils),t.utils)),Ye.mount(t)})};y.create=function(n,e){return new y(n,e)};y.version=Yn;var D=[],Ne,_t,Ct=!1,bt,yt,dt,Pe;function mo(){function n(){this.defaults={scroll:!0,forceAutoScrollFallback:!1,scrollSensitivity:30,scrollSpeed:10,bubbleScroll:!0};for(var e in this)e.charAt(0)==="_"&&typeof this[e]=="function"&&(this[e]=this[e].bind(this))}return n.prototype={dragStarted:function(o){var t=o.originalEvent;this.sortable.nativeDraggable?E(document,"dragover",this._handleAutoScroll):this.options.supportPointer?E(document,"pointermove",this._handleFallbackAutoScroll):t.touches?E(document,"touchmove",this._handleFallbackAutoScroll):E(document,"mousemove",this._handleFallbackAutoScroll)},dragOverCompleted:function(o){var t=o.originalEvent;!this.options.dragOverBubble&&!t.rootEl&&this._handleAutoScroll(t)},drop:function(){this.sortable.nativeDraggable?x(document,"dragover",this._handleAutoScroll):(x(document,"pointermove",this._handleFallbackAutoScroll),x(document,"touchmove",this._handleFallbackAutoScroll),x(document,"mousemove",this._handleFallbackAutoScroll)),Gt(),it(),Vn()},nulling:function(){dt=_t=Ne=Ct=Pe=bt=yt=null,D.length=0},_handleFallbackAutoScroll:function(o){this._handleAutoScroll(o,!0)},_handleAutoScroll:function(o,t){var i=this,a=(o.touches?o.touches[0]:o).clientX,r=(o.touches?o.touches[0]:o).clientY,s=document.elementFromPoint(a,r);if(dt=o,t||this.options.forceAutoScrollFallback||Xe||oe||He){wt(o,this.options,s,t);var l=le(s,!0);Ct&&(!Pe||a!==bt||r!==yt)&&(Pe&&Gt(),Pe=setInterval(function(){var d=le(document.elementFromPoint(a,r),!0);d!==l&&(l=d,it()),wt(o,i.options,d,t)},10),bt=a,yt=r)}else{if(!this.options.bubbleScroll||le(s,!0)===J()){it();return}wt(o,this.options,le(s,!1),!1)}}},ne(n,{pluginName:"scroll",initializeByDefault:!0})}function it(){D.forEach(function(n){clearInterval(n.pid)}),D=[]}function Gt(){clearInterval(Pe)}var wt=dn(function(n,e,o,t){if(e.scroll){var i=(n.touches?n.touches[0]:n).clientX,a=(n.touches?n.touches[0]:n).clientY,r=e.scrollSensitivity,s=e.scrollSpeed,l=J(),d=!1,p;_t!==o&&(_t=o,it(),Ne=e.scroll,p=e.scrollFn,Ne===!0&&(Ne=le(o,!0)));var c=0,v=Ne;do{var f=v,g=L(f),h=g.top,k=g.bottom,B=g.left,O=g.right,Y=g.width,q=g.height,de=void 0,V=void 0,ce=f.scrollWidth,Ie=f.scrollHeight,z=b(f),ke=f.scrollLeft,ie=f.scrollTop;f===l?(de=Y<ce&&(z.overflowX==="auto"||z.overflowX==="scroll"||z.overflowX==="visible"),V=q<Ie&&(z.overflowY==="auto"||z.overflowY==="scroll"||z.overflowY==="visible")):(de=Y<ce&&(z.overflowX==="auto"||z.overflowX==="scroll"),V=q<Ie&&(z.overflowY==="auto"||z.overflowY==="scroll"));var _e=de&&(Math.abs(O-i)<=r&&ke+Y<ce)-(Math.abs(B-i)<=r&&!!ke),Z=V&&(Math.abs(k-a)<=r&&ie+q<Ie)-(Math.abs(h-a)<=r&&!!ie);if(!D[c])for(var ue=0;ue<=c;ue++)D[ue]||(D[ue]={});(D[c].vx!=_e||D[c].vy!=Z||D[c].el!==f)&&(D[c].el=f,D[c].vx=_e,D[c].vy=Z,clearInterval(D[c].pid),(_e!=0||Z!=0)&&(d=!0,D[c].pid=setInterval((function(){t&&this.layer===0&&y.active._onTouchMove(dt);var Ce=D[this.layer].vy?D[this.layer].vy*s:0,ae=D[this.layer].vx?D[this.layer].vx*s:0;typeof p=="function"&&p.call(y.dragged.parentNode[j],ae,Ce,n,dt,D[this.layer].el)!=="continue"||cn(D[this.layer].el,ae,Ce)}).bind({layer:c}),24))),c++}while(e.bubbleScroll&&v!==l&&(v=le(v,!1)));Ct=d}},30),bn=function(e){var o=e.originalEvent,t=e.putSortable,i=e.dragEl,a=e.activeSortable,r=e.dispatchSortableEvent,s=e.hideGhostForTarget,l=e.unhideGhostForTarget;if(o){var d=t||a;s();var p=o.changedTouches&&o.changedTouches.length?o.changedTouches[0]:o,c=document.elementFromPoint(p.clientX,p.clientY);l(),d&&!d.el.contains(c)&&(r("spill"),this.onSpill({dragEl:i,putSortable:t}))}};function Lt(){}Lt.prototype={startIndex:null,dragStart:function(e){var o=e.oldDraggableIndex;this.startIndex=o},onSpill:function(e){var o=e.dragEl,t=e.putSortable;this.sortable.captureAnimationState(),t&&t.captureAnimationState();var i=Se(this.sortable.el,this.startIndex,this.options);i?this.sortable.el.insertBefore(o,i):this.sortable.el.appendChild(o),this.sortable.animateAll(),t&&t.animateAll()},drop:bn};ne(Lt,{pluginName:"revertOnSpill"});function Bt(){}Bt.prototype={onSpill:function(e){var o=e.dragEl,t=e.putSortable,i=t||this.sortable;i.captureAnimationState(),o.parentNode&&o.parentNode.removeChild(o),i.animateAll()},drop:bn};ne(Bt,{pluginName:"removeOnSpill"});y.mount(new mo);y.mount(Bt,Lt);function ct(n){const e=document.getElementById("notes-grid");if(!e)return;e.innerHTML="";const o=u.currentView==="all"?u.notes.filter(r=>{const s=u.categories.find(l=>l.id===r.categoryId);return!s||!s.passwordHash}):u.notes.filter(r=>r.categoryId===u.currentView),t=o.filter(r=>r.pinned),i=o.filter(r=>!r.pinned),a=r=>{const s=document.createElement("div");s.className="note-card note-animate-in relative group",s.dataset.id=r.id;const l=Re.find(v=>v.id===r.themeId)||Re[0],d=u.settings.theme==="dark"?l.dark:l.light;r.themeId!=="default"&&(s.style.backgroundColor=d,s.style.borderColor=u.settings.theme==="dark"?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.05)");const p=u.categories.find(v=>v.id===r.categoryId),c=u.unlockedNotes.has(r.id);return s.innerHTML=`
            <div class="note-card-content">
                <div class="flex items-start justify-between mb-3">
                    <h3 class="font-bold text-sm line-clamp-2 leading-tight">${r.title}</h3>
                    <div class="flex gap-1.5 opacity-60">
                        ${r.pinned?'<i data-lucide="pin" class="w-3.5 h-3.5 fill-current"></i>':""}
                        ${r.passwordHash?`<i data-lucide="${c?"unlock":"lock"}" class="w-3.5 h-3.5 lock-indicator cursor-pointer" data-id="${r.id}"></i>`:""}
                    </div>
                </div>
                <div class="text-[13px] opacity-70 line-clamp-5 mb-6 leading-relaxed flex-1">
                    ${r.passwordHash&&!c?'<div class="flex items-center gap-2 py-4 italic opacity-50"><i data-lucide="shield-alert" class="w-4 h-4"></i> Contenido protegido</div>':r.content}
                </div>
                <div class="flex items-center justify-between mt-auto pt-3 border-t">
                    <div class="flex items-center gap-2">
                         ${p?`<span class="text-[10px] px-2 py-0.5 rounded bg-muted font-medium text-muted-foreground">${p.name}</span>`:""}
                    </div>
                    <button class="delete-note-btn p-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors md:opacity-0 md:group-hover:opacity-100 text-muted-foreground" data-id="${r.id}" title="Eliminar">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
        `,s.onclick=async v=>{if(!v.target.closest(".delete-note-btn")){if(r.passwordHash&&!u.unlockedNotes.has(r.id)){try{const f=await te("Nota Protegida","Ingresa la contraseña para ver esta nota:");if(!f)return;if(await N.hashPassword(f)!==r.passwordHash){S("❌ Contraseña incorrecta");return}u.unlockedNotes.add(r.id),n(r),setTimeout(()=>ct(n),300)}catch(f){console.error("Error unlocking note:",f),S("❌ Error al desbloquear")}return}n(r)}},s};if(t.length>0){const r=document.createElement("h3");if(r.className="text-xs font-bold text-muted-foreground uppercase tracking-wider col-span-full mb-2 mt-2 flex items-center gap-2",r.innerHTML='<i data-lucide="pin" class="w-3 h-3"></i> Destacadas',e.appendChild(r),t.forEach(s=>e.appendChild(a(s))),i.length>0){const s=document.createElement("div");s.className="col-span-full h-px bg-border my-4",e.appendChild(s)}}if(i.length>0){if(t.length>0){const r=document.createElement("h3");r.className="text-xs font-bold text-muted-foreground uppercase tracking-wider col-span-full mb-2 mt-2",r.innerText="Notas",e.appendChild(r)}i.forEach(r=>e.appendChild(a(r)))}o.length===0&&(e.innerHTML=`<div class="col-span-full text-center py-20 text-muted-foreground opacity-50">
            <i data-lucide="ghost" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
            <p>No hay notas aquí</p>
        </div>`),R(),e.querySelectorAll(".delete-note-btn").forEach(r=>{r.onclick=async s=>{s.stopPropagation();const l=r.dataset.id,d=u.notes.find(p=>p.id===l);if(d!=null&&d.passwordHash&&!u.unlockedNotes.has(d.id)){const p=await te("Eliminar Nota Protegida","Ingresa la contraseña para autorizar la eliminación:");if(!p)return;if(await N.hashPassword(p)!==d.passwordHash)return S("❌ Contraseña incorrecta")}confirm("¿Eliminar esta nota?")&&(u.notes=u.notes.filter(p=>p.id!==l),await X(),ct(n),window.triggerAutoSync&&window.triggerAutoSync())}}),go()}function go(n){const e=document.getElementById("notes-grid");e&&(e.sortable&&e.sortable.destroy(),e.sortable=y.create(e,{animation:250,ghostClass:"opacity-50",onEnd:async()=>{const o=[];e.querySelectorAll(".note-card").forEach(a=>{const r=u.notes.find(s=>s.id===a.dataset.id);r&&o.push(r)});const t=new Set(o.map(a=>a.id)),i=u.notes.filter(a=>!t.has(a.id));u.notes=[...o,...i],await X()}}))}const ho="974464877836-721dprai6taijtuufmrkh438q68e97sp.apps.googleusercontent.com";let De=null;async function Xt(){console.log("Iniciando aplicación modular..."),localStorage.removeItem("cn_pass_plain_v3"),vo(),In(),wn(),Nn(ee),Fn(),bo(),await Dn(ee),yo(),wo(),Eo(),So(),xo(),ko(),R(),console.log("Aplicación lista.")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Xt):Xt();function vo(){const n=document.getElementById("root");if(!n)return console.error("No se encontró el elemento #root");n.innerHTML=`
        ${Tn()}
        ${Bn()}
        ${An()}
        ${Mn()}
        ${zn()}
        ${$n()}
    `,console.log("Estructura inyectada.")}function ee(){ct(Oe),on(At,u.categories),yn(),R()}function At(n,e){u.currentView=n,yn(e),ct(Oe)}function yn(n=null){const e=document.getElementById("view-title"),o=document.getElementById("view-desc");if(!e||!o)return;const t=u.categories.find(a=>a.id===u.currentView),i=n||(t?t.name:"Todas las notas");e.innerText=i,o.innerText=u.currentView==="all"?"Organiza tus pensamientos y protege tu privacidad.":`Mostrando notas en "${i}".`}function wn(){const n=u.settings.theme==="dark";document.documentElement.classList.toggle("dark",n),document.documentElement.classList.toggle("light",!n)}function I(n,e){const o=document.getElementById(n);o&&(o.onclick=e)}function bo(){I("add-note-btn",()=>Oe()),I("mobile-add-btn",()=>Oe()),I("sync-btn",$e),I("mobile-sync-btn",$e),I("mobile-sync-btn-bottom",$e),I("settings-trigger",Vt),I("mobile-settings-btn",()=>{we(),Vt()}),I("sidebar-toggle-btn",()=>{const t=document.querySelector("aside");t.classList.toggle("collapsed");const i=document.getElementById("sidebar-toggle-btn").querySelector("i"),a=t.classList.contains("collapsed");i.setAttribute("data-lucide",a?"panel-left-open":"panel-left-close"),R()}),I("mobile-force-reload-btn",nn),document.body.addEventListener("click",t=>{t.target.closest("#logout-btn, #mobile-logout-btn")&&Wt(),t.target.id==="mobile-sidebar-overlay"&&we()});const n=async()=>{u.settings.drivePath=document.getElementById("config-drive-path").value,u.settings.algo=document.getElementById("config-algo").value,await X(),S("✅ Configuración guardada"),Yt()};I("save-sync-config",n),I("save-security-config",n),I("connect-drive-btn",xn),I("theme-light",()=>Jt("light")),I("theme-dark",()=>Jt("dark"));const e=document.querySelectorAll(".nav-link[data-view], .nav-link-mobile[data-view], .nav-link-mobile-drawer[data-view]");e.forEach(t=>{t.onclick=()=>{const i=t.dataset.view;e.forEach(a=>a.classList.toggle("active",a.dataset.view===i)),document.querySelectorAll("#sidebar-categories .nav-link").forEach(a=>a.classList.remove("active")),document.querySelectorAll(".nav-link-mobile-drawer").forEach(a=>{a.classList.remove("active");const r=a.querySelector("i");r&&r.classList.remove("text-primary");const s=a.querySelector("span");s&&s.classList.remove("text-primary")}),At(i,i==="all"?"Todas las notas":""),we()}}),document.querySelectorAll(".nav-link-mobile-drawer").forEach(t=>{t.onclick=i=>{i.preventDefault();const a=t.dataset.category;u.currentView=a,document.querySelectorAll(".nav-link[data-view], .nav-link-mobile[data-view]").forEach(r=>r.classList.remove("active")),document.querySelectorAll("#sidebar-categories .nav-link").forEach(r=>r.classList.remove("active")),document.querySelectorAll(".nav-link-mobile-drawer").forEach(r=>{const s=r.dataset.category===a;r.classList.toggle("active",s);const l=r.querySelector("i");l&&l.classList.toggle("text-primary",s);const d=r.querySelector("span");d&&d.classList.toggle("text-primary",s)}),we(),ee()}}),I("sidebar-manage-cats",Ut),I("mobile-manage-cats",()=>{we(),Ut()}),I("add-cat-btn",Io);const o=t=>{const i=t.target.closest("#settings-modal, #categories-modal, #editor-modal");i&&i.classList.add("hidden")};document.querySelectorAll(".close-modal, .close-settings, .close-categories").forEach(t=>{t.onclick=o}),document.body.addEventListener("click",t=>{const i=t.target.closest(".toggle-pass");if(!i)return;const a=document.getElementById(i.dataset.target);if(!a)return;const r=a.type==="password";a.type=r?"text":"password",i.innerHTML=`<i data-lucide="${r?"eye-off":"eye"}" class="w-4 h-4"></i>`,R()}),document.body.addEventListener("keydown",t=>{if(t.key==="Enter"){const i=document.getElementById("auth-shield");if(i&&!i.classList.contains("hidden")){const a=document.getElementById("master-password"),r=document.getElementById("confirm-password");(document.activeElement===a||document.activeElement===r)&&Ot(ee)}}}),I("auth-submit",()=>Ot(ee)),I("factory-reset",()=>{const t=document.getElementById("factory-reset-confirm");(t==null?void 0:t.value.toLowerCase())==="confirmar"&&(localStorage.clear(),sessionStorage.clear(),location.reload())}),window.triggerAutoSync=Yt,window.handleLogout=Wt,window.openEditor=Oe}function yo(){const n=t=>{const i=t.target.value.toLowerCase();document.querySelectorAll(".note-card").forEach(r=>{const s=u.notes.find(d=>d.id===r.dataset.id);if(!s)return;const l=s.title.toLowerCase().includes(i)||s.content.toLowerCase().includes(i);r.classList.toggle("hidden",!l)})},e=document.getElementById("search-input"),o=document.getElementById("mobile-search-input-top");e&&(e.oninput=n),o&&(o.oninput=n)}function wo(){const n=document.getElementById("mobile-sidebar-overlay"),e=()=>{n==null||n.classList.remove("hidden"),on(At,u.categories)};I("mobile-sidebar-trigger",e),I("mobile-sidebar-trigger-bottom",e),I("close-mobile-sidebar",we);const o=document.getElementById("mobile-search-bar"),t=document.getElementById("mobile-search-input-top"),i=()=>{o==null||o.classList.remove("hidden"),t==null||t.focus()};I("mobile-search-btn",i),I("mobile-search-trigger",i),I("close-mobile-search",()=>{o&&o.classList.add("hidden"),t&&(t.value="",t.dispatchEvent(new Event("input")))}),I("mobile-search-trigger",()=>{o==null||o.classList.remove("hidden"),t==null||t.focus()})}function xo(){"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").then(e=>{console.log("SW registrado corectamente:",e.scope)}).catch(e=>{console.log("Fallo al registrar SW:",e)})})}function Eo(){window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),De=e,["pwa-install-btn","sidebar-pwa-install-btn","mobile-pwa-install-btn"].forEach(t=>{var i;return(i=document.getElementById(t))==null?void 0:i.classList.remove("hidden")})});const n=async()=>{if(!De)return;De.prompt();const{outcome:e}=await De.userChoice;e==="accepted"&&["pwa-install-btn","sidebar-pwa-install-btn","mobile-pwa-install-btn"].forEach(t=>{var i;return(i=document.getElementById(t))==null?void 0:i.classList.add("hidden")}),De=null};I("pwa-install-btn",n),I("sidebar-pwa-install-btn",n),I("mobile-pwa-install-btn",n)}function So(){const n=setInterval(()=>{typeof gapi<"u"&&typeof google<"u"&&(clearInterval(n),gapi.load("client",async()=>{await gapi.client.init({discoveryDocs:["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]}),u.gapiLoaded=!0,u.tokenClient=google.accounts.oauth2.initTokenClient({client_id:ho,scope:"https://www.googleapis.com/auth/drive.file",callback:async o=>{if(o.error)return S("❌ Error de vinculación");const t=sessionStorage.getItem("cn_pass_plain_v3");if(!t)return S("❌ Error: Sesión no válida");try{const i=new Qt("notev3_",u.settings.drivePath),a=await i.getOrCreateFolder(u.settings.drivePath),r=await i.loadChunks(a);if(r)try{await N.decrypt(r,t),S("✅ Drive verificado: Contraseña correcta")}catch{S("❌ Contraseña de Bóveda no coincide con Drive");return}localStorage.setItem("gdrive_token_v3",JSON.stringify(o)),gapi.client.setToken(o),Le(!0),S("✅ Vinculado con Google Drive"),$e()}catch(i){console.error("Drive connection error:",i),S("❌ Error al verificar Drive")}}});const e=localStorage.getItem("gdrive_token_v3");if(e){const o=JSON.parse(e);gapi.client.setToken(o),Le(!0),setTimeout(()=>Le(!0),500),setTimeout(()=>Le(!0),2e3)}else Le(!1)}))},500)}function xn(){if(!u.tokenClient)return S("Google API no lista");u.tokenClient.requestAccessToken({prompt:"consent"})}function Le(n){const e=document.getElementById("drive-status"),o=document.getElementById("sync-btn");e&&(e.innerHTML=n?'<span class="flex items-center gap-2 text-green-500 font-bold"><i data-lucide="check-circle" class="w-4 h-4"></i> Conectado</span>':'<span class="flex items-center gap-2 text-muted-foreground font-bold font-mono uppercase"><i data-lucide="x-circle" class="w-4 h-4"></i> No conectado</span>',e.className=n?"text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary":"text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"),o&&(o.style.opacity=n?"1":"0.3",o.style.pointerEvents=n?"auto":"none"),R()}let xt=!1;async function $e(){if(xt)return;const n=sessionStorage.getItem("cn_pass_plain_v3");if(!n)return;const e=document.getElementById("sync-icon"),o=document.getElementById("sync-btn");xt=!0,e&&e.classList.add("animate-spin"),o&&o.classList.add("text-primary");try{const t=new Qt("notev3_",u.settings.drivePath),i=await t.getOrCreateFolder(u.settings.drivePath),a=await t.loadChunks(i);if(a)try{const s=await N.decrypt(a,n);if(s&&Array.isArray(s.notes)){const l=new Map(s.notes.map(h=>[h.id,h])),d=new Map(u.notes.map(h=>[h.id,h])),p=new Set([...l.keys(),...d.keys()]),c=Array.from(p).map(h=>{const k=d.get(h),B=l.get(h);return k?B&&B.updatedAt>k.updatedAt?B:k:B});u.notes=c.sort((h,k)=>k.updatedAt-h.updatedAt);const v=new Map(s.categories.map(h=>[h.id,h])),f=new Map(u.categories.map(h=>[h.id,h])),g=new Set([...v.keys(),...f.keys()]);u.categories=Array.from(g).map(h=>f.get(h)||v.get(h)),await X(),ee()}}catch(s){console.error("Decryption failed during sync pull",s),S("⚠️ No se pudo descargar: Contraseña no coincide")}const r=await N.encrypt({notes:u.notes,categories:u.categories},n);await t.saveChunks(r,i),S("✅ Sincronización completa")}catch(t){console.error("Sync error:",t),t.status===401||t.result&&t.result.error&&t.result.error.code===401?(S("⚠️ Sesión de Drive expirada. Re-conectando..."),xn()):S("❌ Error de sincronización")}finally{xt=!1,e&&e.classList.remove("animate-spin"),o&&o.classList.remove("text-primary")}}function Yt(){const n=localStorage.getItem("gdrive_token_v3");u.gapiLoaded&&n&&sessionStorage.getItem("cn_pass_plain_v3")&&$e()}function Ut(){const n=document.getElementById("categories-modal");n&&(n.classList.remove("hidden"),Ge(ee,u.categories))}function we(){const n=document.getElementById("mobile-sidebar-overlay");n&&n.classList.add("hidden")}async function Io(){const n=document.getElementById("new-cat-name"),e=n==null?void 0:n.value.trim();e&&(u.categories.push({id:"cat_"+Date.now(),name:e,color:"#aecbfa",passwordHash:null}),await X(),n&&(n.value=""),Ge(ee,u.categories),ee(),window.triggerAutoSync&&window.triggerAutoSync())}function Wt(){localStorage.removeItem("cn_pass_plain_v3"),sessionStorage.removeItem("cn_pass_plain_v3"),location.reload()}function ko(){const n=document.getElementById("app-version");n&&(n.innerText=kn)}function Vt(){const n=document.getElementById("settings-modal");if(n){n.classList.remove("hidden"),document.getElementById("config-drive-path").value=u.settings.drivePath,document.getElementById("config-algo").value=u.settings.algo;const e=n.querySelector('.settings-tab[data-tab="appearance"]');e&&e.click()}}function Jt(n){u.settings.theme=n,wn(),X()}
