// ============================================
// Error Monitoring — Suivi d'erreurs structuré
// ============================================
// Utilitaire de suivi d'erreurs sans dépendance externe.
// Stocke les erreurs en mémoire, fournit des statistiques et un accès aux erreurs récentes.

export interface ErrorEntry {
  id: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: Date;
  route?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

type ErrorSeverity = ErrorEntry['severity'];

/** Classification automatique de la sévérité selon le code d'erreur HTTP */
function classifySeverity(error: unknown): ErrorSeverity {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('econnrefused') ||
      msg.includes('enotfound') ||
      msg.includes('database') ||
      msg.includes('prisma')
    ) {
      return 'critical';
    }
    if (
      msg.includes('authentication') ||
      msg.includes('unauthorized') ||
      msg.includes('forbidden')
    ) {
      return 'high';
    }
    if (
      msg.includes('not found') ||
      msg.includes('validation') ||
      msg.includes('invalid')
    ) {
      return 'medium';
    }
  }
  return 'low';
}

/** Génère un identifiant unique court pour chaque erreur */
function generateId(): string {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

class ErrorMonitor {
  private errors: ErrorEntry[] = [];
  private maxSize = 100;

  /**
   * Capture une erreur avec un contexte optionnel.
   * Classe automatiquement la sévérité si non spécifiée.
   */
  capture(
    error: Error | unknown,
    context?: Record<string, unknown>,
    severity?: ErrorSeverity
  ): ErrorEntry {
    const err = error instanceof Error ? error : new Error(String(error));
    const entry: ErrorEntry = {
      id: generateId(),
      message: err.message,
      stack: err.stack,
      context: context ?? undefined,
      timestamp: new Date(),
      route: context?.route as string | undefined,
      severity: severity ?? classifySeverity(error),
    };

    this.errors.push(entry);

    // Limiter la taille du tampon
    if (this.errors.length > this.maxSize) {
      this.errors = this.errors.slice(-this.maxSize);
    }

    return entry;
  }

  /** Récupère les N erreurs les plus récentes */
  getRecent(limit = 10): ErrorEntry[] {
    return this.errors.slice(-limit).reverse();
  }

  /** Statistiques sur les erreurs capturées */
  getStats(): {
    total: number;
    bySeverity: Record<string, number>;
    last24h: number;
  } {
    const bySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    const now = Date.now();
    const last24h = this.errors.filter(
      (e) => now - e.timestamp.getTime() < 86_400_000
    ).length;

    for (const entry of this.errors) {
      bySeverity[entry.severity] = (bySeverity[entry.severity] || 0) + 1;
    }

    return {
      total: this.errors.length,
      bySeverity,
      last24h,
    };
  }

  /** Réinitialise le tampon d'erreurs */
  clear(): void {
    this.errors = [];
  }

  /** Pour les tests : accès direct au tableau interne */
  _getErrors(): ErrorEntry[] {
    return this.errors;
  }
}

export const errorMonitor = new ErrorMonitor();
