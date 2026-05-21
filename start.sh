#!/bin/bash

# AI Toolbox 开发启动脚本
# 用法: ./start.sh [命令]
# 命令:
#   start  - 启动应用（默认）
#   stop   - 停止应用
#   restart - 重启应用
#   clean  - 清理所有进程

set -e

PROJECT_DIR="/Users/jobo/projects/opencode-dev/my-product"
LOG_FILE="/tmp/ai-toolbox.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 停止进程
stop_app() {
    echo -e "${YELLOW}Stopping application...${NC}"
    pkill -9 -f "vite" 2>/dev/null || true
    pkill -9 -f "ai-toolbox" 2>/dev/null || true
    sleep 2

    # 清理端口占用
    lsof -ti :1420 | xargs kill -9 2>/dev/null || true
    sleep 1

    echo -e "${GREEN}✓ Application stopped${NC}"
}

# 启动应用
start_app() {
    echo -e "${YELLOW}Starting application...${NC}"
    cd "$PROJECT_DIR"

    cargo tauri dev 2>&1 | tee "$LOG_FILE" &
    sleep 35

    if ps aux | grep ai-toolbox | grep -v grep > /dev/null; then
        echo -e "${GREEN}✓ Application started successfully${NC}"
        echo -e "Access: http://localhost:1420/"
        echo -e "Logs: tail -f $LOG_FILE"
    else
        echo -e "${RED}✗ Failed to start application${NC}"
        echo -e "Check logs: $LOG_FILE"
        exit 1
    fi
}

# 清理所有进程
clean_all() {
    echo -e "${YELLOW}Cleaning up all processes...${NC}"
    pkill -9 -f "vite" 2>/dev/null || true
    pkill -9 -f "ai-toolbox" 2>/dev/null || true
    pkill -9 -f "cargo" 2>/dev/null || true
    pkill -9 -f "node" 2>/dev/null || true
    sleep 3

    # 清理端口占用
    lsof -ti :1420 | xargs kill -9 2>/dev/null || true
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    sleep 1

    echo -e "${GREEN}✓ All processes cleaned up${NC}"
}

# 显示状态
show_status() {
    echo -e "${YELLOW}Application Status:${NC}"
    if ps aux | grep ai-toolbox | grep -v grep > /dev/null; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${RED}✗ Not running${NC}"
    fi

    echo ""
    echo -e "${YELLOW}Processes:${NC}"
    ps aux | grep -E "(ai-toolbox|vite)" | grep -v grep || echo "No processes found"
}

# 显示日志
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        tail -50 "$LOG_FILE"
    else
        echo "No logs found"
    fi
}

# 主程序
case "${1:-start}" in
    start)
        stop_app
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        stop_app
        start_app
        ;;
    clean)
        clean_all
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|clean|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start    - Start the application (default)"
        echo "  stop     - Stop the application"
        echo "  restart  - Restart the application"
        echo "  clean    - Kill all related processes"
        echo "  status   - Show application status"
        echo "  logs     - Show recent logs"
        exit 1
        ;;
esac
