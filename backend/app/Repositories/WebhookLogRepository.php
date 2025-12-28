<?php

namespace App\Repositories;

use App\Entities\WebhookLogEntity;
use CodeIgniter\Model;

class WebhookLogRepository extends Model
{
    protected $table            = 'webhook_logs';
    protected $primaryKey       = 'id';
    protected $returnType       = WebhookLogEntity::class;
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'channel_id',
        'method',
        'url',
        'headers',
        'payload',
        'response_status',
        'response_body',
        'ip_address',
        'created_at'
    ];

    // Dates
    protected $useTimestamps = false; // We manage created_at manually or via set

    public function log(
        ?int $channelId,
        string $method,
        string $url,
        array $headers,
        $payload,
        int $responseStatus,
        $responseBody,
        string $ip
    ): int {
        $encodedHeaders = json_encode($headers);
        $encodedPayload = is_array($payload) || is_object($payload) ? json_encode($payload) : $payload;
        $encodedResponse = is_array($responseBody) || is_object($responseBody) ? json_encode($responseBody) : $responseBody;

        // Ensure payload is valid JSON or null string
        if (is_string($encodedPayload) && !json_decode($encodedPayload) && json_last_error() !== JSON_ERROR_NONE) {
            // force string if not valid json? existing payload might be raw string
        }

        // CodeIgniter automatically handles specific db types if entity cast is set, but we are inserting raw mostly.

        $data = [
            'channel_id'      => $channelId,
            'method'          => $method,
            'url'             => $url,
            'headers'         => $encodedHeaders,
            'payload'         => is_array($payload) ? json_encode($payload) : $payload, // Ensure json
            'response_status' => $responseStatus,
            'response_body'   => $encodedResponse,
            'ip_address'      => $ip,
            'created_at'      => date('Y-m-d H:i:s'),
        ];

        return $this->insert($data);
    }

    public function findByChannelId(int $channelId, int $limit = 50, int $offset = 0)
    {
        return $this->where('channel_id', $channelId)
            ->orderBy('created_at', 'DESC')
            ->findAll($limit, $offset);
    }
}
