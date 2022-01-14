module.exports = () => ({
  base: '/',
  title: 'Versea 开发文档',
  lang: 'zh-CN',
  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
  ],
  markdown: {
    anchor: { permalink: false },
    toc: { includeLevel: [1, 2, 3] },
  },
  sidebarDepth: 3,
  theme: '@vuepress/vue',
  themeConfig: {
    smoothScroll: true,
    sidebar: [
      {
        title: '简介',
        collapsable: false,
        path: '/summary/',
      },
    ],
  },
});
