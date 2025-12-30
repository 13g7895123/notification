<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

/**
 * 版本控制器
 * 提供應用程式版本資訊和 Git 提交歷史
 */
class VersionController extends BaseController
{
    /**
     * 取得當前版本資訊
     */
    public function current(): ResponseInterface
    {
        $version = $this->getVersionFromGit();

        return $this->response->setJSON([
            'success' => true,
            'data' => $version
        ]);
    }

    /**
     * 取得更新歷史（Git 提交記錄）
     */
    public function history(): ResponseInterface
    {
        $limit = (int) ($this->request->getGet('limit') ?? 50);
        $limit = min(max($limit, 1), 100); // 限制在 1-100 之間

        $commits = $this->getGitCommits($limit);

        return $this->response->setJSON([
            'success' => true,
            'data' => [
                'commits' => $commits,
                'total' => count($commits)
            ]
        ]);
    }

    /**
     * 從 Git 取得版本資訊
     */
    private function getVersionFromGit(): array
    {
        $projectRoot = ROOTPATH;

        // 取得最新的 tag（如果有的話）
        $tag = $this->executeGitCommand('describe --tags --abbrev=0 2>/dev/null || echo ""', $projectRoot);

        // 取得提交數量
        $commitCount = (int) $this->executeGitCommand('rev-list --count HEAD 2>/dev/null || echo "0"', $projectRoot);

        // 取得最新提交的短 hash
        $shortHash = $this->executeGitCommand('rev-parse --short HEAD 2>/dev/null || echo "unknown"', $projectRoot);

        // 取得最新提交的完整 hash
        $fullHash = $this->executeGitCommand('rev-parse HEAD 2>/dev/null || echo "unknown"', $projectRoot);

        // 取得最新提交的時間
        $lastCommitDate = $this->executeGitCommand('log -1 --format=%ci 2>/dev/null || echo ""', $projectRoot);

        // 取得當前分支
        $branch = $this->executeGitCommand('rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"', $projectRoot);

        // 取得最新提交訊息
        $lastCommitMessage = $this->executeGitCommand('log -1 --format=%s 2>/dev/null || echo ""', $projectRoot);

        // 計算版本號
        // 格式: 1.major.minor，其中 minor 是提交數量
        // 根據 tag 或提交數量計算
        if (!empty($tag)) {
            $version = $tag;
        } else {
            // 沒有 tag 時，使用提交數量計算版本
            // 每 100 次提交增加一個次版本號
            $major = (int) floor($commitCount / 100);
            $minor = $commitCount % 100;
            $version = "1.{$major}.{$minor}";
        }

        return [
            'version' => $version,
            'commitCount' => $commitCount,
            'shortHash' => $shortHash,
            'fullHash' => $fullHash,
            'lastCommitDate' => $lastCommitDate,
            'lastCommitMessage' => $lastCommitMessage,
            'branch' => $branch,
            'displayVersion' => "{$version} ({$shortHash})"
        ];
    }

    /**
     * 取得 Git 提交記錄
     */
    private function getGitCommits(int $limit): array
    {
        $projectRoot = ROOTPATH;

        // 使用自訂格式取得提交記錄
        // 格式: hash|shortHash|author|date|message
        $format = '%H|%h|%an|%ci|%s';
        $output = $this->executeGitCommand(
            "log --format=\"{$format}\" -n {$limit} 2>/dev/null",
            $projectRoot
        );

        if (empty($output)) {
            return [];
        }

        $lines = array_filter(explode("\n", $output));
        $commits = [];

        foreach ($lines as $line) {
            $parts = explode('|', $line, 5);
            if (count($parts) === 5) {
                // 解析提交訊息中的類型
                $message = $parts[4];
                $type = $this->parseCommitType($message);

                $commits[] = [
                    'hash' => $parts[0],
                    'shortHash' => $parts[1],
                    'author' => $parts[2],
                    'date' => $parts[3],
                    'message' => $message,
                    'type' => $type,
                    'typeLabel' => $this->getCommitTypeLabel($type)
                ];
            }
        }

        return $commits;
    }

    /**
     * 解析提交類型（Conventional Commits）
     */
    private function parseCommitType(string $message): string
    {
        // 匹配 Conventional Commit 格式: type(scope): description
        if (preg_match('/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+?\))?:/', $message, $matches)) {
            return $matches[1];
        }

        return 'other';
    }

    /**
     * 取得提交類型的標籤
     */
    private function getCommitTypeLabel(string $type): string
    {
        $labels = [
            'feat' => '新功能',
            'fix' => '修復',
            'docs' => '文件',
            'style' => '樣式',
            'refactor' => '重構',
            'perf' => '效能',
            'test' => '測試',
            'build' => '建置',
            'ci' => 'CI/CD',
            'chore' => '雜項',
            'revert' => '還原',
            'other' => '其他'
        ];

        return $labels[$type] ?? $labels['other'];
    }

    /**
     * 執行 Git 命令
     */
    private function executeGitCommand(string $command, string $cwd): string
    {
        $fullCommand = "cd {$cwd} && git {$command}";
        $output = shell_exec($fullCommand);

        return trim($output ?? '');
    }
}
