# AI 工具箱 - 开发命令

# 默认命令
default:
    @just --list

# 安装依赖
install:
    bun install

# 启动开发服务器
dev:
    bun run dev

# 启动 Tauri 开发模式
tauri-dev:
    cargo tauri dev

# 构建前端
build:
    bun run build

# 构建 Tauri 应用
tauri-build:
    cargo tauri build

# 构建特定平台
tauri-build-mac:
    cargo tauri build --target universal-apple-darwin

tauri-build-win:
    cargo tauri build --target x86_64-pc-windows-msvc

tauri-build-linux:
    cargo tauri build --target x86_64-unknown-linux-gnu

# 代码检查
check:
    bun run build
    cargo check

# Rust 检查
clippy:
    cargo clippy

# 格式化代码
fmt:
    cargo fmt
    bunx prettier --write src/

# 运行测试
test:
    bun test
    cargo test

# 运行前端测试
test-frontend:
    bun test

# 运行 Rust 测试
test-rust:
    cargo test

# 运行 Tauri 测试
test-tauri:
    cargo test -p ai-toolbox

# 清理构建文件
clean:
    rm -rf dist
    rm -rf src-tauri/target
    rm -rf node_modules

# 重新安装依赖
reinstall:
    rm -rf node_modules
    rm -f bun.lock
    bun install

# 检查依赖更新
deps-update:
    bun update
    cargo update

# 启动 Storybook
storybook:
    bun run dev:storybook

# 构建 Storybook
storybook-build:
    bun run build:storybook

# 检查 TypeScript
typecheck:
    bunx tsc --noEmit

# 检查 Rust 类型
rust-check:
    cargo check

# 运行 linter
lint:
    bunx eslint src/
    cargo clippy

# 修复 linter 问题
lint-fix:
    bunx eslint --fix src/
    cargo clippy --fix

# 生成文档
docs:
    cargo doc --open

# 检查安全漏洞
audit:
    bun audit
    cargo audit

# 更新依赖版本
deps-upgrade:
    bun update
    cargo update

# 检查过时依赖
deps-outdated:
    bun outdated
    cargo outdated

# 启动开发服务器（带调试）
dev-debug:
    RUST_LOG=debug cargo tauri dev

# 启动开发服务器（带详细日志）
dev-verbose:
    RUST_LOG=trace cargo tauri dev

# 构建调试版本
build-debug:
    bun run build
    cargo tauri build --debug

# 构建发布版本
build-release:
    bun run build
    cargo tauri build

# 检查构建产物
check-build:
    ls -la src-tauri/target/release/bundle/

# 清理并重新构建
rebuild: clean install build tauri-build

# 运行所有检查
check-all: typecheck clippy test

# 准备发布
release: check-all build-release
    @echo "Release build complete!"

# 提交代码
commit message:
    git add .
    git commit -m "{{message}}"

# 推送代码
push:
    git push

# 创建 PR
pr:
    gh pr create

# 查看 Git 状态
status:
    git status

# 查看 Git 日志
log:
    git log --oneline -10

# 创建新分支
branch name:
    git checkout -b "{{name}}"

# 切换分支
switch branch:
    git checkout "{{branch}}"

# 合并分支
merge branch:
    git merge "{{branch}}"

# 解决冲突
conflict:
    git mergetool

# 查看差异
diff:
    git diff

# 暂存更改
stash:
    git stash

# 恢复暂存
stash-pop:
    git stash pop

# 查看远程
remote:
    git remote -v

# 拉取最新
pull:
    git pull

# 推送并设置上游
push-set-upstream branch:
    git push -u origin "{{branch}}"

# 查看帮助
help:
    @echo "AI 工具箱开发命令:"
    @echo ""
    @echo "  just install      - 安装依赖"
    @echo "  just dev          - 启动开发服务器"
    @echo "  just tauri-dev    - 启动 Tauri 开发模式"
    @echo "  just build        - 构建前端"
    @echo "  just tauri-build  - 构建 Tauri 应用"
    @echo "  just check        - 代码检查"
    @echo "  just test         - 运行测试"
    @echo "  just clean        - 清理构建文件"
    @echo "  just lint         - 运行 linter"
    @echo "  just fmt          - 格式化代码"
    @echo ""
    @echo "  just help         - 显示此帮助"
