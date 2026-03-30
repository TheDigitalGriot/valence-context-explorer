/**
 * Infrastructure services - Core application infrastructure.
 *
 * Exports:
 * - DataCache: LRU cache with TTL for parsed session data
 * - FileWatcher: Watches for file changes with debouncing
 * - ConfigManager: App configuration management
 * - FileSystemProvider: Abstract filesystem interface
 * - LocalFileSystemProvider: Local fs implementation
 * - ServiceContext: Service bundle for a single workspace context
 * - ServiceContextRegistry: Registry coordinator for all contexts
 */

export * from './ConfigManager';
export * from './DataCache';
export type * from './FileSystemProvider';
export * from './FileWatcher';
export * from './LocalFileSystemProvider';
export * from './ServiceContext';
export * from './ServiceContextRegistry';
export * from './TriggerManager';
