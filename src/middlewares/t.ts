// server.ts (Serveur Node.js en TypeScript)
import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { signData, verifyData } from './utils/crypto';
import { PrivateMessageSchema, PublicMessageSchema } from './utils/schemas';

// Interfaces TypeScript pour typer les événements Socket.IO côté client et serveur
interface UserData {
  id: string;
  name: string;
}
interface SocketData {
  user?: UserData;
}
interface ClientToServerEvents {
  // Le client envoie un message public (payload validé par PublicMessageSchema)
  public_message: (msg: { text: string }) => void;
  // Le client envoie un message privé (payload validé par PrivateMessageSchema)
  private_message: (msg: { to: string; text: string }) => void;
}
interface ServerToClientEvents {
  // Le serveur envoie un message public (après l'avoir signé)
  public_message: (msg: { data: { text: string; from: string }; sig: string }) => void;
  // Le serveur envoie un message privé (après l'avoir signé)
  private_message: (msg: { data: { text: string; from: string }; sig: string }) => void;
  // On pourrait ajouter d'autres événements (ex: notifications d'erreur personnalisées) si nécessaire
}

// Configuration des secrets (à sécuriser en production via des variables d'environnement)
const HMAC_SECRET = process.env.HMAC_SECRET || 'CHANGE_THIS_SECRET'; // Secret partagé pour HMAC (ne pas hardcoder en prod)
const JWT_SECRET = process.env.JWT_SECRET || 'JWT_SECRET_KEY'; // Secret pour signer/vérifier les JWT (à définir en prod)

// Initialisation du serveur Socket.IO sur le port 3000
const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(3000, {
  cors: { origin: '*' }, // Autoriser toutes les origines pour l'exemple. En production, restreindre à votre domaine client.
});

console.log('Serveur Socket.IO démarré sur le port 3000');

// Middleware global d'authentification (handshake) : vérifie le token JWT fourni lors de la connexion
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      // Vérifier le token JWT et attacher les informations d'utilisateur au socket
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user: UserData = { id: decoded.id, name: decoded.name };
      socket.data.user = user;
      // Joindre le socket à une "room" identifiée par l'ID utilisateur, pour faciliter l'émission de messages privés vers cet utilisateur
      socket.join(user.id);
      console.log(`✅ Utilisateur authentifié : ${user.name} (id=${user.id})`);
    } catch (err) {
      console.error('❌ Échec de la vérification du JWT :', err);
      // Refuser la connexion si le token est invalide
      return next(new Error("Échec d'authentification")); // Le client recevra un événement "connect_error"
    }
  }
  // Pas de token fourni -> utilisateur non authentifié (invité). On continue sans attacher de user.
  return next();
});

// Gestion d'une nouvelle connexion client
io.on('connection', socket => {
  const user = socket.data.user;
  if (user) {
    console.log(`🔗 Socket connecté pour l'utilisateur authentifié ${user.name} (${user.id})`);
  } else {
    console.log('🔗 Socket connecté pour un utilisateur invité (non authentifié)');
  }

  // Middleware de vérification de la signature HMAC pour chaque message entrant du client
  socket.use((packet, next) => {
    const [event, message] = packet;
    // On s'attend à recevoir un objet { data: ..., sig: ... } pour chaque message
    if (!message || typeof message !== 'object' || !message.data || !message.sig) {
      return next(new Error('Format de message invalide ou signature manquante'));
    }
    // Vérifier la signature du message à l'aide du secret HMAC partagé
    const isValid = verifyData(message.data, HMAC_SECRET, message.sig);
    if (!isValid) {
      return next(new Error('Signature de message invalide')); // Le client recevra un événement "error"
    }
    // Si la signature est valide, remplacer le contenu du paquet par les données réelles (pour les prochains middlewares et handlers)
    packet[1] = message.data;
    return next();
  });

  // Middleware de validation des données avec Zod pour chaque message entrant (après la vérification de signature)
  socket.use((packet, next) => {
    const [event, data] = packet;
    let parseResult;
    if (event === 'public_message') {
      parseResult = PublicMessageSchema.safeParse(data);
    } else if (event === 'private_message') {
      parseResult = PrivateMessageSchema.safeParse(data);
    } else {
      // Événement non reconnu par notre protocole - on le rejette
      return next(new Error(`Événement non supporté : "${event}"`));
    }
    if (!parseResult.success) {
      console.error(`❌ Schéma invalide pour ${event} :`, parseResult.error);
      return next(new Error('Données du message invalides'));
    }
    // Données valides selon le schéma, on peut éventuellement utiliser parseResult.data (identique à data ici)
    packet[1] = parseResult.data;
    return next();
  });

  // Middleware de contrôle d'accès : vérifie que l'utilisateur est authentifié pour les événements sensibles
  socket.use((packet, next) => {
    const [event, data] = packet;
    if (event === 'private_message') {
      if (!socket.data.user) {
        // Si un invité tente d'envoyer un message privé, on refuse
        return next(new Error('Authentification requise pour cet événement'));
      }
    }
    return next();
  });

  // Handler de l'événement "public_message" (message public envoyé par un client)
  socket.on('public_message', payload => {
    // À ce stade, le payload a été validé et vérifié. On peut le traiter en toute confiance.
    const senderName = socket.data.user ? socket.data.user.name : 'Anonyme';
    console.log(`📨 Message public reçu de ${senderName} : "${payload.text}"`);

    // Préparer le message à diffuser à tous les clients (texte + nom de l'émetteur)
    const outgoingData = { text: payload.text, from: senderName };
    // Signer le message avec le secret HMAC
    const signature = signData(outgoingData, HMAC_SECRET);
    // Envoyer à tous les clients le message signé (y compris à l'expéditeur, pour simplicité)
    io.emit('public_message', { data: outgoingData, sig: signature });
    // En production, on pourrait utiliser socket.broadcast.emit pour ne pas renvoyer à l'expéditeur si ce n'est pas nécessaire côté UI.
  });

  // Handler de l'événement "private_message" (message privé envoyé par un client authentifié)
  socket.on('private_message', payload => {
    const sender = socket.data.user!; // Ce handler n'est appelé que si user existe (middleware d'auth l'a garanti)
    console.log(`📨 Message privé de ${sender.name} vers [id=${payload.to}] : "${payload.text}"`);

    // Préparer le message à envoyer au destinataire (texte + nom de l'expéditeur)
    const outgoingData = { text: payload.text, from: sender.name };
    const signature = signData(outgoingData, HMAC_SECRET);
    // Émettre le message privé **seulement** au client cible dont l'ID correspond (s'il est connecté sur une "room" du même id)
    io.to(payload.to).emit('private_message', { data: outgoingData, sig: signature });
    // 💡 Remarque : on utilise ici socket.join(user.id) plus haut pour que chaque utilisateur ait une "room" dédiée (nommée par son id).
    // Ainsi io.to(payload.to) enverra uniquement au socket du destinataire correspondant à cet id.
  });

  // Gérer la déconnexion du client
  socket.on('disconnect', () => {
    if (socket.data.user) {
      console.log(`❎ Déconnexion de l'utilisateur ${socket.data.user.name} (${socket.data.user.id})`);
    } else {
      console.log("❎ Déconnexion d'un utilisateur non authentifié");
    }
    // (Socket.IO gère automatiquement la sortie du socket de toutes les rooms auxquelles il était associé)
  });
});
