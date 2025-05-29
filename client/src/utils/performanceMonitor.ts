interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Limiter le nombre de métriques stockées

  public startTimer(name: string): (metadata?: Record<string, any>) => void {
    const startTime = performance.now();

    return (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime;
      this.addMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata,
      });
    };
  }

  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Garder seulement les métriques récentes
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log les métriques lentes en développement
    if (process.env.NODE_ENV === 'development' && metric.duration > 1000) {
      console.warn(`Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
    }
  }

  public getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name);
    }
    return [...this.metrics];
  }

  public getAverageTime(name: string): number {
    const relevantMetrics = this.getMetrics(name);
    if (relevantMetrics.length === 0) return 0;

    const total = relevantMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / relevantMetrics.length;
  }

  public clear() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

export function usePerformanceMonitor(componentName: string) {
  const endTimer = performanceMonitor.startTimer(`component:${componentName}`);

  return {
    endTimer,
    logRender: () => endTimer({ type: 'render' }),
    logEffect: (effectName: string) => endTimer({ type: 'effect', effectName }),
  };
}
