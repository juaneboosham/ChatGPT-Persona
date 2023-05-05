
# ChatGPT-Persona

在[Yidadaa/ChatGPT-Next-Web](https://github.com/Yidadaa/ChatGPT-Next-Web)的基础上进行二次开发。主要新增了预置prompt生成特定角色的功能，以娱乐为主，大家感兴趣也可以自己部署上来玩玩。


这是一个娱乐项目，本质上只是添加了预置的prompt，但是加上了一个选角色的页面，再加上角色的介绍包装一下，就显得戏剧又好玩。

喜欢的朋友可以star下~

如果遇到相关问题或是有更多新想法的欢迎创建issue讨论。

## Demo

![Persona](./docs/persona/demo.gif)


## Screenshots

![Persona](./docs/persona/persona_demo.png)
![Chat](./docs/persona/demo_chat.png)

## 快速体验

1.  [访问demo](https://meahabgpt.up.railway.app/)

2. 填入[OpenAI API key](https://platform.openai.com/overview)
![Setting](./docs/persona/setting_api_key.png)

3. 开始体验

## 部署

支持一键部署

1、vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/import?s=https%3A%2F%2Fgithub.com%2Fjuaneboosham%2FChatGPT-Persona&project-name=ChatGPT-Persona&env=OPENAI_API_KEY&env=CODE&framework=nextjs)


2、Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/pPchvD?referralCode=5mcmNY)

vercel，railway分配的域名部分情况下会有DNS污染，可以在部署后绑定自定义域名。

## 部署环境变量设置


`OPENAI_API_KEY`（required）

openai官网生成的[OpenAI API key](https://platform.openai.com/overview)，需要有chatGPT账号并需要能够顺利登录。

`CODE`（optional）

可以理解为访问密码。建议添加。
如果部署到公网，应该限制访问，否则账号余额恐怕要给刷光。

`BASE_URL`（optional）

说明：OpenAI 接口代理 URL，如果你手动配置了 openai 接口代理，请填写此选项。
如果遇到 ssl 证书问题，请将 BASE_URL 的协议设置为 http。

> Default: https://api.openai.com

> Examples: http://your-openai-proxy.com

`OPENAI_ORG_ID`（optional）

指定 OpenAI 中的组织 ID。


## 本地开发

1.node环境, >= 16。

2.git clone

3.执行yarn install && yarn dev。

## 鸣谢

感谢@Yidadaa，感谢Yidadaa/ChatGPT-Next-Web的参与者。

[Issues](https://github.com/juaneboosham/ChatGPT-Persona/issues)

## 反馈
[Issues](https://github.com/juaneboosham/ChatGPT-Persona/issues)
