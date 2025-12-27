<?php

namespace Tests\Unit\Services;

use App\Services\AuthService;
use App\Repositories\UserRepository;
use App\Entities\UserEntity;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

class AuthServiceTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate     = true;
    protected $namespace   = 'App';
    private AuthService $authService;
    private UserRepository $userRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->authService = new AuthService();
        $this->userRepository = new UserRepository();
    }

    public function testLoginSuccess()
    {
        // 建立測試使用者
        $email = 'test@example.com';
        $password = 'password123';
        $this->userRepository->create([
            'username' => 'testuser',
            'email' => $email,
            'password' => $password,
            'role' => 'user',
            'status' => 'active'
        ]);

        $result = $this->authService->login($email, $password);

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('token', $result);
        $this->assertEquals($email, $result['user']['email']);
    }

    public function testLoginInvalidPassword()
    {
        $email = 'test@example.com';
        $password = 'password123';
        $this->userRepository->create([
            'username' => 'testuser',
            'email' => $email,
            'password' => $password,
            'role' => 'user',
            'status' => 'active'
        ]);

        $result = $this->authService->login($email, 'wrongpassword');

        $this->assertFalse($result['success']);
        $this->assertEquals('INVALID_CREDENTIALS', $result['error']);
    }

    public function testLoginDisabledAccount()
    {
        $email = 'disabled@example.com';
        $password = 'password123';
        $this->userRepository->create([
            'username' => 'disableduser',
            'email' => $email,
            'password' => $password,
            'role' => 'user',
            'status' => 'inactive'
        ]);

        $result = $this->authService->login($email, $password);

        $this->assertFalse($result['success']);
        $this->assertEquals('ACCOUNT_DISABLED', $result['error']);
    }

    public function testVerifyToken()
    {
        $user = new UserEntity([
            'id' => 123,
            'email' => 'test@example.com',
            'role' => 'admin'
        ]);

        $token = $this->authService->generateToken($user);
        $decoded = $this->authService->verifyToken($token);

        $this->assertNotNull($decoded);
        $this->assertEquals(123, $decoded['sub']);
        $this->assertEquals('admin', $decoded['role']);
    }
}
