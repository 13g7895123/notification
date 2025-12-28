<?php

namespace App\Controllers;

use App\Repositories\ChannelRepository;
use CodeIgniter\API\ResponseTrait;

class WebhookController extends BaseController
{
    use ResponseTrait;

    private ChannelRepository $channelRepository;

    public function __construct()
    {
        $this->channelRepository = new ChannelRepository();
    }

    /**
     * POST /api/webhook/line?key=xxx
     */
    public function line()
    {
        $key = $this->request->getGet('key');

        if (!$key) {
            return $this->fail('Missing key', 400);
        }

        // 雖然目前只是接收，但我們可以預留處理邏輯
        // 查找對應的渠道
        // $channel = $this->db->table('channels')->where('webhook_key', $key)->get()->getRow();

        // 返回 200 OK 給 LINE
        return $this->respond(['status' => 'ok']);
    }
}
