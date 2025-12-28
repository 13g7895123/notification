<?php

namespace App\Entities;

use CodeIgniter\Entity\Entity;

class WebhookLogEntity extends Entity
{
    protected $datamap = [];

    protected $dates   = ['created_at'];

    protected $casts   = [
        'id'              => 'integer',
        'channel_id'      => 'integer',
        'response_status' => 'integer',
        'payload'         => 'json', // Auto cast JSON to array
    ];
}
