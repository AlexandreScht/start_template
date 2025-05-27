// client.ts (Client navigateur TypeScript, ex. dans un composant Next.js ou script frontend)
import CryptoJS from 'crypto-js';
import { io, type Socket } from 'socket.io-client';
import { ServerPrivateMessageSchema, ServerPublicMessageSchema } from './utils/schemas';

// Interfaces d'événements correspondant à celles du serveur
interface ClientToServerEvents {
  public_message: (msg: { data: { text: string }; sig: string }) => void;
  private_message: (msg: { data: { to: string; text: string }; sig: string }) => void;
}
interface ServerToClientEvents {
  public_message: (msg: { data: { text: string; from: string }; sig: string }) => void;
  private_message: (msg: { data: { text: string; from: string }; sig: string }) => void;
}

// Secret HMAC partagé – en production, devrait être négocié de manière sûre plutôt que codé en dur
const HMAC_SECRET = 'CHANGE_THIS_SECRET';

// Fonctions utilitaires de signature/vérification (HMAC SHA-256) côté client
function signData(data: any, secret: string): string {
  const json = JSON.stringify(data);
  const hash = CryptoJS.HmacSHA256(json, secret);
  return hash.toString(CryptoJS.enc.Hex);
}
function verifyData(data: any, secret: string, signature: string): boolean {
  const json = JSON.stringify(data);
  const hashHex = CryptoJS.HmacSHA256(json, secret).toString(CryptoJS.enc.Hex);
  return hashHex === signature;
}

// Initialisation du socket client et envoi du token d'authentification si disponible
const token = localStorage.getItem('authToken'); // par ex., le JWT stocké après login de l'utilisateur
const auth = token ? { token } : {};
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3000', { auth });

// Gérer les erreurs globales envoyées par le serveur (ex: erreurs de middleware)
socket.on('error', err => {
  console.error('Erreur reçue du serveur :', err);
  // On pourrait informer l'utilisateur (alerte, toast UI, etc.) selon l'application
});

// Fonction générique pour vérifier et valider un message entrant du serveur avant de le traiter
function verifyAndParseIncoming<EventData>(eventName: string, message: { data: EventData; sig: string } | any, schema: any): EventData | null {
  if (!message || typeof message !== 'object' || !message.data || !message.sig) {
    console.error(`Message "${eventName}" mal formé ou signature manquante.`);
    return null;
  }
  // Vérifier la signature HMAC du message
  if (!verifyData(message.data, HMAC_SECRET, message.sig)) {
    console.error(`Signature invalide pour le message "${eventName}".`);
    return null;
  }
  // Valider les données du message avec le schéma Zod approprié
  const parseResult = schema.safeParse(message.data);
  if (!parseResult.success) {
    console.error(`Données du message "${eventName}" invalides :`, parseResult.error);
    return null;
  }
  // Tout est valide, on peut renvoyer les données parsées en toute confiance
  return parseResult.data;
}

// Écoute des événements venant du serveur, avec vérification préalable
socket.on('public_message', message => {
  const data = verifyAndParseIncoming('public_message', message, ServerPublicMessageSchema);
  if (data) {
    console.log(`[Public] Message reçu de ${data.from} : "${data.text}"`);
    // Ici, on mettrait à jour l'UI pour afficher le message public reçu
  }
});

socket.on('private_message', message => {
  const data = verifyAndParseIncoming('private_message', message, ServerPrivateMessageSchema);
  if (data) {
    console.log(`[Privé] Message privé de ${data.from} : "${data.text}"`);
    // Mettre à jour l'UI pour afficher le message privé reçu (chat privé, notification, etc.)
  }
});

// Fonctions pour émettre des messages signés vers le serveur
function sendPublicMessage(text: string) {
  const payload = { text };
  const signature = signData(payload, HMAC_SECRET);
  socket.emit('public_message', { data: payload, sig: signature });
}

function sendPrivateMessage(to: string, text: string) {
  const payload = { to, text };
  const signature = signData(payload, HMAC_SECRET);
  socket.emit('private_message', { data: payload, sig: signature });
}

// Exemple d'utilisation des fonctions d'envoi (dans une application réelle, ces appels seraient déclenchés par l'utilisateur via l'interface)
sendPublicMessage('Bonjour tout le monde !');
if (token) {
  // N'envoyer un message privé que si l'utilisateur est connecté (token présent)
  sendPrivateMessage('destUserId', 'Salut, ceci est un message privé.');
}
