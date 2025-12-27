<?php

namespace Tests\Unit\Repositories;

use App\Repositories\ApiKeyRepository;
use App\Repositories\UserRepository;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

class ApiKeyRepositoryTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate     = true;
    protected $namespace   = 'App';
    private ApiKeyRepository $apiKeyRepository;
    private int $userId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->apiKeyRepository = new ApiKeyRepository();

        // 建立測試使用者
        $userRepo = new UserRepository();
        $user = $userRepo->create([
            'username' => 'apikeytest',
            'email' => 'apikey@example.com',
            'password' => 'password',
            'role' => 'user'
        ]);
        $this->userId = $user->id;
    }

    public function testCreateApiKey()
    {
        $data = [
            'name' => 'Test API Key',
            'permissions' => ['send', 'read_logs'],
            'userId' => $this->userId
        ];

        $result = $this->apiKeyRepository->create($data);

        $this->assertNotEmpty($result['fullKey']);
        $this->assertEquals('Test API Key', $result['entity']->name);
        $this->assertEquals($this->userId, $result['entity']->userId);
    }

    public function testVerifyKey()
    {
        $created = $this->apiKeyRepository->create([
            'name' => 'Verify Test',
            'userId' => $this->userId
        ]);

        $fullKey = $created['fullKey'];
        $hash = hash('sha256', $fullKey);

        $found = $this->apiKeyRepository->findByKeyHash($hash);

        $this->assertNotNull($found);
        $this->assertEquals($this->userId, $found->userId);
    }

    public function testInvalidKey()
    {
        $found = $this->apiKeyRepository->findByKeyHash('invalid_hash');
        $this->assertNull($found);
    }
}
