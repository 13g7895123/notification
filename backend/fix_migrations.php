<?php

// Prevent spark from running its own command
define('PHPUNIT_RUNNING', true);

// Bootstrap CodeIgniter 4
require_once __DIR__ . '/vendor/autoload.php';
$paths = new \Config\Paths();
require_once __DIR__ . '/system/Test/bootstrap.php';

$db = \Config\Database::connect();

$migrations = [
    ['2025-12-27-035700', 'App\Database\Migrations\CreateUsersTable'],
    ['2025-12-27-035701', 'App\Database\Migrations\CreateChannelsTable'],
    ['2025-12-27-035702', 'App\Database\Migrations\CreateMessagesTable'],
    ['2025-12-27-035703', 'App\Database\Migrations\CreateMessageResultsTable'],
    ['2025-12-27-035704', 'App\Database\Migrations\CreateTemplatesTable'],
    ['2025-12-27-035705', 'App\Database\Migrations\CreateApiKeysTable'],
    ['2025-12-27-035706', 'App\Database\Migrations\CreateApiUsageLogsTable'],
    ['2025-12-28-100000', 'App\Database\Migrations\CreateWindowsNotificationsTable'],
    ['2025-12-28-110000', 'App\Database\Migrations\AddDisplayNameToUsers'],
];

foreach ($migrations as $m) {
    // Check if exists
    $query = $db->table('migrations')->where('version', $m[0])->get();
    if ($query->getRow()) {
        echo "Version {$m[0]} already marked.\n";
        continue;
    }

    $db->table('migrations')->insert([
        'version'   => $m[0],
        'class'     => $m[1],
        'group'     => 'default',
        'namespace' => 'App',
        'time'      => time(),
        'batch'     => 1
    ]);
    echo "Marked {$m[0]} as migrated.\n";
}
