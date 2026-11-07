// ─── Site-wide settings (app_settings)
export interface SettingsRepo {
  /** Demo content visible? Defaults to true when the setting can't be read. */
  getDemoMode(): Promise<boolean>;
  setDemoMode(on: boolean): Promise<void>;
}
