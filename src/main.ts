/**
 * Main Entry Point & Dependency Injection Composition Root
 * 
 * This is the composition root that orchestrates dependency injection
 * across all layers. Each layer is responsible for creating its own
 * dependencies, and this file wires them together.
 */

import { createInfrastructureDependencies, type InfrastructureDependencies } from './infrastructure/dependencies';
import { createUseCaseDependencies, type UseCaseDependencies } from './usecases/dependencies';
import { createPresentationDependencies, type PresentationDependencies } from './presentation/dependencies';

/**
 * Complete application dependencies
 * Combines all layer dependencies into a single interface
 */
export interface AppDependencies extends 
  InfrastructureDependencies, 
  UseCaseDependencies, 
  PresentationDependencies {}

/**
 * Create the complete dependency graph
 * Each layer creates its own dependencies, then we wire them together
 */
export function createAppDependencies(): AppDependencies {
  // 1. Infrastructure layer creates repositories and services
  const infrastructureDeps = createInfrastructureDependencies();
  
  // 2. Use case layer creates use cases with injected repositories
  const useCaseDeps = createUseCaseDependencies(
    infrastructureDeps.calendarRepository,
    infrastructureDeps.presetRepository
  );

  // 3. Presentation layer creates UI configuration and utilities
  const presentationDeps = createPresentationDependencies();

  // 4. Combine all dependencies
  return {
    ...infrastructureDeps,
    ...useCaseDeps,
    ...presentationDeps
  };
}

/**
 * Get application dependencies
 * Convenience function for accessing the dependency graph
 */
export function getAppDependencies(): AppDependencies {
  // For now, create dependencies each time
  // In a more complex app, you might want to cache this
  return createAppDependencies();
}

/**
 * Initialize the calendar extension
 * This is the main entry point called from react-inject.tsx
 */
export function initializeCalendarExtension(): AppDependencies {
  const dependencies = createAppDependencies();
  
  // Log successful initialization
  console.log('📅 Lens Calendar Extension initialized with dependencies:', {
    repositories: {
      calendar: dependencies.calendarRepository.constructor.name,
      preset: dependencies.presetRepository.constructor.name
    },
    useCases: {
      clearCalendars: dependencies.clearCalendarsUseCase.constructor.name,
      enableCalendar: dependencies.enableCalendarUseCase.constructor.name,
      applyPreset: dependencies.applyPresetUseCase.constructor.name,
      importPresets: dependencies.importPresetsUseCase.constructor.name,
      exportPresets: dependencies.exportPresetsUseCase.constructor.name
    },
    presentation: {
      theme: dependencies.themeConfig,
      notifications: dependencies.notificationConfig
    }
  });
  
  return dependencies;
}