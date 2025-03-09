export class ServerException extends Error {
  public status: number;
  public message: string;

  constructor(status: number = 500, message: string | string[] = "Une erreur s'est produite") {
    super(Array.isArray(message) ? message.join(' | ') : message);
    this.status = status;
    this.message = Array.isArray(message) ? message.join(' | ') : message;
  }
}

export class NotFoundError extends ServerException {
  constructor(message: string[] | string = 'Ressource non trouvée') {
    super(404, message);
  }
}

export class InvalidArgumentError extends ServerException {
  constructor(message: string[] | string = 'Arguments invalides') {
    super(422, message);
  }
}

export class InsufficientFund extends ServerException {
  constructor(message: string[] | string = 'Fond insuffisant, depot requis sur le compte spot') {
    super(500, message);
  }
}

export class InvalidCredentialsError extends ServerException {
  constructor(message: string[] | string = 'Identifiants invalides') {
    super(401, message);
  }
}

export class InvalidSessionError extends ServerException {
  constructor(message: string[] | string = 'Session invalide') {
    super(403, message);
  }
}

export class ExpiredSessionError extends ServerException {
  constructor(message: string[] | string = 'Session expired') {
    super(999, message);
  }
}

export class InvalidAccessError extends ServerException {
  constructor(message: string[] | string = 'Accès refusé') {
    super(403, message);
  }
}
export class InvalidToken extends ServerException {
  constructor(message: string[] | string) {
    super(605, `La ou les cryptos suivantes ne sont pas reconnues => ${message}`);
  }
}

export class ServicesError extends ServerException {
  constructor(message: string[] | string = 'Echec de la requete API') {
    super(505, message);
  }
}
