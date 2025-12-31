<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

/**
 * 版本控制器
 * 提供應用程式版本資訊和 Git 提交歷史
 * 
 * 優先從靜態 JSON 檔案讀取（生產環境），
 * 如果檔案不存在則嘗試從 Git 取得（開發環境）
 */
class VersionController extends BaseController
{
    private string $versionFile;
    private string $historyFile;

    public function __construct()
    {
        $this->versionFile = ROOTPATH . 'version.json';
        $this->historyFile = ROOTPATH . 'version-history.json';
    }

    /**
     * 取得當前版本資訊
     */
    public function current(): ResponseInterface
    {
        // 優先從檔案讀取
        if (file_exists($this->versionFile)) {
            $content = file_get_contents($this->versionFile);
            $version = json_decode($content, true);

            if ($version) {
                return $this->response->setJSON([
                    'success' => true,
                    'data' => $version
                ]);
            }
        }

        // 備選：從 Git 取得（開發環境）
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
        $limit = min(max($limit, 1), 100);

        // 優先從檔案讀取
        if (file_exists($this->historyFile)) {
            $content = file_get_contents($this->historyFile);
            $history = json_decode($content, true);

            if ($history && isset($history['commits'])) {
                // 根據 limit 截取
                $commits = array_slice($history['commits'], 0, $limit);
                return $this->response->setJSON([
                    'success' => true,
                    'data' => [
                        'commits' => $commits,
                        'total' => count($commits)
                    ]
                ]);
            }
        }

        // 備選：從 Git 取得（開發環境）
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
     * 從 Git 取得版本資訊（開發環境用）
     */
    private function getVersionFromGit(): array
    {
        $projectRoot = ROOTPATH;

        // 檢查是否在 Git 倉庫中
        $gitDir = $projectRoot . '.git';
        if (!is_dir($gitDir)) {
            return $this->getDefaultVersion();
        }

        $tag = $this->executeGitCommand('describe --tags --abbrev=0 2>/dev/null || echo ""', $projectRoot);
        $commitCount = (int) $this->executeGitCommand('rev-list --count HEAD 2>/dev/null || echo "0"', $projectRoot);
        $shortHash = $this->executeGitCommand('rev-parse --short HEAD 2>/dev/null || echo "unknown"', $projectRoot);
        $fullHash = $this->executeGitCommand('rev-parse HEAD 2>/dev/null || echo "unknown"', $projectRoot);
        $lastCommitDate = $this->executeGitCommand('log -1 --format=%ci 2>/dev/null || echo ""', $projectRoot);
        $branch = $this->executeGitCommand('rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"', $projectRoot);
        $lastCommitMessage = $this->executeGitCommand('log -1 --format=%s 2>/dev/null || echo ""', $projectRoot);

        if (!empty($tag)) {
            $version = $tag;
        } else {
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
     * 取得預設版本資訊（無 Git 時使用）
     */
    private function getDefaultVersion(): array
    {
        return [
            'version' => '1.0.0',
            'commitCount' => 0,
            'shortHash' => 'unknown',
            'fullHash' => 'unknown',
            'lastCommitDate' => date('Y-m-d H:i:s'),
            'lastCommitMessage' => '版本資訊不可用',
            'branch' => 'unknown',
            'displayVersion' => '1.0.0 (unknown)',
            'note' => '請執行 scripts/generate-version.sh 生成版本資訊'
        ];
    }

    /**
     * 取得 Git 提交記錄（開發環境用）
     */
    private function getGitCommits(int $limit): array
    {
        $projectRoot = ROOTPATH;

        $gitDir = $projectRoot . '.git';
        if (!is_dir($gitDir)) {
            return [];
        }

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
