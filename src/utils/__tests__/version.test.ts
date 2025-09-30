import { Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { VersionManager, versionManager, VersionInfo } from '../version';

// Mock modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

jest.mock('expo-application', () => ({
  nativeApplicationVersion: '2.1.0',
  nativeBuildVersion: '42',
  applicationId: 'com.test.app',
  applicationName: 'Test App',
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      version: '1.5.0',
      name: 'Web Test App',
      slug: 'web-test-app',
      web: {
        buildNumber: 123,
        bundleIdentifier: 'com.web.test.app',
      },
      extra: {
        buildDate: '2025-09-30',
        buildHash: 'abc123',
      },
    },
  },
}));

describe('VersionManager', () => {
  let manager: VersionManager;

  beforeEach(() => {
    manager = VersionManager.getInstance();
    manager.clearCache();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = VersionManager.getInstance();
      const instance2 = VersionManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should export a default instance', () => {
      expect(versionManager).toBeInstanceOf(VersionManager);
      expect(versionManager).toBe(VersionManager.getInstance());
    });
  });

  describe('Native Platform (iOS/Android)', () => {
    beforeEach(() => {
      (Platform as any).OS = 'ios';
    });

    describe('getVersionInfo', () => {
      it('should return complete version info for native platforms', async () => {
        const expectedInfo: VersionInfo = {
          version: '2.1.0',
          buildNumber: '42',
          bundleId: 'com.test.app',
          platform: 'ios',
          formattedVersion: '2.1.0 (42)',
        };

        const result = await manager.getVersionInfo();
        expect(result).toEqual(expectedInfo);
      });

      it('should cache version info after first call', async () => {
        await manager.getVersionInfo();
        await manager.getVersionInfo();

        // Application methods should only be called once due to caching
        expect(Application.nativeApplicationVersion).toHaveBeenCalledTimes(1);
        expect(Application.nativeBuildVersion).toHaveBeenCalledTimes(1);
      });

      it('should handle missing Application values with defaults', async () => {
        (Application as any).nativeApplicationVersion = null;
        (Application as any).nativeBuildVersion = null;
        (Application as any).applicationId = null;

        const result = await manager.getVersionInfo();

        expect(result.version).toBe('1.0.0');
        expect(result.buildNumber).toBe('1');
        expect(result.bundleId).toBe('com.kmac5dev.pbsessions');
      });
    });

    describe('getAppName', () => {
      it('should return app name from Application module', async () => {
        const result = await manager.getAppName();
        expect(result).toBe('Test App');
      });

      it('should return default name when Application name is missing', async () => {
        (Application as any).applicationName = null;

        const result = await manager.getAppName();
        expect(result).toBe('PB Sessions');
      });
    });

    describe('getBuildInfo', () => {
      it('should return platform info for native platforms', async () => {
        const result = await manager.getBuildInfo();
        expect(result).toEqual({
          platform: 'ios',
        });
      });
    });
  });

  describe('Web Platform', () => {
    beforeEach(() => {
      (Platform as any).OS = 'web';
      manager.clearCache();
    });

    describe('getVersionInfo', () => {
      it('should return complete version info for web platform', async () => {
        const expectedInfo: VersionInfo = {
          version: '1.5.0',
          buildNumber: '123',
          bundleId: 'com.web.test.app',
          platform: 'web',
          formattedVersion: '1.5.0 (123)',
        };

        const result = await manager.getVersionInfo();
        expect(result).toEqual(expectedInfo);
      });

      it('should handle missing Constants values with defaults', async () => {
        (Constants as any).default = {
          expoConfig: null,
        };

        const result = await manager.getVersionInfo();

        expect(result.version).toBe('1.0.0');
        expect(result.buildNumber).toBe('1');
        expect(result.bundleId).toBe('com.pbsessions.app');
      });

      it('should fallback to slug when bundleIdentifier is missing', async () => {
        (Constants as any).default = {
          expoConfig: {
            version: '1.5.0',
            slug: 'fallback-slug',
            web: {
              buildNumber: 123,
            },
          },
        };

        const result = await manager.getVersionInfo();
        expect(result.bundleId).toBe('fallback-slug');
      });
    });

    describe('getAppName', () => {
      it('should return app name from Constants', async () => {
        const result = await manager.getAppName();
        expect(result).toBe('Web Test App');
      });

      it('should return default name when Constants name is missing', async () => {
        (Constants as any).default = {
          expoConfig: {
            name: null,
          },
        };

        const result = await manager.getAppName();
        expect(result).toBe('PB Sessions');
      });
    });

    describe('getBuildInfo', () => {
      it('should return platform and build info for web', async () => {
        const result = await manager.getBuildInfo();
        expect(result).toEqual({
          platform: 'web',
          buildDate: '2025-09-30',
          buildHash: 'abc123',
        });
      });

      it('should handle missing extra build info', async () => {
        (Constants as any).default = {
          expoConfig: {
            extra: null,
          },
        };

        const result = await manager.getBuildInfo();
        expect(result).toEqual({
          platform: 'web',
          buildDate: undefined,
          buildHash: undefined,
        });
      });
    });
  });

  describe('Individual Getters', () => {
    beforeEach(() => {
      (Platform as any).OS = 'ios';
    });

    it('should get version string', async () => {
      const result = await manager.getVersion();
      expect(result).toBe('2.1.0');
    });

    it('should get build number', async () => {
      const result = await manager.getBuildNumber();
      expect(result).toBe('42');
    });

    it('should get formatted version', async () => {
      const result = await manager.getFormattedVersion();
      expect(result).toBe('2.1.0 (42)');
    });
  });

  describe('Version Comparison', () => {
    beforeEach(() => {
      (Platform as any).OS = 'ios';
      // Mock current version as 2.1.0
    });

    describe('compareVersion', () => {
      it('should return 1 when current version is newer', async () => {
        const result = await manager.compareVersion('1.5.0');
        expect(result).toBe(1);
      });

      it('should return 0 when versions are equal', async () => {
        const result = await manager.compareVersion('2.1.0');
        expect(result).toBe(0);
      });

      it('should return -1 when current version is older', async () => {
        const result = await manager.compareVersion('3.0.0');
        expect(result).toBe(-1);
      });

      it('should handle different number of version parts', async () => {
        const result1 = await manager.compareVersion('2.1');
        const result2 = await manager.compareVersion('2.1.0.1');
        
        expect(result1).toBe(0); // 2.1.0 === 2.1.0 (implicit .0)
        expect(result2).toBe(-1); // 2.1.0 < 2.1.0.1
      });

      it('should handle patch version differences', async () => {
        const result1 = await manager.compareVersion('2.1.1');
        const result2 = await manager.compareVersion('2.0.9');
        
        expect(result1).toBe(-1); // 2.1.0 < 2.1.1
        expect(result2).toBe(1);  // 2.1.0 > 2.0.9
      });
    });

    describe('isNewerThan', () => {
      it('should return true when current version is newer', async () => {
        const result = await manager.isNewerThan('1.0.0');
        expect(result).toBe(true);
      });

      it('should return false when current version is older', async () => {
        const result = await manager.isNewerThan('3.0.0');
        expect(result).toBe(false);
      });

      it('should return false when versions are equal', async () => {
        const result = await manager.isNewerThan('2.1.0');
        expect(result).toBe(false);
      });
    });

    describe('isOlderThan', () => {
      it('should return true when current version is older', async () => {
        const result = await manager.isOlderThan('3.0.0');
        expect(result).toBe(true);
      });

      it('should return false when current version is newer', async () => {
        const result = await manager.isOlderThan('1.0.0');
        expect(result).toBe(false);
      });

      it('should return false when versions are equal', async () => {
        const result = await manager.isOlderThan('2.1.0');
        expect(result).toBe(false);
      });
    });
  });

  describe('compareVersionStrings (private method testing via public methods)', () => {
    it('should handle major version differences', async () => {
      (Application as any).nativeApplicationVersion = '1.0.0';
      manager.clearCache();
      
      const result = await manager.compareVersion('2.0.0');
      expect(result).toBe(-1);
    });

    it('should handle minor version differences', async () => {
      (Application as any).nativeApplicationVersion = '2.2.0';
      manager.clearCache();
      
      const result = await manager.compareVersion('2.1.0');
      expect(result).toBe(1);
    });

    it('should handle version strings with different lengths', async () => {
      (Application as any).nativeApplicationVersion = '2.1';
      manager.clearCache();
      
      const result = await manager.compareVersion('2.1.0.0');
      expect(result).toBe(0);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache and force re-fetch', async () => {
      // First call
      await manager.getVersionInfo();
      expect(Application.nativeApplicationVersion).toHaveBeenCalledTimes(1);

      // Clear cache
      manager.clearCache();

      // Second call should fetch again
      await manager.getVersionInfo();
      expect(Application.nativeApplicationVersion).toHaveBeenCalledTimes(2);
    });

    it('should use cached values for multiple calls without cache clear', async () => {
      await manager.getVersionInfo();
      await manager.getVersion();
      await manager.getBuildNumber();
      await manager.getFormattedVersion();

      // Should only call the native methods once due to caching
      expect(Application.nativeApplicationVersion).toHaveBeenCalledTimes(1);
      expect(Application.nativeBuildVersion).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle Platform.OS being undefined', async () => {
      (Platform as any).OS = undefined;
      manager.clearCache();

      const result = await manager.getVersionInfo();
      expect(result.platform).toBeUndefined();
    });

    it('should handle completely missing expo-constants', async () => {
      (Platform as any).OS = 'web';
      (Constants as any).default = undefined;
      manager.clearCache();

      const result = await manager.getVersionInfo();
      
      expect(result.version).toBe('1.0.0');
      expect(result.buildNumber).toBe('1');
      expect(result.bundleId).toBe('com.pbsessions.app');
    });

    it('should handle completely missing expo-application', async () => {
      (Platform as any).OS = 'ios';
      (Application as any).nativeApplicationVersion = undefined;
      (Application as any).nativeBuildVersion = undefined;
      (Application as any).applicationId = undefined;
      manager.clearCache();

      const result = await manager.getVersionInfo();
      
      expect(result.version).toBe('1.0.0');
      expect(result.buildNumber).toBe('1');
      expect(result.bundleId).toBe('com.kmac5dev.pbsessions');
    });
  });

  describe('Console Logging', () => {
    it('should log current version during comparison', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await manager.compareVersion('1.0.0');
      
      expect(consoleSpy).toHaveBeenCalledWith('currentVersion: 2.1.0');
      
      consoleSpy.mockRestore();
    });
  });
});

