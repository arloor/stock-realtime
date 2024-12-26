## A 股实时行情

每 3 秒定时刷新 A 股行情，支持多个股票代码，支持设置持仓以计算当日盈亏。

不存储任何数据，使用公开行情数据 api（新浪财经）。

基于 Next.js 开发，服务端渲染技术。

## 表格视图

![alt text](image-1.png)

## 卡片视图

![alt text](image.png)

## 移动端

![alt text](image-2.png)

## 运行

```bash
podman run -it --name stock-realtime --rm --replace --pull=newer --network host docker.io/arloor/stock-realtime
## 指定端口
podman run -it --name stock-realtime --rm --replace --pull=newer --network host -e PORT=3000 docker.io/arloor/stock-realtime
## 后台运行
podman run -d --name stock-realtime --rm --replace --pull=newer --network host docker.io/arloor/stock-realtime
## 用systemd管理podman容器
podman generate systemd --new --name stock-realtime| tee /lib/systemd/system/stock.service
systemctl daemon-reload
systemctl enable stock --now
```

访问 http://your_ip:9999/?code=sz399001&code=sh000001&autoRefresh=true

## 调试

```bash
npm install -g pnpm
pnpm i
pnpm dev
```

## docker 镜像编译

```bash
podman login docker.io -u arloor -p ${your_docker_hub_token}
podman build -f Dockerfile . -t docker.io/arloor/stock-realtime --build-arg=PORT=9999 --network host #podman的命令会使用系统代理来拉取node modules和下载alpine的apk包
podman push docker.io/arloor/stock-realtime:latest
```

docker build 需要手动增加 `--build-arg http_proxy --build-arg https_proxy`参数来使用代理

```bash
docker build -f Dockerfile . -t docker.io/arloor/stock-realtime --build-arg PORT=9999 --build-arg http_proxy --build-arg https_proxy --network host
```
