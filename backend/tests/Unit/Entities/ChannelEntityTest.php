<?php

namespace Tests\Unit\Entities;

use App\Entities\ChannelEntity;
use CodeIgniter\Test\CIUnitTestCase;

class ChannelEntityTest extends CIUnitTestCase
{
    public function testCanCreateChannelEntity()
    {
        $data = [
            'id' => 1,
            'type' => 'line',
            'name' => 'Test Channel',
            'enabled' => 1,
            'config' => json_encode(['token' => 'abc']),
            'user_id' => 1,
            'created_at' => '2024-01-01 00:00:00',
            'updated_at' => '2024-01-01 00:00:00'
        ];

        $channel = new ChannelEntity($data);

        $this->assertEquals(1, $channel->id);
        $this->assertEquals('line', $channel->type);
        $this->assertTrue($channel->enabled);
        $this->assertEquals(1, $channel->userId);
        $this->assertEquals('abc', $channel->getConfigValue('token'));
    }

    public function testIsTypeHelperMethods()
    {
        $line = new ChannelEntity(['type' => 'line']);
        $telegram = new ChannelEntity(['type' => 'telegram']);

        $this->assertTrue($line->isLine());
        $this->assertFalse($line->isTelegram());

        $this->assertTrue($telegram->isTelegram());
        $this->assertFalse($telegram->isLine());
    }
}
