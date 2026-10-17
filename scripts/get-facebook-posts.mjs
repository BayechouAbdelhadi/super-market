#!/usr/bin/env node

/**
 * Script de récupération des publications d'une page Facebook via Meta Graph API
 *
 * Utilise la clé d'API Meta : NEXT_META_API_KEY (définie dans .env)
 * 
 * Étapes :
 *  1. Appelle /me/accounts pour lister toutes les pages administrées par le compte
 *  2. Trouve la page demandée par son nom (insensible à la casse)
 *  3. Utilise l'ID (et le Page Access Token correspondant) pour extraire les publications
 *
 * Exemples d'utilisation :
 *   node scripts/get-facebook-posts.mjs
 *   node scripts/get-facebook-posts.mjs "Super Market"
 *   node scripts/get-facebook-posts.mjs --json
 */

import fs from 'node:fs';
import path from 'node:path';

// 1. Chargement des variables d'environnement
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (typeof process.loadEnvFile === 'function' && fs.existsSync(envPath)) {
    try {
      process.loadEnvFile(envPath);
    } catch {
      // ignore
    }
  }

  if (!process.env.NEXT_META_API_KEY && fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const GRAPH_API_VERSION = 'v22.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const apiKey = process.env.NEXT_META_API_KEY;

if (!apiKey) {
  console.error('\n❌ ERREUR: La variable NEXT_META_API_KEY est manquante dans votre fichier .env\n');
  process.exit(1);
}

// Arguments CLI
const args = process.argv.slice(2);
const isJsonOutput = args.includes('--json');
const pageNameQuery = args.find((a) => !a.startsWith('--')) || 'super market';

async function fetchJson(url) {
  const response = await fetch(url);
  const json = await response.json();
  if (!response.ok || json.error) {
    const err = new Error(json.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    err.metaError = json.error;
    throw err;
  }
  return json;
}

async function main() {
  console.log('='.repeat(65));
  console.log('  🔍 Meta Graph API — Recherche de page et récupération des posts');
  console.log('='.repeat(65));
  console.log(`\n• Clé Meta API détectée (taille: ${apiKey.length} caractères)`);
  console.log(`• Requête de recherche : "${pageNameQuery}"\n`);

  // 1. Appeler me/accounts pour lister les pages disponibles
  console.log('📡 Étape 1 : Appel à /me/accounts pour lister vos pages gérées...');
  const accountsUrl = `${GRAPH_API_BASE}/me/accounts?fields=id,name,category,tasks,access_token&access_token=${encodeURIComponent(apiKey)}`;

  let accountsData;
  try {
    accountsData = await fetchJson(accountsUrl);
  } catch (err) {
    console.error('\n❌ Erreur lors de l\'appel à /me/accounts :');
    console.error(`   Message : ${err.message}`);
    if (err.metaError) {
      console.error(`   Code    : ${err.metaError.code}`);
      console.error(`   Type    : ${err.metaError.type}`);
      console.error(`   Détails : ${err.metaError.error_user_msg || err.metaError.message}`);
    }
    process.exit(1);
  }

  const pages = accountsData.data || [];
  if (pages.length === 0) {
    console.warn('\n⚠️  Aucune page trouvée pour ce compte via /me/accounts.');
    console.warn('   Vérifiez que votre jeton d\'accès dispose des permissions :');
    console.warn('   - pages_show_list');
    console.warn('   - pages_read_engagement');
    console.warn('   - pages_read_user_content (si requis)');
    process.exit(0);
  }

  console.log(`✅ ${pages.length} page(s) trouvée(s) :`);
  pages.forEach((p, index) => {
    console.log(`   [${index + 1}] ID: ${p.id.padEnd(16)} | Nom: "${p.name}" (${p.category || 'Catégorie non spécifiée'})`);
  });

  // 2. Trouver la page correspondante par son nom
  const normalizedQuery = pageNameQuery.toLowerCase().trim();
  let matchedPage = pages.find((p) => p.name.toLowerCase().includes(normalizedQuery));

  if (!matchedPage && pages.length === 1) {
    console.log(`\nℹ️  Recherche spécifique non concluante pour "${pageNameQuery}", sélection automatique de la seule page disponible : "${pages[0].name}"`);
    matchedPage = pages[0];
  } else if (!matchedPage) {
    console.error(`\n❌ Aucune page trouvée correspondant à "${pageNameQuery}".`);
    console.error(`   Pages disponibles : ${pages.map((p) => `"${p.name}"`).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🎯 Page sélectionnée : "${matchedPage.name}" (ID: ${matchedPage.id})`);

  // Utiliser le Page Access Token s'il est retourné, sinon le jeton utilisateur principal
  const pageAccessToken = matchedPage.access_token || apiKey;

  // 3. Récupérer les publications de la page
  console.log(`\n📡 Étape 2 : Récupération des posts pour la page (ID: ${matchedPage.id})...`);
  const fields = [
    'id',
    'message',
    'story',
    'created_time',
    'full_picture',
    'permalink_url',
    'attachments{media,type,url,title,description}',
  ].join(',');

  const postsUrl = `${GRAPH_API_BASE}/${matchedPage.id}/posts?fields=${fields}&limit=10&access_token=${encodeURIComponent(pageAccessToken)}`;

  let postsData;
  try {
    postsData = await fetchJson(postsUrl);
  } catch (err) {
    console.error(`\n❌ Erreur lors de la récupération des posts (${matchedPage.id}/posts) :`);
    console.error(`   Message : ${err.message}`);
    if (err.metaError) {
      console.error(`   Code : ${err.metaError.code} (${err.metaError.type})`);
    }
    process.exit(1);
  }

  let posts = postsData.data || [];

  // Fallback sur /{page-id}/feed si 0 posts trouvés
  if (posts.length === 0) {
    try {
      const feedUrl = `${GRAPH_API_BASE}/${matchedPage.id}/feed?fields=${fields}&limit=10&access_token=${encodeURIComponent(pageAccessToken)}`;
      const feedData = await fetchJson(feedUrl);
      if (feedData.data && feedData.data.length > 0) {
        posts = feedData.data;
        console.log(`ℹ️  ${posts.length} publication(s) trouvée(s) via le flux /{page-id}/feed.`);
      }
    } catch {
      // ignore fallback error
    }
  }

  console.log(`✅ ${posts.length} publication(s) récupérée(s) !\n`);

  if (isJsonOutput) {
    console.log(JSON.stringify(posts, null, 2));
    return;
  }

  // Affichage formaté lisible
  posts.forEach((post, i) => {
    const date = post.created_time ? new Date(post.created_time).toLocaleString('fr-FR') : 'Date inconnue';
    console.log('-'.repeat(65));
    console.log(`📌 Post #${i + 1} | Date: ${date} | ID: ${post.id}`);
    if (post.message) {
      console.log(`💬 Message :\n   ${post.message.split('\n').join('\n   ')}`);
    } else if (post.story) {
      console.log(`💬 Story : ${post.story}`);
    } else {
      console.log(`💬 (Sans texte)`);
    }

    if (post.full_picture) {
      console.log(`🖼️  Image : ${post.full_picture}`);
    }

    if (post.permalink_url) {
      console.log(`🔗 Lien  : ${post.permalink_url}`);
    }

    if (post.attachments?.data?.length) {
      const att = post.attachments.data[0];
      if (att.title || att.description) {
        console.log(`📎 Pièce jointe : ${att.title || ''} ${att.description ? `(${att.description})` : ''}`);
      }
    }
  });

  console.log('-'.repeat(65));
  console.log(`\n✨ Terminé avec succès. ${posts.length} publication(s) affichée(s).\n`);
}

main().catch((err) => {
  console.error('\n❌ Erreur inattendue :', err);
  process.exit(1);
});
