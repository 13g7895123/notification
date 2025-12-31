#!/bin/bash

# 生成版本資訊的腳本
# 在部署時執行，將 Git 資訊寫入 version.json

# 取得腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 輸出檔案位置
OUTPUT_FILE="${PROJECT_ROOT}/backend/version.json"
HISTORY_FILE="${PROJECT_ROOT}/backend/version-history.json"

echo "📦 生成版本資訊..."

# 取得 Git 資訊
TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
SHORT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
FULL_HASH=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
LAST_COMMIT_DATE=$(git log -1 --format=%ci 2>/dev/null || echo "")
LAST_COMMIT_MESSAGE=$(git log -1 --format=%s 2>/dev/null || echo "")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
AUTHOR=$(git log -1 --format=%an 2>/dev/null || echo "unknown")

# 計算版本號
if [ -n "$TAG" ]; then
    VERSION="$TAG"
else
    MAJOR=$((COMMIT_COUNT / 100))
    MINOR=$((COMMIT_COUNT % 100))
    VERSION="1.${MAJOR}.${MINOR}"
fi

# 取得構建時間
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 生成版本 JSON 檔案
cat > "$OUTPUT_FILE" << EOF
{
    "version": "${VERSION}",
    "commitCount": ${COMMIT_COUNT},
    "shortHash": "${SHORT_HASH}",
    "fullHash": "${FULL_HASH}",
    "lastCommitDate": "${LAST_COMMIT_DATE}",
    "lastCommitMessage": "${LAST_COMMIT_MESSAGE}",
    "lastCommitAuthor": "${AUTHOR}",
    "branch": "${BRANCH}",
    "displayVersion": "${VERSION} (${SHORT_HASH})",
    "buildTime": "${BUILD_TIME}"
}
EOF

echo "✅ 版本資訊已寫入: $OUTPUT_FILE"
echo "   版本: ${VERSION}"
echo "   Commit: ${SHORT_HASH}"
echo "   分支: ${BRANCH}"

# 生成提交歷史 JSON 檔案
echo ""
echo "📝 生成提交歷史..."

# 使用 Python（如果有的話）或簡單的 Bash
if command -v python3 &> /dev/null; then
    python3 << 'PYTHON_SCRIPT'
import subprocess
import json
import re

def get_type_label(t):
    labels = {
        'feat': '新功能', 'fix': '修復', 'docs': '文件',
        'style': '樣式', 'refactor': '重構', 'perf': '效能',
        'test': '測試', 'build': '建置', 'ci': 'CI/CD',
        'chore': '雜項', 'revert': '還原'
    }
    return labels.get(t, '其他')

def parse_type(msg):
    match = re.match(r'^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+?\))?:', msg)
    if match:
        return match.group(1)
    return 'other'

result = subprocess.run(
    ['git', 'log', '--format=%H|%h|%an|%ci|%s', '-n', '100'],
    capture_output=True, text=True
)

commits = []
for line in result.stdout.strip().split('\n'):
    if not line:
        continue
    parts = line.split('|', 4)
    if len(parts) == 5:
        msg = parts[4]
        t = parse_type(msg)
        commits.append({
            'hash': parts[0],
            'shortHash': parts[1],
            'author': parts[2],
            'date': parts[3],
            'message': msg,
            'type': t,
            'typeLabel': get_type_label(t)
        })

import os
script_dir = os.path.dirname(os.path.abspath(__file__)) if '__file__' in dir() else os.getcwd()
project_root = os.environ.get('PROJECT_ROOT', os.path.dirname(script_dir))
history_file = os.path.join(project_root, 'backend', 'version-history.json')

with open(history_file, 'w', encoding='utf-8') as f:
    json.dump({'commits': commits, 'total': len(commits)}, f, ensure_ascii=False, indent=2)

print(f"✅ 提交歷史已寫入: {history_file}")
print(f"   共 {len(commits)} 筆記錄")
PYTHON_SCRIPT
else
    # 簡化版：直接用 Bash 生成基本 JSON
    echo '{"commits": [], "total": 0, "note": "Python not available for full history"}' > "$HISTORY_FILE"
    echo "⚠️ Python 不可用，已生成空的歷史檔案"
fi

echo ""
echo "🎉 版本資訊生成完成！"
