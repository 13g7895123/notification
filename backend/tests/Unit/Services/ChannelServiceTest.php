<?php

namespace Tests\Unit\Services;

use App\Services\ChannelService;
use App\Repositories\UserRepository;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

class ChannelServiceTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate     = true;
    protected $namespace   = 'App';
    private ChannelService $channelService;
    private int $userId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->channelService = new ChannelService();

        // 建立測試使用者
        $userRepo = new UserRepository();
        $user = $userRepo->create([
            'username' => 'channeltest',
            'email' => 'channel@example.com',
            'password' => 'password',
            'role' => 'user'
        ]);
        $this->userId = $user->id;
    }

    public function testCreateChannel()
    {
        $data = [
            'type' => 'line',
            'name' => 'My LINE',
            'config' => ['channelAccessToken' => 'token123', 'targetId' => 'U123']
        ];

        $result = $this->channelService->createChannel($data, $this->userId);

        $this->assertTrue($result['success']);
        $this->assertEquals('line', $result['channel']['type']);
        $this->assertEquals($this->userId, (new \App\Entities\ChannelEntity($result['channel']))->userId);
    }

    public function testGetChannelsByUserId()
    {
        // 建立兩個渠道
        $this->channelService->createChannel([
            'type' => 'line',
            'name' => 'L1',
            'config' => ['token' => 't1']
        ], $this->userId);

        $this->channelService->createChannel([
            'type' => 'telegram',
            'name' => 'T1',
            'config' => ['token' => 't2']
        ], $this->userId);

        $channels = $this->channelService->getChannelsByUserId($this->userId);

        $this->assertCount(2, $channels);
    }

    public function testUpdateChannel()
    {
        $result = $this->channelService->createChannel([
            'type' => 'line',
            'name' => 'Old Name',
            'config' => ['token' => 't1']
        ], $this->userId);

        $id = $result['channel']['id'];

        $updateResult = $this->channelService->updateChannel($id, ['name' => 'New Name'], $this->userId);

        $this->assertTrue($updateResult['success']);
        $this->assertEquals('New Name', $updateResult['channel']['name']);
    }

    public function testDeleteChannel()
    {
        $result = $this->channelService->createChannel([
            'type' => 'line',
            'name' => 'To Delete',
            'config' => ['token' => 't1']
        ], $this->userId);

        $id = $result['channel']['id'];

        $deleteResult = $this->channelService->deleteChannel($id, $this->userId);
        $this->assertTrue($deleteResult['success']);

        $channel = $this->channelService->getChannel($id, $this->userId);
        $this->assertNull($channel);
    }
}
