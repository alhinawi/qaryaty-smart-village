// ─── Site-wide settings (app_settings)
export interface SettingsRepo {
  /** Demo content visible? Defaults to true when the setting can't be read. */
  getDemoMode(): Promise<boolean>;
  setDemoMode(on: boolean): Promise<void>;
  /** واتساب الطلبات master switch. Defaults to OFF when the setting can't be
   * read (a notification feature fails closed, never open). */
  getWhatsappEnabled(): Promise<boolean>;
  setWhatsappEnabled(on: boolean): Promise<void>;
}
