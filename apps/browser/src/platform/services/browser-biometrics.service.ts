import { Injectable } from "@angular/core";

import { BiometricsService } from "@bitwarden/common/platform/biometrics/biometric.service";

import { BrowserApi } from "../browser/browser-api";

@Injectable()
export class BrowserBiometricsService extends BiometricsService {
  constructor(
    private biometricCallback: () => Promise<boolean>,
    private biometricUnlockAvailableCallback: () => Promise<boolean>,
  ) {
    super();
  }

  async supportsBiometric() {
    const platformInfo = await BrowserApi.getPlatformInfo();
    if (platformInfo.os === "mac" || platformInfo.os === "win") {
      return true;
    }
    return false;
  }

  authenticateBiometric(): Promise<boolean> {
    return this.biometricCallback();
  }

  isBiometricUnlockAvailable(): Promise<boolean> {
    return this.biometricUnlockAvailableCallback();
  }
}
