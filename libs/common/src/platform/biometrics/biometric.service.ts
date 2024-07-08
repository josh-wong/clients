export abstract class BiometricsService {
  abstract supportsBiometric(): Promise<boolean>;
  abstract isBiometricUnlockAvailable(): Promise<boolean>;
  abstract authenticateBiometric(): Promise<boolean>;
}
