import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";

type ErrorKey =
  | "generic"
  | "network"
  | "timeout"
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "server"
  | "invalidCredentials"
  | "accountUnverified"
  | "insufficientBalance"
  | "orderFailed"
  | "withdrawalFailed"
  | "depositFailed"
  | "unknown";

const dictionaries: Record<Locale, Record<ErrorKey, string>> = {
  en: {
    generic: "Something went wrong. Please try again.",
    network: "Network error. Check your connection and try again.",
    timeout: "The request timed out. Please check your connection and try again.",
    unauthorized: "Your session has expired. Please log in again.",
    forbidden: "You do not have permission to perform this action.",
    notFound: "The requested resource was not found.",
    server: "The server is temporarily unavailable. Please try again shortly.",
    invalidCredentials: "Invalid email or password.",
    accountUnverified: "Your account is not verified. Please verify your email.",
    insufficientBalance: "Insufficient balance to complete this transaction.",
    orderFailed: "We could not place your order. Please try again.",
    withdrawalFailed: "Withdrawal failed. Please try again.",
    depositFailed: "Deposit failed. Please try again.",
    unknown: "An unexpected error occurred.",
  },
  fr: {
    generic: "Une erreur est survenue. Veuillez réessayer.",
    network: "Erreur réseau. Vérifiez votre connexion et réessayez.",
    timeout: "La requête a expiré. Vérifiez votre connexion et réessayez.",
    unauthorized: "Votre session a expiré. Veuillez vous reconnecter.",
    forbidden: "Vous n’êtes pas autorisé à effectuer cette action.",
    notFound: "La ressource demandée est introuvable.",
    server: "Le serveur est temporairement indisponible. Veuillez réessayer sous peu.",
    invalidCredentials: "E-mail ou mot de passe invalide.",
    accountUnverified: "Votre compte n’est pas vérifié. Veuillez vérifier votre e-mail.",
    insufficientBalance: "Solde insuffisant pour effectuer cette transaction.",
    orderFailed: "Nous n’avons pas pu placer votre ordre. Veuillez réessayer.",
    withdrawalFailed: "Le retrait a échoué. Veuillez réessayer.",
    depositFailed: "Le dépôt a échoué. Veuillez réessayer.",
    unknown: "Une erreur inattendue s’est produite.",
  },
  da: {
    generic: "Noget gik galt. Prøv igen.",
    network: "Netværksfejl. Tjek din forbindelse og prøv igen.",
    timeout: "Anmodningen fik timeout. Tjek din forbindelse og prøv igen.",
    unauthorized: "Din session er udløbet. Log ind igen.",
    forbidden: "Du har ikke tilladelse til at udføre denne handling.",
    notFound: "Den anmodede ressource blev ikke fundet.",
    server: "Serveren er midlertidigt utilgængelig. Prøv igen om lidt.",
    invalidCredentials: "Ugyldig e-mail eller adgangskode.",
    accountUnverified: "Din konto er ikke bekræftet. Bekræft din e-mail.",
    insufficientBalance: "Utilstrækkelig saldo til at gennemføre denne transaktion.",
    orderFailed: "Vi kunne ikke afgive din ordre. Prøv igen.",
    withdrawalFailed: "Udbetalingen mislykkedes. Prøv igen.",
    depositFailed: "Indbetalingen mislykkedes. Prøv igen.",
    unknown: "Der opstod en uventet fejl.",
  },
  de: {
    generic: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
    network: "Netzwerkfehler. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
    timeout: "Die Anfrage ist abgelaufen. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
    unauthorized: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
    forbidden: "Sie sind nicht berechtigt, diese Aktion auszuführen.",
    notFound: "Die angeforderte Ressource wurde nicht gefunden.",
    server: "Der Server ist vorübergehend nicht verfügbar. Bitte versuchen Sie es gleich erneut.",
    invalidCredentials: "Ungültige E-Mail oder ungültiges Passwort.",
    accountUnverified: "Ihr Konto ist nicht bestätigt. Bitte bestätigen Sie Ihre E-Mail.",
    insufficientBalance: "Unzureichendes Guthaben für diese Transaktion.",
    orderFailed: "Ihre Order konnte nicht platziert werden. Bitte versuchen Sie es erneut.",
    withdrawalFailed: "Auszahlung fehlgeschlagen. Bitte versuchen Sie es erneut.",
    depositFailed: "Einzahlung fehlgeschlagen. Bitte versuchen Sie es erneut.",
    unknown: "Ein unerwarteter Fehler ist aufgetreten.",
  },
  es: {
    generic: "Algo salió mal. Inténtalo de nuevo.",
    network: "Error de red. Comprueba tu conexión e inténtalo de nuevo.",
    timeout: "La solicitud agotó el tiempo de espera. Comprueba tu conexión e inténtalo de nuevo.",
    unauthorized: "Tu sesión ha expirado. Inicia sesión de nuevo.",
    forbidden: "No tienes permiso para realizar esta acción.",
    notFound: "No se encontró el recurso solicitado.",
    server: "El servidor no está disponible temporalmente. Inténtalo de nuevo en breve.",
    invalidCredentials: "Correo o contraseña no válidos.",
    accountUnverified: "Tu cuenta no está verificada. Verifica tu correo.",
    insufficientBalance: "Saldo insuficiente para completar esta transacción.",
    orderFailed: "No pudimos colocar tu orden. Inténtalo de nuevo.",
    withdrawalFailed: "El retiro falló. Inténtalo de nuevo.",
    depositFailed: "El depósito falló. Inténtalo de nuevo.",
    unknown: "Se produjo un error inesperado.",
  },
};

const messageKeyMap: Record<string, ErrorKey> = {
  INSUFFICIENT_BALANCE: "insufficientBalance",
  INVALID_CREDENTIALS: "invalidCredentials",
  ACCOUNT_NOT_VERIFIED: "accountUnverified",
  ACCOUNT_UNVERIFIED: "accountUnverified",
  NETWORK_ERROR: "network",
  TIMEOUT: "timeout",
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "notFound",
  INTERNAL_SERVER_ERROR: "server",
  ORDER_FAILED: "orderFailed",
  WITHDRAWAL_FAILED: "withdrawalFailed",
  DEPOSIT_FAILED: "depositFailed",
  "Invalid email or password": "invalidCredentials",
  "Invalid credentials": "invalidCredentials",
  "insufficient balance": "insufficientBalance",
  "Insufficient balance": "insufficientBalance",
};

function currentLocale(): Locale {
  if (typeof document !== "undefined") {
    const lang = document.documentElement.lang;
    if (isLocale(lang)) return lang;
  }
  return defaultLocale;
}

/**
 * Map a structured backend error code or a well-known English message to the
 * active interface language. Unknown free-form messages are returned unchanged
 * so debugging information is never lost.
 */
export function localizeApiError(message: string, locale?: string): string {
  const active = isLocale(locale) ? locale : currentLocale();
  const key = messageKeyMap[message];
  if (!key) return message;
  return dictionaries[active][key];
}

export function errorMessage(key: ErrorKey, locale?: string): string {
  const active = isLocale(locale) ? locale : currentLocale();
  return dictionaries[active][key];
}
