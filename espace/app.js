/* Application PLAN B : programme de l'interface (chargé en fichier séparé pour l'application Google). */
(function(){
"use strict";
/* ===================== Accès serveur ===================== */
const ENLIGNE = typeof google !== "undefined" && google.script && google.script.run;
function api(action, data){
  if (ENLIGNE) return new Promise((ok, ko) => google.script.run.withSuccessHandler(ok).withFailureHandler(e => ko(e && e.message ? e : new Error(String(e)))).api(action, data || {}));
  return Demo.api(action, data || {});
}
/* Mode démonstration : données fictives dans ce navigateur, pour voir l'interface hors connexion Google. */
const Demo = {
  cle: "planb-demo-v1",
  lire(){ try { return JSON.parse(localStorage.getItem(this.cle)) } catch(e){ return null } },
  ecrire(d){ try { localStorage.setItem(this.cle, JSON.stringify(d)) } catch(e){} },
  base(){
    let d = this.lire();
    if (!d) { d = { taches:[
        {id:"x1",titre:"Exemple : relire la fiche d'intention",domaine:"Cours",priorite:"haute",statut:"a_faire",echeance:new Date(Date.now()+2*864e5).toISOString().slice(0,10),note:""},
        {id:"x2",titre:"Exemple : préparer l'exercice pratique",domaine:"Cours",priorite:"normale",statut:"en_cours",echeance:"",note:""}],
      cours:[{id:"y1",titre:"Exemple de cours",domaine:"Gestion de projets et planification",categorie:"general",statut:"en_cours",public:"Chefs d'équipe",duree:"½ jour",contenu:"Bases\nMéthode\nExercice",prioritaire:true}],
      demandes:[], documents:[] }; this.ecrire(d); }
    return d;
  },
  async api(a, p){
    await new Promise(r => setTimeout(r, 250));
    const d = this.base();
    if (a === "init") return { email:"démonstration", claude:false, modele:"—", demo:true, importe:true, classeurUrl:"#", dossierUrl:"https://drive.google.com/drive/folders/1SowWXzXezmBQXKQUMmZ2A6oL3LGGI6H4", dossierAppUrl:"#", donnees:d };
    if (a === "enregistrer"){ const l = d[p.collection]; const doc = Object.assign({}, p.doc);
      if(!doc.id) doc.id = "z"+Math.random().toString(36).slice(2,9); doc.maj = new Date().toISOString(); if(!doc.cree) doc.cree = doc.maj;
      const i = l.findIndex(x => x.id === doc.id); if (i>=0) l[i] = doc; else l.push(doc); this.ecrire(d); return doc; }
    if (a === "supprimer"){ d[p.collection] = d[p.collection].filter(x => x.id !== p.id); this.ecrire(d); return {ok:true}; }
    if (a === "proposer"){ const dem = {id:"d"+Date.now(), coursTitre:p.coursTitre, typeDoc:p.typeDoc, idees:p.idees, consignes:p.consignes, statut:"en_attente", reponse:"", cree:new Date().toISOString()};
      d.demandes.push(dem); this.ecrire(d); return {enAttente:true, demande:dem}; }
    if (a === "creerWord") throw new Error("En démonstration, aucun fichier n'est créé dans le Drive.");
    if (a === "importer") return {deja:true};
    throw new Error("Action inconnue");
  }
};

/* ===================== État ===================== */
const S = { info:null, d:{taches:[],cours:[],demandes:[],documents:[]}, vue:"accueil", filtreT:"ouvertes", filtreC:"tous", rechC:"", at:{} };
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const auj = () => new Date().toISOString().slice(0,10);
const dateFr = s => s ? new Date(s.length===10 ? s+"T12:00:00" : s).toLocaleDateString("fr-CH",{day:"numeric",month:"short",year:"numeric"}) : "";
function toast(t, ms=3800){ const e=document.createElement("div"); e.className="toast"; e.textContent=t; document.body.appendChild(e); setTimeout(()=>e.remove(), ms); }
function erreur(e){ console.error(e); toast("Erreur : " + (e && e.message || e), 7000); }

const IC = {
  accueil:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  taches:'<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
  cours:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path d="M9 7h6"/>',
  atelier:'<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>',
  outils:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  reglages:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.3 14H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 4.6 1.6 1.6 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.3z"/>',
  ampoule:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  bulle:'<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5M12 16h.01"/>',
  lien:'<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>'
};
const svg = (k, w=18) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]||IC.lien}</svg>`;
const tuile = (type, texte) => `<div class="tuile ${type==="QUESTION"?"q":""}"><div class="ic">${svg(type==="QUESTION"?"bulle":"ampoule",22)}</div><div><b>${type}</b><p>${texte}</p></div></div>`;

const VUES = [
  ["accueil","Accueil"],["taches","Tâches"],["cours","Répertoire des cours"],["atelier","Atelier de création"],["outils","Mes outils"],["reglages","Réglages"]
];
function menu(){
  $("#nav").innerHTML = VUES.map(([k,t]) => `<button data-v="${k}" ${S.vue===k?'aria-current="page"':""}>${svg(k)}${t}</button>`).join("");
}
$("#nav").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (b){ aller(b.dataset.v); $("#side").classList.remove("ouvert"); } });
$("#burger").addEventListener("click", () => { const o = $("#side").classList.toggle("ouvert"); $("#burger").setAttribute("aria-expanded", o); });
function aller(v){ S.vue = v; try{ sessionStorage.setItem("planb-vue", v) }catch(e){} menu(); rendre(); window.scrollTo(0,0); }
function rendre(){ ({accueil:vAccueil,taches:vTaches,cours:vCours,atelier:vAtelier,outils:vOutils,reglages:vReglages}[S.vue]||vAccueil)(); }

const PIED = `<div class="pied">© 2026 Jean-François Caddoux · jfcpro.org — Application privée. J'utilise l'intelligence artificielle comme outil de préparation. Chaque contenu est conçu, relu et validé par moi.</div>`;

/* ===================== Accueil ===================== */
function vAccueil(){
  const t = S.d.taches.filter(x => x.statut !== "fait");
  const retard = t.filter(x => x.echeance && x.echeance < auj());
  const semaine = t.filter(x => x.echeance && x.echeance >= auj() && x.echeance <= new Date(Date.now()+7*864e5).toISOString().slice(0,10));
  const coursEnCours = S.d.cours.filter(c => c.statut === "en_cours");
  const attente = S.d.demandes.filter(d => d.statut === "en_attente");
  const h = new Date().getHours();
  $("#vue").innerHTML = `
    <h1>${h<12?"Bonjour":h<18?"Bon après-midi":"Bonsoir"} Jeff, <em>on avance.</em></h1>
    <p class="sous">Toutes les données de PLAN B, au même endroit, enregistrées dans ton Drive.</p>
    ${!S.info.importe && !S.info.demo ? `<div class="etat">Première ouverture : copie tes tâches et ton répertoire de cours actuels dans l'application. Les artefacts d'origine ne sont pas modifiés. <button class="btn petit" id="imp">Copier mes données</button></div>`:""}
    <div class="grille">
      <div class="carte bandeau"><div class="chiffre">${t.length}</div><h3>Tâches ouvertes</h3><p>${retard.length ? `<span class="pastille p-retard">${retard.length} en retard</span>` : "Aucune en retard"} · ${semaine.length} cette semaine</p></div>
      <div class="carte bandeau"><div class="chiffre">${S.d.cours.length}</div><h3>Cours au répertoire</h3><p>${coursEnCours.length} en préparation · ${S.d.cours.filter(c=>c.statut==="pret").length} prêts</p></div>
      <div class="carte bandeau"><div class="chiffre">${S.d.documents.length}</div><h3>Documents créés ici</h3><p>${attente.length ? attente.length+" proposition(s) en attente de Claude" : "Aucune proposition en attente"}</p></div>
    </div>
    <h2>À faire en priorité</h2>
    <div class="liste">${[...retard, ...t.filter(x=>!retard.includes(x)).sort(triTaches)].slice(0,5).map(ligneTache).join("") || `<div class="vide">Rien d'urgent. Bravo.</div>`}</div>
    <h2>Cours en préparation</h2>
    <div class="grille">${coursEnCours.slice(0,6).map(c => `<div class="carte"><h3>${esc(c.titre)}</h3><p>${esc(c.domaine||"")}</p>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn petit" data-atelier="${esc(c.id)}">Ouvrir dans l'atelier</button>${c.dossierUrl?`<a class="btn petit sec" href="${esc(c.dossierUrl)}" target="_blank" rel="noopener">Dossier Drive</a>`:""}</div></div>`).join("") || `<div class="vide">Aucun cours en préparation.</div>`}</div>
    ${PIED}`;
  const imp = $("#imp"); if (imp) imp.onclick = importer;
  lierTaches(); lierAtelier();
}
async function importer(){
  const b = $("#imp"); b.disabled = true; b.textContent = "Copie en cours…";
  try { const r = await api("importer"); toast(r.deja ? "Déjà copié." : r.importes + " éléments copiés."); await charger(); }
  catch(e){ erreur(e); b.disabled = false; b.textContent = "Copier mes données"; }
}

/* ===================== Tâches ===================== */
const PRIO = {haute:0, normale:1, basse:2};
function triTaches(a,b){ return (a.echeance||"9999").localeCompare(b.echeance||"9999") || (PRIO[a.priorite]??1)-(PRIO[b.priorite]??1); }
function ligneTache(x){
  const fait = x.statut === "fait", ret = !fait && x.echeance && x.echeance < auj();
  return `<div class="ligne ${fait?"fait":""}" data-t="${esc(x.id)}">
    <button class="coche ${fait?"on":""}" data-coche aria-label="${fait?"Rouvrir":"Marquer comme faite"}">${fait?"✓":""}</button>
    <div><div class="t">${esc(x.titre)}</div><div class="m">
      ${x.priorite==="haute"?'<span class="pastille p-haute">Haute</span>':""}${x.statut==="en_cours"?'<span class="pastille p-en_cours">En cours</span>':""}
      ${x.domaine?`<span class="pastille">${esc(x.domaine)}</span>`:""}
      ${x.echeance?`<span class="pastille ${ret?"p-retard":""}">${ret?"En retard · ":""}${dateFr(x.echeance)}</span>`:""}
      ${fait && x.valide_le?`Faite le ${dateFr(x.valide_le)}`:""}
      ${x.note?`<div>${esc(x.note)}</div>`:""}</div></div>
    <div class="act"><button class="btn petit sec" data-modif>Modifier</button></div></div>`;
}
function vTaches(){
  const f = S.filtreT, l = S.d.taches.filter(x => f==="toutes" || (f==="faites" ? x.statut==="fait" : x.statut!=="fait")).sort(triTaches);
  $("#vue").innerHTML = `<h1>Tâches</h1><p class="sous">Ta liste PLAN B. Coche une tâche quand elle est finie.</p>
    <div class="barre"><div class="onglets">${[["ouvertes","Ouvertes"],["faites","Faites"],["toutes","Toutes"]].map(([k,t])=>`<button data-f="${k}" aria-pressed="${f===k}">${t}</button>`).join("")}</div>
    <span class="esp"></span><button class="btn" id="nouvT">+ Nouvelle tâche</button></div>
    <div class="liste">${l.map(ligneTache).join("") || `<div class="vide">Aucune tâche ici.</div>`}</div>${PIED}`;
  document.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { S.filtreT = b.dataset.f; vTaches(); });
  $("#nouvT").onclick = () => editerTache({});
  lierTaches();
}
function lierTaches(){
  document.querySelectorAll("[data-t]").forEach(el => {
    const x = S.d.taches.find(t => t.id === el.dataset.t);
    $("[data-coche]", el).onclick = async () => {
      const n = Object.assign({}, x, x.statut==="fait" ? {statut:"a_faire", valide_le:""} : {statut:"fait", valide_le:auj()});
      await sauver("taches", n); toast(n.statut==="fait" ? "Tâche validée." : "Tâche rouverte.");
    };
    $("[data-modif]", el).onclick = () => editerTache(x);
  });
}
function editerTache(x){
  dialogue(`<h3>${x.id?"Modifier la tâche":"Nouvelle tâche"}</h3>
    <label class="ch">Titre<input type="text" name="titre" required value="${esc(x.titre)}"></label>
    <div class="deux"><label class="ch">Domaine<input type="text" name="domaine" value="${esc(x.domaine)}" list="doms"></label>
    <label class="ch">Échéance<input type="date" name="echeance" value="${esc(x.echeance)}"></label>
    <label class="ch">Priorité<select name="priorite">${["haute","normale","basse"].map(p=>`<option ${ (x.priorite||"normale")===p?"selected":""}>${p}</option>`).join("")}</select></label>
    <label class="ch">Statut<select name="statut">${[["a_faire","À faire"],["en_cours","En cours"],["fait","Faite"]].map(([k,t])=>`<option value="${k}" ${(x.statut||"a_faire")===k?"selected":""}>${t}</option>`).join("")}</select></label></div>
    <label class="ch">Note<textarea name="note" rows="3">${esc(x.note)}</textarea></label>
    <datalist id="doms">${[...new Set(S.d.taches.map(t=>t.domaine).filter(Boolean))].map(d=>`<option value="${esc(d)}">`).join("")}</datalist>`,
    async v => { const n = Object.assign({auteur:"Jeff"}, x, v); if (n.statut==="fait" && !n.valide_le) n.valide_le = auj(); await sauver("taches", n); toast("Tâche enregistrée."); },
    x.id ? async () => { if (await confirmer("Retirer cette tâche de la liste ?")) { await retirer("taches", x.id); toast("Tâche retirée."); } } : null);
}

/* ===================== Répertoire des cours ===================== */
const STATUTS = {idee:"Idée", en_cours:"En préparation", pret:"Prêt"};
const CATS = {general:"Général", technique:"Technique", specifique:"Technique spécifique"};
function vCours(){
  const f = S.filtreC, q = S.rechC.toLowerCase();
  const l = S.d.cours.filter(c => (f==="tous" || c.statut===f) && (!q || (c.titre+" "+c.domaine+" "+(c.contenu||"")).toLowerCase().includes(q)));
  const doms = [...new Set(l.map(c => c.domaine || "Autres"))].sort();
  $("#vue").innerHTML = `<h1>Répertoire des cours</h1><p class="sous">${S.d.cours.length} cours possibles, par domaine. Ouvre un cours dans l'atelier pour en créer les documents.</p>
    <div class="barre"><div class="onglets">${[["tous","Tous"],["idee","Idées"],["en_cours","En préparation"],["pret","Prêts"]].map(([k,t])=>`<button data-f="${k}" aria-pressed="${f===k}">${t}</button>`).join("")}</div>
    <input type="search" id="rech" placeholder="Rechercher…" value="${esc(S.rechC)}" style="min-width:180px"><span class="esp"></span><button class="btn" id="nouvC">+ Nouveau cours</button></div>
    ${doms.map(d => `<div class="groupe">${esc(d)}</div><div class="grille">${l.filter(c => (c.domaine||"Autres")===d).map(carteCours).join("")}</div>`).join("") || `<div class="vide">Aucun cours ne correspond.</div>`}${PIED}`;
  document.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { S.filtreC = b.dataset.f; vCours(); });
  const r = $("#rech"); r.oninput = () => { S.rechC = r.value; clearTimeout(r._t); r._t = setTimeout(() => { vCours(); const n=$("#rech"); n.focus(); n.setSelectionRange(n.value.length,n.value.length); }, 250); };
  $("#nouvC").onclick = () => editerCours({});
  document.querySelectorAll("[data-c]").forEach(b => b.onclick = () => editerCours(S.d.cours.find(c => c.id === b.dataset.c)));
  lierAtelier();
}
function carteCours(c){
  return `<div class="carte"><div style="margin-bottom:8px"><span class="pastille p-${esc(c.statut)}">${STATUTS[c.statut]||esc(c.statut)}</span>${c.categorie?`<span class="pastille">${CATS[c.categorie]||esc(c.categorie)}</span>`:""}${c.prioritaire?'<span class="pastille p-haute">Prioritaire</span>':""}</div>
    <h3>${esc(c.titre)}</h3><p>${esc([c.public, c.duree].filter(Boolean).join(" · "))}</p>
    <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap"><button class="btn petit" data-atelier="${esc(c.id)}">Atelier</button><button class="btn petit sec" data-c="${esc(c.id)}">Fiche</button>
    ${c.dossierUrl?`<a class="btn petit sec" href="${esc(c.dossierUrl)}" target="_blank" rel="noopener">Drive</a>`:""}</div></div>`;
}
function editerCours(c){
  const doms = [...new Set(S.d.cours.map(x=>x.domaine).filter(Boolean))];
  dialogue(`<h3>${c.id?"Fiche du cours":"Nouveau cours"}</h3>
    <label class="ch">Titre<input type="text" name="titre" required value="${esc(c.titre)}"></label>
    <div class="deux"><label class="ch">Domaine<input type="text" name="domaine" list="doms2" value="${esc(c.domaine)}"></label>
    <label class="ch">Catégorie<select name="categorie">${Object.entries(CATS).map(([k,t])=>`<option value="${k}" ${c.categorie===k?"selected":""}>${t}</option>`).join("")}</select></label>
    <label class="ch">Statut<select name="statut">${Object.entries(STATUTS).map(([k,t])=>`<option value="${k}" ${(c.statut||"idee")===k?"selected":""}>${t}</option>`).join("")}</select></label>
    <label class="ch">Durée<input type="text" name="duree" value="${esc(c.duree)}"></label>
    <label class="ch">Public<input type="text" name="public" value="${esc(c.public)}"></label>
    <label class="ch">Format<input type="text" name="format" value="${esc(c.format)}"></label></div>
    <label class="ch">Contenu (une idée par ligne)<textarea name="contenu" rows="4">${esc(c.contenu)}</textarea></label>
    <label class="ch">Appui (expérience, source)<textarea name="appui" rows="2">${esc(c.appui)}</textarea></label>
    <label class="ch">Note<textarea name="note" rows="2">${esc(c.note)}</textarea></label>
    <label class="ch"><input type="checkbox" name="prioritaire" ${c.prioritaire?"checked":""} style="display:inline;width:auto"> Prioritaire</label>
    <datalist id="doms2">${doms.map(d=>`<option value="${esc(d)}">`).join("")}</datalist>`,
    async v => { v.prioritaire = !!v.prioritaire; await sauver("cours", Object.assign({auteur:"Jeff"}, c, v)); toast("Cours enregistré."); },
    c.id ? async () => { if (await confirmer("Retirer ce cours du répertoire ? (son dossier Drive n'est pas touché)")) { await retirer("cours", c.id); toast("Cours retiré du répertoire."); } } : null);
}

/* ===================== Atelier de création ===================== */
const TYPES = ["Fiche d'intention","Objectifs de cours","Programme et déroulé","Support de cours","Exercices et corrigé","Questionnaire d'évaluation","Mémo d'une page"];
function lierAtelier(){ document.querySelectorAll("[data-atelier]").forEach(b => b.onclick = () => { S.at = {coursId:b.dataset.atelier, typeDoc:S.at.typeDoc}; aller("atelier"); }); }
function vAtelier(){
  const a = S.at, c = S.d.cours.find(x => x.id === a.coursId);
  const attente = S.d.demandes.filter(d => d.statut === "en_attente");
  const recues = S.d.demandes.filter(d => d.statut === "recue" && !d.vue).slice(-5);
  $("#vue").innerHTML = `<h1>Atelier de création</h1><p class="sous">Tu donnes tes idées et tes consignes, Claude propose, tu corriges ou relances, puis tu valides : le Word est créé dans le Drive.</p>
    ${!S.info.claude ? tuile("ASTUCE", "Claude n'est pas encore branché (pas de clé API). Le bouton « Proposer » met ta demande en file d'attente : demande ensuite à Claude dans le projet « traite mes demandes de l'application », et sa proposition apparaîtra ici.") : ""}
    <div class="atelier">
      <div class="carte">
        <label class="ch">Cours<select id="aCours"><option value="">— Choisir un cours —</option>${S.d.cours.slice().sort((x,y)=>x.titre.localeCompare(y.titre)).map(x=>`<option value="${esc(x.id)}" ${x.id===a.coursId?"selected":""}>${esc(x.titre)}</option>`).join("")}</select></label>
        <label class="ch">Document<select id="aType">${TYPES.map(t=>`<option ${a.typeDoc===t?"selected":""}>${t}</option>`).join("")}</select></label>
        <label class="ch">Mes idées<textarea id="aIdees" rows="6" placeholder="Ce que tu veux voir : thèmes, exemples de terrain, anecdotes…">${esc(a.idees)}</textarea></label>
        <label class="ch">Mes consignes<textarea id="aCons" rows="4" placeholder="Ton, longueur, public, exercices à prévoir…">${esc(a.consignes)}</textarea></label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
          <button class="btn" id="aProp">${a.texte ? "Relancer avec mes consignes" : "Proposer"}</button>
          ${c && c.dossierUrl ? `<a class="btn sec" href="${esc(c.dossierUrl)}" target="_blank" rel="noopener">Dossier du cours</a>` : ""}
        </div>
        ${attente.length ? `<div class="etat">${attente.length} demande(s) en attente de Claude.<br>${attente.slice(-3).map(d=>`· ${esc(d.typeDoc)} — ${esc(d.coursTitre)}`).join("<br>")}<br><button class="btn petit sec" id="aMaj" style="margin-top:8px">Vérifier les réponses</button></div>` : ""}
        ${recues.length ? `<div class="etat">Propositions reçues :<br>${recues.map(d=>`<button class="btn petit sec" data-dem="${esc(d.id)}" style="margin-top:6px">${esc(d.typeDoc)} — ${esc(d.coursTitre)}</button>`).join(" ")}</div>` : ""}
      </div>
      <div>
        <div class="barre"><div class="onglets"><button data-m="edit" aria-pressed="${S.at.mode!=="apercu"}">Modifier</button><button data-m="apercu" aria-pressed="${S.at.mode==="apercu"}">Aperçu</button></div><span class="esp"></span>
          <button class="btn dore" id="aWord" ${a.texte?"":"disabled"}>Valider et créer le Word</button></div>
        ${S.at.mode==="apercu" ? `<div class="apercu">${mdHtml(a.texte||"")||'<p class="sous">Rien à afficher.</p>'}</div>`
          : `<textarea id="aTexte" class="resultat" placeholder="La proposition de Claude s'affiche ici. Tu peux l'écrire ou la corriger directement.">${esc(a.texte)}</textarea>`}
        <div id="aEtat"></div>
      </div>
    </div>${PIED}`;
  const garder = () => { a.coursId = $("#aCours").value; a.typeDoc = $("#aType").value; a.idees = $("#aIdees").value; a.consignes = $("#aCons").value; const t=$("#aTexte"); if (t) a.texte = t.value; };
  ["#aCours","#aType"].forEach(s => $(s).onchange = () => { garder(); vAtelier(); });
  ["#aIdees","#aCons"].forEach(s => $(s).oninput = garder);
  const tx = $("#aTexte"); if (tx) tx.oninput = () => { a.texte = tx.value; $("#aWord").disabled = !a.texte.trim(); };
  document.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { garder(); S.at.mode = b.dataset.m; vAtelier(); });
  $("#aProp").onclick = () => { garder(); proposer(); };
  $("#aWord").onclick = () => { garder(); creerWord(); };
  const m = $("#aMaj"); if (m) m.onclick = async () => { m.disabled = true; await charger(); vAtelier(); };
  document.querySelectorAll("[data-dem]").forEach(b => b.onclick = async () => {
    const d = S.d.demandes.find(x => x.id === b.dataset.dem);
    Object.assign(S.at, {coursId:d.coursId, typeDoc:d.typeDoc, idees:d.idees, consignes:d.consignes, texte:d.reponse, demandeId:d.id});
    await sauver("demandes", Object.assign({}, d, {vue:true}), true); vAtelier();
  });
}
async function proposer(){
  const a = S.at, c = S.d.cours.find(x => x.id === a.coursId);
  if (!c) { toast("Choisis d'abord un cours."); return; }
  const b = $("#aProp"); b.disabled = true; b.textContent = S.info.claude ? "Claude rédige… (jusqu'à une minute)" : "Envoi…";
  try {
    const r = await api("proposer", {coursId:c.id, coursTitre:c.titre, cours:c, typeDoc:a.typeDoc, idees:a.idees, consignes:a.consignes, precedent:a.texte||""});
    S.d.demandes = S.d.demandes.filter(x => x.id !== r.demande.id).concat([r.demande]);
    if (r.enAttente) { toast("Demande enregistrée. Claude la traitera depuis le projet.", 6000); }
    else { a.texte = r.demande.reponse; a.demandeId = r.demande.id; a.mode = "apercu"; toast("Proposition reçue. Relis, corrige ou relance."); }
  } catch(e){ erreur(e); }
  vAtelier();
}
async function creerWord(){
  const a = S.at, c = S.d.cours.find(x => x.id === a.coursId);
  const titre = a.typeDoc + (c ? " - " + c.titre : "");
  const b = $("#aWord"); b.disabled = true; b.textContent = "Création du Word…";
  try {
    const r = await api("creerWord", {titre, markdown:a.texte, sousTitre:c ? c.titre : "", dossierId:c && c.dossierDrive, coursId:c && c.id, demandeId:a.demandeId||""});
    S.d.documents.push(r);
    $("#aEtat").innerHTML = `<div class="etat">Créé : <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.nom)}</a> · <a href="${esc(r.dossierUrl)}" target="_blank" rel="noopener">ouvrir le dossier</a></div>`;
    toast("Word créé dans le Drive.");
  } catch(e){ erreur(e); }
  b.disabled = false; b.textContent = "Valider et créer le Word";
}
function mdHtml(md){
  const inl = s => esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  let h = "", liste = null;
  const fin = () => { if (liste) { h += `</${liste}>`; liste = null; } };
  md.replace(/\r/g,"").split("\n").forEach(l => {
    let m;
    if (!l.trim()) { fin(); return; }
    if ((m = l.match(/^(#{1,3})\s+(.*)/))) { fin(); h += `<h${m[1].length}>${inl(m[2])}</h${m[1].length}>`; return; }
    if ((m = l.match(/^>\s*(ASTUCE|QUESTION)\s*:?\s*(.*)/i))) { fin(); h += tuile(m[1].toUpperCase(), inl(m[2])); return; }
    if ((m = l.match(/^\s*[-*•]\s+(.*)/))) { if (liste!=="ul"){ fin(); h += "<ul>"; liste="ul"; } h += `<li>${inl(m[1])}</li>`; return; }
    if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (liste!=="ol"){ fin(); h += "<ol>"; liste="ol"; } h += `<li>${inl(m[1])}</li>`; return; }
    fin(); h += `<p>${inl(l.replace(/^>\s*/,""))}</p>`;
  });
  fin(); return h;
}

/* ===================== Mes outils ===================== */
const OUTILS = [
  ["Création de cours","Atelier supports de cours","https://claude.ai/artifact/R44QVACahQAngSr626hvVA","Support, mémos, exercices et modèles Word 01 à 11 d'un cours."],
  ["Création de cours","Atelier fiche ADDIE","https://claude.ai/artifact/59M4bCLvDgQPy7pyRoj1xS","Remplir la fiche ADDIE simplifiée d'un mandat."],
  ["Création de cours","Atelier vecteurs de forces","https://claude.ai/artifact/JyBTouoB1KH7kZLBn6aGaE","Tracer des forces et exporter la figure pour Word."],
  ["Administratif","Facturation Caddoux","https://claude.ai/artifact/9KKvrvojcRX4vtS77TXRL1","Factures PDF avec QR-facture suisse."],
  ["Administratif","Modèles de documents","https://drive.google.com/drive/folders/1SowWXzXezmBQXKQUMmZ2A6oL3LGGI6H4","Dossier PLAN B : modèles Word 01 à 11 et présentation."],
  ["Pilotage","Barre d'outils PLAN B","https://claude.ai/artifact/UUCedMQcQHuHwrmmudEuhH","Tous les artefacts du projet."],
  ["Pilotage","Tâches (version artefact)","https://claude.ai/artifact/XFGxtBBmmDHnRfaEKGTDqz","L'ancienne liste, toujours disponible."],
  ["Pilotage","Répertoire des cours (version artefact)","https://claude.ai/artifact/3aNkZgDnKU8stS8UuATtoB","L'ancien répertoire, toujours disponible."],
  ["Identité visuelle","Charte graphique officielle","https://claude.ai/artifact/H5ByXoXGftTt3u7dtd5dob","Couleurs, police Sora, logo, boîtes Tuile."],
  ["Site internet","jfcpro.org","https://jfcpro.org","Le site public."]
];
function vOutils(){
  const gs = [...new Set(OUTILS.map(o => o[0]))];
  $("#vue").innerHTML = `<h1>Mes outils</h1><p class="sous">Les outils PLAN B existants, inchangés. Ils seront intégrés ici au fur et à mesure.</p>
    <div class="grille"><a class="carte outil" href="${esc(S.info.dossierUrl)}" target="_blank" rel="noopener"><span class="ic">${svg("outils")}</span><span><h3>Dossier Drive PLAN B</h3><p>Tous tes livrables.</p></span></a>
    <a class="carte outil" href="${esc(S.info.classeurUrl)}" target="_blank" rel="noopener"><span class="ic">${svg("taches")}</span><span><h3>Données de l'application</h3><p>Le classeur Google où tout est enregistré.</p></span></a></div>
    ${gs.map(g => `<div class="groupe">${esc(g)}</div><div class="grille">${OUTILS.filter(o=>o[0]===g).map(o=>`<a class="carte outil" href="${esc(o[2])}" target="_blank" rel="noopener"><span class="ic">${svg("lien")}</span><span><h3>${esc(o[1])}</h3><p>${esc(o[3])}</p></span></a>`).join("")}</div>`).join("")}${PIED}`;
}

/* ===================== Réglages ===================== */
function vReglages(){
  $("#vue").innerHTML = `<h1>Réglages</h1><p class="sous">État de l'application.</p>
    <div class="grille">
      <div class="carte"><h3>Compte</h3><p>${esc(S.info.email)}</p></div>
      <div class="carte"><h3>Claude</h3><p>${S.info.claude ? "Branché · modèle " + esc(S.info.modele) : "Non branché : les demandes vont en file d'attente."}</p></div>
      <div class="carte"><h3>Données</h3><p><a href="${esc(S.info.classeurUrl)}" target="_blank" rel="noopener">Classeur « Application PLAN B - données »</a></p></div>
    </div>
    ${tuile("ASTUCE", "Pour brancher Claude : dans le projet Google Apps Script « Application PLAN B », Paramètres du projet › Propriétés du script › ajouter ANTHROPIC_API_KEY avec ta clé (console.anthropic.com). La clé reste cachée côté Google, jamais dans cette page.")}
    <h2>Apparence</h2><div class="onglets">${[["auto","Automatique"],["light","Clair"],["dark","Sombre"]].map(([k,t])=>`<button data-th="${k}" aria-pressed="${(document.documentElement.dataset.theme||"auto")===k}">${t}</button>`).join("")}</div>${PIED}`;
  document.querySelectorAll("[data-th]").forEach(b => b.onclick = () => { const k=b.dataset.th; if(k==="auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme=k; try{localStorage.setItem("planb-theme",k)}catch(e){} vReglages(); });
}

/* ===================== Outils communs ===================== */
async function sauver(col, doc, silencieux){
  try { const r = await api("enregistrer", {collection:col, doc}); const l = S.d[col]; const i = l.findIndex(x => x.id === r.id); if (i>=0) l[i] = r; else l.push(r); if (!silencieux) rendre(); return r; }
  catch(e){ erreur(e); }
}
async function retirer(col, id){
  try { await api("supprimer", {collection:col, id}); S.d[col] = S.d[col].filter(x => x.id !== id); rendre(); } catch(e){ erreur(e); }
}
function dialogue(html, surOk, surSuppr){
  const dlg = $("#dlg"), f = $("#dlgForm");
  f.innerHTML = html + `<div class="dlg-pied">${surSuppr?'<button type="button" class="btn sec gauche" id="dSup">Retirer</button>':""}<button type="button" class="btn sec" id="dAnn">Annuler</button><button class="btn" id="dOk" value="ok">Enregistrer</button></div>`;
  $("#dAnn").onclick = () => dlg.close();
  if (surSuppr) $("#dSup").onclick = async () => { dlg.close(); await surSuppr(); };
  f.onsubmit = async e => { e.preventDefault(); const v = {}; new FormData(f).forEach((val,k) => v[k] = val); f.querySelectorAll("input[type=checkbox]").forEach(cb => v[cb.name] = cb.checked); dlg.close(); await surOk(v); };
  dlg.showModal(); const p = f.querySelector("input,textarea"); if (p) p.focus();
}
function confirmer(q){
  return new Promise(ok => { const dlg = $("#dlg"), f = $("#dlgForm");
    f.innerHTML = `<h3>${esc(q)}</h3><div class="dlg-pied"><button type="button" class="btn sec" id="cNon">Non</button><button type="button" class="btn" id="cOui">Oui</button></div>`;
    $("#cNon").onclick = () => { dlg.close(); ok(false); }; $("#cOui").onclick = () => { dlg.close(); ok(true); }; dlg.showModal(); });
}
async function charger(){
  S.info = await api("init");
  S.d = Object.assign({taches:[],cours:[],demandes:[],documents:[]}, S.info.donnees);
  $("#mode").hidden = !S.info.demo; $("#compte").textContent = S.info.demo ? "Données fictives, rien n'est enregistré dans le Drive." : S.info.email;
  rendre();
}
(function demarrer(){
  try { const th = localStorage.getItem("planb-theme"); if (th && th!=="auto") document.documentElement.dataset.theme = th; } catch(e){}
  try { S.vue = sessionStorage.getItem("planb-vue") || "accueil"; } catch(e){}
  menu();
  charger().catch(e => { $("#vue").innerHTML = `<div class="etat err">Impossible de charger les données : ${esc(e.message||e)}</div>`; });
})();
})();
