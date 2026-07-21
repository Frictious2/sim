const { getPool } = require('../config/database');

class SiteSetting {
  static async findAll() {
    const [rows] = await getPool().query('SELECT * FROM site_settings ORDER BY setting_group ASC, setting_key ASC');
    return rows;
  }

  static async findByKey(settingKey) {
    const [rows] = await getPool().query('SELECT * FROM site_settings WHERE setting_key = ? LIMIT 1', [settingKey]);
    return rows[0] || null;
  }

  static async upsert(settingKey, settingValue, settingGroup = null) {
    await getPool().query(
      `INSERT INTO site_settings (setting_key, setting_value, setting_group)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         setting_value = VALUES(setting_value),
         setting_group = VALUES(setting_group),
         updated_at = CURRENT_TIMESTAMP`,
      [settingKey, settingValue, settingGroup]
    );
    return this.findByKey(settingKey);
  }

  static async upsertMany(settings = []) {
    for (const item of settings) {
      await this.upsert(item.settingKey, item.settingValue, item.settingGroup || null);
    }
  }
}

module.exports = SiteSetting;
