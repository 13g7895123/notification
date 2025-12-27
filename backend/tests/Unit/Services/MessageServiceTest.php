<?php

namespace Tests\Unit\Services;

use App\Services\MessageService;
use App\Services\ChannelService;
use App\Repositories\UserRepository;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

class MessageServiceTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate     = true;
    protected $namespace   = 'App';
    private MessageService $messageService;
    private int $userId;
    private int $channelId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->messageService = new MessageService();
        $channelService = new ChannelService();

        // 建立測試使用者
        $userRepo = new UserRepository();
        $user = $userRepo->create([
            'username' => 'msgtest',
            'email' => 'msg@example.com',
            'password' => 'password',
            'role' => 'user'
        ]);
        $this->userId = $user->id;

        // 建立測試渠道
        $channelResult = $channelService->createChannel([
            'type' => 'line',
            'name' => 'Test Channel',
            'config' => ['targetId' => 'U123']
        ], $this->userId);
        $this->channelId = $channelResult['channel']['id'];
    }

    public function testSendMessageValidation()
    {
        $result = $this->messageService->sendMessage([], $this->userId);
        $this->assertFalse($result['success']);
        $this->assertEquals('VALIDATION_ERROR', $result['error']);
    }

    public function testGetMessagesPagination()
    {
        $result = $this->messageService->sendMessage([
            'title' => 'Test Message',
            'content' => 'Content',
            'channelIds' => [$this->channelId]
        ], $this->userId);

        $this->assertTrue($result['success']);

        $messages = $this->messageService->getMessages(['user_id' => $this->userId]);
        $this->assertGreaterThanOrEqual(1, $messages['total']);
    }

    public function testDeleteMessage()
    {
        $result = $this->messageService->sendMessage([
            'title' => 'To Delete',
            'content' => 'Content',
            'channelIds' => [$this->channelId]
        ], $this->userId);

        $id = $result['messageId'];
        $deleteResult = $this->messageService->deleteMessage($id);

        $this->assertTrue($deleteResult['success']);
    }
}
