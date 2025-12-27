<?php

namespace Tests\Unit\Repositories;

use App\Repositories\TemplateRepository;
use App\Repositories\UserRepository;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

class TemplateRepositoryTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate     = true;
    protected $namespace   = 'App';
    private TemplateRepository $templateRepository;
    private int $userId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->templateRepository = new TemplateRepository();

        // 建立測試使用者
        $userRepo = new UserRepository();
        $user = $userRepo->create([
            'username' => 'templatetest',
            'email' => 'template@example.com',
            'password' => 'password',
            'role' => 'user'
        ]);
        $this->userId = $user->id;
    }

    public function testCreateAndFindTemplate()
    {
        $data = [
            'name' => 'Welcome',
            'title' => 'Hello {name}',
            'content' => 'Welcome to our service!',
            'userId' => $this->userId
        ];

        $template = $this->templateRepository->create($data);
        $this->assertEquals('Welcome', $template->name);

        $found = $this->templateRepository->find($template->id, $this->userId);
        $this->assertNotNull($found);
        $this->assertEquals('Welcome', $found->name);
    }

    public function testFindTemplatesByUserId()
    {
        $this->templateRepository->create([
            'name' => 'T1',
            'title' => 'Title 1',
            'content' => 'Content 1',
            'userId' => $this->userId
        ]);

        $templates = $this->templateRepository->findByUserId($this->userId);
        $this->assertCount(1, $templates);
    }

    public function testIsolation()
    {
        // 建立當前使用者的模板
        $this->templateRepository->create([
            'name' => 'My Template',
            'title' => 'Title',
            'content' => 'Content',
            'userId' => $this->userId
        ]);

        // 建立另一個使用者
        $userRepo = new UserRepository();
        $otherUser = $userRepo->create([
            'username' => 'otheruser',
            'email' => 'other@example.com',
            'password' => 'password'
        ]);

        // 建立另一個使用者的模板
        $this->templateRepository->create([
            'name' => 'Other User Template',
            'title' => 'Title',
            'content' => 'Content',
            'userId' => $otherUser->id
        ]);

        $templates = $this->templateRepository->findByUserId($this->userId);
        $this->assertNotEmpty($templates);
        foreach ($templates as $t) {
            $this->assertNotEquals('Other User Template', $t->name);
        }
    }
}
