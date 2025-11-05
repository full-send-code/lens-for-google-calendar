/**
 * Application Container
 * 
 * This is the composition root that orchestrates dependency injection
 * across all layers. Each layer is responsible for creating its own
 * dependencies, and this container wires them together.
 */

import { createInfrastructureDependencies, type InfrastructureDependencies } from './infrastructure/dependencies';
import { createUseCaseDependencies, type UseCaseDependencies } from './usecases/dependencies';

/**
 * Complete application dependencies
 * Combines all layer dependencies into a single interface
 */
export interface AppDependencies extends InfrastructureDependencies, UseCaseDependencies {}

/**
 * Application Container
 * Singleton container that manages the complete dependency graph
 */
export class AppContainer {
  private static instance: AppContainer;
  private dependencies: AppDependencies;

  private constructor() {
    this.dependencies = this.createDependencyGraph();
  }

  /**
   * Get singleton container instance
   * Ensures same dependencies across the entire extension
   */
  public static getInstance(): AppContainer {
    if (!AppContainer.instance) {
      AppContainer.instance = new AppContainer();
    }
    return AppContainer.instance;
  }

  /**
   * Get all application dependencies
   */
  public getDependencies(): AppDependencies {
    return this.dependencies;
  }

  /**
   * Get specific dependency by key
   */
  public get<K extends keyof AppDependencies>(key: K): AppDependencies[K] {
    return this.dependencies[key];
  }

  /**
   * Create the complete dependency graph
   * Each layer creates its own dependencies, then we wire them together
   */
  private createDependencyGraph(): AppDependencies {
    // 1. Infrastructure layer creates repositories and services
    const infrastructureDeps = createInfrastructureDependencies();
    
    // 2. Use case layer creates use cases with injected repositories
    const useCaseDeps = createUseCaseDependencies(
      infrastructureDeps.calendarRepository,
      infrastructureDeps.presetRepository
    );

    // 3. Combine all dependencies
    return {
      ...infrastructureDeps,
      ...useCaseDeps
    };
  }

  /**
   * Reset container (useful for testing)
   */
  public static reset(): void {
    AppContainer.instance = null as any;
  }
}

/**
 * Convenience function to get all dependencies
 */
export function getAppDependencies(): AppDependencies {
  return AppContainer.getInstance().getDependencies();
}

/**
 * Convenience function to get specific dependency
 */
export function getDependency<K extends keyof AppDependencies>(key: K): AppDependencies[K] {
  return AppContainer.getInstance().get(key);
}