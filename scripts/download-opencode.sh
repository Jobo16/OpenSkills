#!/bin/bash

# OpenSkill - 下载 OpenCode Sidecar 二进制文件
# 用法: ./scripts/download-opencode.sh [版本]

set -e

# 配置
OPENCODE_VERSION="${1:-latest}"
OPENCODE_REPO="https://github.com/anthropics/opencode"
BINARIES_DIR="src-tauri/binaries"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检测平台
detect_platform() {
    local os=$(uname -s)
    local arch=$(uname -m)

    case "$os" in
        Darwin)
            case "$arch" in
                arm64) echo "aarch64-apple-darwin" ;;
                x86_64) echo "x86_64-apple-darwin" ;;
                *) echo "unsupported" ;;
            esac
            ;;
        Linux)
            case "$arch" in
                x86_64) echo "x86_64-unknown-linux-gnu" ;;
                aarch64) echo "aarch64-unknown-linux-gnu" ;;
                *) echo "unsupported" ;;
            esac
            ;;
        MINGW*|MSYS*|CYGWIN*)
            case "$arch" in
                x86_64) echo "x86_64-pc-windows-msvc" ;;
                *) echo "unsupported" ;;
            esac
            ;;
        *)
            echo "unsupported"
            ;;
    esac
}

# 下载文件
download_file() {
    local url="$1"
    local output="$2"

    if command -v curl &> /dev/null; then
        curl -L -o "$output" "$url"
    elif command -v wget &> /dev/null; then
        wget -O "$output" "$url"
    else
        echo -e "${RED}错误: 需要 curl 或 wget${NC}"
        exit 1
    fi
}

# 主程序
main() {
    echo -e "${YELLOW}OpenSkill - OpenCode 下载器${NC}"
    echo ""

    # 检测平台
    local platform=$(detect_platform)
    if [ "$platform" = "unsupported" ]; then
        echo -e "${RED}错误: 不支持的平台 $(uname -s) $(uname -m)${NC}"
        exit 1
    fi

    echo -e "平台: ${GREEN}$platform${NC}"

    # 确定二进制文件名
    local binary_name="opencode"
    if [[ "$platform" == *"windows"* ]]; then
        binary_name="opencode.exe"
    fi

    local target_file="$BINARIES_DIR/opencode-$platform"
    if [[ "$platform" == *"windows"* ]]; then
        target_file="$BINARIES_DIR/opencode-$platform.exe"
    fi

    # 创建目录
    mkdir -p "$BINARIES_DIR"

    # 检查文件是否已存在
    if [ -f "$target_file" ]; then
        echo -e "${GREEN}✓ 二进制文件已存在: $target_file${NC}"
        echo ""
        read -p "是否重新下载？(y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "跳过下载"
            return 0
        fi
    fi

    # 构建下载 URL
    # 注意: 这里假设 OpenCode 提供预编译二进制文件
    # 实际的 URL 需要根据 OpenCode 的发布方式调整
    local download_url=""

    if [ "$OPENCODE_VERSION" = "latest" ]; then
        # 获取最新版本
        echo "获取最新版本..."
        # 这里需要实现获取最新版本的逻辑
        # 暂时使用固定版本
        OPENCODE_VERSION="0.1.0"
    fi

    # 构建下载 URL（需要根据实际情况调整）
    # 示例: https://github.com/anthropics/opencode/releases/download/v{VERSION}/opencode-{PLATFORM}.zip
    download_url="https://github.com/anthropics/opencode/releases/download/v${OPENCODE_VERSION}/opencode-${platform}.zip"

    echo "下载 OpenCode v$OPENCODE_VERSION..."
    echo "URL: $download_url"

    # 下载并解压
    local temp_dir=$(mktemp -d)
    local zip_file="$temp_dir/opencode.zip"

    download_file "$download_url" "$zip_file"

    # 解压
    echo "解压..."
    unzip -q "$zip_file" -d "$temp_dir"

    # 查找并移动二进制文件
    local extracted_binary=$(find "$temp_dir" -name "$binary_name" -type f | head -1)

    if [ -z "$extracted_binary" ]; then
        echo -e "${RED}错误: 找不到二进制文件${NC}"
        rm -rf "$temp_dir"
        exit 1
    fi

    # 复制到目标位置
    cp "$extracted_binary" "$target_file"
    chmod +x "$target_file"

    # 清理
    rm -rf "$temp_dir"

    echo ""
    echo -e "${GREEN}✓ 下载完成: $target_file${NC}"
    echo ""
    echo "文件大小: $(du -h "$target_file" | cut -f1)"
}

main "$@"
