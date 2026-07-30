# ValorantBuild

纯静态的无畏契约皮肤搭配网页。

## 项目结构

```text
app/          Next.js 路由与应用源代码
  components/ 跨页面复用的布局、导航和基础界面组件
  features/   按页面功能拆分的装备构建与皮肤排行模块
  hooks/      跨功能复用的客户端 Hooks
  lib/        数据加载、浏览器存储、分享图片等通用能力
  types/      Valorant 数据与界面状态的共享类型
public/       静态数据、字体与站点图标
scripts/      数据和字体资源生成脚本
```

## 常用命令

```bash
npm run dev
npm run lint
npm run build
npm run data:update
```

