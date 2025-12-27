<?php

namespace Tests\Unit\Services;

use App\Services\UserService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

class UserServiceTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate     = true;
    protected $namespace   = 'App';
    private UserService $userService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->userService = new UserService();
    }

    public function testCreateUser()
    {
        $data = [
            'username' => 'newuser',
            'email' => 'new@example.com',
            'password' => 'secret123',
            'role' => 'user'
        ];

        $result = $this->userService->createUser($data);

        $this->assertTrue($result['success']);
        $this->assertEquals('newuser', $result['user']['username']);
    }

    public function testCreateDuplicateEmail()
    {
        $data = [
            'username' => 'u1',
            'email' => 'same@example.com',
            'password' => 'pass'
        ];

        $this->userService->createUser($data);
        $result = $this->userService->createUser($data);

        $this->assertFalse($result['success']);
        $this->assertEquals('CONFLICT', $result['error']);
    }

    public function testUpdateStatus()
    {
        $create = $this->userService->createUser([
            'username' => 'activeuser',
            'email' => 'active@example.com',
            'password' => 'pass'
        ]);

        $id = $create['user']['id'];
        $result = $this->userService->updateStatus($id, 'inactive');

        $this->assertTrue($result['success']);
        $this->assertEquals('inactive', $result['data']['status']);
    }
}
