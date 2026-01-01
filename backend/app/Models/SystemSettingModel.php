<?php

namespace App\Models;

use CodeIgniter\Model;

class SystemSettingModel extends Model
{
    protected $table            = 'system_settings';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['key', 'value', 'type', 'description', 'updated_at'];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    /**
     * 取得設定值
     */
    public function get(string $key, $default = null)
    {
        $setting = $this->where('key', $key)->first();

        if (!$setting) {
            return $default;
        }

        return $this->castValue($setting['value'], $setting['type']);
    }

    /**
     * 設定值
     */
    public function set(string $key, $value): bool
    {
        $existing = $this->where('key', $key)->first();

        if ($existing) {
            return $this->update($existing['id'], [
                'value' => (string) $value,
                'updated_at' => date('Y-m-d H:i:s')
            ]);
        }

        return false;
    }

    /**
     * 批次取得設定
     */
    public function getMultiple(array $keys): array
    {
        $settings = $this->whereIn('key', $keys)->findAll();
        $result = [];

        foreach ($settings as $setting) {
            $result[$setting['key']] = $this->castValue($setting['value'], $setting['type']);
        }

        return $result;
    }

    /**
     * 取得所有設定
     */
    public function getAll(): array
    {
        $settings = $this->findAll();
        $result = [];

        foreach ($settings as $setting) {
            $result[$setting['key']] = [
                'value' => $this->castValue($setting['value'], $setting['type']),
                'type' => $setting['type'],
                'description' => $setting['description']
            ];
        }

        return $result;
    }

    /**
     * 型別轉換
     */
    private function castValue($value, string $type)
    {
        switch ($type) {
            case 'integer':
                return (int) $value;
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            case 'json':
                return json_decode($value, true);
            default:
                return $value;
        }
    }
}
