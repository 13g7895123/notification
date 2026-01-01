<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use App\Repositories\MessageRepository;
use App\Repositories\ChannelRepository;
use App\Repositories\ChannelUserRepository;
use App\Entities\MessageEntity;

/**
 * 排程器守護進程
 * 
 * 用法：
 *   php spark scheduler:daemon         - 前台運行
 *   php spark scheduler:daemon --once  - 只執行一次（用於 cron job）
 * 
 * 功能：
 *   - 每分鐘檢查並處理已到期的排程訊息
 *   - 持續更新心跳檔案以表示排程器正在運行
 */
class SchedulerDaemon extends BaseCommand
{
    protected $group       = 'Tasks';
    protected $name        = 'scheduler:daemon';
    protected $description = '排程器守護進程 - 處理排程訊息並維護心跳';
    protected $usage       = 'scheduler:daemon [--once]';
    protected $arguments   = [];
    protected $options     = [
        '--once' => '只執行一次後退出（適用於 Cron Job）',
    ];

    private string $heartbeatFile;
    private string $pidFile;
    private string $logFile;
    private bool $running = true;

    private MessageRepository $messageRepository;
    private ChannelRepository $channelRepository;
    private ChannelUserRepository $channelUserRepository;

    public function run(array $params)
    {
        $this->heartbeatFile = WRITEPATH . 'pids/scheduler_heartbeat';
        $this->pidFile = WRITEPATH . 'pids/scheduler.pid';
        $this->logFile = WRITEPATH . 'logs/scheduler.log';

        $onceMode = CLI::getOption('once') !== null;

        // 初始化 Repositories
        $this->messageRepository = new MessageRepository();
        $this->channelRepository = new ChannelRepository();
        $this->channelUserRepository = new ChannelUserRepository();

        // 確保 pids 目錄存在
        if (!is_dir(WRITEPATH . 'pids')) {
            mkdir(WRITEPATH . 'pids', 0755, true);
        }

        if ($onceMode) {
            // 單次執行模式（適用於 Cron Job）
            $this->log('單次執行模式開始');
            $this->updateHeartbeat();
            $this->processScheduledMessages();
            $this->log('單次執行完成');
            return;
        }

        // 守護進程模式
        $this->startDaemon();
    }

    /**
     * 啟動守護進程
     */
    private function startDaemon(): void
    {
        // 檢查是否已有實例在運行
        if ($this->isAlreadyRunning()) {
            CLI::write('排程器已在運行中，PID: ' . file_get_contents($this->pidFile), 'yellow');
            return;
        }

        // 寫入 PID 檔案
        file_put_contents($this->pidFile, getmypid());

        // 設置信號處理（優雅關閉）
        if (function_exists('pcntl_signal')) {
            pcntl_signal(SIGTERM, [$this, 'handleSignal']);
            pcntl_signal(SIGINT, [$this, 'handleSignal']);
        }

        CLI::write('排程器守護進程已啟動', 'green');
        CLI::write('PID: ' . getmypid(), 'cyan');
        CLI::write('心跳檔案: ' . $this->heartbeatFile, 'cyan');
        CLI::write('按 Ctrl+C 停止...', 'yellow');
        CLI::newLine();

        $this->log('守護進程啟動，PID: ' . getmypid());

        $lastProcess = 0;

        while ($this->running) {
            // 更新心跳
            $this->updateHeartbeat();

            // 每 60 秒處理一次排程訊息
            $now = time();
            if ($now - $lastProcess >= 60) {
                $this->processScheduledMessages();
                $lastProcess = $now;
            }

            // 處理信號
            if (function_exists('pcntl_signal_dispatch')) {
                pcntl_signal_dispatch();
            }

            // 休眠 10 秒後再次檢查
            sleep(10);
        }

        // 清理
        $this->cleanup();
        CLI::write('排程器已停止', 'yellow');
        $this->log('守護進程停止');
    }

    /**
     * 更新心跳時間戳
     */
    private function updateHeartbeat(): void
    {
        file_put_contents($this->heartbeatFile, time());
    }

    /**
     * 處理已到期的排程訊息
     */
    private function processScheduledMessages(): void
    {
        try {
            $scheduledMessages = $this->messageRepository->getScheduledMessagesReady();

            if (empty($scheduledMessages)) {
                $this->log('沒有待處理的排程訊息');
                return;
            }

            $count = count($scheduledMessages);
            $this->log("找到 {$count} 筆待處理的排程訊息");
            CLI::write("處理 {$count} 筆排程訊息...", 'cyan');

            foreach ($scheduledMessages as $message) {
                $this->processMessage($message);
            }

            $this->log('排程訊息處理完成');
        } catch (\Exception $e) {
            $this->log('處理排程訊息時發生錯誤: ' . $e->getMessage(), 'error');
            CLI::write('錯誤: ' . $e->getMessage(), 'red');
        }
    }

    /**
     * 處理單一訊息
     */
    private function processMessage(MessageEntity $message): void
    {
        $this->log("處理訊息 ID: {$message->id} - {$message->title}");

        // 更新狀態為發送中
        $this->messageRepository->updateStatus($message->id, MessageEntity::STATUS_SENDING);

        // 取得 channel options
        $channelOptions = $this->messageRepository->getChannelOptions($message->id);

        $results = [];

        foreach ($message->channelIds as $channelId) {
            $channel = $this->channelRepository->find($channelId, $message->userId);

            if (!$channel || !$channel->enabled) {
                $this->messageRepository->addResult($message->id, $channelId, false, '渠道不存在或已停用');
                $results[] = ['success' => false];
                continue;
            }

            // 決定發送對象
            $targetUsers = [];
            $options = $channelOptions[$channelId] ?? ['type' => 'all'];

            if (($options['type'] ?? 'all') === 'selected' && !empty($options['users'])) {
                $targetUsers = $options['users'];
            } else {
                $users = $this->channelUserRepository->findByChannelId($channelId);
                $targetUsers = array_map(
                    fn($u) => $u->providerId,
                    array_filter($users, fn($u) => $u->status === 'active')
                );
            }

            // 向後兼容
            if (empty($targetUsers) && $channel->getConfigValue('targetId')) {
                $targetUsers = [$channel->getConfigValue('targetId')];
            }

            if (empty($targetUsers)) {
                $this->messageRepository->addResult($message->id, $channelId, false, '無發送對象');
                $results[] = ['success' => false];
                continue;
            }

            // 執行發送
            $sendResult = $this->sendToChannel($channel, $message->title, $message->content, $targetUsers);

            $this->messageRepository->addResult(
                $message->id,
                $channelId,
                $sendResult['success'],
                $sendResult['error'] ?? null
            );

            $results[] = $sendResult;

            if ($sendResult['success']) {
                $this->log("  渠道 {$channel->name}: 成功");
            } else {
                $this->log("  渠道 {$channel->name}: 失敗 - " . ($sendResult['error'] ?? '未知錯誤'));
            }
        }

        // 判斷最終狀態
        $successCount = count(array_filter($results, fn($r) => $r['success']));
        $totalCount = count($results);

        if ($totalCount === 0) {
            $finalStatus = MessageEntity::STATUS_FAILED;
        } elseif ($successCount === $totalCount) {
            $finalStatus = MessageEntity::STATUS_SENT;
        } elseif ($successCount > 0) {
            $finalStatus = MessageEntity::STATUS_PARTIAL;
        } else {
            $finalStatus = MessageEntity::STATUS_FAILED;
        }

        $this->messageRepository->updateStatus($message->id, $finalStatus, date('Y-m-d H:i:s'));
    }

    /**
     * 發送到指定渠道
     */
    private function sendToChannel($channel, string $title, string $content, array $targetUsers): array
    {
        try {
            if ($channel->isLine()) {
                return $this->sendToLine($channel, $title, $content, $targetUsers);
            } elseif ($channel->isTelegram()) {
                $successCount = 0;
                $errors = [];
                foreach ($targetUsers as $chatId) {
                    $res = $this->sendToTelegram($channel, $title, $content, $chatId);
                    if ($res['success']) {
                        $successCount++;
                    } else {
                        $errors[] = $res['error'] ?? 'Unknown error';
                    }
                }

                if ($successCount > 0) {
                    return ['success' => true];
                }
                return ['success' => false, 'error' => implode(', ', $errors)];
            }
            return ['success' => false, 'error' => '不支援的渠道類型'];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function sendToLine($channel, string $title, string $content, array $targetIds): array
    {
        try {
            $httpClient = new \LINE\Clients\MessagingApi\Api\MessagingApiApi(
                new \GuzzleHttp\Client(),
                \LINE\Clients\MessagingApi\Configuration::getDefaultConfiguration()
                    ->setAccessToken($channel->getConfigValue('channelAccessToken'))
            );

            $text = "📢 {$title}\n\n{$content}";

            $message = new \LINE\Clients\MessagingApi\Model\TextMessage([
                'type' => 'text',
                'text' => $text
            ]);

            $chunks = array_chunk($targetIds, 500);

            foreach ($chunks as $chunk) {
                $multicastRequest = new \LINE\Clients\MessagingApi\Model\MulticastRequest([
                    'to' => $chunk,
                    'messages' => [$message]
                ]);
                $httpClient->multicast($multicastRequest);
            }

            return ['success' => true];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function sendToTelegram($channel, string $title, string $content, string $chatId): array
    {
        try {
            $botToken = $channel->getConfigValue('botToken');
            $parseMode = $channel->getConfigValue('parseMode', 'HTML');

            $text = "📢 <b>{$title}</b>\n\n{$content}";
            if ($parseMode === 'Markdown') {
                $text = "📢 *{$title}*\n\n{$content}";
            }

            $url = "https://api.telegram.org/bot{$botToken}/sendMessage";

            $client = \Config\Services::curlrequest();
            $response = $client->post($url, [
                'form_params' => [
                    'chat_id' => $chatId,
                    'text' => $text,
                    'parse_mode' => $parseMode,
                ],
            ]);

            $result = json_decode($response->getBody(), true);

            if ($result['ok']) {
                return ['success' => true];
            } else {
                return ['success' => false, 'error' => $result['description'] ?? '未知錯誤'];
            }
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * 檢查是否已有排程器在運行
     */
    private function isAlreadyRunning(): bool
    {
        if (!file_exists($this->pidFile)) {
            return false;
        }

        $pid = (int) trim(file_get_contents($this->pidFile));

        // 檢查進程是否存在
        if (function_exists('posix_kill')) {
            return posix_kill($pid, 0);
        }

        // Windows 或無 posix 擴展時的備用方案
        return file_exists("/proc/{$pid}");
    }

    /**
     * 處理系統信號
     */
    public function handleSignal(int $signal): void
    {
        $this->log("收到信號: {$signal}，準備停止...");
        $this->running = false;
    }

    /**
     * 清理資源
     */
    private function cleanup(): void
    {
        if (file_exists($this->pidFile)) {
            unlink($this->pidFile);
        }
    }

    /**
     * 寫入日誌
     */
    private function log(string $message, string $level = 'info'): void
    {
        $timestamp = date('Y-m-d H:i:s');
        $logLine = "[{$timestamp}] [{$level}] {$message}" . PHP_EOL;

        file_put_contents($this->logFile, $logLine, FILE_APPEND | LOCK_EX);
    }
}
