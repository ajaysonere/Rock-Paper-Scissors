import { NativeModules, TurboModuleRegistry } from "react-native";
import { NativeModulesProxy } from "expo-modules-core";

type NativeUnimoduleProxyShape = {
  modulesConstants?: Record<string, any>;
  exportedMethods?: Record<string, any>;
  viewManagersMetadata?: Record<string, any>;
};

const legacyProxy = NativeModules?.NativeUnimoduleProxy as NativeUnimoduleProxyShape | undefined;
const aliasSource = "ExpoCamera";
const aliasTarget = "ExponentCamera";

function aliasIfNecessary(container: Record<string, any> | undefined, from: string, to: string) {
  if (!container) return;
  if (to in container) return;
  if (!(from in container)) return;

  const source = container[from];
  if (!source) return;

  try {
    Object.defineProperty(container, to, {
      configurable: true,
      enumerable: true,
      get() {
        return container[from];
      },
    });
  } catch (error) {
    if (__DEV__) {
      console.debug(
        `[expoCameraCompat] Failed to alias ${from} -> ${to}: ${(error as Error).message}`
      );
    }
  }
}

aliasIfNecessary(legacyProxy?.modulesConstants, aliasSource, aliasTarget);
aliasIfNecessary(legacyProxy?.exportedMethods, aliasSource, aliasTarget);
aliasIfNecessary(legacyProxy?.viewManagersMetadata, aliasSource, aliasTarget);

const expoModules = (globalThis as any)?.expo?.modules;
aliasIfNecessary(expoModules, aliasSource, aliasTarget);

if (
  NativeModulesProxy &&
  (NativeModulesProxy as Record<string, any>)[aliasSource] &&
  !(NativeModulesProxy as Record<string, any>)[aliasTarget]
) {
  try {
    Object.defineProperty(NativeModulesProxy, aliasTarget, {
      configurable: true,
      enumerable: true,
      get() {
        return (NativeModulesProxy as Record<string, any>)[aliasSource];
      },
    });
  } catch (error) {
    if (__DEV__) {
      console.debug(
        `[expoCameraCompat] Failed to alias proxy ${aliasSource} -> ${aliasTarget}: ${
          (error as Error).message
        }`
      );
    }
  }
}

const originalGet = TurboModuleRegistry?.get?.bind(TurboModuleRegistry);
if (originalGet) {
  TurboModuleRegistry.get = ((moduleName: string) => {
    if (moduleName === aliasTarget) {
      return originalGet(moduleName) ?? originalGet(aliasSource);
    }
    if (moduleName === aliasSource) {
      const found = originalGet(moduleName);
      return found ?? originalGet(aliasTarget);
    }
    return originalGet(moduleName);
  }) as typeof TurboModuleRegistry.get;
}

const originalGetEnforcing = TurboModuleRegistry?.getEnforcing?.bind(TurboModuleRegistry);
if (originalGetEnforcing) {
  TurboModuleRegistry.getEnforcing = ((moduleName: string) => {
    if (moduleName === aliasTarget) {
      try {
        return originalGetEnforcing(moduleName);
      } catch {
        return originalGetEnforcing(aliasSource);
      }
    }
    if (moduleName === aliasSource) {
      try {
        return originalGetEnforcing(moduleName);
      } catch {
        return originalGetEnforcing(aliasTarget);
      }
    }
    return originalGetEnforcing(moduleName);
  }) as typeof TurboModuleRegistry.getEnforcing;
}
